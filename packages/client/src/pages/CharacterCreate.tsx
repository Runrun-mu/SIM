import type { AgentIdentity } from '@sim/shared';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../stores/simulation';

const generateId = () => `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const MAX_AGENTS = 8;

/** Generate a deterministic HSL color from a name string */
function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

/** Map personality keywords to trait tags */
function getTraitTags(personality: string): { label: string; color: string }[] {
  const lower = personality.toLowerCase();
  const tags: { label: string; color: string }[] = [];
  const traitMap: Record<string, string> = {
    rational: '#00f0ff',
    analytical: '#00f0ff',
    bold: '#ff2d55',
    aggressive: '#ff2d55',
    empathetic: '#a855f7',
    cooperative: '#a855f7',
    curious: '#facc15',
    adaptive: '#facc15',
    cautious: '#22c55e',
    strategic: '#3b82f6',
  };
  for (const [keyword, color] of Object.entries(traitMap)) {
    if (lower.includes(keyword)) {
      tags.push({ label: keyword, color });
    }
  }
  return tags.length > 0 ? tags : [{ label: 'neutral', color: '#6b7280' }];
}

const defaultAgent = (): AgentIdentity => ({
  id: generateId(),
  name: '',
  age: 30,
  occupation: '',
  personality: '',
  wealth: 100,
  soul: '',
});

const presets: Omit<AgentIdentity, 'id'>[] = [
  {
    name: 'Alice',
    age: 28,
    occupation: 'Economist',
    personality: 'Rational and analytical',
    wealth: 100,
    soul: 'You are Alice, a rational economist who always considers the long-term consequences of decisions. You believe in cooperation when it leads to mutual benefit.',
  },
  {
    name: 'Bob',
    age: 35,
    occupation: 'Trader',
    personality: 'Bold and aggressive',
    wealth: 100,
    soul: 'You are Bob, an aggressive trader who prioritizes personal gain. You are willing to take risks and exploit opportunities.',
  },
  {
    name: 'Carol',
    age: 42,
    occupation: 'Diplomat',
    personality: 'Empathetic and cooperative',
    wealth: 100,
    soul: 'You are Carol, a diplomat who values relationships and trust. You prefer cooperation and building long-term alliances.',
  },
  {
    name: 'Dave',
    age: 25,
    occupation: 'Student',
    personality: 'Curious and adaptive',
    wealth: 100,
    soul: 'You are Dave, a curious student who learns from each interaction. You start with cooperation but adapt your strategy based on observed behavior.',
  },
];

export default function CharacterCreate() {
  const navigate = useNavigate();
  const { scenarioType, agents, addAgent, removeAgent, updateAgent, setAgents } =
    useSimulationStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!scenarioType) {
    navigate('/');
    return null;
  }

  const handleAddPresets = () => {
    const newAgents = presets.map((p) => ({ ...p, id: generateId() }));
    setAgents(newAgents);
  };

  const handleAddBlank = () => {
    addAgent(defaultAgent());
  };

  const handleStartSimulation = () => {
    if (agents.length < 2) return;
    navigate('/simulation');
  };

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-cyber-cyan text-sm mb-2 block"
          >
            ← Back to scenarios
          </button>
          <h1 className="text-3xl font-bold text-white">
            Character Setup
            <span className="text-cyber-cyan ml-2 text-lg font-mono">
              {scenarioType === 'prisoners-dilemma' ? "Prisoner's Dilemma" : 'Wealth Distribution'}
            </span>
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAddPresets}
            className="px-4 py-2 rounded-lg border border-cyber-purple/50 text-cyber-purple hover:bg-cyber-purple/10 transition-colors"
          >
            Load Presets
          </button>
          <button
            type="button"
            onClick={handleAddBlank}
            className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
          >
            + Add Agent
          </button>
        </div>
      </div>

      {/* Agent count progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-gray-400">
            Agents: {agents.length} / {MAX_AGENTS}
          </span>
          <span className="text-xs font-mono text-gray-500">
            {agents.length < 2 ? 'Need at least 2 agents' : '✓ Ready to simulate'}
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(agents.length / MAX_AGENTS) * 100}%`,
              background:
                agents.length < 2 ? '#ff2d55' : 'linear-gradient(90deg, #00f0ff, #7b2ff7)',
            }}
          />
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-20 text-gray-500 animate-fade-in-up">
          <p className="text-xl mb-4">No agents yet</p>
          <p>Click "Load Presets" to add example agents or "Add Agent" to create custom ones.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] animate-slide-in"
              style={{
                animationDelay: `${index * 0.08}s`,
                opacity: 0,
                animationFillMode: 'forwards',
              }}
            >
              {editingId === agent.id ? (
                <AgentForm
                  agent={agent}
                  onSave={(updated) => {
                    updateAgent(agent.id, updated);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {/* Color-coded avatar */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{
                          backgroundColor: `${nameToColor(agent.name || 'U')}20`,
                          color: nameToColor(agent.name || 'U'),
                          border: `2px solid ${nameToColor(agent.name || 'U')}40`,
                        }}
                      >
                        {(agent.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{agent.name || 'Unnamed'}</h3>
                        <p className="text-gray-400 text-sm">
                          {agent.occupation} · Age {agent.age} · 💰 {agent.wealth}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(agent.id)}
                        className="text-xs text-cyber-cyan hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAgent(agent.id)}
                        className="text-xs text-cyber-pink hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {/* Personality trait tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {getTraitTags(agent.personality).map((tag) => (
                      <span
                        key={tag.label}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${tag.color}15`,
                          color: tag.color,
                          border: `1px solid ${tag.color}30`,
                        }}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-300 mt-2 text-sm">{agent.personality}</p>
                  <p className="text-gray-500 mt-1 text-xs italic line-clamp-2">{agent.soul}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {agents.length >= 2 && (
        <div className="text-center">
          <button
            type="button"
            onClick={handleStartSimulation}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white font-bold text-lg hover:opacity-90 transition-opacity"
          >
            Start Simulation ({agents.length} agents)
          </button>
        </div>
      )}
    </div>
  );
}

function AgentForm({
  agent,
  onSave,
  onCancel,
}: {
  agent: AgentIdentity;
  onSave: (updates: Partial<AgentIdentity>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...agent });

  return (
    <div className="space-y-3">
      <input
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <div className="grid grid-cols-3 gap-2">
        <input
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          type="number"
          placeholder="Age"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
        />
        <input
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          placeholder="Occupation"
          value={form.occupation}
          onChange={(e) => setForm({ ...form, occupation: e.target.value })}
        />
        <input
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          type="number"
          placeholder="Wealth"
          value={form.wealth}
          onChange={(e) => setForm({ ...form, wealth: Number(e.target.value) })}
        />
      </div>
      <input
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
        placeholder="Personality"
        value={form.personality}
        onChange={(e) => setForm({ ...form, personality: e.target.value })}
      />
      <textarea
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white h-20 resize-none"
        placeholder="Soul prompt (system role for LLM)"
        value={form.soul}
        onChange={(e) => setForm({ ...form, soul: e.target.value })}
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-sm text-gray-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(form)}
          className="px-3 py-1 text-sm bg-cyber-cyan/20 text-cyber-cyan rounded-lg hover:bg-cyber-cyan/30"
        >
          Save
        </button>
      </div>
    </div>
  );
}
