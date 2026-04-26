/**
 * LiveTpsCard — Live TPS & BPS counters.
 *
 * Displays real-time Transactions Per Second and Blocks Per Second
 * with trend indicators (↑/↓) and a rolling sparkline bar chart.
 *
 * Currently uses simulated data via setInterval — swap the
 * useSimulatedTps hook body for a real WebSocket feed later.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCheckpoints } from '../../hooks/useCheckpoints';

// ─── Types ──────────────────────────────────────────────────────

interface TpsSnapshot {
  tps: number;
  bps: number;
  timestamp: number;
}

type Trend = 'up' | 'down' | 'flat';

// ─── Simulated data hook (replace with WS later) ────────────────

const HISTORY_LENGTH = 20; // keep last 20 snapshots for sparkline

function useRealTps() {
  const { checkpoints, isLoading, isError } = useCheckpoints();
  const [current, setCurrent] = useState<TpsSnapshot | null>(null);
  const [history, setHistory] = useState<TpsSnapshot[]>([]);
  const prevRef = useRef<TpsSnapshot | null>(null);

  useEffect(() => {
    if (!checkpoints || checkpoints.length < 2) return;

    const latest = checkpoints[0];
    const oldest = checkpoints[checkpoints.length - 1];

    if (!latest || !oldest) return;

    const timeDiff =
      (Number(latest.timestampMs) - Number(oldest.timestampMs)) / 1000;
    
    if (timeDiff <= 0) return;

    const txDiff =
      Number(latest.networkTotalTransactions) -
      Number(oldest.networkTotalTransactions);
    const blocksDiff =
      Number(latest.sequenceNumber) - Number(oldest.sequenceNumber);

    const tps = Math.round((txDiff / timeDiff) * 10) / 10;
    const bps = Math.round((blocksDiff / timeDiff) * 10) / 10;

    const snap: TpsSnapshot = {
      tps,
      bps,
      timestamp: Number(latest.timestampMs),
    };

    // Only update if it's a new measurement (based on timestamp)
    if (!prevRef.current || prevRef.current.timestamp !== snap.timestamp) {
      prevRef.current = current;
      setCurrent(snap);
      setHistory((h) => [...h.slice(-(HISTORY_LENGTH - 1)), snap]);
    }
  }, [checkpoints, current]);

  const previous = prevRef.current;

  const tpsTrend: Trend =
    current && previous
      ? current.tps > previous.tps
        ? 'up'
        : current.tps < previous.tps
          ? 'down'
          : 'flat'
      : 'flat';

  const bpsTrend: Trend =
    current && previous
      ? current.bps > previous.bps
        ? 'up'
        : current.bps < previous.bps
          ? 'down'
          : 'flat'
      : 'flat';

  return { current, previous, history, tpsTrend, bpsTrend, isLoading, isError };
}

// ─── Trend arrow component ──────────────────────────────────────

function TrendArrow({ trend }: { trend: Trend }) {
  if (trend === 'flat') {
    return (
      <span className="text-iota-muted text-xs ml-1 transition-all duration-300">
        ―
      </span>
    );
  }

  const isUp = trend === 'up';
  return (
    <span
      className={`inline-flex items-center ml-1.5 text-xs font-semibold transition-all duration-300
        ${isUp ? 'text-emerald-400' : 'text-red-400'}`}
    >
      <svg
        className={`w-3.5 h-3.5 transition-transform duration-300
          ${isUp ? '' : 'rotate-180'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </span>
  );
}

// ─── Animated number display ────────────────────────────────────

function AnimatedCounter({
  value,
  trend,
  label,
  unit,
}: {
  value: number | null;
  trend: Trend;
  label: string;
  unit: string;
}) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const animationRef = useRef<number>(0);
  const currentRef = useRef<number>(0);

  const animate = useCallback((target: number) => {
    const start = currentRef.current;
    const diff = target - start;
    const duration = 600; // ms
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;

      currentRef.current = current;
      setDisplayValue(Math.round(current * 10) / 10);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      }
    };

    cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (value !== null) {
      animate(value);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [value, animate]);

  const glowColor =
    trend === 'up'
      ? 'drop-shadow(0 0 8px rgba(52,211,153,0.15))'
      : trend === 'down'
        ? 'drop-shadow(0 0 8px rgba(248,113,113,0.15))'
        : 'none';

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-iota-muted uppercase tracking-widest font-medium">
        {label}
      </span>
      <div className="flex items-baseline" style={{ filter: glowColor }}>
        <span
          className={`text-3xl font-bold tabular-nums tracking-tight transition-colors duration-300
            ${trend === 'up' ? 'text-emerald-300' : trend === 'down' ? 'text-red-300' : 'text-white'}`}
        >
          {value !== null ? displayValue.toFixed(1) : '—'}
        </span>
        <span className="text-xs text-iota-muted ml-1.5 font-medium">
          {unit}
        </span>
        <TrendArrow trend={trend} />
      </div>
    </div>
  );
}

// ─── Sparkline bar chart ────────────────────────────────────────

function Sparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  if (data.length === 0) return null;

  const max = Math.max(...data, 1);

  return (
    <div className="flex items-end gap-[2px] h-8 w-full">
      {data.map((val, i) => {
        const heightPct = Math.max((val / max) * 100, 4);
        const opacity = 0.3 + (i / data.length) * 0.7; // fade in from left

        return (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-500 ease-out"
            style={{
              height: `${heightPct}%`,
              backgroundColor: color,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Main card ──────────────────────────────────────────────────

export function LiveTpsCard() {
  const { current, history, tpsTrend, bpsTrend, isLoading, isError } =
    useRealTps();

  const tpsHistory = history.map((s) => s.tps);
  const bpsHistory = history.map((s) => s.bps);

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 animate-fade-in flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-iota-label flex items-center gap-2">
          <svg
            className="w-4 h-4 text-iota-cyan"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          Network Throughput
        </h4>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-emerald-400/70 font-medium uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-10 gap-2 animate-pulse">
          <div className="w-20 h-6 rounded bg-white/5" />
          <div className="w-12 h-3 rounded bg-white/5" />
          <div className="w-full h-8 rounded bg-white/5 mt-4" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <svg
            className="w-8 h-8 text-red-400/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-xs text-red-400/80">Connection lost</p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Counters */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <AnimatedCounter
              value={current?.tps ?? null}
              trend={tpsTrend}
              label="Transactions / sec"
              unit="TPS"
            />
            <AnimatedCounter
              value={current?.bps ?? null}
              trend={bpsTrend}
              label="Blocks / sec"
              unit="BPS"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-white/5 mb-3" />

          {/* Sparklines */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-iota-muted uppercase tracking-wider">
                TPS History
              </span>
              <Sparkline data={tpsHistory} color="#06b6d4" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-iota-muted uppercase tracking-wider">
                BPS History
              </span>
              <Sparkline data={bpsHistory} color="#3b82f6" />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-iota-muted">
              Updates every 5s
            </span>
            <span className="text-[10px] text-iota-muted tabular-nums font-mono">
              Peak: {Math.max(...tpsHistory, 0).toFixed(1)} TPS
            </span>
          </div>
        </>
      )}
    </div>
  );
}
