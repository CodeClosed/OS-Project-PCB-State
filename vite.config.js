import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { exec } from 'child_process';
import os from 'os';

/**
 * Custom Vite API plugin serving real host OS processes to the frontend
 * Accessible at GET /api/system-processes
 */
function systemProcessesPlugin() {
  return {
    name: 'system-processes-api',
    configureServer(server) {
      server.middlewares.use('/api/system-processes', (req, res) => {
        const isWin = os.platform() === 'win32';
        const cmd = isWin
          ? `powershell -NoProfile -Command "Get-Process | Where-Object CPU -gt 0 | Sort-Object CPU -Descending | Select-Object -First 40 Id, ProcessName, CPU, WorkingSet64, Responding | ConvertTo-Json -Compress"`
          : `ps -eo pid,comm,%cpu,%mem,stat --no-headers | head -n 40`;

        exec(cmd, { timeout: 4000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');

          if (err) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ success: false, error: err.message, processes: [] }));
          }

          try {
            let processes = [];
            if (isWin) {
              const raw = JSON.parse(stdout.trim());
              const list = Array.isArray(raw) ? raw : [raw];
              processes = list.map((p) => ({
                pid: p.Id,
                name: p.ProcessName,
                cpuSeconds: Math.round((p.CPU || 0) * 100) / 100,
                memoryMB: Math.max(1, Math.round((p.WorkingSet64 || 0) / (1024 * 1024))),
                responding: p.Responding !== false,
              }));
            } else {
              const lines = stdout.trim().split('\n');
              processes = lines
                .filter((l) => l.trim().length > 0)
                .map((l) => {
                  const parts = l.trim().split(/\s+/);
                  return {
                    pid: parseInt(parts[0], 10),
                    name: parts[1],
                    cpuSeconds: parseFloat(parts[2]) || 0,
                    memoryMB: Math.max(1, Math.round(parseFloat(parts[3]) * 16)),
                    responding: !parts[4]?.includes('T') && !parts[4]?.includes('Z'),
                  };
                });
            }

            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                platform: os.platform(),
                hostname: os.hostname(),
                totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
                freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
                cpus: os.cpus().length,
                timestamp: Date.now(),
                processes,
              })
            );
          } catch (parseErr) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: parseErr.message, processes: [] }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    systemProcessesPlugin(),
  ],
});
