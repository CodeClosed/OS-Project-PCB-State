import os from 'os';

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const cpus = os.cpus()?.length || 4;
  const totalMemoryMB = Math.round(os.totalmem() / (1024 * 1024)) || 8192;
  const freeMemoryMB = Math.round(os.freemem() / (1024 * 1024)) || 4096;

  // Cloud / Serverless environment processes
  const mockSystemProcesses = [
    { pid: 1, name: 'systemd / init', cpuSeconds: 142.5, memoryMB: 48, responding: true },
    { pid: 12, name: 'kthreadd', cpuSeconds: 88.2, memoryMB: 16, responding: true },
    { pid: 45, name: 'vercel-runtime', cpuSeconds: 312.4, memoryMB: 128, responding: true },
    { pid: 89, name: 'node (worker-pool)', cpuSeconds: 456.8, memoryMB: 256, responding: true },
    { pid: 104, name: 'edge-proxy', cpuSeconds: 94.1, memoryMB: 64, responding: true },
    { pid: 180, name: 'dnsmasq', cpuSeconds: 12.3, memoryMB: 24, responding: true },
    { pid: 210, name: 'system-logger', cpuSeconds: 45.7, memoryMB: 32, responding: true },
    { pid: 340, name: 'network-monitor', cpuSeconds: 67.9, memoryMB: 42, responding: true },
    { pid: 450, name: 'metrics-collector', cpuSeconds: 110.2, memoryMB: 96, responding: true },
    { pid: 512, name: 'cron-daemon', cpuSeconds: 8.5, memoryMB: 18, responding: true },
    { pid: 680, name: 'storage-driver', cpuSeconds: 78.4, memoryMB: 112, responding: true },
    { pid: 790, name: 'security-agent', cpuSeconds: 220.1, memoryMB: 180, responding: true },
    { pid: 880, name: 'cache-manager', cpuSeconds: 185.3, memoryMB: 145, responding: true },
    { pid: 920, name: 'http-dispatch', cpuSeconds: 290.6, memoryMB: 160, responding: true },
    { pid: 1024, name: 'os-watchdog', cpuSeconds: 15.0, memoryMB: 28, responding: true },
  ];

  res.status(200).json({
    success: true,
    platform: os.platform() || 'linux',
    hostname: os.hostname() || 'vercel-serverless-node',
    totalMemoryMB,
    freeMemoryMB,
    cpus,
    timestamp: Date.now(),
    processes: mockSystemProcesses,
  });
}
