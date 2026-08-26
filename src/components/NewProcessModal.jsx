import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { createProcess } from '../types/process';

export default function NewProcessModal({ isOpen, onClose, onCreateProcess, nextPid, currentTick = 0 }) {
  const [name, setName] = useState(`Process ${nextPid}`);
  const [priority, setPriority] = useState(1);
  const [arrivalTime, setArrivalTime] = useState(currentTick);
  const [burst, setBurst] = useState(6);
  const [memoryMB, setMemoryMB] = useState(32);

  // Update defaults when opened
  useEffect(() => {
    if (isOpen) {
      setName(`P${nextPid} (Task)`);
      setArrivalTime(currentTick);
    }
  }, [isOpen, nextPid, currentTick]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProc = createProcess({
      pid: nextPid,
      name: name.trim() || `P${nextPid}`,
      priority: Math.max(0, Number(priority)),
      arrivalTime: Math.max(0, Number(arrivalTime)),
      totalBurst: Math.max(1, Number(burst)),
      memoryMB: Math.max(1, Number(memoryMB)),
      ioAfter: 0,
      ioDuration: 0,
    });
    onCreateProcess(newProc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 font-mono text-xs flex flex-col gap-4 shadow-2xl max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm font-sans">Create New Process (Allocate PCB)</h3>
              <span className="text-[11px] text-slate-500 font-medium">Auto PID • Custom Values (0 to ∞)</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          
          {/* PID badge & Distinct Name Input */}
          <div className="grid grid-cols-3 gap-2.5 items-end">
            <div>
              <label className="text-slate-600 block mb-1 font-medium text-[11px]">Assigned PID</label>
              <div className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-blue-700 font-bold text-center">
                #{nextPid}
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-slate-600 block mb-1 font-medium text-[11px]">Process Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Audio Engine, Worker Service"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Priority & Arrival Time (0 to ∞) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-slate-600 block mb-1 font-medium text-[11px]">
                Priority Rank <span className="text-slate-400 font-normal">(0 to ∞, 0=Top)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={priority}
                onChange={(e) => setPriority(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-medium text-[11px]">
                Arrival Time <span className="text-slate-400 font-normal">(AT: 0 to ∞)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold">ticks</span>
              </div>
            </div>
          </div>

          {/* CPU Burst Time (1 to ∞) */}
          <div>
            <label className="text-slate-600 block mb-1 font-medium text-[11px]">
              CPU Burst Time <span className="text-slate-400 font-normal">(BT: 1 to ∞ ticks)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={burst}
                onChange={(e) => setBurst(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-bold text-sm"
              />
              <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 font-bold">ticks</span>
            </div>
          </div>

          {/* Memory Footprint (1 to ∞ MB) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 font-medium text-[11px]">Memory Allocation</label>
              <span className="text-slate-400 font-normal">(1 to ∞ MB)</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={memoryMB}
                onChange={(e) => setMemoryMB(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-blue-500 font-bold text-center"
              />
              <span className="text-slate-500 font-bold">MB</span>

              {/* Quick Presets */}
              <div className="flex-1 flex gap-1 justify-end">
                {[16, 32, 64, 128, 256].map((mb) => (
                  <button
                    type="button"
                    key={mb}
                    onClick={() => setMemoryMB(mb)}
                    className={`px-2 py-1 rounded border text-[10px] transition-colors cursor-pointer ${
                      Number(memoryMB) === mb
                        ? 'bg-blue-600 border-blue-600 text-white font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {mb}M
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
            >
              Allocate & Create PCB
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
