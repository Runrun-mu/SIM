import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSimulationStore } from '../stores/simulation';

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
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="tick" stroke="#666" fontSize={10} />
            <YAxis stroke="#666" fontSize={10} />
            <Tooltip
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
              }}
            />
            <Legend />
            {scenarioType === 'prisoners-dilemma' && (
              <>
                <Line
                  type="monotone"
                  dataKey="cooperationRate"
                  stroke="#00f0ff"
                  name="Cooperation %"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#7b2ff7"
                  name="Avg Score"
                  dot={false}
                  strokeWidth={2}
                />
              </>
            )}
            {scenarioType === 'wealth-distribution' && (
              <>
                <Line
                  type="monotone"
                  dataKey="gini"
                  stroke="#ff2d55"
                  name="Gini Coefficient"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="top10"
                  stroke="#00f0ff"
                  name="Top 10% Share"
                  dot={false}
                  strokeWidth={2}
                />
              </>
            )}
          </LineChart>
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
