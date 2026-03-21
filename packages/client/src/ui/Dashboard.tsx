import type { ScenarioType } from '@sim/shared';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSimulationStore } from '../stores/simulation';

const NEON_CYAN = '#00f0ff';
const NEON_PURPLE = '#7b2ff7';
const NEON_PINK = '#ff2d55';
const NEON_GREEN = '#39ff14';
const NEON_ORANGE = '#ff9500';

interface MetricDef {
  key: string;
  name: string;
  color: string;
  gradient: string;
  filter: string;
  yAxisId?: string;
  type?: 'line' | 'bar';
}

function getMetricsForScenario(type: ScenarioType | null): MetricDef[] {
  switch (type) {
    case 'prisoners-dilemma':
      return [
        {
          key: 'cooperationRate',
          name: 'Cooperation %',
          color: NEON_CYAN,
          gradient: 'gradCyan',
          filter: 'glowCyan',
        },
        {
          key: 'avgScore',
          name: 'Avg Score',
          color: NEON_PURPLE,
          gradient: 'gradPurple',
          filter: 'glowPurple',
        },
      ];
    case 'wealth-distribution':
      return [
        {
          key: 'gini',
          name: 'Gini Coefficient',
          color: NEON_PINK,
          gradient: 'gradPink',
          filter: 'glowPink',
        },
        {
          key: 'top10',
          name: 'Top 10% Share',
          color: NEON_CYAN,
          gradient: 'gradCyan',
          filter: 'glowCyan',
        },
      ];
    case 'public-goods':
      return [
        {
          key: 'avgContribution',
          name: 'Avg Contribution',
          color: NEON_CYAN,
          gradient: 'gradCyan',
          filter: 'glowCyan',
        },
        {
          key: 'freeRiderRatio',
          name: 'Free-Rider %',
          color: NEON_PINK,
          gradient: 'gradPink',
          filter: 'glowPink',
        },
        {
          key: 'poolTotal',
          name: 'Pool Total',
          color: NEON_GREEN,
          gradient: 'gradGreen',
          filter: 'glowGreen',
        },
      ];
    case 'ultimatum-game':
      return [
        {
          key: 'avgOffer',
          name: 'Avg Offer',
          color: NEON_CYAN,
          gradient: 'gradCyan',
          filter: 'glowCyan',
        },
        {
          key: 'rejectionRate',
          name: 'Rejection %',
          color: NEON_PINK,
          gradient: 'gradPink',
          filter: 'glowPink',
        },
      ];
    case 'dictator-game':
      return [
        {
          key: 'avgDictatorOffer',
          name: 'Avg Offer',
          color: NEON_CYAN,
          gradient: 'gradCyan',
          filter: 'glowCyan',
        },
        {
          key: 'generosity',
          name: 'Generosity %',
          color: NEON_GREEN,
          gradient: 'gradGreen',
          filter: 'glowGreen',
        },
      ];
    case 'hawk-dove':
      return [
        {
          key: 'hawkRate',
          name: 'Hawk Rate %',
          color: NEON_PINK,
          gradient: 'gradPink',
          filter: 'glowPink',
        },
        {
          key: 'conflictRate',
          name: 'Conflict %',
          color: NEON_ORANGE,
          gradient: 'gradOrange',
          filter: 'glowOrange',
        },
        {
          key: 'avgResourceGain',
          name: 'Avg Gain',
          color: NEON_GREEN,
          gradient: 'gradGreen',
          filter: 'glowGreen',
        },
      ];
    case 'trust-game':
      return [
        {
          key: 'avgInvestment',
          name: 'Avg Investment',
          color: NEON_CYAN,
          gradient: 'gradCyan',
          filter: 'glowCyan',
        },
        {
          key: 'avgReturn',
          name: 'Avg Return',
          color: NEON_PURPLE,
          gradient: 'gradPurple',
          filter: 'glowPurple',
        },
        {
          key: 'trustIndex',
          name: 'Trust Index',
          color: NEON_GREEN,
          gradient: 'gradGreen',
          filter: 'glowGreen',
        },
      ];
    case 'minority-game':
      return [
        {
          key: 'winnerCount',
          name: 'Winners',
          color: NEON_GREEN,
          gradient: 'gradGreen',
          filter: 'glowGreen',
        },
        {
          key: 'switchRate',
          name: 'Switch Rate %',
          color: NEON_ORANGE,
          gradient: 'gradOrange',
          filter: 'glowOrange',
        },
      ];
    case 'tragedy-of-commons':
      return [
        {
          key: 'resourcePool',
          name: 'Resource Pool',
          color: NEON_GREEN,
          gradient: 'gradGreen',
          filter: 'glowGreen',
        },
        {
          key: 'avgExtraction',
          name: 'Avg Extraction',
          color: NEON_PINK,
          gradient: 'gradPink',
          filter: 'glowPink',
        },
        {
          key: 'sustainability',
          name: 'Sustainability',
          color: NEON_CYAN,
          gradient: 'gradCyan',
          filter: 'glowCyan',
        },
      ];
    case 'axelrod-tournament':
      return [
        {
          key: 'avgScore',
          name: 'Avg Score',
          color: NEON_CYAN,
          gradient: 'gradCyan',
          filter: 'glowCyan',
        },
      ];
    case 'schelling-segregation':
      return [
        {
          key: 'segregation',
          name: 'Segregation',
          color: NEON_PINK,
          gradient: 'gradPink',
          filter: 'glowPink',
        },
        {
          key: 'satisfaction',
          name: 'Satisfaction %',
          color: NEON_GREEN,
          gradient: 'gradGreen',
          filter: 'glowGreen',
        },
        {
          key: 'moveRate',
          name: 'Move Rate %',
          color: NEON_ORANGE,
          gradient: 'gradOrange',
          filter: 'glowOrange',
        },
      ];
    case 'voting-model':
      return [
        {
          key: 'swingVoter',
          name: 'Swing Voter %',
          color: NEON_ORANGE,
          gradient: 'gradOrange',
          filter: 'glowOrange',
        },
      ];
    case 'sir-epidemic':
      return [
        {
          key: 'susceptible',
          name: 'Susceptible',
          color: NEON_CYAN,
          gradient: 'gradCyan',
          filter: 'glowCyan',
        },
        {
          key: 'infected',
          name: 'Infected',
          color: NEON_PINK,
          gradient: 'gradPink',
          filter: 'glowPink',
        },
        {
          key: 'recovered',
          name: 'Recovered',
          color: NEON_GREEN,
          gradient: 'gradGreen',
          filter: 'glowGreen',
        },
      ];
    case 'social-influence':
      return [
        {
          key: 'consensus',
          name: 'Consensus',
          color: NEON_CYAN,
          gradient: 'gradCyan',
          filter: 'glowCyan',
        },
        {
          key: 'avgShift',
          name: 'Avg Shift',
          color: NEON_PURPLE,
          gradient: 'gradPurple',
          filter: 'glowPurple',
        },
      ];
    default:
      return [];
  }
}

