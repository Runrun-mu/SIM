import { useSimulationStore } from '../stores/simulation';
import { useUIStore } from '../stores/ui';
import { wsClient } from '../ws/client';

export default function ControlBar({ onBack }: { onBack: () => void }) {
  const { status, currentTick, scenarioType, config } = useSimulationStore();
  const { speed, setSpeed } = useUIStore();
  const maxTicks = config?.maxTicks ?? useSimulationStore.getState().maxTicks;

  const handlePause = () => wsClient.send({ type: 'pause' });
  const handleResume = () => wsClient.send({ type: 'resume' });
  const handleStop = () => wsClient.send({ type: 'stop' });

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    wsClient.send({ type: 'set-speed', speed: newSpeed });
  };

  return (
    <div className="h-14 border-b border-white/10 bg-white/5 backdrop-blur-xl flex items-center px-4 gap-4">
      <button type="button" onClick={onBack} className="text-gray-400 hover:text-white text-sm">
        ← Exit
      </button>

      <div className="h-6 w-px bg-white/10" />

      <span className="text-cyber-cyan font-mono text-sm">
        {scenarioType
          ? scenarioType
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')
          : '—'}
      </span>

      <div className="h-6 w-px bg-white/10" />

      <span className="text-white font-mono text-sm">
        Tick: {currentTick.toLocaleString()} / {maxTicks.toLocaleString()}
      </span>

      <div
        className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-green-400 animate-pulse' : status === 'paused' ? 'bg-yellow-400' : 'bg-gray-500'}`}
      />
      <span className="text-gray-400 text-xs uppercase">{status}</span>

      <div className="flex-1" />

      {/* Speed control */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs">Speed:</span>
        {[0.5, 1, 2, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSpeedChange(s)}
            className={`px-2 py-1 rounded text-xs font-mono ${speed === s ? 'bg-cyber-cyan/20 text-cyber-cyan' : 'text-gray-400 hover:text-white'}`}
          >
            {s}x
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-white/10" />

      {/* Controls */}
      {status === 'running' && (
        <button
          type="button"
          onClick={handlePause}
          className="px-3 py-1 rounded-lg text-sm bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
        >
          ⏸ Pause
        </button>
      )}
      {status === 'paused' && (
        <button
          type="button"
          onClick={handleResume}
          className="px-3 py-1 rounded-lg text-sm bg-green-500/10 text-green-400 hover:bg-green-500/20"
        >
          ▶ Resume
        </button>
      )}
      {(status === 'running' || status === 'paused') && (
        <button
          type="button"
          onClick={handleStop}
          className="px-3 py-1 rounded-lg text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20"
        >
          ⏹ Stop
        </button>
      )}
    </div>
  );
}
