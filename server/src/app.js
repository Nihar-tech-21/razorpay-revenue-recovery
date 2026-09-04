const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const eventRoutes = require("./routes/eventRoutes");
const healthRoutes = require("./routes/healthRoutes");
const revenueRoutes = require("./routes/revenueRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const agentRoutes = require("./routes/agentRoutes");
const recoveryRoutes = require("./routes/recoveryRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Revenue Recovery API is running",
  });
});

app.use("/api/events", eventRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/recovery", recoveryRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
