/**
 * TransactionBlocksCard — transaction blocks metrics + SVG sparkline chart.
 *
 * Displays total transaction count and last epoch count with a
 * lightweight SVG area chart showing transaction volume over epochs.
 */

interface TransactionBlocksCardProps {
  epoch?: string;
}

/**
 * Generates a smooth SVG path for the area chart.
 * Uses placeholder data points that mimic real epoch-over-epoch growth.
 */
function generateChartPath(
  width: number,
  height: number,
  padding: number,
): { linePath: string; areaPath: string; points: { x: number; y: number }[] } {
  // Placeholder data: transaction volume per recent epoch (last 20 epochs)
  const data = [
    120, 135, 128, 145, 155, 148, 160, 172, 165, 180,
    175, 190, 185, 195, 188, 200, 210, 205, 215, 220,
  ];

  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * chartWidth,
    y: padding + (1 - (val - minVal) / range) * chartHeight,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1]!.x} ${height} L ${points[0]!.x} ${height} Z`
    : '';

  return { linePath, areaPath, points };
}

export function TransactionBlocksCard({ epoch }: TransactionBlocksCardProps) {
  const chartWidth = 340;
  const chartHeight = 120;
  const { linePath, areaPath } = generateChartPath(chartWidth, chartHeight, 8);

  // Calculate epoch labels for x-axis
  const currentEpoch = epoch ? parseInt(epoch) : 355;
  const epochLabels = Array.from({ length: 5 }, (_, i) =>
    String(currentEpoch - 20 + i * 5),
  );

  return (
    <div className="bg-iota-card/80 backdrop-blur-sm border border-iota-border rounded-2xl p-6 animate-fade-in">
      {/* Card Title */}
      <h4 className="text-sm font-medium text-iota-label mb-4 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-iota-blue"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Transaction Blocks
      </h4>

      {/* Metrics */}
      <div className="flex gap-8 mb-4">
        <div>
          <span className="text-2xl font-semibold text-white">633.2 M</span>
          <p className="text-xs text-iota-label mt-0.5">Total</p>
        </div>
        <div>
          <span className="text-2xl font-semibold text-white">1.83 M</span>
          <p className="text-xs text-iota-label mt-0.5">Last epoch</p>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={8}
              y1={8 + ratio * (chartHeight - 16)}
              x2={chartWidth - 8}
              y2={8 + ratio * (chartHeight - 16)}
              stroke="#1f2937"
              strokeWidth="0.5"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#chartGradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Epoch labels */}
        <div className="flex justify-between px-2 mt-1">
          {epochLabels.map((label) => (
            <span key={label} className="text-[10px] text-iota-muted">
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
