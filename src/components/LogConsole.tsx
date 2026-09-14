import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Copy, 
  Check, 
  Filter,
  Activity
} from 'lucide-react';
import { AuditLogEntry } from '../types';

interface LogConsoleProps {
  logs: AuditLogEntry[];
  onClearLogs: () => void;
}

export const LogConsole: React.FC<LogConsoleProps> = ({ logs, onClearLogs }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [copied, setCopied] = useState<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === 'ALL') return true;
    if (filterLevel === 'SIGNAL') return log.level === 'SIGNAL';
    if (filterLevel === 'AI') return log.level === 'AI';
    if (filterLevel === 'DATA') return log.category === 'MARKET_DATA' || log.category === 'CALENDAR';
    return true;
  });

  const handleCopy = () => {
    const text = logs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toISOString()}] [${l.level}] [${l.category}] ${l.message}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-t border-[#1c2738] bg-[#06090e] text-xs w-full">
      {/* Console Header / Toggle Bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 xl:px-10 py-2 bg-[#090e17] border-b border-[#172233] w-full">
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Real-Time Audit Console
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
            {logs.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Level Filter Tabs */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono">
            {['ALL', 'SIGNAL', 'AI', 'DATA'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-0.5 rounded transition ${
                  filterLevel === lvl
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            title="Copy audit logs to clipboard"
            className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 border border-slate-700 transition"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={onClearLogs}
            title="Clear logs"
            className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Console Output Area */}
      {isOpen && (
        <div className="h-32 sm:h-36 overflow-y-auto font-mono text-[11px] px-3 sm:px-6 lg:px-8 xl:px-10 py-2.5 space-y-1.5 bg-[#05080e] scrollbar-thin">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-400 italic">No events logged yet. Listening to live feeds...</div>
          ) : (
            filteredLogs.map((log) => {
              let badgeColor = 'bg-slate-800 text-slate-300';
              if (log.level === 'SIGNAL') badgeColor = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
              else if (log.level === 'AI') badgeColor = 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40';
              else if (log.level === 'WARN') badgeColor = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
              else if (log.level === 'SUCCESS') badgeColor = 'bg-emerald-500/20 text-emerald-400';

              return (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-400 flex-shrink-0 text-[10px] sm:text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase flex-shrink-0 ${badgeColor}`}>
                    {log.level}
                  </span>
                  <span className="text-slate-400 text-[10px] uppercase font-sans hidden xs:inline flex-shrink-0">
                    [{log.category}]
                  </span>
                  <span className="text-slate-200 break-words flex-1">{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
};
