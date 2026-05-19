const app = require("./index");
const { healthcheck } = require("./db");

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`[api] PhotoMetrics API listening on http://localhost:${PORT}`);

  const dbStatus = await healthcheck();
  if (!dbStatus.ok) {
    console.warn("[api] Database healthcheck failed. Check DATABASE_URL, PGSSLMODE, and that PostgreSQL is running.");
  }
});
