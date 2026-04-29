import { motion } from 'framer-motion';
import type { Validator } from '../../types';
import { formatStakeCompact, formatApy, formatCommission, truncateAddress } from '../../utils/formatters';

interface ValidatorModalProps {
  validator: Validator;
  onClose: () => void;
}

export function ValidatorModal({ validator, onClose }: ValidatorModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        className="relative w-full max-w-lg bg-[#050609] border border-white/10 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-iota-muted hover:text-white transition-colors rounded-full hover:bg-white/5"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start gap-4 mb-6">
          {validator.imageUrl ? (
            <img src={validator.imageUrl} alt={validator.name} className="w-16 h-16 rounded-xl border border-white/10 object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-iota-blue/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">{validator.name[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0 pt-1">
            <h2 className="text-2xl font-bold text-white truncate">{validator.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-iota-muted font-mono">{truncateAddress(validator.iotaAddress, 8)}</span>
              <button
                onClick={() => navigator.clipboard.writeText(validator.iotaAddress)}
                className="text-iota-muted hover:text-white transition-colors"
                title="Copy Address"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {validator.description && (
          <p className="text-sm text-iota-muted mb-6 leading-relaxed">
            {validator.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col gap-1 p-3 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="text-xl font-semibold text-white tabular-nums">{formatStakeCompact(validator.stakingPoolIotaBalance)} IOTA</div>
            <div className="text-xs text-iota-label">Total Stake</div>
          </div>
          <div className="flex flex-col gap-1 p-3 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="text-xl font-semibold text-emerald-400 tabular-nums">{formatApy(validator.apy)}</div>
            <div className="text-xs text-iota-label">APY</div>
          </div>
          <div className="flex flex-col gap-1 p-3 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="text-xl font-semibold text-white tabular-nums">{formatCommission(validator.commissionRate)}</div>
            <div className="text-xs text-iota-label">Commission</div>
          </div>
          <div className="flex flex-col gap-1 p-3 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="text-xl font-semibold text-white tabular-nums">{(Number(validator.votingPower) / 100).toFixed(2)}%</div>
            <div className="text-xs text-iota-label">Voting Power</div>
          </div>
        </div>

        {validator.projectUrl && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <a
              href={validator.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-colors"
            >
              Visit Project Website
              <svg className="w-4 h-4 text-iota-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
