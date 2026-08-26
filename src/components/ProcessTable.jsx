import React, { useState, useEffect, useRef } from 'react';
import { STATE_COLORS, createProcess } from '../types/process';
import { Eye, Trash2, Plus, Upload, Download, FileSpreadsheet } from 'lucide-react';

export default function ProcessTable({
  processes = [],
  selectedPid,
  onSelectPid,
  onDeleteProcess,
  onQuickAddProcess,
  onUpdateProcess,
  onBlurProcess,
  onImportProcesses,
  onClearAll,
  nextPid = 1,
  algorithm = 'FCFS',
}) {
  const [quickName, setQuickName] = useState(`P${nextPid}`);
  const [quickPriority, setQuickPriority] = useState(1);
  const [quickAT, setQuickAT] = useState(0);
  const [quickBurst, setQuickBurst] = useState(4);
  const fileInputRef = useRef(null);

  const usesPriority = algorithm === 'PRIORITY_NP' || algorithm === 'PRIORITY_P';

  // Keep default name in sync with nextPid
  useEffect(() => {
    setQuickName(`P${nextPid}`);
  }, [nextPid]);

  const submitAdd = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const name = quickName && quickName.trim() ? quickName.trim() : `P${nextPid}`;
    const priority = quickPriority !== '' && !isNaN(Number(quickPriority)) ? Number(quickPriority) : 1;
    const arrivalTime = quickAT !== '' && !isNaN(Number(quickAT)) ? Number(quickAT) : 0;
    const totalBurst = quickBurst !== '' && !isNaN(Number(quickBurst)) && Number(quickBurst) >= 1 ? Number(quickBurst) : 4;

    if (onQuickAddProcess) {
      onQuickAddProcess({
        name,
        priority,
        arrivalTime,
        totalBurst,
        memoryMB: 32,
      });
    }

    // Set next name suggestion
    setQuickName(`P${nextPid + 1}`);
  };

  // Parse and Import CSV file directly
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;

        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && !l.startsWith('#'));

        if (lines.length === 0) {
          alert('The selected file is empty.');
          return;
        }

        const firstLineCols = lines[0].split(/[,;\t]/).map((c) => c.replace(/^["']|["']$/g, '').trim().toLowerCase());

        let hasHeader = false;
        let nameIdx = -1;
        let atIdx = -1;
        let btIdx = -1;
        let priorityIdx = -1;
        let pidIdx = -1;
        let ioAfterIdx = -1;
        let ioDurationIdx = -1;

        // Smart Header Identification
        firstLineCols.forEach((col, idx) => {
          if (col === 'name' || col === 'process' || col === 'process name' || col === 'pname') {
            nameIdx = idx;
            hasHeader = true;
          } else if (col === 'at' || col === 'arrival' || col === 'arrival time' || col === 'arrivaltime') {
            atIdx = idx;
            hasHeader = true;
          } else if (col === 'bt' || col === 'burst' || col === 'burst time' || col === 'bursttime' || col === 'cpu burst') {
            btIdx = idx;
            hasHeader = true;
          } else if (col === 'priority' || col === 'prio' || col === 'p') {
            priorityIdx = idx;
            hasHeader = true;
          } else if (col === 'pid' || col === 'id' || col === '#') {
            pidIdx = idx;
            hasHeader = true;
          } else if (col === 'io_after' || col === 'ioafter' || col === 'io after' || col === 'io') {
            ioAfterIdx = idx;
            hasHeader = true;
          } else if (col === 'io_duration' || col === 'ioduration' || col === 'io duration' || col === 'wait' || col === 'i/o') {
            ioDurationIdx = idx;
            hasHeader = true;
          }
        });

        const dataLines = hasHeader ? lines.slice(1) : lines;
        const parsed = [];

        dataLines.forEach((line, index) => {
          const cols = line.split(/[,;\t]/).map((c) => c.replace(/^["']|["']$/g, '').trim());
          if (cols.length === 0 || (cols.length === 1 && cols[0] === '')) return;

          let pid = index + 1;
          let name = `P${pid}`;
          let arrivalTime = 0;
          let totalBurst = 4;
          let priority = 1;
          let ioAfter = 0;
          let ioDuration = 0;

          if (hasHeader) {
            if (pidIdx !== -1 && !isNaN(Number(cols[pidIdx]))) pid = Number(cols[pidIdx]);
            if (nameIdx !== -1 && cols[nameIdx]) name = cols[nameIdx];
            if (atIdx !== -1 && !isNaN(Number(cols[atIdx]))) arrivalTime = Math.max(0, Number(cols[atIdx]));
            if (btIdx !== -1 && !isNaN(Number(cols[btIdx]))) totalBurst = Math.max(1, Number(cols[btIdx]));
            if (priorityIdx !== -1 && !isNaN(Number(cols[priorityIdx]))) priority = Math.max(0, Number(cols[priorityIdx]));
            if (ioAfterIdx !== -1 && !isNaN(Number(cols[ioAfterIdx]))) ioAfter = Math.max(0, Number(cols[ioAfterIdx]));
            if (ioDurationIdx !== -1 && !isNaN(Number(cols[ioDurationIdx]))) ioDuration = Math.max(0, Number(cols[ioDurationIdx]));
          } else {
            // Headerless format matching common CSV patterns
            if (cols.length >= 7) {
              // Format: PID, Name, AT, BT, Priority, IO_After, IO_Duration
              pid = !isNaN(Number(cols[0])) ? Number(cols[0]) : index + 1;
              name = cols[1] || `P${pid}`;
              arrivalTime = Math.max(0, Number(cols[2]) || 0);
              totalBurst = Math.max(1, Number(cols[3]) || 4);
              priority = Math.max(0, Number(cols[4]) || 1);
              ioAfter = Math.max(0, Number(cols[5]) || 0);
              ioDuration = Math.max(0, Number(cols[6]) || 0);
            } else if (cols.length === 6) {
              // Format: Name, AT, BT, Priority, IO_After, IO_Duration
              name = cols[0] || `P${index + 1}`;
              arrivalTime = Math.max(0, Number(cols[1]) || 0);
              totalBurst = Math.max(1, Number(cols[2]) || 4);
              priority = Math.max(0, Number(cols[3]) || 1);
              ioAfter = Math.max(0, Number(cols[4]) || 0);
              ioDuration = Math.max(0, Number(cols[5]) || 0);
            } else if (cols.length === 5) {
              // Format: PID, Name, AT, BT, Priority
              pid = !isNaN(Number(cols[0])) ? Number(cols[0]) : index + 1;
              name = cols[1] || `P${pid}`;
              arrivalTime = Math.max(0, Number(cols[2]) || 0);
              totalBurst = Math.max(1, Number(cols[3]) || 4);
              priority = Math.max(0, Number(cols[4]) || 1);
            } else if (cols.length === 4) {
              // Format: Name, AT, BT, Priority
              name = cols[0] || `P${index + 1}`;
              arrivalTime = Math.max(0, Number(cols[1]) || 0);
              totalBurst = Math.max(1, Number(cols[2]) || 4);
              priority = Math.max(0, Number(cols[3]) || 1);
            } else if (cols.length === 3) {
              // Format: Name, AT, BT
              name = cols[0] || `P${index + 1}`;
              arrivalTime = Math.max(0, Number(cols[1]) || 0);
              totalBurst = Math.max(1, Number(cols[2]) || 4);
            } else if (cols.length === 2) {
              // Format: AT, BT
              arrivalTime = Math.max(0, Number(cols[0]) || 0);
              totalBurst = Math.max(1, Number(cols[1]) || 4);
            }
          }

          parsed.push(
            createProcess({
              pid,
              name,
              arrivalTime,
              totalBurst,
              priority,
              ioAfter,
              ioDuration,
              memoryMB: 32,
            })
          );
        });

        if (parsed.length === 0) {
          alert('Could not parse any valid processes from the file.');
          return;
        }

        if (onImportProcesses) {
          onImportProcesses(parsed);
        }
      } catch (err) {
        alert('Failed to parse CSV file. Please verify file format.');
        console.error(err);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  // Export current table to CSV file
  const handleExportCSV = () => {
    if (processes.length === 0) return;
    const headers = ['PID', 'Name', 'AT', 'BT', 'Priority'];
    const rows = processes.map((p) => [p.pid, p.name, p.arrivalTime, p.totalBurst, p.priority]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'processes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download sample CSV template
  const handleDownloadSample = () => {
    const sample = 'PID,Name,AT,BT,Priority\n1,P1,0,6,3\n2,P2,1,8,1\n3,P3,2,3,4\n4,P4,3,4,2';
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'processes_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4 font-mono text-xs flex flex-col gap-3 shadow-xs">
      
      {/* Hidden CSV file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv, .txt"
        className="hidden"
      />

      {/* Table Header & Controls */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
        <div>
          <h3 className="font-bold text-slate-900 font-sans text-sm">Active Processes PCB Table</h3>
          <span className="text-[11px] text-slate-500 font-medium">{processes.length} processes registered</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Import CSV button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors text-[11px] cursor-pointer font-sans font-medium"
            title="Import processes directly from CSV or text file"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>

          {/* Export CSV button */}
          {processes.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors text-[11px] cursor-pointer font-sans font-medium"
              title="Export current processes table to CSV"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          )}

          {/* Sample template button */}
          {processes.length === 0 && (
            <button
              type="button"
              onClick={handleDownloadSample}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors text-[11px] cursor-pointer font-sans font-medium"
              title="Download sample CSV template"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Sample
            </button>
          )}

          {/* Clear All button */}
          {processes.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors text-[11px] cursor-pointer font-sans font-medium"
              title="Clear all rows from table"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Table Rows */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-[11px] bg-slate-50">
              <th className="py-2.5 px-2.5 font-bold">PID</th>
              <th className="py-2.5 px-2.5 font-bold">NAME</th>
              <th className="py-2.5 px-2.5 font-bold">STATE</th>
              <th className="py-2.5 px-2.5 font-bold">
                <div className="flex items-center gap-1.5">
                  <span className={usesPriority ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                    PRIORITY
                  </span>
                  {usesPriority ? (
                    <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.5 rounded shadow-2xs" title="Priority is used by the active scheduler">
                      Active
                    </span>
                  ) : (
                    <span className="text-[9px] bg-slate-100 text-slate-400 border border-slate-200 font-normal px-1 py-0.5 rounded" title={`Priority is ignored by ${algorithm} scheduler`}>
                      Ignored
                    </span>
                  )}
                </div>
              </th>
              <th className="py-2.5 px-2.5 font-bold text-slate-700">AT</th>
              <th className="py-2.5 px-2.5 font-bold text-cyan-700">CPU BURST (BT)</th>
              <th className="py-2.5 px-2.5 font-bold text-cyan-800">CT</th>
              <th className="py-2.5 px-2.5 font-bold text-rose-800">TAT</th>
              <th className="py-2.5 px-2.5 font-bold text-emerald-800">WT</th>
              <th className="py-2.5 px-2.5 font-bold text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processes.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-6 text-center text-slate-400 italic">
                  Table is empty. Use the quick-add bar below to add processes.
                </td>
              </tr>
            ) : (
              processes.map((p) => {
                const isSelected = selectedPid === p.pid;
                const badge = STATE_COLORS[p.state]?.badge || STATE_COLORS.READY.badge;
                const ct = p.completionTime !== null ? `T+${p.completionTime}` : '—';
                const tat = p.turnaroundTime !== null ? `${p.turnaroundTime}t` : '—';
                const wt = `${p.waitingTime}t`;

                return (
                  <tr
                    key={p.pid}
                    onClick={() => onSelectPid(p.pid)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/80 border-l-2 border-l-blue-600' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-2 px-2.5 font-bold text-slate-800">#{p.pid}</td>
                    
                    {/* Editable Process Name */}
                    <td className="py-2 px-2.5 font-semibold text-slate-900">
                      <input
                        type="text"
                        value={p.name ?? ''}
                        onChange={(e) => onUpdateProcess && onUpdateProcess(p.pid, 'name', e.target.value)}
                        onBlur={(e) => onBlurProcess && onBlurProcess(p.pid, 'name', e.target.value)}
                        onFocus={() => onSelectPid(p.pid)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 bg-white/70 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5 font-semibold text-slate-900 focus:outline-none transition-colors shadow-2xs text-xs"
                        title="Click to edit process name"
                      />
                    </td>

                    {/* State Badge */}
                    <td className="py-2 px-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge}`}>
                        {p.state}
                      </span>
                    </td>

                    {/* Editable Priority */}
                    <td className="py-2 px-2.5">
                      <div className={`flex items-center gap-1 ${usesPriority ? '' : 'opacity-65'}`} onClick={(e) => e.stopPropagation()}>
                        <span className={`text-[11px] font-bold ${usesPriority ? 'text-amber-700' : 'text-slate-400'}`}>Lvl</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={p.priority !== undefined ? p.priority : ''}
                          onChange={(e) => onUpdateProcess && onUpdateProcess(p.pid, 'priority', e.target.value)}
                          onBlur={(e) => onBlurProcess && onBlurProcess(p.pid, 'priority', e.target.value)}
                          onFocus={() => onSelectPid(p.pid)}
                          className={`w-12 bg-white border rounded px-1 py-0.5 text-center font-bold text-xs focus:outline-none transition-colors shadow-2xs ${
                            usesPriority
                              ? 'border-amber-200 hover:border-amber-400 focus:border-amber-500 text-amber-800'
                              : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 text-slate-500'
                          }`}
                          title={usesPriority ? 'Active Priority (0 = Highest Priority)' : `Priority (Ignored by active ${algorithm} scheduler)`}
                        />
                      </div>
                    </td>

                    {/* Editable Arrival Time (AT) */}
                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-slate-500 font-medium text-[11px]">T+</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={p.arrivalTime !== undefined ? p.arrivalTime : ''}
                          onChange={(e) => onUpdateProcess && onUpdateProcess(p.pid, 'arrivalTime', e.target.value)}
                          onBlur={(e) => onBlurProcess && onBlurProcess(p.pid, 'arrivalTime', e.target.value)}
                          onFocus={() => onSelectPid(p.pid)}
                          className="w-12 bg-white border border-slate-200 hover:border-blue-400 focus:border-blue-500 rounded px-1 py-0.5 text-center font-bold text-slate-700 focus:outline-none transition-colors shadow-2xs text-xs"
                          title="Directly edit Arrival Time (ticks)"
                        />
                      </div>
                    </td>

                    {/* Editable CPU Burst Time (BT) */}
                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {p.executedBurst > 0 ? (
                          <>
                            <span className="text-cyan-700 font-bold text-[11px]">{p.remainingBurst}t /</span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={p.totalBurst !== undefined ? p.totalBurst : ''}
                              onChange={(e) => onUpdateProcess && onUpdateProcess(p.pid, 'totalBurst', e.target.value)}
                              onBlur={(e) => onBlurProcess && onBlurProcess(p.pid, 'totalBurst', e.target.value)}
                              onFocus={() => onSelectPid(p.pid)}
                              className="w-12 bg-white border border-cyan-200 hover:border-cyan-400 focus:border-cyan-500 rounded px-1 py-0.5 text-center font-bold text-cyan-800 focus:outline-none transition-colors shadow-2xs text-xs"
                              title="Directly edit Total Burst Time (ticks)"
                            />
                            <span className="text-cyan-700 font-bold text-[11px]">t</span>
                          </>
                        ) : (
                          <>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={p.totalBurst !== undefined ? p.totalBurst : ''}
                              onChange={(e) => onUpdateProcess && onUpdateProcess(p.pid, 'totalBurst', e.target.value)}
                              onBlur={(e) => onBlurProcess && onBlurProcess(p.pid, 'totalBurst', e.target.value)}
                              onFocus={() => onSelectPid(p.pid)}
                              className="w-14 bg-white border border-cyan-200 hover:border-cyan-400 focus:border-cyan-500 rounded px-1.5 py-0.5 text-center font-bold text-cyan-800 focus:outline-none transition-colors shadow-2xs text-xs"
                              title="Directly edit Burst Time (ticks)"
                            />
                            <span className="text-cyan-700 font-bold text-[11px]">t</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-2 px-2.5 text-cyan-800 font-bold">{ct}</td>
                    <td className="py-2 px-2.5 text-rose-700 font-bold">{tat}</td>
                    <td className="py-2 px-2.5 text-emerald-700 font-bold">{wt}</td>
                    <td className="py-2 px-2.5 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectPid(p.pid)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-blue-600 transition-colors cursor-pointer"
                          title="Inspect PCB"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProcess(p.pid)}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                          title="Delete process from list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Fast Quick Add Row Bar */}
      <form
        onSubmit={submitAdd}
        className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-center gap-2 text-xs"
      >
        <span className="font-bold text-blue-700 px-2 py-1 bg-white rounded border border-slate-200 text-[11px]">
          #{nextPid}
        </span>

        <input
          type="text"
          placeholder="Name"
          value={quickName}
          onChange={(e) => setQuickName(e.target.value)}
          className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
        />

        <div className={`flex items-center gap-1 ${usesPriority ? '' : 'opacity-70'}`}>
          <span className="text-[11px] text-slate-500 font-medium">Priority:</span>
          <input
            type="number"
            min="0"
            step="1"
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value === '' ? '' : e.target.value)}
            className={`w-14 bg-white border rounded px-1.5 py-1 font-bold focus:outline-none text-center ${
              usesPriority
                ? 'border-amber-300 text-amber-800 focus:border-amber-500'
                : 'border-slate-300 text-slate-600 focus:border-blue-500'
            }`}
            title={usesPriority ? 'Priority (0 = Top)' : `Priority (Ignored by ${algorithm} scheduler)`}
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-500 font-medium">AT:</span>
          <input
            type="number"
            min="0"
            step="1"
            value={quickAT}
            onChange={(e) => setQuickAT(e.target.value === '' ? '' : e.target.value)}
            className="w-14 bg-white border border-slate-300 rounded px-1.5 py-1 text-slate-900 font-bold focus:outline-none focus:border-blue-500 text-center"
            title="Arrival Time (ticks)"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-500 font-medium">BT:</span>
          <input
            type="number"
            min="1"
            step="1"
            value={quickBurst}
            onChange={(e) => setQuickBurst(e.target.value === '' ? '' : e.target.value)}
            className="w-14 bg-white border border-slate-300 rounded px-1.5 py-1 text-slate-900 font-bold focus:outline-none focus:border-blue-500 text-center"
            title="Burst Time (ticks)"
          />
        </div>

        <button
          type="submit"
          className="ml-auto flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Row</span>
        </button>
      </form>

    </div>
  );
}
