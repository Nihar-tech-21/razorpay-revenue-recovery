const express = require("express");

const { detectDegradation } = require("../services/degradationService");

const router = express.Router();

router.get("/degradation", async (req, res) => {
  try {
    const { provider, method, windowMinutes } = req.query;

    if (!provider || !method) {
      return res.status(400).json({
        message: "provider and method are required",
      });
    }

    const result = await detectDegradation({
      provider,
      method,
      windowMinutes: Number(windowMinutes) || 10,
    });

    res.json(result);
  } catch (error) {
    console.error("Degradation detection error:", error);

    res.status(500).json({
      message: "Failed to detect degradation",
      error: error.message,
    });
  }
});

module.exports = router;
