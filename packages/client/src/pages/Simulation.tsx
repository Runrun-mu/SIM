import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentGraph from '../scene/AgentGraph';
import { useSimulationStore } from '../stores/simulation';
import CharacterPanel from '../ui/CharacterPanel';
import ControlBar from '../ui/ControlBar';
import Dashboard from '../ui/Dashboard';
import Timeline from '../ui/Timeline';
import { wsClient } from '../ws/client';
import { saveRun } from './MultiDashboard';

export default function Simulation() {
  const navigate = useNavigate();
  const { scenarioType, agents, status, config, summary, tickHistory, reset, handleWSMessage } =
    useSimulationStore();
  const initialized = useRef(false);
  const savedRef = useRef(false);

  // Save run data when simulation ends
  useEffect(() => {
    if (status === 'ended' && summary && scenarioType && !savedRef.current) {
      savedRef.current = true;
      saveRun({
        id: `run-${Date.now()}`,
        scenarioType,
        scenarioName: config?.name ?? scenarioType,
        agentCount: agents.length,
        ticks: tickHistory.length,
        summary,
        timestamp: Date.now(),
      });
    }
  }, [status, summary, scenarioType, config, agents, tickHistory]);

  useEffect(() => {
    if (!scenarioType || agents.length < 2) {
      navigate('/');
      return;
    }

    // Connect WS and subscribe to messages
    wsClient.connect();
    const unsub = wsClient.onMessage(handleWSMessage);

    // Start simulation once connected
    if (!initialized.current) {
      initialized.current = true;
      const tryStart = () => {
        if (wsClient.isConnected()) {
          wsClient.send({
            type: 'start-simulation',
            config: config ?? {
              type: scenarioType,
              name:
                scenarioType === 'prisoners-dilemma' ? "Prisoner's Dilemma" : 'Wealth Distribution',
              description: '',
              maxTicks: 20,
              agentCount: agents.length,
              parameters: {},
            },
            agents,
          });
        } else {
          setTimeout(tryStart, 500);
        }
      };
      tryStart();
    }

    return () => {
      unsub();
    };
  }, [scenarioType, agents, config, navigate, handleWSMessage]);

  const handleBack = () => {
    wsClient.send({ type: 'stop' });
    reset();
    navigate('/');
  };

  return (
    <div className="h-screen flex flex-col bg-cyber-bg overflow-hidden">
      {/* Top bar */}
      <ControlBar onBack={handleBack} />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Scene - Left */}
        <div className="flex-1 relative">
          <AgentGraph />
          <CharacterPanel />
        </div>

        {/* Right Panel - Timeline */}
        <div className="w-96 border-l border-white/10 overflow-hidden">
          <Timeline />
        </div>
      </div>

      {/* Bottom - Dashboard */}
      <div className="h-64 border-t border-white/10">
        <Dashboard />
      </div>
    </div>
  );
}
