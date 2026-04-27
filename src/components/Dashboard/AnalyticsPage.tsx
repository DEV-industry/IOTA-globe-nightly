import { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Sector,
} from 'recharts';
import { useValidators } from '../../hooks/useValidators';
import { useGeocode } from '../../hooks/useGeocode';
import { formatStakeCompact, formatCompactNumber } from '../../utils/formatters';
import { useAnalyticsHistory } from '../../hooks/useAnalyticsHistory';

// ─── Time Range ─────────────────────────────────────────────────────────────────



// Mock data generators removed

// No static DONUT_DATA, it's calculated in the component.

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

function formatTimeTick(v: number | string) {
  if (typeof v === 'string') return v;
  const d = new Date(v);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function formatTimeLabel(v: any) {
  if (typeof v === 'string') return v;
  if (!v) return '';
  const d = new Date(v);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function GlassCard({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 ${className}`} style={style}>
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

  const { validators, totalStake, activeValidatorCount } = useValidators();
  const validatorsWithGeo = useGeocode(validators);
  const { data: analyticsData = [], isLoading: analyticsLoading } = useAnalyticsHistory();

  const lastAnalyticsItem = analyticsData.length > 0 ? analyticsData[analyticsData.length - 1] : null;

  const [footprintTab, setFootprintTab] = useState<'country' | 'provider'>('country');

  const donutData = useMemo(() => {
    if (!validatorsWithGeo.length || !totalStake) return [];
    
    const countryMap = new Map<string, number>();
    let totalVotingPower = 0;

    validatorsWithGeo.forEach(v => {
      let key = 'Others';
      if (footprintTab === 'country') {
        key = v.country || 'Others';
      } else {
        key = v.name || 'Unknown Provider';
      }
      const vp = Number(v.votingPower) || 0;
      totalVotingPower += vp;
      countryMap.set(key, (countryMap.get(key) || 0) + vp);
    });

    const rawData = Array.from(countryMap.entries()).map(([name, power]) => ({
      name,
      power,
      value: totalVotingPower > 0 ? (power / totalVotingPower) * 100 : 0
    })).sort((a, b) => b.power - a.power);

    // Take top 6, rest goes to Others
    const topCountries = rawData.slice(0, 6);
    const others = rawData.slice(6);
    
    const othersPower = others.reduce((sum, item) => sum + item.power, 0);
    const othersValue = others.reduce((sum, item) => sum + item.value, 0);

    if (othersPower > 0) {
      topCountries.push({ name: 'Others', power: othersPower, value: othersValue });
    }

    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6', '#374151'];
    
    return topCountries.map((item, idx) => ({
      name: item.name,
      value: Number(item.value.toFixed(2)),
      stake: formatStakeCompact(item.power.toString()),
      color: colors[idx % colors.length]
    }));
  }, [validatorsWithGeo, totalStake, footprintTab]);

  const topCountry = donutData[0];
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  const activeCountry = hoveredSlice !== null && donutData[hoveredSlice] 
    ? donutData[hoveredSlice] 
    : topCountry;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderActiveShape = useCallback((props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 3}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.15))', transition: 'all 0.2s ease-out' }}
        />
      </g>
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#000] text-white">
      <div className="max-w-[1400px] mx-auto pt-24 pb-12 px-4 lg:px-8">

        {/* ── Block Overview ─────────────────────────────────── */}
        <GlassCard className="mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-baseline gap-2 mb-4">
            <h3 className="text-base font-bold text-white">Block Overview</h3>
            <span className="text-xs text-iota-muted">· Live recent trend</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatMiniCard 
              label="Highest fee block" 
              value={lastAnalyticsItem ? lastAnalyticsItem.highestFeeBlock.toFixed(4) : "0"} 
              unit="IOTA" 
              change={0} 
            />
            <StatMiniCard 
              label="Total transactions" 
              value={lastAnalyticsItem ? formatCompactNumber(lastAnalyticsItem.totalTxs) : "0"} 
              unit="txs" 
              change={0} 
            />
            <StatMiniCard 
              label="Avg. block fullness" 
              value={lastAnalyticsItem ? lastAnalyticsItem.avgFullness.toString() : "0"} 
              unit="%" 
              change={0} 
            />
            <StatMiniCard 
              label="Total tips paid" 
              value={lastAnalyticsItem ? lastAnalyticsItem.totalTips.toFixed(4) : "0"} 
              unit="IOTA" 
              change={0} 
            />
          </div>
        </GlassCard>

        {/* ── Validator Footprint ────────────────────────────── */}
        <GlassCard className="mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold text-iota-muted bg-white/[0.04] border border-white/10 rounded-full px-3 py-1">
                Validator Footprint
              </span>
            </div>
            <div className="flex items-center gap-1 bg-black/30 rounded-full p-0.5 border border-white/[0.06]">
              <button onClick={() => setFootprintTab('country')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${footprintTab === 'country' ? 'bg-white text-black' : 'text-iota-muted hover:text-white'}`}>Country</button>
              <button onClick={() => setFootprintTab('provider')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${footprintTab === 'provider' ? 'bg-white text-black' : 'text-iota-muted hover:text-white'}`}>Provider</button>
            </div>
          </div>
          <h3 className="text-base font-bold text-white mt-3">Geographic and provider share</h3>
          <p className="text-xs text-iota-muted mb-5">Compare validator concentration by country or provider, weighted by stake or raw validator count.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut */}
            <div className="flex justify-center items-center">
              <div className="relative">
                <ResponsiveContainer width={280} height={280}>
                  <PieChart style={{ outline: 'none' }}>
                    <Pie 
                      data={donutData} 
                      dataKey="value" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={80} 
                      outerRadius={120} 
                      paddingAngle={2} 
                      strokeWidth={0}
                      {...{ activeIndex: hoveredSlice !== null ? hoveredSlice : undefined } as any}
                      activeShape={renderActiveShape}
                      onMouseEnter={(_, index) => setHoveredSlice(index)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      style={{ outline: 'none' }}
                    >
                      {donutData.map((d, i) => (
                        <Cell 
                          key={i} 
                          fill={d.color} 
                          style={{ 
                            opacity: hoveredSlice !== null && hoveredSlice !== i ? 0.4 : 1, 
                            transition: 'opacity 0.2s ease-out',
                            outline: 'none',
                          }} 
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                  style={{ transition: 'transform 0.2s ease-out', transform: hoveredSlice !== null ? 'scale(1.05)' : 'scale(1)' }}
                >
                  {activeCountry && (
                    <>
                      <span 
                        className="text-xs font-medium"
                        style={{ color: activeCountry.color, transition: 'color 0.2s ease-out' }}
                      >
                        {activeCountry.name}
                      </span>
                      <span className="text-3xl font-bold text-white">{activeCountry.value}%</span>
                      <span className="text-[10px] text-iota-muted font-semibold">{activeCountry.stake} IOTA</span>
                    </>
                  )}
                  {!activeCountry && <span className="text-sm text-iota-muted">Loading...</span>}
                  <span className="text-[10px] text-iota-muted uppercase tracking-widest font-bold mt-1">of stake</span>
                </div>
              </div>
            </div>

            {/* Stats + List */}
            <div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { l: 'Groups', v: donutData.length > 0 ? (donutData.length - (donutData.find(d => d.name === 'Others') ? 1 : 0)).toString() : '0' }, 
                  { l: 'Validators', v: activeValidatorCount.toString() }, 
                  { l: 'Total Stake', v: totalStake ? `${formatStakeCompact(totalStake)} IOTA` : '0 IOTA' }
                ].map(s => (
                  <div key={s.l} className="bg-black/30 border border-white/[0.06] rounded-xl px-3 py-2.5">
                    <span className="text-[10px] text-iota-muted uppercase tracking-widest font-bold block">{s.l}</span>
                    <span className="text-lg font-bold text-white">{s.v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">All {footprintTab === 'country' ? 'countries' : 'providers'}</span>
                <span className="text-xs text-iota-muted">share by delegated stake</span>
              </div>
              <div className="space-y-2">
                {donutData.filter(d => d.name !== 'Others').map((d, i) => (
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

        {/* ── Block Performance Header ───────────────────────── */}
        <div className="mb-4 mt-10">
          <SectionTitle title="Block Performance" subtitle="Block production timing and network throughput" />
        </div>

        <GlassCard className="mb-6 relative">
          {analyticsLoading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl"><span className="text-sm text-iota-muted">Loading live data...</span></div>}
          <ChartLabel title="Block Time" sub="live window (ms)" legend={[{ label: 'Block Time', color: '#4b5563' }, { label: 'Moving Avg', color: '#ffffff' }]} />
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analyticsData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={axisTickStyle} interval="preserveStartEnd" minTickGap={30} tickFormatter={formatTimeTick} />
              <YAxis axisLine={false} tickLine={false} tick={axisTickStyle} tickFormatter={(v: number) => `${v} ms`} width={60} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} labelFormatter={formatTimeLabel} cursor={false} />
              <Bar dataKey="blockTime" name="Block Time" fill="#374151" radius={[2, 2, 0, 0]} barSize={8} />
              <Line dataKey="movingAvg" name="Moving Avg" stroke="#ffffff" strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* ── Transaction Analytics Header ───────────────────── */}
        <div className="mb-4 mt-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <SectionTitle title="Transaction Analytics" subtitle="Transaction volume, throughput, and fee dynamics" />
        </div>

        <GlassCard className="mb-6 relative opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          {analyticsLoading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl"><span className="text-sm text-iota-muted">Loading live data...</span></div>}
          <ChartLabel title="Transaction Metrics" sub="TPS & Transaction Count (live)" legend={[{ label: 'TPS', color: '#4b5563' }, { label: 'Transaction Count', color: '#ffffff' }]} />
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analyticsData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={axisTickStyle} interval="preserveStartEnd" minTickGap={30} tickFormatter={formatTimeTick} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={axisTickStyle} width={45} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={axisTickStyle} width={40} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} labelFormatter={formatTimeLabel} cursor={false} />
              <Bar yAxisId="left" dataKey="tps" name="TPS" fill="#374151" radius={[2, 2, 0, 0]} barSize={8} />
              <Line yAxisId="right" dataKey="txCount" name="Transaction Count" stroke="#ffffff" strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* ── Fee Charts (2-col grid) ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          <GlassCard className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {analyticsLoading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl"><span className="text-sm text-iota-muted">Loading...</span></div>}
            <ChartLabel title="Transaction Fees" sub="total per block (IOTA)" legend={[{ label: 'Base Fee', color: '#4b5563' }, { label: 'Priority Fee', color: '#ffffff' }]} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analyticsData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={axisTickStyle} interval="preserveStartEnd" minTickGap={30} tickFormatter={formatTimeTick} />
                <YAxis axisLine={false} tickLine={false} tick={axisTickStyle} width={50} tickFormatter={(v: number) => v.toFixed(3)} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} labelFormatter={formatTimeLabel} cursor={false} />
                <Bar dataKey="baseFee" name="Base Fee" stackId="fee" fill="#374151" radius={[0, 0, 0, 0]} barSize={8} />
                <Bar dataKey="priorityFee" name="Priority Fee" stackId="fee" fill="#ffffff" radius={[2, 2, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
            {analyticsLoading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl"><span className="text-sm text-iota-muted">Loading...</span></div>}
            <ChartLabel title="Median Fees" sub="per block (IOTA)" legend={[{ label: 'Base Fee', color: '#4b5563' }, { label: 'Priority Fee', color: '#ffffff' }]} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analyticsData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={axisTickStyle} interval="preserveStartEnd" minTickGap={30} tickFormatter={formatTimeTick} />
                <YAxis axisLine={false} tickLine={false} tick={axisTickStyle} width={50} tickFormatter={(v: number) => v.toFixed(3)} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} labelFormatter={formatTimeLabel} cursor={false} />
                <Bar dataKey="medianBase" name="Base Fee" stackId="mfee" fill="#374151" radius={[0, 0, 0, 0]} barSize={8} />
                <Bar dataKey="medianPriority" name="Priority Fee" stackId="mfee" fill="#ffffff" radius={[2, 2, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
