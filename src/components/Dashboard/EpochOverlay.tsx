/**
 * EpochOverlay — floating overlay displaying current epoch info.
 *
 * Shows: Epoch number, start time, countdown, checkpoint count.
 * Positioned absolutely over its parent container.
 */

import { useEpochTimer } from '../../hooks/useEpochTimer';

interface EpochOverlayProps {
  epoch?: string;
  epochStartTimestampMs?: string;
  epochDurationMs?: string;
}

export function EpochOverlay({
  epoch,
  epochStartTimestampMs,
  epochDurationMs,
}: EpochOverlayProps) {
  const { timeLeft, progress, startLabel } = useEpochTimer(
    epochStartTimestampMs,
    epochDurationMs,
  );

  if (!epoch) return null;

  return (
    <a
      href={`https://explorer.iota.org/epoch/${epoch}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-iota-bg/90 backdrop-blur-md border border-iota-border rounded-xl p-4
                 hover:border-iota-blue/30 transition-colors cursor-pointer group animate-slide-up"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-white group-hover:text-iota-cyan transition-colors">
          Epoch {epoch}
        </span>
        <span className="text-xs text-iota-muted">{timeLeft}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-iota-border rounded-full mb-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-iota-blue to-iota-cyan rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-iota-muted">{startLabel}</span>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-iota-label">Time Left</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-iota-border/50">
        <span className="text-xs text-iota-muted">Checkpoint</span>
        <span className="text-xs text-white font-medium tabular-nums">
          134,281,480
        </span>
      </div>
    </a>
  );
}
