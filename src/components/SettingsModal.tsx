import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Check, 
  ShieldCheck, 
  RefreshCw,
  Server
} from 'lucide-react';
import { ApiConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfig;
  onSaveConfig: (config: ApiConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [geminiKey, setGeminiKey] = useState<string>(config.geminiKey || '');
  const [soundAlerts, setSoundAlerts] = useState<boolean>(config.soundAlerts);
  const [autoPollImminent, setAutoPollImminent] = useState<boolean>(config.autoPollImminent);
  const [pollingInterval, setPollingInterval] = useState<number>(config.pollingIntervalSeconds || 15);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [testingStatus, setTestingStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    const newConfig: ApiConfig = {
      finnhubKey: config.finnhubKey || '',
      twelveDataKey: config.twelveDataKey || '',
      geminiKey: geminiKey.trim(),
      soundAlerts,
      autoPollImminent,
      pollingIntervalSeconds: pollingInterval,
    };
    onSaveConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleTestConnections = async () => {
    setTestingStatus('Checking backend engine & environment...');
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setTestingStatus(
        `Backend Status: ${data.status} | Finnhub: ${data.finnhubConfigured ? '.env Configured' : 'Live Stream'} | TwelveData: ${data.twelveDataConfigured ? '.env Configured' : 'Live Stream'}`
      );
    } catch {
      setTestingStatus('Connection error checking backend server.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b111a] border border-[#223046] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c2738] bg-[#0d1522]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Engine Preferences
              </h3>
              <p className="text-xs text-slate-400">
                Macro signal alerts & scheduler controls
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Note on .env Security & API Keys */}
          <div className="bg-[#09121d] border border-emerald-900/50 rounded-lg p-3 text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Environment Security (.env)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              API credentials (<code className="text-slate-300 font-mono">GEMINI_API_KEY</code>, <code className="text-slate-300 font-mono">FINNHUB_API_KEY</code>, <code className="text-slate-300 font-mono">TWELVEDATA_API_KEY</code>) are automatically loaded from <code className="text-slate-300 font-mono">.env</code> in development and production deployments (Cloud Run, Netlify, Vercel).
            </p>
          </div>

          {/* Optional Gemini API Key Override */}
          <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 space-y-1.5">
            <label className="font-semibold text-slate-200 block text-xs">
              Gemini API Key (Optional Override)
            </label>
            <p className="text-[10px] text-slate-400">
              Leave blank to use default from <code className="text-slate-300 font-mono">.env</code> or enter a dedicated Google AI key:
            </p>
            <input
              type="password"
              placeholder="AIzaSy... (or loaded from .env)"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs font-mono outline-none focus:border-emerald-500"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Acoustic Terminal Alerts</span>
                <p className="text-[10px] text-slate-400">Play audio chimes on signal evaluations</p>
              </div>
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Auto-Evaluate Imminent Events</span>
                <p className="text-[10px] text-slate-400">Automatically trigger evaluation when countdown reaches T-0</p>
              </div>
              <input
                type="checkbox"
                checked={autoPollImminent}
                onChange={(e) => setAutoPollImminent(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Polling Interval</span>
                <p className="text-[10px] text-slate-400">Live price refresh rate ({pollingInterval}s)</p>
              </div>
              <select
                value={pollingInterval}
                onChange={(e) => setPollingInterval(Number(e.target.value))}
                className="bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded border border-slate-700 font-mono outline-none"
              >
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            </div>
          </div>

          {/* Test Status feedback */}
          {testingStatus && (
            <div className="text-[11px] font-mono text-emerald-300 bg-[#070e17] p-2.5 rounded border border-emerald-900/60">
              {testingStatus}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1c2738] bg-[#0d1522] flex items-center justify-between">
          <button
            onClick={handleTestConnections}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Health Check</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{savedSuccess ? 'Saved!' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
