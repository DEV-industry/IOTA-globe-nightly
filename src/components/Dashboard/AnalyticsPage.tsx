import { useState, useMemo } from 'react';
import {
  BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

// ─── Time Range ─────────────────────────────────────────────────────────────────

type TimeRange = '60min' | '24h' | '7d' | '30d';
const TIME_LABELS: Record<TimeRange, string> = {
  '60min': '60 min', '24h': '24 hours', '7d': '7 days', '30d': '30 days',
};

// ─── Mock Data Generators ───────────────────────────────────────────────────────

function seed(i: number) { return Math.abs(Math.sin(i * 127.1) * 43758.5453) % 1; }

function genBlockTimeData(count = 60) {
  return Array.from({ length: count }, (_, i) => {
    const min = Math.floor(i / 1);
    const h = 16 + Math.floor(min / 60);
    const m = min % 60;
    const time = `${h}:${String(m).padStart(2, '0')}`;
    const blockTime = 390 + seed(i) * 20 - 5;
    const movingAvg = 395 + Math.sin(i * 0.08) * 3;
    return { time, blockTime: Math.round(blockTime), movingAvg: Math.round(movingAvg * 10) / 10 };
  });
}

function genTxMetricsData(count = 60) {
  return Array.from({ length: count }, (_, i) => {
    const min = Math.floor(i);
    const h = 16 + Math.floor(min / 60);
    const m = 28 + (min % 60);
    const hh = h + Math.floor(m / 60);
    const mm = m % 60;
    const time = `${hh}:${String(mm).padStart(2, '0')}`;
    const tps = 80 + seed(i + 10) * 150 + (seed(i + 20) > 0.85 ? 300 : 0);
    const txCount = 1000 + seed(i + 30) * 4000 + (seed(i + 40) > 0.8 ? 2000 : 0);
    return { time, tps: Math.round(tps), txCount: Math.round(txCount) };
  });
}

function genFeeData(count = 60) {
  return Array.from({ length: count }, (_, i) => {
    const min = Math.floor(i);
    const h = 16 + Math.floor(min / 60);
    const m = 28 + (min % 60);
    const hh = h + Math.floor(m / 60);
    const mm = m % 60;
    const time = `${hh}:${String(mm).padStart(2, '0')}`;
    const baseFee = 50 + seed(i + 50) * 120;
    const priorityFee = 20 + seed(i + 60) * 80 + (seed(i + 70) > 0.9 ? 400 : 0);
    const medianBase = 0.015 + seed(i + 80) * 0.02;
    const medianPriority = 0.005 + seed(i + 90) * 0.015;
    return {
      time, baseFee: Math.round(baseFee), priorityFee: Math.round(priorityFee),
      medianBase: Math.round(medianBase * 1000) / 1000,
      medianPriority: Math.round(medianPriority * 1000) / 1000,
    };
  });
}

const DONUT_DATA = [
  { name: 'United States', value: 23.4, stake: '3.4B', color: '#22c55e' },
  { name: 'Germany', value: 16.2, stake: '2.4B', color: '#3b82f6' },
  { name: 'The Netherlands', value: 12.7, stake: '1.9B', color: '#f59e0b' },
  { name: 'Singapore', value: 5.31, stake: '776.4M', color: '#6366f1' },
  { name: 'Japan', value: 4.8, stake: '701M', color: '#ec4899' },
  { name: 'Finland', value: 4.2, stake: '613M', color: '#14b8a6' },
  { name: 'Others', value: 33.39, stake: '4.9B', color: '#374151' },
];

// ─── Shared tooltip ─────────────────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: 'rgba(0,0,0,0.88)',
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  borderStyle: 'solid' as const,
  borderRadius: 10,
  padding: '8px 12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};
const tooltipLabel = { color: '#6b7280', fontSize: 11, marginBottom: 4 };
const axisTickStyle = { fill: '#4b5563', fontSize: 11, fontFamily: 'Inter' };

// ─── Sub-components ─────────────────────────────────────────────────────────────

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

interface StatMiniCardProps { label: string; value: string; unit: string; change: number }
function StatMiniCard({ label, value, unit, change }: StatMiniCardProps) {
  const positive = change >= 0;
  return (
    <div className="bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-iota-muted font-medium">{label}</span>
        <span className={`text-xs font-semibold flex items-center gap-0.5 ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d={positive ? 'M6 2L10 7H2L6 2Z' : 'M6 10L2 5H10L6 10Z'} fill="currentColor" />
          </svg>
          {positive ? '+' : ''}{change}%
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
        <span className="text-xs text-iota-muted uppercase font-semibold tracking-wider">{unit}</span>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-1">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-sm text-iota-muted mt-0.5">{subtitle}</p>
    </div>
  );
}

function ChartLabel({ title, sub, legend }: { title: string; sub?: string; legend?: { label: string; color: string }[] }) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-bold text-white">{title}</span>
        {sub && <span className="text-xs text-iota-muted">{sub}</span>}
      </div>
      {legend && (
        <div className="flex items-center gap-4">
          {legend.map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
              <span className="text-xs text-iota-muted">{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>('60min');

  const blockTimeData = useMemo(() => genBlockTimeData(), []);
  const txMetrics = useMemo(() => genTxMetricsData(), []);
  const feeData = useMemo(() => genFeeData(), []);

  return (
    <div className="min-h-screen bg-[#000] text-white">
      <div className="max-w-[1400px] mx-auto pt-24 pb-12 px-4 lg:px-8">

        {/* ── Time Range Pills ───────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-1">
            {(Object.keys(TIME_LABELS) as TimeRange[]).map(k => (
              <button
                key={k}
                onClick={() => setRange(k)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  range === k
                    ? 'bg-[#7c3aed] text-white shadow-lg shadow-purple-500/20'
                    : 'text-iota-muted hover:text-white'
                }`}
              >
                {TIME_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Block Overview ─────────────────────────────────── */}
        <GlassCard className="mb-6">
          <div className="flex items-baseline gap-2 mb-4">
            <h3 className="text-base font-bold text-white">Block Overview</h3>
            <span className="text-xs text-iota-muted">· last {TIME_LABELS[range]}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatMiniCard label="Highest fee block" value="391.74" unit="IOTA" change={19.9} />
            <StatMiniCard label="Total transactions" value="1,786,423" unit="txs" change={5.5} />
            <StatMiniCard label="Avg. block fullness" value="3" unit="%" change={-5.7} />
            <StatMiniCard label="Total tips paid" value="48,799.96" unit="IOTA" change={55.3} />
          </div>
        </GlassCard>

        {/* ── Validator Footprint ────────────────────────────── */}
        <GlassCard className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold text-iota-muted bg-white/[0.04] border border-white/10 rounded-full px-3 py-1">
                ⊕ Validator Footprint
              </span>
            </div>
            <div className="flex items-center gap-1 bg-black/30 rounded-full p-0.5 border border-white/[0.06]">
              <button className="px-3 py-1 rounded-full text-xs font-semibold bg-[#7c3aed] text-white">Country</button>
              <button className="px-3 py-1 rounded-full text-xs font-semibold text-iota-muted hover:text-white transition-colors">Provider</button>
            </div>
          </div>
          <h3 className="text-base font-bold text-white mt-3">Geographic and provider share</h3>
          <p className="text-xs text-iota-muted mb-5">Compare validator concentration by country or provider, weighted by stake or raw validator count.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut */}
            <div className="flex justify-center items-center">
              <div className="relative">
                <ResponsiveContainer width={280} height={280}>
                  <PieChart>
                    <Pie data={DONUT_DATA} dataKey="value" cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={2} strokeWidth={0}>
                      {DONUT_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-emerald-400 font-medium">United States</span>
                  <span className="text-3xl font-bold text-white">23.4%</span>
                  <span className="text-[10px] text-iota-muted uppercase tracking-widest font-bold">of stake</span>
                </div>
              </div>
            </div>

            {/* Stats + List */}
            <div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[{ l: 'Groups', v: '30' }, { l: 'Validators', v: '200' }, { l: 'Total Stake', v: '14.6B IOTA' }].map(s => (
                  <div key={s.l} className="bg-black/30 border border-white/[0.06] rounded-xl px-3 py-2.5">
                    <span className="text-[10px] text-iota-muted uppercase tracking-widest font-bold block">{s.l}</span>
                    <span className="text-lg font-bold text-white">{s.v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">All countries</span>
                <span className="text-xs text-iota-muted">share by delegated stake</span>
              </div>
              <div className="space-y-2">
                {DONUT_DATA.filter(d => d.name !== 'Others').map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-iota-muted">{i + 1}.</span>
                      <span className="text-sm font-medium text-white">{d.name}</span>
                    </div>
                    <span className="text-sm text-iota-muted tabular-nums">{d.stake} IOTA · {d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ── Block Performance ──────────────────────────────── */}
        <GlassCard className="mb-6">
          <SectionTitle title="Block Performance" subtitle="Block production timing and network throughput" />
          <div className="bg-black/30 border border-white/[0.06] rounded-xl p-4 mt-4">
            <ChartLabel title="Block Time" sub={`avg last ${TIME_LABELS[range]} (ms)`} legend={[{ label: 'Block Time', color: '#4b5563' }, { label: 'Moving Avg', color: '#7c3aed' }]} />
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={blockTimeData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={axisTickStyle} interval={9} />
                <YAxis domain={[340, 450]} axisLine={false} tickLine={false} tick={axisTickStyle} tickFormatter={(v: number) => `${v} ms`} width={60} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} />
                <Bar dataKey="blockTime" name="Block Time" fill="#374151" radius={[2, 2, 0, 0]} barSize={8} />
                <Line dataKey="movingAvg" name="Moving Avg" stroke="#7c3aed" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* ── Transaction Analytics ──────────────────────────── */}
        <GlassCard className="mb-6">
          <SectionTitle title="Transaction Analytics" subtitle="Transaction volume, throughput, and fee dynamics" />
          <div className="bg-black/30 border border-white/[0.06] rounded-xl p-4 mt-4">
            <ChartLabel title="Transaction Metrics" sub={`TPS & Transaction Count last ${TIME_LABELS[range]}`} legend={[{ label: 'TPS', color: '#4b5563' }, { label: 'Transaction Count', color: '#7c3aed' }]} />
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={txMetrics} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={axisTickStyle} interval={9} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={axisTickStyle} width={45} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={axisTickStyle} width={40} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} />
                <Bar yAxisId="left" dataKey="tps" name="TPS" fill="#374151" radius={[2, 2, 0, 0]} barSize={8} />
                <Line yAxisId="right" dataKey="txCount" name="Transaction Count" stroke="#7c3aed" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* ── Fee Charts (2-col grid) ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <ChartLabel title="Transaction Fees" sub={`total last ${TIME_LABELS[range]} (IOTA)`} legend={[{ label: 'Base Fee', color: '#4b5563' }, { label: 'Priority Fee', color: '#7c3aed' }]} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={feeData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={axisTickStyle} interval={9} />
                <YAxis axisLine={false} tickLine={false} tick={axisTickStyle} width={45} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} />
                <Bar dataKey="baseFee" name="Base Fee" stackId="fee" fill="#374151" radius={[0, 0, 0, 0]} barSize={8} />
                <Bar dataKey="priorityFee" name="Priority Fee" stackId="fee" fill="#7c3aed" radius={[2, 2, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard>
            <ChartLabel title="Median Fees" sub={`per block, avg last ${TIME_LABELS[range]} (IOTA)`} legend={[{ label: 'Base Fee', color: '#4b5563' }, { label: 'Priority Fee', color: '#7c3aed' }]} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={feeData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={axisTickStyle} interval={9} />
                <YAxis axisLine={false} tickLine={false} tick={axisTickStyle} width={50} tickFormatter={(v: number) => v.toFixed(3)} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} />
                <Bar dataKey="medianBase" name="Base Fee" stackId="mfee" fill="#374151" radius={[0, 0, 0, 0]} barSize={8} />
                <Bar dataKey="medianPriority" name="Priority Fee" stackId="mfee" fill="#7c3aed" radius={[2, 2, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
