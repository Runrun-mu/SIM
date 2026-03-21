import type { ScenarioType } from '@sim/shared';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../stores/simulation';

const scenarios: {
  type: ScenarioType;
  name: string;
  description: string;
  icon: string;
  agentCount: number;
}[] = [
  {
    type: 'prisoners-dilemma',
    name: "Prisoner's Dilemma",
    description: 'Cooperate or defect. Classic game theory.',
    icon: '⚔️',
    agentCount: 4,
  },
  {
    type: 'wealth-distribution',
    name: 'Wealth Distribution',
    description: 'Trade resources. Watch inequality emerge.',
    icon: '💰',
    agentCount: 6,
  },
  {
    type: 'public-goods',
    name: 'Public Goods Game',
    description: 'Contribute to a shared pool. Free-rider problem.',
    icon: '🏛️',
    agentCount: 6,
  },
  {
    type: 'ultimatum-game',
    name: 'Ultimatum Game',
    description: 'Propose a split; accept or reject.',
    icon: '🤝',
    agentCount: 4,
  },
  {
    type: 'dictator-game',
    name: 'Dictator Game',
    description: 'Dictator decides the split. Study altruism.',
    icon: '👑',
    agentCount: 4,
  },
  {
    type: 'hawk-dove',
    name: 'Hawk-Dove Game',
    description: 'Aggressive vs peaceful resource competition.',
    icon: '🦅',
    agentCount: 4,
  },
  {
    type: 'trust-game',
    name: 'Trust Game',
    description: 'Invest and return. Build or betray trust.',
    icon: '🔒',
    agentCount: 4,
  },
  {
    type: 'minority-game',
    name: 'Minority Game',
    description: 'Choose A or B. The minority wins.',
    icon: '🎲',
    agentCount: 7,
  },
  {
    type: 'tragedy-of-commons',
    name: 'Tragedy of Commons',
    description: 'Shared resource extraction dilemma.',
    icon: '🌍',
    agentCount: 6,
  },
  {
    type: 'axelrod-tournament',
    name: 'Axelrod Tournament',
    description: 'Iterated PD round-robin tournament.',
    icon: '🏆',
    agentCount: 4,
  },
  {
    type: 'schelling-segregation',
    name: 'Schelling Segregation',
    description: 'Agents prefer similar neighbors.',
    icon: '🏘️',
    agentCount: 8,
  },
  {
    type: 'voting-model',
    name: 'Voting Model',
    description: 'Multi-round voting for candidates.',
    icon: '🗳️',
    agentCount: 7,
  },
  {
    type: 'sir-epidemic',
    name: 'SIR Epidemic',
    description: 'Disease spreading simulation.',
    icon: '🦠',
    agentCount: 10,
  },
  {
    type: 'social-influence',
    name: 'Social Influence',
    description: 'Opinion dynamics and consensus.',
    icon: '📢',
    agentCount: 8,
  },
];

export default function ScenarioSelect() {
  const navigate = useNavigate();
  const setScenario = useSimulationStore((s) => s.setScenario);

  const handleSelect = (type: ScenarioType) => {
    setScenario(type);
    navigate('/characters');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold text-cyber-cyan mb-2 font-mono animate-glow-pulse">
        Group Dynamics Simulator
      </h1>
      <p
        className="text-gray-400 mb-12 text-lg animate-fade-in-up"
        style={{ animationDelay: '0.1s', opacity: 0 }}
      >
        LLM-driven multi-agent simulation platform
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        {scenarios.map((s, index) => (
          <button
            key={s.type}
            type="button"
            onClick={() => handleSelect(s.type)}
            className="group relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:border-cyber-cyan/50 hover:bg-white/10 transition-all duration-300 text-left hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] animate-fade-in-up"
            style={{ animationDelay: `${0.1 + index * 0.06}s`, opacity: 0 }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyber-cyan/5 to-cyber-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <span className="text-3xl mb-3 block">{s.icon}</span>
              <h2 className="text-lg font-bold text-white mb-1">{s.name}</h2>
              <p className="text-gray-400 text-sm line-clamp-2">{s.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-cyber-cyan text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  → Select
                </span>
                <span className="text-xs font-mono text-cyber-purple/70 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyber-purple/70 animate-pulse" />
                  {s.agentCount}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
