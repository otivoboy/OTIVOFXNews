import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Compass, 
  Layers, 
  Globe, 
  ShieldAlert, 
  Zap, 
  Activity, 
  Flame, 
  CheckCircle2, 
  Scale, 
  ArrowRight, 
  ExternalLink, 
  Sliders, 
  DollarSign, 
  Percent, 
  Building2, 
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { MACRO_KNOWLEDGE_TOPICS, MACRO_KNOWLEDGE_QUIZ_QUESTIONS, MacroKnowledgeTopic } from '../data/macroKnowledgeBase';

interface MacroKnowledgePlaybookSectionProps {
  onSelectEventTopic?: (code: string) => void;
  onLaunchQuizTopic?: (topicId: string) => void;
}

export const MacroKnowledgePlaybookSection: React.FC<MacroKnowledgePlaybookSectionProps> = ({
  onSelectEventTopic,
  onLaunchQuizTopic,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'INFLATION_LABOR' | 'CENTRAL_BANKS_RATES' | 'INTERBANK_LIQUIDITY'>('ALL');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('cpi-inflation');
  
  // Interactive Simulator state for the selected topic
  const [activeScenarioIndex, setActiveScenarioIndex] = useState<number>(0);

  // Filter topics
  const filteredTopics = useMemo(() => {
    return MACRO_KNOWLEDGE_TOPICS.filter((t) => {
      const matchCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
      const matchSearch = 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.overview.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  const activeTopic = useMemo(() => {
    const found = MACRO_KNOWLEDGE_TOPICS.find((t) => t.id === selectedTopicId);
    return found || MACRO_KNOWLEDGE_TOPICS[0];
  }, [selectedTopicId]);

  // When switching topic, reset scenario index if out of bounds
  const currentScenario = useMemo(() => {
    if (!activeTopic.scenarios || activeTopic.scenarios.length === 0) return null;
    return activeTopic.scenarios[Math.min(activeScenarioIndex, activeTopic.scenarios.length - 1)];
  }, [activeTopic, activeScenarioIndex]);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                <BookOpen className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Macroeconomic Knowledge Base & Transmission Playbooks
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
              Central Bank & Macroeconomic Transmission Playbook
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Comprehensive institutional guide to Consumer Price Index (CPI), Non-Farm Payrolls (NFP), FOMC policy, Producer Price Index (PPI), Official Cash Rate (OCR), Overnight Money Markets, ECB 3-rate tiering, Swiss National Bank interventions, and BoJ Yen Carry Trade mechanics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <div className="bg-[#fcfaf5] border border-[#e2dcd2] rounded-lg px-3 py-2 text-right">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Core Playbooks</div>
              <div className="text-base font-bold font-mono text-slate-900">10 Topics Active</div>
            </div>
            <div className="bg-[#fcfaf5] border border-[#e2dcd2] rounded-lg px-3 py-2 text-right">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Market Coverage</div>
              <div className="text-base font-bold font-mono text-emerald-700">100% Macro Synchronized</div>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="mt-5 pt-4 border-t border-[#e2dcd2] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Playbooks (10)' },
              { id: 'INFLATION_LABOR', label: 'Inflation & Labor (CPI, NFP, PPI)' },
              { id: 'CENTRAL_BANKS_RATES', label: 'Central Banks & Rates (FOMC, Rates, OCR, ECB, SNB, BoJ)' },
              { id: 'INTERBANK_LIQUIDITY', label: 'Interbank Liquidity (Overnight Rate)' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-[#f4eee3] hover:bg-[#eae2d4] text-slate-700 border border-[#e2dcd2]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playbooks (e.g. CPI, NFP, OCR, BoJ, Carry Trade)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#fdfcf9] border border-[#d8d0c4] rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Knowledge Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Topic Navigator List (4 Cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-mono font-bold text-slate-500 uppercase px-1 flex items-center justify-between">
            <span>Select Macro Playbook</span>
            <span>{filteredTopics.length} Topics</span>
          </div>

          <div className="space-y-2">
            {filteredTopics.map((topic) => {
              const isSelected = topic.id === activeTopic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => {
                    setSelectedTopicId(topic.id);
                    setActiveScenarioIndex(0);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#ffffff] border-emerald-600 shadow-md ring-1 ring-emerald-600/30'
                      : 'bg-[#ffffff] hover:bg-[#faf7f0] border-[#e2dcd2] shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                      {topic.shortTitle}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${topic.badgeColor}`}>
                      {topic.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 font-sans">
                    {topic.tagline}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f0ece2] text-[10px] text-slate-500 font-mono">
                    <span>{topic.centralBankOrAgency.split('/')[0]}</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      View Playbook <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Topic Deep Dive (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card Header & Overview */}
          <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${activeTopic.badgeColor}`}>
                    {activeTopic.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {activeTopic.releaseTiming}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-sans">
                  {activeTopic.title}
                </h3>
              </div>

              {onSelectEventTopic && (
                <button
                  onClick={() => onSelectEventTopic(activeTopic.code)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Filter Calendar for {activeTopic.code}
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans bg-[#faf8f4] p-3.5 rounded-lg border border-[#e8e2d8]">
              {activeTopic.overview}
            </p>

            {/* Key Data Variants / Components (if present) */}
            {activeTopic.components && activeTopic.components.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-mono font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  Key Data Variants & Sub-Components
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {activeTopic.components.map((comp, idx) => (
                    <div key={idx} className="bg-[#fcfaf6] border border-[#e2dcd2] rounded-lg p-3 space-y-1">
                      <div className="text-xs font-bold text-slate-900 font-sans">{comp.name}</div>
                      <div className="text-[11px] text-slate-600 font-sans">{comp.role}</div>
                      <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-[#eee8dc]">
                        {comp.importance}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regional Terminology / Equivalents (if present) */}
            {activeTopic.regionalEquivalents && activeTopic.regionalEquivalents.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-mono font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  Global Regional Terminology & Equivalents
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f4eee3] border-b border-[#e2dcd2] text-slate-700 font-mono uppercase text-[10px]">
                        <th className="py-2 px-3">Country / Region</th>
                        <th className="py-2 px-3">Central Bank</th>
                        <th className="py-2 px-3">Official Rate Name</th>
                        <th className="py-2 px-3">Operational Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee8dc]">
                      {activeTopic.regionalEquivalents.map((reg, idx) => (
                        <tr key={idx} className="hover:bg-[#faf7f0] transition-colors">
                          <td className="py-2 px-3 font-bold text-slate-900 font-sans">{reg.country}</td>
                          <td className="py-2 px-3 text-slate-700 font-sans">{reg.centralBank}</td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-800">{reg.rateName}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{reg.benchmarkTarget}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Unique Policy Features (e.g. SNB Direct Interventions, BoJ Carry Trade, ECB 3-rate) */}
            {activeTopic.uniqueFeatures && activeTopic.uniqueFeatures.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="text-xs font-mono font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  Unique Institutional Policy Features & Mechanics
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeTopic.uniqueFeatures.map((feat, idx) => (
                    <div key={idx} className="bg-amber-50/50 border border-amber-200 rounded-lg p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-950 font-sans">{feat.title}</span>
                        <span className="text-[10px] font-mono uppercase text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                          {feat.subtitle}
                        </span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed font-sans">
                        {feat.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Interactive Scenario Matrix & Simulator */}
          <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e2dcd2]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-sm font-bold text-slate-900 font-sans">
                    Scenario Matrix & Cross-Asset Reactions
                  </h4>
                </div>
                <p className="text-xs text-slate-600 font-sans">
                  Toggle market scenarios to evaluate instant transmission vectors across US Dollar, Gold, Stocks, and Yields.
                </p>
              </div>

              {/* Scenario Toggle Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-[#f4eee3] border border-[#e2dcd2] rounded-lg">
                {activeTopic.scenarios.map((sc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveScenarioIndex(idx)}
                    className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                      activeScenarioIndex === idx
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-[#eae2d4]'
                    }`}
                  >
                    Scenario {idx + 1}: {sc.scenarioName.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Scenario Quick Summary Banner */}
            {currentScenario && (
              <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-lg p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900 font-sans">
                    {currentScenario.scenarioName}
                  </span>
                  <span className="text-xs font-mono text-slate-600">
                    Condition: {currentScenario.condition}
                  </span>
                </div>

                {/* Scenario Asset Metric Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  <div className="bg-[#ffffff] border border-[#e2dcd2] rounded p-2 text-center">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Inflation/Data</div>
                    <div className="text-xs font-bold font-mono mt-0.5 flex items-center justify-center gap-1">
                      {currentScenario.inflationOrMetricDirection === 'UP' ? (
                        <span className="text-emerald-700">🟢 Up</span>
                      ) : (
                        <span className="text-rose-700">🔴 Down</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#ffffff] border border-[#e2dcd2] rounded p-2 text-center">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Interest Rates</div>
                    <div className="text-xs font-bold font-mono mt-0.5 flex items-center justify-center gap-1">
                      {currentScenario.rateOutlook === 'UP' ? (
                        <span className="text-emerald-700">🟢 Up</span>
                      ) : (
                        <span className="text-rose-700">🔴 Down</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#ffffff] border border-[#e2dcd2] rounded p-2 text-center">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">US Dollar (USD)</div>
                    <div className="text-xs font-bold font-mono mt-0.5 flex items-center justify-center gap-1">
                      {currentScenario.usdDirection === 'UP' ? (
                        <span className="text-emerald-700">🟢 Up</span>
                      ) : (
                        <span className="text-rose-700">🔴 Down</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#ffffff] border border-[#e2dcd2] rounded p-2 text-center">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Gold (XAU/USD)</div>
                    <div className="text-xs font-bold font-mono mt-0.5 flex items-center justify-center gap-1">
                      {currentScenario.goldDirection === 'UP' ? (
                        <span className="text-emerald-700">🟢 Up</span>
                      ) : (
                        <span className="text-rose-700">🔴 Down</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#ffffff] border border-[#e2dcd2] rounded p-2 text-center col-span-2 sm:col-span-1">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Stocks (Nasdaq/SPX)</div>
                    <div className="text-xs font-bold font-mono mt-0.5 flex items-center justify-center gap-1">
                      {currentScenario.stocksDirection === 'UP' ? (
                        <span className="text-emerald-700">🟢 Up</span>
                      ) : (
                        <span className="text-rose-700">🔴 Down</span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 font-sans pt-1">
                  <strong className="text-slate-900">Transmission Verdict:</strong> {currentScenario.details}
                </p>
              </div>
            )}

            {/* Asset Impact Breakdown Table */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-mono font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-500" />
                Detailed Asset Breakdown & Transmission Mechanics
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f4eee3] border-b border-[#e2dcd2] text-slate-700 font-mono uppercase text-[10px]">
                      <th className="py-2 px-3">Asset / Symbol</th>
                      <th className="py-2 px-3">Hawkish Move (Rates Up)</th>
                      <th className="py-2 px-3">Dovish Move (Rates Down)</th>
                      <th className="py-2 px-3">Core Transmission Dynamics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee8dc]">
                    {activeTopic.assetImpacts.map((asset, idx) => (
                      <tr key={idx} className="hover:bg-[#faf7f0] transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">
                          {asset.assetName}
                          <div className="text-[10px] font-mono text-slate-500">{asset.symbol}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          {asset.hawkishMove === 'UP' ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {asset.hawkishLabel}
                            </span>
                          ) : (
                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              {asset.hawkishLabel}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          {asset.dovishMove === 'UP' ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {asset.dovishLabel}
                            </span>
                          ) : (
                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              {asset.dovishLabel}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-sans text-xs max-w-xs">
                          {asset.mechanism}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 4. Why Markets Move This Way (Core Principles) */}
          <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-bold text-slate-900 font-sans">
                Why Markets Move This Way: Core Mathematical & Financial Principles
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {activeTopic.principles.map((pr, idx) => (
                <div key={idx} className="bg-[#fcfaf6] border border-[#e2dcd2] rounded-lg p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 font-sans">{pr.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans pl-4">
                    {pr.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Macro Quiz & Interactive Practice Hub */}
          <div className="bg-emerald-950 text-white rounded-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                  Institutional Macro Knowledge Test
                </span>
              </div>
              <h4 className="text-base font-bold font-sans">
                Mastered this {activeTopic.shortTitle} Playbook?
              </h4>
              <p className="text-xs text-emerald-200 leading-relaxed font-sans">
                Test your institutional macro intuition with scenario-based quiz questions covering CPI surprise vectors, FOMC Dot Plots, real yields, and BoJ Carry Trade dynamics.
              </p>
            </div>

            {onLaunchQuizTopic && (
              <button
                onClick={() => onLaunchQuizTopic(activeTopic.id)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs font-mono transition-colors shadow-xs flex items-center gap-2 flex-shrink-0 cursor-pointer"
              >
                <span>Launch Macro Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
