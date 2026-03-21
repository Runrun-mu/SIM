import {
  Area,
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

export default function Dashboard() {
  const { tickHistory, scenarioType, summary, status } = useSimulationStore();

  const chartData = tickHistory.map((t) => ({
    tick: t.tick,
    cooperationRate: t.aggregated.cooperationRate
      ? +(t.aggregated.cooperationRate * 100).toFixed(1)
      : undefined,
    gini: t.aggregated.giniCoefficient ? +t.aggregated.giniCoefficient.toFixed(3) : undefined,
    avgScore: t.aggregated.averageScore ? +t.aggregated.averageScore.toFixed(1) : undefined,
    top10: t.aggregated.top10Percent ? +(t.aggregated.top10Percent * 100).toFixed(1) : undefined,
  }));

  return (
    <div className="h-full flex bg-white/5 backdrop-blur-xl">
      {/* Chart */}
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NEON_CYAN} stopOpacity={0.3} />
                <stop offset="100%" stopColor={NEON_CYAN} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NEON_PURPLE} stopOpacity={0.3} />
                <stop offset="100%" stopColor={NEON_PURPLE} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NEON_PINK} stopOpacity={0.3} />
                <stop offset="100%" stopColor={NEON_PINK} stopOpacity={0} />
              </linearGradient>
              <filter id="glowCyan">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowPurple">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowPink">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
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
            {scenarioType === 'prisoners-dilemma' && (
              <>
                <Area
                  type="monotone"
                  dataKey="cooperationRate"
                  fill="url(#gradCyan)"
                  stroke="none"
                />
                <Line
                  type="monotone"
                  dataKey="cooperationRate"
                  stroke={NEON_CYAN}
                  name="Cooperation %"
                  dot={false}
                  strokeWidth={2}
                  filter="url(#glowCyan)"
                />
                <Area type="monotone" dataKey="avgScore" fill="url(#gradPurple)" stroke="none" />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke={NEON_PURPLE}
                  name="Avg Score"
                  dot={false}
                  strokeWidth={2}
                  filter="url(#glowPurple)"
                />
              </>
            )}
            {scenarioType === 'wealth-distribution' && (
              <>
                <Area type="monotone" dataKey="gini" fill="url(#gradPink)" stroke="none" />
                <Line
                  type="monotone"
                  dataKey="gini"
                  stroke={NEON_PINK}
                  name="Gini Coefficient"
                  dot={false}
                  strokeWidth={2}
                  filter="url(#glowPink)"
                />
                <Area type="monotone" dataKey="top10" fill="url(#gradCyan)" stroke="none" />
                <Line
                  type="monotone"
                  dataKey="top10"
                  stroke={NEON_CYAN}
                  name="Top 10% Share"
                  dot={false}
                  strokeWidth={2}
                  filter="url(#glowCyan)"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="w-48 p-4 border-l border-white/10 flex flex-col gap-3">
        <h3 className="text-xs font-mono text-gray-400 uppercase">Summary</h3>
        {status === 'ended' && summary ? (
          <>
            {summary.cooperationRate !== undefined && (
              <Stat
                label="Final Coop Rate"
                value={`${(summary.cooperationRate * 100).toFixed(0)}%`}
              />
            )}
            {summary.averageScore !== undefined && (
              <Stat label="Avg Score" value={summary.averageScore.toFixed(1)} />
            )}
            {summary.giniCoefficient !== undefined && (
              <Stat label="Gini" value={summary.giniCoefficient.toFixed(3)} />
            )}
            {summary.top10Percent !== undefined && (
              <Stat label="Top 10%" value={`${(summary.top10Percent * 100).toFixed(0)}%`} />
            )}
          </>
        ) : (
          <p className="text-gray-500 text-xs">Running...</p>
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
