import { useCheckpoints } from '../../hooks/useCheckpoints';
import { useValidators } from '../../hooks/useValidators';

function formatShortTimeAgo(timestampMs: string | number) {
  const diff = Date.now() - Number(timestampMs);
  const seconds = Math.max(0, Math.floor(diff / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function formatDigest(digest: string) {
  if (!digest) return '';
  if (digest.length <= 6) return digest;
  return `${digest.slice(0, 4)}...${digest.slice(-2)}`;
}

interface TransactionBlocksCardProps {
  epoch?: string;
}

export function TransactionBlocksCard({ epoch }: TransactionBlocksCardProps) {
  const { checkpoints, isLoading, isError } = useCheckpoints();
  const { validators } = useValidators();

  // Helper to get a semi-random avatar based on the block's sequence number or digest
  const getAvatarForBlock = (digest: string) => {
    if (!validators || validators.length === 0) return null;
    let hash = 0;
    for (let i = 0; i < digest.length; i++) {
      hash = digest.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % validators.length;
    return validators[index]?.imageUrl;
  };

  return (
    <div className="bg-iota-card rounded-2xl p-4 animate-fade-in flex flex-col h-full">
      <h4 className="text-sm font-medium text-iota-label mb-3 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-iota-blue"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Recent Checkpoints
      </h4>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {isLoading && (
          <div className="text-center text-xs text-iota-muted py-4">Loading checkpoints...</div>
        )}
        {isError && (
          <div className="text-center text-xs text-red-400 py-4">Failed to load checkpoints</div>
        )}
        {!isLoading && !isError && checkpoints.length === 0 && (
          <div className="text-center text-xs text-iota-muted py-4">No checkpoints found</div>
        )}
        
        {checkpoints.slice(0, 6).map((cp) => {
          const avatarUrl = getAvatarForBlock(cp.digest);
          
          return (
            <div 
              key={cp.digest} 
              className="flex items-center justify-between px-2 py-2 hover:bg-white/[0.03] transition-all border-b border-white/5 last:border-b-0 group cursor-pointer rounded-lg"
            >
              {/* Left Side: Avatar + Block Info */}
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 flex-shrink-0 border border-white/5">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Validator" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-iota-blue/20" />
                  )}
                </div>
                
                {/* Block Info */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-semibold text-iota-muted uppercase tracking-wider">Block</span>
                    <span className="text-blue-400 font-mono text-sm">{formatDigest(cp.digest)}</span>
                  </div>
                  <span className="text-[10px] text-iota-muted font-mono mt-0.5">Epoch {cp.epoch}</span>
                </div>
              </div>

              {/* Right Side: Txns + Time */}
              <div className="flex items-center gap-6">
                {/* Txns */}
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-semibold text-iota-muted uppercase tracking-wider mb-0.5">Txns</span>
                  <span className="text-white text-xs font-mono">{cp.transactions?.length || 0}</span>
                </div>

                {/* Time & Arrow */}
                <div className="flex items-center gap-2">
                  <span className="text-iota-muted text-xs font-mono">{formatShortTimeAgo(cp.timestampMs)}</span>
                  <svg 
                    className="w-3.5 h-3.5 text-iota-muted group-hover:text-iota-blue transition-colors" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
