import { useSimulationStore } from '../stores/simulation';

export default function CharacterPanel() {
  const { selectedAgentId, selectAgent, tickHistory, agents } = useSimulationStore();

  if (!selectedAgentId) return null;

  const agent = agents.find((a) => a.id === selectedAgentId);
  if (!agent) return null;

  // Get agent's latest state from tick history
  const latestTick = tickHistory[tickHistory.length - 1];
  const agentState = latestTick?.agentStates.find((s) => s.identity.id === selectedAgentId);

  return (
    <div className="absolute top-4 left-4 w-72 p-4 rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-white">{agent.name}</h3>
        <button
          type="button"
          onClick={() => selectAgent(null)}
          className="text-gray-400 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>

      <div className="text-sm text-gray-400 space-y-1 mb-3">
        <p>
          {agent.occupation} · Age {agent.age}
        </p>
        <p>{agent.personality}</p>
      </div>

      {agentState && (
        <div className="space-y-2">
          <h4 className="text-xs font-mono text-gray-500 uppercase">Resources</h4>
          <div className="grid grid-cols-2 gap-2">
            <ResourceBar
              label="Wealth"
              value={agentState.resources.wealth}
              max={200}
              color="cyan"
            />
            <ResourceBar
              label="Health"
              value={agentState.resources.health}
              max={200}
              color="green"
            />
            <ResourceBar
              label="Credit"
              value={agentState.resources.credit}
              max={100}
              color="purple"
            />
            <ResourceBar
              label="Rep"
              value={agentState.resources.reputation}
              max={100}
              color="yellow"
            />
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500 italic line-clamp-3">{agent.soul}</div>
    </div>
  );
}

function ResourceBar({
  label,
  value,
  max,
  color,
}: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyber-cyan',
    green: 'bg-green-400',
    purple: 'bg-cyber-purple',
    yellow: 'bg-yellow-400',
  };

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-mono">{Math.round(value)}</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorMap[color] ?? 'bg-white'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