function buildChartData(
  // biome-ignore lint/suspicious/noExplicitAny: chart data is dynamic
  tickHistory: any[],
  scenarioType: ScenarioType | null,
): Record<string, unknown>[] {
  return tickHistory.map((t) => {
    const a = t.aggregated;
    const base: Record<string, unknown> = { tick: t.tick };

    switch (scenarioType) {
      case 'prisoners-dilemma':
        base.cooperationRate =
          a.cooperationRate != null ? +(a.cooperationRate * 100).toFixed(1) : undefined;
        base.avgScore = a.averageScore != null ? +a.averageScore.toFixed(1) : undefined;
        break;
      case 'wealth-distribution':
        base.gini = a.giniCoefficient != null ? +a.giniCoefficient.toFixed(3) : undefined;
        base.top10 = a.top10Percent != null ? +(a.top10Percent * 100).toFixed(1) : undefined;
        break;
      case 'public-goods':
        base.avgContribution =
          a.averageContribution != null ? +a.averageContribution.toFixed(1) : undefined;
        base.freeRiderRatio =
          a.freeRiderRatio != null ? +(a.freeRiderRatio * 100).toFixed(1) : undefined;
        base.poolTotal = a.publicPoolTotal != null ? +a.publicPoolTotal.toFixed(0) : undefined;
        break;
      case 'ultimatum-game':
        base.avgOffer = a.averageOffer != null ? +a.averageOffer.toFixed(1) : undefined;
        base.rejectionRate =
          a.rejectionRate != null ? +(a.rejectionRate * 100).toFixed(1) : undefined;
        break;
      case 'dictator-game':
        base.avgDictatorOffer =
          a.averageDictatorOffer != null ? +a.averageDictatorOffer.toFixed(1) : undefined;
        base.generosity =
          a.generosityRate != null ? +(a.generosityRate * 100).toFixed(1) : undefined;
        break;
      case 'hawk-dove':
        base.hawkRate = a.hawkRate != null ? +(a.hawkRate * 100).toFixed(1) : undefined;
        base.conflictRate = a.conflictRate != null ? +(a.conflictRate * 100).toFixed(1) : undefined;
        base.avgResourceGain =
          a.averageResourceGain != null ? +a.averageResourceGain.toFixed(1) : undefined;
        break;
      case 'trust-game':
        base.avgInvestment =
          a.averageInvestment != null ? +a.averageInvestment.toFixed(1) : undefined;
        base.avgReturn = a.averageReturn != null ? +a.averageReturn.toFixed(1) : undefined;
        base.trustIndex = a.trustIndex != null ? +a.trustIndex.toFixed(2) : undefined;
        break;
      case 'minority-game':
        base.winnerCount = a.winnerCount ?? undefined;
        base.switchRate = a.switchRate != null ? +(a.switchRate * 100).toFixed(1) : undefined;
        break;
      case 'tragedy-of-commons':
        base.resourcePool = a.resourcePool != null ? +a.resourcePool.toFixed(0) : undefined;
        base.avgExtraction =
          a.averageExtraction != null ? +a.averageExtraction.toFixed(1) : undefined;
        base.sustainability =
          a.sustainabilityIndex != null ? +a.sustainabilityIndex.toFixed(2) : undefined;
        break;
      case 'axelrod-tournament': {
        const scores = a.tournamentScores;
        if (scores) {
          const vals = Object.values(scores) as number[];
          base.avgScore =
            vals.length > 0
              ? +(vals.reduce((s: number, v: number) => s + v, 0) / vals.length).toFixed(1)
              : undefined;
        }
        break;
      }
      case 'schelling-segregation':
        base.segregation = a.segregationIndex != null ? +a.segregationIndex.toFixed(2) : undefined;
        base.satisfaction =
          a.satisfactionRate != null ? +(a.satisfactionRate * 100).toFixed(1) : undefined;
        base.moveRate = a.moveRate != null ? +(a.moveRate * 100).toFixed(1) : undefined;
        break;
      case 'voting-model':
        base.swingVoter =
          a.swingVoterRate != null ? +(a.swingVoterRate * 100).toFixed(1) : undefined;
        break;
      case 'sir-epidemic':
        base.susceptible = a.susceptibleCount ?? undefined;
        base.infected = a.infectedCount ?? undefined;
        base.recovered = a.recoveredCount ?? undefined;
        break;
      case 'social-influence':
        base.consensus = a.consensusLevel != null ? +a.consensusLevel.toFixed(2) : undefined;
        base.avgShift =
          a.averageOpinionShift != null ? +a.averageOpinionShift.toFixed(1) : undefined;
        break;
    }

    return base;
  });
}

