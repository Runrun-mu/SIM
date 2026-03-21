import type { AggregatedMetrics, ScenarioType } from '@sim/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const NEON_CYAN = '#00f0ff';
const NEON_PURPLE = '#7b2ff7';
const NEON_PINK = '#ff2d55';
const NEON_GREEN = '#39ff14';
const NEON_ORANGE = '#ff9500';
const NEON_YELLOW = '#ffd60a';

const COLORS = [NEON_CYAN, NEON_PURPLE, NEON_PINK, NEON_GREEN, NEON_ORANGE, NEON_YELLOW];

interface SimulationRun {
  id: string;
  scenarioType: ScenarioType;
  scenarioName: string;
  agentCount: number;
  ticks: number;
  summary: AggregatedMetrics;
  timestamp: number;
}

const SCENARIO_NAMES: Record<ScenarioType, string> = {
  'prisoners-dilemma': "Prisoner's Dilemma",
  'wealth-distribution': 'Wealth Distribution',
  'public-goods': 'Public Goods',
  'ultimatum-game': 'Ultimatum Game',
  'dictator-game': 'Dictator Game',
  'hawk-dove': 'Hawk-Dove',
  'trust-game': 'Trust Game',
  'minority-game': 'Minority Game',
  'tragedy-of-commons': 'Tragedy of Commons',
  'axelrod-tournament': 'Axelrod Tournament',
  'schelling-segregation': 'Schelling Segregation',
  'voting-model': 'Voting Model',
  'sir-epidemic': 'SIR Epidemic',
  'social-influence': 'Social Influence',
};

