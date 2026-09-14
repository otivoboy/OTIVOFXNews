import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown,
  ChevronUp,
  Check,
  User,
  LogOut,
  ShieldCheck,
  LogIn,
  Activity,
  LineChart,
  Gauge,
  Newspaper,
  Compass,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { ApiConfig, NavigationPage } from '../types';
import { useUserTimeZone } from '../context/TimeZoneContext';
import { useAuth } from '../context/AuthContext';
import { COMMON_TIMEZONES } from '../utils/timeZone';

interface HeaderProps {
  apiConfig: ApiConfig;
  onUpdateConfig: (config: ApiConfig) => void;
  onOpenSettings: () => void;
  onOpenHistoricModal: () => void;
  isConnected: boolean;
  activeProvider: string;
  isSimulating: boolean;
  onResetSimulation: () => void;
  quotes?: any[];
  activePage?: NavigationPage;
  onSelectPage?: (page: NavigationPage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSimulating,
  onResetSimulation,
  onOpenSettings,
  activePage = 'macro',
  onSelectPage,
}) => {
  const { 
    geoTimeInfo, 
    activeTimeZone, 
    is12Hour, 
    isAuto, 
    liveClock, 
    setTimeZone, 
    toggleTimeFormat, 
    resetToAuto 
  } = useUserTimeZone();

  const { 
    user, 
    isAuthenticated, 
    logout, 
    setAuthModalOpen, 
    setProfileModalOpen
  } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [tzDropdownOpen, setTzDropdownOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const NAV_ITEMS: Array<{ id: NavigationPage; label: string; shortLabel: string; fullTitle: string; icon: any; externalUrl?: string }> = [
    { id: 'macro', label: 'Macro & Calendar', shortLabel: 'Macro', fullTitle: 'Macroeconomic Calendar & Impact Transmission Engine', icon: Compass },
    { id: 'playbook', label: 'Macro Playbooks', shortLabel: 'Playbooks', fullTitle: 'Central Bank & Macro Transmission Knowledge Base', icon: BookOpen },
    { id: 'technical', label: 'Technical', shortLabel: 'Technical', fullTitle: 'Open OTIVO TV (otivotv.netlify.app)', icon: LineChart, externalUrl: 'https://otivotv.netlify.app' },
    { id: 'sentiment', label: 'Sentiment', shortLabel: 'Sentiment', fullTitle: 'Live Community & Institutional Market Sentiment', icon: Gauge },
    { id: 'news', label: 'News Feed', shortLabel: 'News Feed', fullTitle: 'Raw Market Data & Intelligence News Feed', icon: Newspaper },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTzDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-[#e2dcd2] bg-[#ffffff]/95 backdrop-blur sticky top-0 z-40 w-full px-3 sm:px-6 lg:px-8 xl:px-10 shadow-xs">
      <div className="w-full flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <img
            src="/logo.png"
            alt="OTIVO FX News Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain border border-[#d8d0c4] shadow-xs bg-[#f7f4ee]"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5 font-sans">
            <span className="text-emerald-700 font-black">OTIVO</span>
            <span className="text-slate-900 font-bold">FX News</span>
          </h1>
          {isSimulating && (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono border border-amber-300 uppercase font-bold animate-pulse">
              REPLAY ACTIVE
            </span>
          )}
        </div>

        {/* Center Primary Page Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-[#f4eee3] border border-[#e2dcd2] rounded-xl shadow-xs">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            if (item.externalUrl) {
              return (
                <a
                  key={item.id}
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none text-slate-600 hover:text-slate-900 hover:bg-[#eae2d5]/60"
                  title={item.fullTitle}
                >
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.label}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 -ml-0.5" />
                </a>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onSelectPage?.(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#ffffff] text-emerald-800 shadow-sm border border-[#e2dcd2]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#eae2d5]/60'
                }`}
                title={item.fullTitle}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions & Controls (Clock, Profile / Auth / Settings) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Forex Factory Style IP & Browser Live Clock */}
          <div className="hidden lg:flex items-center relative" ref={dropdownRef}>
            <button
              onClick={() => setTzDropdownOpen(!tzDropdownOpen)}
              className="flex items-center gap-2 bg-[#f6f2ea] hover:bg-[#ede6d9] border border-[#e2dcd2] hover:border-[#d5cdc2] px-2.5 py-1.5 rounded-lg text-xs transition group cursor-pointer shadow-xs"
              title="Forex Factory Time & IP Location Settings"
            >
              <span className="font-mono text-slate-900 font-bold text-xs tracking-wide">
                {liveClock || '--:--:--'}
              </span>

              <div className="flex items-center gap-1.5 pl-2 border-l border-[#d8d0c4] text-[11px] text-slate-600 font-mono">
                <span className="text-emerald-700 font-bold">{geoTimeInfo.gmtOffset}</span>
                <span className="hidden xl:inline text-slate-700 font-medium truncate max-w-[90px]">
                  {geoTimeInfo.cityName}
                </span>
                {isAuto && (
                  <span className="px-1.5 py-0.2 bg-[#e6f4ea] border border-[#b7e1cd] text-emerald-800 text-[9px] rounded font-bold uppercase">
                    Auto
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-500 ml-0.5" />
              </div>
            </button>

            {/* Timezone & Location Popover Dropdown */}
            {tzDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#ffffff] border border-[#e2dcd2] rounded-xl shadow-xl z-50 p-3 text-xs animate-in fade-in zoom-in-95 duration-150 text-slate-800">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e2dcd2]">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold font-sans">
                    <span>Time & Location Engine</span>
                  </div>
                  <button
                    onClick={toggleTimeFormat}
                    className="px-2 py-0.5 bg-[#f6f2ea] hover:bg-[#ede6d9] text-slate-800 border border-[#e2dcd2] rounded font-mono text-[10px] font-bold cursor-pointer"
                  >
                    {is12Hour ? '12-Hour (AM/PM)' : '24-Hour'}
                  </button>
                </div>

                {/* Auto IP Location Banner */}
                <div 
                  onClick={() => {
                    resetToAuto();
                    setTzDropdownOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border mb-2 cursor-pointer transition flex items-start gap-2 ${
                    isAuto
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-[#fbf9f5] border-[#e2dcd2] text-slate-600 hover:border-[#d5cdc2]'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-[11px]">
                        Auto Detect (Browser & IP)
                      </span>
                      {isAuto && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                      {geoTimeInfo.timeZone} ({geoTimeInfo.gmtOffset})
                    </div>
                    {geoTimeInfo.ipAddress && (
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                        Client IP: {geoTimeInfo.ipAddress}
                      </div>
                    )}
                  </div>
                </div>

                {/* Presets List */}
                <div className="text-[10px] font-mono uppercase text-slate-500 font-bold mb-1.5 px-1">
                  Global Market Timezones
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin pr-1">
                  {COMMON_TIMEZONES.filter(tz => tz.id !== 'AUTO').map((tz) => {
                    const isSelected = !isAuto && activeTimeZone === tz.timeZone;
                    return (
                      <button
                        key={tz.id}
                        onClick={() => {
                          setTimeZone(tz.timeZone);
                          setTzDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                            : 'text-slate-700 hover:bg-[#f6f2ea] hover:text-slate-900'
                        }`}
                      >
                        <span className="text-[11px] truncate">{tz.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-700 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {isSimulating && (
            <button
              onClick={onResetSimulation}
              className="text-xs px-2.5 py-1.5 rounded bg-[#f6f2ea] hover:bg-[#ede6d9] text-slate-800 border border-[#e2dcd2] font-mono font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span className="hidden sm:inline">Exit Sandbox</span>
              <span className="sm:hidden">Exit</span>
            </button>
          )}

          {/* User Profile / Auth Control Dropdown */}
          <div className="relative" ref={userMenuRef}>
            {isAuthenticated && user ? (
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 bg-[#f6f2ea] hover:bg-[#ede6d9] border border-[#e2dcd2] hover:border-[#d5cdc2] p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition group cursor-pointer shadow-xs"
                title="View Trader Profile"
              >
                <div className="relative">
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                    alt={user.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover border border-emerald-600/40 bg-slate-800"
                  />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[100px] leading-tight">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-emerald-800 tracking-wider">
                    {user.accountTier}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Profile Dropdown Menu */}
            {userDropdownOpen && isAuthenticated && user && (
              <div className="absolute right-0 mt-2 w-64 bg-[#ffffff] border border-[#e2dcd2] rounded-2xl shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150 text-slate-800">
                {/* Header info */}
                <div className="p-2.5 bg-[#f6f2ea] rounded-xl border border-[#e2dcd2] mb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs truncate max-w-[140px]">
                      {user.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                      {user.accountTier}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                    {user.email}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-600 mt-2 pt-2 border-t border-[#e2dcd2] font-mono">
                    <span>Style: <strong>{user.tradingStyle}</strong></span>
                    <span className="text-emerald-700 font-bold">Win: {user.stats.winRateEst}%</span>
                  </div>
                </div>

                <div className="space-y-1 font-sans">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#f6f2ea] text-slate-800 font-semibold flex items-center gap-2 transition cursor-pointer"
                  >
                    <User className="w-4 h-4 text-emerald-700" />
                    <span>Trader Profile & Risk</span>
                  </button>

                  <div className="my-1 border-t border-[#e2dcd2]" />

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-700 font-semibold flex items-center gap-2 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Dropdown Info Toggle button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded bg-[#f6f2ea] border border-[#e2dcd2] text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Toggle market metrics & clock"
            aria-label="Toggle mobile details"
          >
            {mobileMenuOpen ? (
              <ChevronUp className="w-4 h-4 text-emerald-700 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-600 transition-transform" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Info & Navigation Bar */}
      {mobileMenuOpen && (
        <div className="lg:hidden py-3 border-t border-[#e2dcd2] flex flex-col gap-2.5 bg-[#faf8f5] animate-in slide-in-from-top-2 duration-150 px-1">
          {/* Mobile Page Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 bg-[#f4eee3] border border-[#e2dcd2] rounded-xl">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              
              if (item.externalUrl) {
                return (
                  <a
                    key={item.id}
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none text-slate-600 hover:text-slate-900 hover:bg-[#eae2d5]/60"
                    title={item.fullTitle}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{item.shortLabel}</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  </a>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectPage?.(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#ffffff] text-emerald-800 shadow-xs border border-[#e2dcd2]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-[#eae2d5]/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <span className="truncate">{item.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-1 pt-1 border-t border-[#e2dcd2]/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-800 font-mono">
              <span className="font-bold text-slate-900">{liveClock}</span>
              <span className="text-emerald-700 text-[10px]">({geoTimeInfo.gmtOffset})</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={resetToAuto}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isAuto ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-[#f6f2ea] text-slate-600'
                }`}
              >
                Auto IP
              </button>
              <button
                onClick={toggleTimeFormat}
                className="px-1.5 py-0.5 rounded bg-[#f6f2ea] text-slate-800 border border-[#e2dcd2] font-mono text-[10px]"
              >
                {is12Hour ? '12h' : '24h'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