function getSummaryStats(
  summary: Record<string, unknown> | null,
  scenarioType: ScenarioType | null,
): { label: string; value: string }[] {
  if (!summary) return [];
  const s = summary as Record<string, number | string | Record<string, number> | undefined>;
  const stats: { label: string; value: string }[] = [];

  switch (scenarioType) {
    case 'prisoners-dilemma':
      if (s.cooperationRate != null)
        stats.push({
          label: 'Final Coop Rate',
          value: `${((s.cooperationRate as number) * 100).toFixed(0)}%`,
        });
      if (s.averageScore != null)
        stats.push({ label: 'Avg Score', value: (s.averageScore as number).toFixed(1) });
      break;
    case 'wealth-distribution':
      if (s.giniCoefficient != null)
        stats.push({ label: 'Gini', value: (s.giniCoefficient as number).toFixed(3) });
      if (s.top10Percent != null)
        stats.push({
          label: 'Top 10%',
          value: `${((s.top10Percent as number) * 100).toFixed(0)}%`,
        });
      break;
    case 'public-goods':
      if (s.averageContribution != null)
        stats.push({
          label: 'Avg Contribution',
          value: (s.averageContribution as number).toFixed(1),
        });
      if (s.freeRiderRatio != null)
        stats.push({
          label: 'Free Riders',
          value: `${((s.freeRiderRatio as number) * 100).toFixed(0)}%`,
        });
      break;
    case 'ultimatum-game':
      if (s.averageOffer != null)
        stats.push({ label: 'Avg Offer', value: (s.averageOffer as number).toFixed(1) });
      if (s.rejectionRate != null)
        stats.push({
          label: 'Rejection Rate',
          value: `${((s.rejectionRate as number) * 100).toFixed(0)}%`,
        });
      break;
    case 'dictator-game':
      if (s.averageDictatorOffer != null)
        stats.push({ label: 'Avg Offer', value: (s.averageDictatorOffer as number).toFixed(1) });
      break;
    case 'hawk-dove':
      if (s.hawkRate != null)
        stats.push({ label: 'Hawk Rate', value: `${((s.hawkRate as number) * 100).toFixed(0)}%` });
      if (s.conflictRate != null)
        stats.push({
          label: 'Conflicts',
          value: `${((s.conflictRate as number) * 100).toFixed(0)}%`,
        });
      break;
    case 'trust-game':
      if (s.trustIndex != null)
        stats.push({ label: 'Trust Index', value: (s.trustIndex as number).toFixed(2) });
      if (s.averageInvestment != null)
        stats.push({ label: 'Avg Investment', value: (s.averageInvestment as number).toFixed(1) });
      break;
    case 'minority-game':
      if (s.winnerCount != null) stats.push({ label: 'Winners', value: String(s.winnerCount) });
      if (s.minorityChoice != null)
        stats.push({ label: 'Minority', value: String(s.minorityChoice) });
      break;
    case 'tragedy-of-commons':
      if (s.resourcePool != null)
        stats.push({ label: 'Pool', value: (s.resourcePool as number).toFixed(0) });
      if (s.sustainabilityIndex != null)
        stats.push({
          label: 'Sustainability',
          value: (s.sustainabilityIndex as number).toFixed(2),
        });
      break;
    case 'axelrod-tournament':
      if (s.dominantStrategy != null)
        stats.push({ label: 'Dominant', value: String(s.dominantStrategy) });
      break;
    case 'schelling-segregation':
      if (s.segregationIndex != null)
        stats.push({ label: 'Segregation', value: (s.segregationIndex as number).toFixed(2) });
      if (s.satisfactionRate != null)
        stats.push({
          label: 'Satisfaction',
          value: `${((s.satisfactionRate as number) * 100).toFixed(0)}%`,
        });
      break;
    case 'voting-model':
      if (s.winningCandidate != null)
        stats.push({ label: 'Winner', value: String(s.winningCandidate) });
      break;
    case 'sir-epidemic':
      if (s.susceptibleCount != null)
        stats.push({ label: 'Susceptible', value: String(s.susceptibleCount) });
      if (s.infectedCount != null)
        stats.push({ label: 'Infected', value: String(s.infectedCount) });
      if (s.recoveredCount != null)
        stats.push({ label: 'Recovered', value: String(s.recoveredCount) });
      break;
    case 'social-influence':
      if (s.consensusLevel != null)
        stats.push({ label: 'Consensus', value: (s.consensusLevel as number).toFixed(2) });
      break;
  }

  return stats;
}

