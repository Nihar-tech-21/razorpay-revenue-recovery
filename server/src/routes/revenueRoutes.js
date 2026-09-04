const express = require("express");

const { calculateRevenueAtRisk } = require("../services/revenueRiskService");

const router = express.Router();

router.get("/risk", async (req, res) => {
  try {
    const { provider, method, windowMinutes } = req.query;

    if (!provider || !method) {
      return res.status(400).json({
        message: "provider and method are required",
      });
    }

    const result = await calculateRevenueAtRisk({
      provider,
      method,
      windowMinutes: Number(windowMinutes) || 10,
    });

    res.json(result);
  } catch (error) {
    console.error("Revenue risk calculation error:", error);

    res.status(500).json({
      message: "Failed to calculate revenue risk",
      error: error.message,
    });
  }
});

module.exports = router;
