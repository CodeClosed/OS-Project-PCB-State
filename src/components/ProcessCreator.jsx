import React, { useState } from 'react';
import { PlusCircle, X, HardDrive } from 'lucide-react';
import { createPCB } from '../types/process';

export default function ProcessCreator({ isOpen, onClose, onCreateProcess, nextPid, currentTick }) {
  const [name, setName] = useState(`P${nextPid}`);
  const [priority, setPriority] = useState(2);
  const [cpuBurst, setCpuBurst] = useState(8);
  const [arrivalTime, setArrivalTime] = useState(currentTick);
  const [hasIO, setHasIO] = useState(false);
  const [ioTriggerAt, setIoTriggerAt] = useState(3);
  const [ioDuration, setIoDuration] = useState(2);
  const [ioDevice, setIoDevice] = useState('Disk');
  const [memoryMB, setMemoryMB] = useState(64);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const ioEvents = hasIO
      ? [
          {
            triggerAt: Number(ioTriggerAt),
            device: ioDevice,
            duration: Number(ioDuration),
          },
        ]
      : [];

    const newProc = createPCB({
      pid: nextPid,
      name: name.trim() || `P${nextPid}`,
      priority: Number(priority),
      totalBurst: Number(cpuBurst),
      arrivalTime: Number(arrivalTime),
      memoryMB: Number(memoryMB),
      ioEvents,
    });

    onCreateProcess(newProc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-panel-glow w-full max-w-md rounded-2xl p-6 border border-slate-700 font-mono text-xs flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-sans">Create New Process (Allocate PCB)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Creation Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Name & PID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Process Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Web Worker"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Assigned PID</label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-400 font-bold">
                #{nextPid}
              </div>
            </div>
          </div>

          {/* Priority & Arrival Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">
                Priority Level <span className="text-slate-500">(1=High)</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value={1}>Level 1 (Highest / Realtime)</option>
                <option value={2}>Level 2 (High)</option>
                <option value={3}>Level 3 (Normal)</option>
                <option value={4}>Level 4 (Low)</option>
                <option value={5}>Level 5 (Background)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Arrival Clock Tick</label>
              <input
                type="number"
                min="0"
                max="50"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-bold text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* CPU Burst Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400">Total CPU Burst</label>
              <span className="text-cyan-400 font-bold">{cpuBurst} ticks</span>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              value={cpuBurst}
              onChange={(e) => setCpuBurst(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Memory Footprint */}
          <div>
            <label className="text-slate-400 block mb-1">Virtual Memory Allocation</label>
            <div className="grid grid-cols-4 gap-2">
              {[32, 64, 128, 256].map((mb) => (
                <button
                  type="button"
                  key={mb}
                  onClick={() => setMemoryMB(mb)}
                  className={`py-1.5 rounded border text-center transition-colors cursor-pointer ${
                    memoryMB === mb
                      ? 'bg-purple-600/30 border-purple-400 text-purple-200 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {mb} MB
                </button>
              ))}
            </div>
          </div>

          {/* I/O Events Configuration */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-amber-400" />
                Configure I/O Burst Event
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasIO}
                  onChange={(e) => setHasIO(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {hasIO && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-[11px]">
                <div>
                  <label className="text-slate-500 block">Device</label>
                  <select
                    value={ioDevice}
                    onChange={(e) => setIoDevice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none cursor-pointer mt-1"
                  >
                    <option value="Disk">Disk</option>
                    <option value="Network">Network</option>
                    <option value="Keyboard">Keyboard</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-500 block">Trigger @ (Tick)</label>
                  <input
                    type="number"
                    min="1"
                    max={cpuBurst - 1}
                    value={ioTriggerAt}
                    onChange={(e) => setIoTriggerAt(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none mt-1"
                  />
                </div>

                <div>
                  <label className="text-slate-500 block">Duration (Ticks)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={ioDuration}
                    onChange={(e) => setIoDuration(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-glow-emerald cursor-pointer"
            >
              Initialize & Spawn PCB
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
