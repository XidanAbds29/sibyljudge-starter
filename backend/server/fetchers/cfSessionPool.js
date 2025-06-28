// backend/server/fetchers/cfSessionPool.js
const fs = require("fs");
const path = require("path");

const SESSIONS_DIR = path.join(__dirname, "../cf_sessions");

function loadSessionPool() {
  if (!fs.existsSync(SESSIONS_DIR)) return [];
  const files = fs.readdirSync(SESSIONS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((file) => ({
    id: file.replace(".json", ""),
    cookies: JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, file), "utf8")),
    lastUsed: 0,
  }));
}

function getAvailableSession(pool) {
  if (!pool.length)
    throw new Error("No Codeforces sessions available. Please upload cookies.");
  pool.sort((a, b) => a.lastUsed - b.lastUsed);
  const session = pool[0];
  session.lastUsed = Date.now();
  return session;
}

module.exports = { loadSessionPool, getAvailableSession };
