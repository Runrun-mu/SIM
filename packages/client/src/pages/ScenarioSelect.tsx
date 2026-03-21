import type { ScenarioType } from '@sim/shared';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../stores/simulation';

const scenarios: { type: ScenarioType; name: string; description: string; icon: string }[] = [
  {
    type: 'prisoners-dilemma',
    name: "Prisoner's Dilemma",
    description:
      'Classic game theory: agents choose to cooperate or defect. Observe emergent strategies and trust dynamics.',
    icon: '⚔️',
  },
  {
    type: 'wealth-distribution',
    name: 'Wealth Distribution',
    description:
      'Agents trade resources in a dynamic market. Watch inequality emerge and study wealth concentration.',
    icon: '💰',
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
      <h1 className="text-5xl font-bold text-cyber-cyan mb-2 font-mono">
        Group Dynamics Simulator
      </h1>
      <p className="text-gray-400 mb-12 text-lg">LLM-driven multi-agent simulation platform</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {scenarios.map((s) => (
          <button
            key={s.type}
            type="button"
            onClick={() => handleSelect(s.type)}
            className="group relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:border-cyber-cyan/50 hover:bg-white/10 transition-all duration-300 text-left"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyber-cyan/5 to-cyber-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <span className="text-4xl mb-4 block">{s.icon}</span>
              <h2 className="text-2xl font-bold text-white mb-2">{s.name}</h2>
              <p className="text-gray-400">{s.description}</p>
              <div className="mt-4 text-cyber-cyan text-sm font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                → Select scenario
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
