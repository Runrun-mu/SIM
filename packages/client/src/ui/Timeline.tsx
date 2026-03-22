import { useSimulationStore } from '../stores/simulation';
import { useUIStore } from '../stores/ui';

/** Get a short metric summary string for any scenario type */
function getTickSummary(
  scenarioType: string | null,
  aggregated: Record<string, unknown>,
): string | null {
  if (!scenarioType) return null;
  const a = aggregated;

  switch (scenarioType) {
    case 'prisoners-dilemma':
      return a.cooperationRate != null
        ? `Coop: ${((a.cooperationRate as number) * 100).toFixed(0)}%`
        : null;
    case 'wealth-distribution':
      return a.giniCoefficient != null ? `Gini: ${(a.giniCoefficient as number).toFixed(3)}` : null;
    case 'public-goods':
      return a.averageContribution != null
        ? `Avg Contrib: ${(a.averageContribution as number).toFixed(1)}`
        : null;
    case 'ultimatum-game':
      return a.averageOffer != null ? `Avg Offer: ${(a.averageOffer as number).toFixed(1)}` : null;
    case 'dictator-game':
      return a.averageDictatorOffer != null
        ? `Avg Offer: ${(a.averageDictatorOffer as number).toFixed(1)}`
        : null;
    case 'hawk-dove':
      return a.hawkRate != null ? `Hawk: ${((a.hawkRate as number) * 100).toFixed(0)}%` : null;
    case 'trust-game':
      return a.trustIndex != null ? `Trust: ${(a.trustIndex as number).toFixed(2)}` : null;
    case 'minority-game':
      return a.winnerCount != null ? `Winners: ${a.winnerCount}` : null;
    case 'tragedy-of-commons':
      return a.resourcePool != null ? `Pool: ${(a.resourcePool as number).toFixed(0)}` : null;
    case 'axelrod-tournament': {
      const scores = a.tournamentScores as Record<string, number> | undefined;
      if (scores) {
        const vals = Object.values(scores);
        const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
        return `Avg Score: ${avg.toFixed(1)}`;
      }
      return null;
    }
    case 'schelling-segregation':
      return a.satisfactionRate != null
        ? `Satisfaction: ${((a.satisfactionRate as number) * 100).toFixed(0)}%`
        : null;
    case 'voting-model':
      return a.winningCandidate != null ? `Leader: ${a.winningCandidate}` : null;
    case 'sir-epidemic':
      return a.infectedCount != null ? `Infected: ${a.infectedCount}` : null;
    case 'social-influence':
      return a.consensusLevel != null
        ? `Consensus: ${(a.consensusLevel as number).toFixed(2)}`
        : null;
    default:
      return null;
  }
}

export default function Timeline() {
  const { tickHistory, scenarioType, agents } = useSimulationStore();
  const { selectedTick, setSelectedTick } = useUIStore();

  // Build agentId → name lookup
  const agentNameMap = new Map(agents.map((a) => [a.id, a.name]));

  const handleTickClick = (tick: number) => {
    setSelectedTick(selectedTick === tick ? null : tick);
  };

  return (
    <div className="h-full flex flex-col bg-white/5">
      <div className="p-3 border-b border-white/10">
        <h2 className="text-sm font-bold text-white font-mono">Timeline</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tickHistory.length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-8">Waiting for simulation...</p>
        ) : (
          [...tickHistory].reverse().map((tick) => {
            const isSelected = selectedTick === tick.tick;
            const summary = getTickSummary(
              scenarioType,
              tick.aggregated as unknown as Record<string, unknown>,
            );

            return (
              <button
                type="button"
                key={tick.tick}
                onClick={() => handleTickClick(tick.tick)}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 text-left w-full ${
                  isSelected
                    ? 'bg-cyber-cyan/10 border-cyber-cyan/40 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'bg-white/5 border-white/5 hover:border-white/15 hover:bg-white/[0.07]'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`font-mono text-xs ${isSelected ? 'text-cyber-cyan' : 'text-cyber-cyan/70'}`}
                  >
                    {isSelected ? '▸ ' : ''}Tick {tick.tick}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {tick.interactions.length} interactions
                  </span>
                </div>

                {/* Metric summary for all scenarios */}
                {summary && <div className="text-xs text-gray-400 mb-2 font-mono">{summary}</div>}

                {tick.interactions.map((interaction) => (
                  <div key={interaction.id} className="text-xs text-gray-300 mb-1">
                    {Object.entries(interaction.actions).map(([agentId, action]) => (
                      <span key={agentId} className="mr-2">
                        <span className="text-gray-400">
                          {agentNameMap.get(agentId) || agentId.slice(0, 8)}:
                        </span>{' '}
                        <span
                          className={
                            action === 'cooperate'
                              ? 'text-green-400'
                              : action === 'defect'
                                ? 'text-red-400'
                                : action === 'hawk'
                                  ? 'text-red-400'
                                  : action === 'dove'
                                    ? 'text-green-400'
                                    : 'text-yellow-400'
                          }
                        >
                          {action}
                        </span>
                      </span>
                    ))}
                  </div>
                ))}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
