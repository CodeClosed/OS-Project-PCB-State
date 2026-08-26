import React, { useRef, useEffect } from 'react';
import { BarChart2 } from 'lucide-react';

export default function GanttChart({ ganttHistory, currentTick }) {
  const containerRef = useRef(null);

  // Auto-scroll to end
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [ganttHistory]);

  // Group continuous intervals: [{ name, pid, start, end, duration, palette }]
  const intervals = [];
  ganttHistory.forEach((item) => {
    const last = intervals[intervals.length - 1];
    if (last && last.pid === item.pid && last.name === item.name) {
      last.end = item.end;
      last.duration += item.end - item.start;
    } else {
      intervals.push({
        pid: item.pid,
        name: item.name,
        start: item.start,
        end: item.end,
        duration: item.end - item.start,
        palette: item.palette,
      });
    }
  });

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4 font-mono text-xs flex flex-col gap-2.5 shadow-xs">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-slate-900 font-sans text-sm">Execution Gantt Chart</h3>
        </div>
        <span className="text-[11px] text-slate-500 font-bold">Current Clock: <strong className="text-blue-600">T+{currentTick}</strong></span>
      </div>

      {/* Simple Block Gantt Chart */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center min-h-[72px] scroll-smooth"
      >
        {intervals.length === 0 ? (
          <span className="text-slate-400 italic py-2 mx-auto font-sans">
            Gantt chart is empty. Click Start or Step forward to simulate.
          </span>
        ) : (
          <div className="flex items-center">
            {intervals.map((block, idx) => {
              const isIdle = block.name === 'IDLE';

              return (
                <div key={idx} className="flex flex-col items-center flex-shrink-0">
                  {/* Block Box */}
                  <div
                    className={`h-10 border border-slate-300 px-3 flex items-center justify-center font-bold text-xs shadow-2xs transition-all ${
                      isIdle
                        ? 'bg-slate-200 text-slate-600 border-dashed'
                        : `${block.palette?.bg || 'bg-blue-600'} text-white`
                    }`}
                    style={{ minWidth: `${Math.max(48, block.duration * 28)}px` }}
                  >
                    <span>{isIdle ? 'IDLE' : block.name.split(' ')[0]}</span>
                  </div>

                  {/* Time Tick Indicator */}
                  <div className="w-full flex justify-between text-[10px] text-slate-600 mt-1 px-1 font-bold">
                    <span>{block.start}</span>
                    <span>{block.end}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
