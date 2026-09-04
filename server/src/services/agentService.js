const { GoogleGenAI, Type } = require("@google/genai");

const { getProviderHealth } = require("./providerHealthService");

const { getFailurePatterns } = require("./failurePatternService");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const parseAIResponse = (text) => {
  if (!text) {
    throw new Error("AI returned an empty response");
  }

  let cleaned = text.trim();

  // Remove Markdown code fences if Gemini wraps the JSON in them.
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  cleaned = cleaned.trim();

  // Extract the JSON object if Gemini adds text around it.
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("AI response does not contain a valid JSON object");
  }

  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Raw AI response:", text);
    console.error("Cleaned AI response:", cleaned);

    throw new Error("AI returned invalid JSON");
  }
};

const providerHealthTool = {
  name: "getProviderHealth",

  description:
    "Checks the recent health of a payment provider and payment method. Use this to determine whether the provider is healthy, recovering, or degraded.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      provider: {
        type: Type.STRING,
        description: "Payment provider or bank name",
      },

      method: {
        type: Type.STRING,
        description: "Payment method such as UPI or CARD",
      },

      windowMinutes: {
        type: Type.NUMBER,
        description: "Recent time window to analyze in minutes",
      },
    },

    required: ["provider", "method"],
  },
};

const failurePatternsTool = {
  name: "getFailurePatterns",

  description:
    "Analyzes recent payment failures and groups them by failure reason, source, and processing step. Use this to determine whether failures share a common pattern.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      provider: {
        type: Type.STRING,
        description: "Payment provider or bank name",
      },

      method: {
        type: Type.STRING,
        description: "Payment method such as UPI or CARD",
      },

      windowMinutes: {
        type: Type.NUMBER,
        description: "Recent time window to analyze in minutes",
      },
    },

    required: ["provider", "method"],
  },
};

const diagnoseIncident = async (incident) => {
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `
You are an AI revenue recovery analyst inside a fintech payment system.

Your job is to investigate a payment degradation incident
and recommend a SAFE next action.

Important rules:

- Investigate before making a recommendation.
- Use the available tools when additional evidence is needed.
- Do not invent facts.
- Do not claim certainty when evidence is incomplete.
- Do not directly execute financial actions.
- Financial actions will later be checked by a deterministic policy engine.

ACTION DECISION RULES:

1. If failures are strongly correlated to the same provider, payment method,
   time window, and failure pattern, and the provider is degraded, classify
   this as SYSTEMIC DEGRADATION.

2. For confirmed systemic degradation caused by a temporary provider/bank
   problem, recommend "pause_recovery".
   The goal is to avoid repeatedly retrying affected payments while the
   provider is unhealthy.

3. Recommend "monitor" when the provider is degraded or recovering but the
   evidence does not yet justify a stronger intervention.

4. Recommend "resume_recovery" only when the provider appears healthy or has
   clearly recovered enough for controlled recovery to restart.

5. Recommend "escalate" only when:
   - the evidence is insufficient or contradictory,
   - the root cause is uncertain,
   - confidence is low,
   - the situation is unusually high-risk,
   - or human intervention is genuinely required.

6. A high failure rate or high revenue-at-risk amount alone is NOT sufficient
   reason to escalate when the evidence clearly identifies a systemic,
   temporary provider degradation.

For the main systemic-degradation scenario, prefer:
SYSTEMIC DEGRADATION → pause_recovery → monitor → resume_recovery after recovery.

INCIDENT:

Provider: ${incident.provider}

Payment method: ${incident.method}

Failure rate: ${incident.failureRate}%

Baseline failure rate: ${incident.baselineFailureRate}%

Affected payments: ${incident.affectedPayments}

Revenue at risk: ₹${incident.revenueAtRisk}

Severity: ${incident.severity}

First investigate the incident using the available tools.

Then return ONLY valid JSON:

{
  "diagnosis": "string",
  "confidence": 0.0,
  "recommendedAction": "pause_recovery | resume_recovery | escalate | monitor",
  "reason": "string",
  "escalate": true
}

Confidence must be between 0 and 1.
`,
        },
      ],
    },
  ];

  const config = {
    tools: [
      {
        functionDeclarations: [providerHealthTool, failurePatternsTool],
      },
    ],
  };

  for (let round = 0; round < 5; round++) {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config,
    });

    // If Gemini has returned actual text, we are finished.
    if (response.text) {
      return parseAIResponse(response.text);
    }

    // Otherwise Gemini wants to call one or more tools.
    if (response.functionCalls?.length) {
      const functionResponseParts = [];

      for (const functionCall of response.functionCalls) {
        let result;

        if (functionCall.name === "getProviderHealth") {
          result = await getProviderHealth(functionCall.args);
        } else if (functionCall.name === "getFailurePatterns") {
          result = await getFailurePatterns(functionCall.args);
        } else {
          result = {
            error: `Unknown tool: ${functionCall.name}`,
          };
        }

        functionResponseParts.push({
          functionResponse: {
            name: functionCall.name,
            response: {
              result,
            },
          },
        });
      }

      contents.push(response.candidates[0].content);

      contents.push({
        role: "user",
        parts: functionResponseParts,
      });

      continue;
    }

    throw new Error("Gemini returned neither text nor function calls");
  }

  throw new Error("Agent exceeded maximum tool-calling rounds");
};

module.exports = {
  diagnoseIncident,
};
