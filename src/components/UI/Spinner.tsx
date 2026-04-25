/**
 * Spinner — pulsing IOTA-themed loading indicator.
 */

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center" role="status">
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-iota-border border-t-iota-blue animate-spin`}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
