import { useSimulationStore } from '../stores/simulation';

export default function Timeline() {
  const { tickHistory, scenarioType } = useSimulationStore();

  return (
    <div className="h-full flex flex-col bg-white/5">
      <div className="p-3 border-b border-white/10">
        <h2 className="text-sm font-bold text-white font-mono">Timeline</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tickHistory.length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-8">Waiting for simulation...</p>
        ) : (
          [...tickHistory].reverse().map((tick) => (
            <div key={tick.tick} className="p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-cyber-cyan font-mono text-xs">Tick {tick.tick}</span>
                <span className="text-gray-500 text-xs">
                  {tick.interactions.length} interactions
                </span>
              </div>
              {tick.interactions.map((interaction) => (
                <div key={interaction.id} className="text-xs text-gray-300 mb-1">
                  {Object.entries(interaction.actions).map(([agentId, action]) => (
                    <span key={agentId} className="mr-2">
                      <span className="text-gray-400">{agentId.slice(0, 8)}:</span>{' '}
                      <span
                        className={
                          action === 'cooperate'
                            ? 'text-green-400'
                            : action === 'defect'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                        }
                      >
                        {action}
                      </span>
                    </span>
                  ))}
                </div>
              ))}
              {scenarioType === 'prisoners-dilemma' &&
                tick.aggregated.cooperationRate !== undefined && (
                  <div className="text-xs text-gray-400 mt-1">
                    Cooperation: {(tick.aggregated.cooperationRate * 100).toFixed(0)}%
                  </div>
                )}
              {scenarioType === 'wealth-distribution' &&
                tick.aggregated.giniCoefficient !== undefined && (
                  <div className="text-xs text-gray-400 mt-1">
                    Gini: {tick.aggregated.giniCoefficient.toFixed(3)}
                  </div>
                )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