// Load stored simulation results from localStorage
function loadRuns(): SimulationRun[] {
  try {
    const data = localStorage.getItem('sim-runs');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRun(run: SimulationRun): void {
  const runs = loadRuns();
  runs.push(run);
  // Keep last 50 runs
  if (runs.length > 50) runs.splice(0, runs.length - 50);
  localStorage.setItem('sim-runs', JSON.stringify(runs));
}

type ViewMode = 'overview' | 'cooperation' | 'fairness' | 'efficiency';

export default function MultiDashboard() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const runs = loadRuns();

  // Group runs by scenario type
  const byScenario = new Map<ScenarioType, SimulationRun[]>();
  for (const run of runs) {
    const existing = byScenario.get(run.scenarioType) ?? [];
    existing.push(run);
    byScenario.set(run.scenarioType, existing);
  }

  // Compute aggregate stats per scenario
  const scenarioStats = Array.from(byScenario.entries())
    .map(([type, scenarioRuns]) => {
      const latest = scenarioRuns[scenarioRuns.length - 1];
      if (!latest) return null;
      const s = latest.summary;
      return {
        name: SCENARIO_NAMES[type] ?? type,
        type,
        runs: scenarioRuns.length,
        cooperationRate: s.cooperationRate ?? 0,
        fairness: 1 - (s.giniCoefficient ?? 0),
        trust: s.trustIndex ?? 0,
        sustainability: s.sustainabilityIndex ?? 0,
        consensus: s.consensusLevel ?? 0,
        hawkRate: s.hawkRate ?? 0,
        avgScore: s.averageScore ?? 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Radar data for cooperation-related scenarios
  const radarData = scenarioStats
    .filter((s) => s.cooperationRate > 0 || s.trust > 0 || s.fairness > 0)
    .map((s) => ({
      scenario: s.name.substring(0, 12),
      cooperation: +(s.cooperationRate * 100).toFixed(0),
      fairness: +(s.fairness * 100).toFixed(0),
      trust: +(s.trust * 100).toFixed(0),
    }));

  // Bar chart: run counts per scenario
  const runCountData = scenarioStats.map((s) => ({
    name: s.name.substring(0, 10),
    runs: s.runs,
  }));

  // Pie chart: distribution of scenarios run
  const pieData = scenarioStats.map((s) => ({
    name: s.name,
    value: s.runs,
  }));

  const tabs: { key: ViewMode; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'cooperation', label: 'Cooperation' },
    { key: 'fairness', label: 'Fairness' },
    { key: 'efficiency', label: 'Efficiency' },
  ];

  return (
    <div className="min-h-screen bg-cyber-bg text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold animate-glow-pulse">Multi-Scenario Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Comparative analysis across {byScenario.size} scenario types • {runs.length} total runs
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-sm"
        >
          ← Back to Scenarios
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setViewMode(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
              viewMode === tab.key
                ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl mb-2">No simulation data yet</h2>
          <p className="text-sm mb-6">Run some simulations to see comparative analytics here.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-lg bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 hover:bg-cyber-cyan/30 transition-all"
          >
            Start a Simulation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Run Distribution */}
          {viewMode === 'overview' && (
            <>
              <GlassCard title="Scenarios Run">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={runCountData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis
                      dataKey="name"
                      stroke="#444"
                      fontSize={10}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="#444" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(10,10,20,0.9)',
                        border: '1px solid rgba(0,240,255,0.2)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="runs" name="Runs">
                      {runCountData.map((_, i) => (
                        <Cell
                          key={`cell-${
                            // biome-ignore lint/suspicious/noArrayIndexKey: chart cells
                            i
                          }`}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard title="Scenario Distribution">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name.substring(0, 8)} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((_, i) => (
                        <Cell
                          key={`pie-${
                            // biome-ignore lint/suspicious/noArrayIndexKey: chart cells
                            i
                          }`}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </GlassCard>

              {/* Recent runs table */}
              <GlassCard title="Recent Runs" className="lg:col-span-2">
                <div className="overflow-auto max-h-60">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-white/10">
                        <th className="text-left p-2">Scenario</th>
                        <th className="text-right p-2">Agents</th>
                        <th className="text-right p-2">Ticks</th>
                        <th className="text-right p-2">Key Metric</th>
                        <th className="text-right p-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs
                        .slice(-10)
                        .reverse()
                        .map((run) => (
                          <tr key={run.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-2 text-cyber-cyan">{run.scenarioName}</td>
                            <td className="p-2 text-right">{run.agentCount}</td>
                            <td className="p-2 text-right">{run.ticks}</td>
                            <td className="p-2 text-right font-mono text-cyber-purple">
                              {getKeyMetric(run)}
                            </td>
                            <td className="p-2 text-right text-gray-500">
                              {new Date(run.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </>
          )}

          {/* Cooperation View */}
          {viewMode === 'cooperation' && radarData.length > 0 && (
            <GlassCard title="Cooperation Radar" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#ffffff15" />
                  <PolarAngleAxis dataKey="scenario" stroke="#888" fontSize={10} />
                  <PolarRadiusAxis stroke="#444" fontSize={9} />
                  <Radar
                    name="Cooperation"
                    dataKey="cooperation"
                    stroke={NEON_CYAN}
                    fill={NEON_CYAN}
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="Fairness"
                    dataKey="fairness"
                    stroke={NEON_GREEN}
                    fill={NEON_GREEN}
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="Trust"
                    dataKey="trust"
                    stroke={NEON_PURPLE}
                    fill={NEON_PURPLE}
                    fillOpacity={0.2}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {viewMode === 'cooperation' && radarData.length === 0 && (
            <GlassCard title="Cooperation Analysis" className="lg:col-span-2">
              <div className="flex items-center justify-center h-48 text-gray-500">
                Run cooperation-related scenarios (PD, Trust, Public Goods) to see data here.
              </div>
            </GlassCard>
          )}

          {/* Fairness View */}
          {viewMode === 'fairness' && (
            <GlassCard title="Fairness Comparison" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={scenarioStats
                    .filter((s) => s.fairness > 0)
                    .map((s) => ({
                      name: s.name.substring(0, 12),
                      fairness: +(s.fairness * 100).toFixed(0),
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="name" stroke="#444" fontSize={10} />
                  <YAxis stroke="#444" fontSize={10} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,20,0.9)',
                      border: '1px solid rgba(0,240,255,0.2)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="fairness" name="Fairness %" fill={NEON_GREEN} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {/* Efficiency View */}
          {viewMode === 'efficiency' && (
            <GlassCard title="Efficiency Metrics" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={scenarioStats.map((s) => ({
                    name: s.name.substring(0, 12),
                    sustainability: +(s.sustainability * 100).toFixed(0),
                    consensus: +(s.consensus * 100).toFixed(0),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="name" stroke="#444" fontSize={10} />
                  <YAxis stroke="#444" fontSize={10} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,20,0.9)',
                      border: '1px solid rgba(0,240,255,0.2)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="sustainability"
                    name="Sustainability %"
                    fill={NEON_GREEN}
                    opacity={0.8}
                  />
                  <Bar dataKey="consensus" name="Consensus %" fill={NEON_PURPLE} opacity={0.8} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}

function GlassCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 animate-fade-in-up ${className}`}
    >
      <h3 className="text-sm font-mono text-gray-400 uppercase mb-3">{title}</h3>
      {children}
    </div>
  );
}

function getKeyMetric(run: SimulationRun): string {
  const s = run.summary;
  switch (run.scenarioType) {
    case 'prisoners-dilemma':
      return s.cooperationRate != null ? `Coop ${(s.cooperationRate * 100).toFixed(0)}%` : '—';
    case 'wealth-distribution':
      return s.giniCoefficient != null ? `Gini ${s.giniCoefficient.toFixed(3)}` : '—';
    case 'public-goods':
      return s.averageContribution != null ? `Avg ${s.averageContribution.toFixed(1)}` : '—';
    case 'ultimatum-game':
      return s.averageOffer != null ? `Offer ${s.averageOffer.toFixed(1)}` : '—';
    case 'dictator-game':
      return s.averageDictatorOffer != null ? `Offer ${s.averageDictatorOffer.toFixed(1)}` : '—';
    case 'hawk-dove':
      return s.hawkRate != null ? `Hawk ${(s.hawkRate * 100).toFixed(0)}%` : '—';
    case 'trust-game':
      return s.trustIndex != null ? `Trust ${s.trustIndex.toFixed(2)}` : '—';
    case 'minority-game':
      return s.minorityChoice != null ? `Min: ${s.minorityChoice}` : '—';
    case 'tragedy-of-commons':
      return s.resourcePool != null ? `Pool ${s.resourcePool.toFixed(0)}` : '—';
    case 'axelrod-tournament':
      return s.dominantStrategy ?? '—';
    case 'schelling-segregation':
      return s.segregationIndex != null ? `Seg ${s.segregationIndex.toFixed(2)}` : '—';
    case 'voting-model':
      return s.winningCandidate ?? '—';
    case 'sir-epidemic':
      return s.infectedCount != null ? `Infected ${s.infectedCount}` : '—';
    case 'social-influence':
      return s.consensusLevel != null ? `Con ${s.consensusLevel.toFixed(2)}` : '—';
    default:
      return '—';
  }
}