const GRADIENT_DEFS = [
  { id: 'gradCyan', color: NEON_CYAN },
  { id: 'gradPurple', color: NEON_PURPLE },
  { id: 'gradPink', color: NEON_PINK },
  { id: 'gradGreen', color: NEON_GREEN },
  { id: 'gradOrange', color: NEON_ORANGE },
];

const FILTER_DEFS = [
  { id: 'glowCyan' },
  { id: 'glowPurple' },
  { id: 'glowPink' },
  { id: 'glowGreen' },
  { id: 'glowOrange' },
];

export default function Dashboard() {
  const { tickHistory, scenarioType, summary, status } = useSimulationStore();

  const metrics = getMetricsForScenario(scenarioType);
  const chartData = buildChartData(tickHistory, scenarioType);
  const stats =
    status === 'ended'
      ? getSummaryStats(summary as Record<string, unknown> | null, scenarioType)
      : [];

  return (
    <div className="h-full flex bg-white/5 backdrop-blur-xl">
      {/* Chart */}
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              {GRADIENT_DEFS.map((g) => (
                <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={g.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={g.color} stopOpacity={0} />
                </linearGradient>
              ))}
              {FILTER_DEFS.map((f) => (
                <filter key={f.id} id={f.id}>
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
            <XAxis
              dataKey="tick"
              stroke="#444"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#ffffff10' }}
            />
            <YAxis
              stroke="#444"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#ffffff10' }}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(10, 10, 20, 0.9)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                borderRadius: '8px',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)',
              }}
            />
            <Legend />
            {metrics.map((m) =>
              m.type === 'bar' ? (
                <Bar key={m.key} dataKey={m.key} fill={m.color} name={m.name} opacity={0.7} />
              ) : (
                <g key={m.key}>
                  <Area
                    type="monotone"
                    dataKey={m.key}
                    fill={`url(#${m.gradient})`}
                    stroke="none"
                  />
                  <Line
                    type="monotone"
                    dataKey={m.key}
                    stroke={m.color}
                    name={m.name}
                    dot={false}
                    strokeWidth={2}
                    filter={`url(#${m.filter})`}
                  />
                </g>
              ),
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="w-48 p-4 border-l border-white/10 flex flex-col gap-3">
        <h3 className="text-xs font-mono text-gray-400 uppercase">Summary</h3>
        {status === 'ended' && stats.length > 0 ? (
          stats.map((s) => <Stat key={s.label} label={s.label} value={s.value} />)
        ) : (
          <p className="text-gray-500 text-xs">{status === 'ended' ? 'No data' : 'Running...'}</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-mono text-cyber-cyan">{value}</div>
    </div>
  );
}
