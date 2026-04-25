/**
 * GlobeControls — zoom in/out and auto-rotate toggle.
 */

interface GlobeControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export function GlobeControls({
  onZoomIn,
  onZoomOut,
  onResetView,
}: GlobeControlsProps) {
  return (
    <div
      id="globe-controls"
      className="absolute top-4 right-4 flex flex-col gap-1.5 z-10"
    >
      <ControlButton
        onClick={onZoomIn}
        title="Zoom in"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        }
      />
      <ControlButton
        onClick={onZoomOut}
        title="Zoom out"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        }
      />
      <ControlButton
        onClick={onResetView}
        title="Reset view"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <div className="w-full h-px bg-iota-border/50 my-0.5" />
    </div>
  );
}

function ControlButton({
  onClick,
  title,
  icon,
  active = false,
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        w-9 h-9 rounded-lg flex items-center justify-center
        border backdrop-blur-md transition-all duration-200
        ${
          active
            ? 'bg-iota-blue/20 border-iota-blue/40 text-iota-blue'
            : 'bg-iota-bg/60 border-iota-border/50 text-iota-muted hover:text-white hover:border-iota-blue/30'
        }
      `}
    >
      {icon}
    </button>
  );
}
