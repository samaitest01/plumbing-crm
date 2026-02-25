const { execSync, spawn } = require("child_process");
const path = require("path");

const PORT = Number(process.env.PORT || 5000);

function getPidsOnPortWindows(port) {
  try {
    const output = execSync(`netstat -ano -p tcp | findstr :${port}`, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();

    if (!output) return [];

    const lines = output.split(/\r?\n/);
    const pids = new Set();

    for (const line of lines) {
      const normalized = line.trim().replace(/\s+/g, " ");
      if (!normalized.includes("LISTENING")) continue;
      const parts = normalized.split(" ");
      const pid = Number(parts[parts.length - 1]);
      if (Number.isFinite(pid) && pid > 0 && pid !== process.pid) {
        pids.add(pid);
      }
    }

    return Array.from(pids);
  } catch {
    return [];
  }
}

function getPidsOnPortUnix(port) {
  try {
    const output = execSync(`lsof -ti tcp:${port}`, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();

    if (!output) return [];

    return output
      .split(/\r?\n/)
      .map((value) => Number(value.trim()))
      .filter((pid) => Number.isFinite(pid) && pid > 0 && pid !== process.pid);
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

function freePort(port) {
  const pids = process.platform === "win32"
    ? getPidsOnPortWindows(port)
    : getPidsOnPortUnix(port);

  if (pids.length === 0) {
    return;
  }

  console.log(`⚠️ Port ${port} is in use by PID(s): ${pids.join(", ")}`);

  const killed = [];
  for (const pid of pids) {
    if (killPid(pid)) {
      killed.push(pid);
    }
  }

  if (killed.length > 0) {
    console.log(`✅ Freed port ${port} by stopping PID(s): ${killed.join(", ")}`);
  } else {
    console.log(`❌ Could not free port ${port}. Start may fail with EADDRINUSE.`);
  }
}

freePort(PORT);

const serverEntry = path.join(__dirname, "..", "server.js");
const child = spawn(process.execPath, [serverEntry], {
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
