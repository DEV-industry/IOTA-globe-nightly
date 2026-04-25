/**
 * useEpochTimer — live countdown for the current epoch.
 *
 * Takes epochStartTimestampMs and epochDurationMs from the API,
 * returns a live-updating countdown string and progress percentage.
 */

import { useState, useEffect } from 'react';
import { formatEpochTimeLeft } from '../utils/formatters';

interface EpochTimerResult {
  timeLeft: string;
  progress: number;
  startLabel: string;
}

export function useEpochTimer(
  epochStartTimestampMs?: string,
  epochDurationMs?: string,
): EpochTimerResult {
  const [result, setResult] = useState<EpochTimerResult>({
    timeLeft: '—',
    progress: 0,
    startLabel: '',
  });

  useEffect(() => {
    if (!epochStartTimestampMs || !epochDurationMs) return;

    const update = () => {
      setResult(formatEpochTimeLeft(epochStartTimestampMs, epochDurationMs));
    };

    update(); // immediate
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [epochStartTimestampMs, epochDurationMs]);

  return result;
}
