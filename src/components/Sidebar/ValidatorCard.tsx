/**
 * ValidatorCard — shows details for a single validator.
 *
 * Used in the sidebar list and as a detail panel when
 * a validator marker is clicked on the globe.
 */

import { motion } from 'framer-motion';
import type { Validator } from '../../types';
import {
  formatStakeCompact,
  formatApy,
  formatCommission,
  truncateAddress,
  getStakeTier,
  getTierColor,
} from '../../utils/formatters';

interface ValidatorCardProps {
  validator: Validator;
  allValidators: Validator[];
  isSelected?: boolean;
  onClick?: () => void;
}

export function ValidatorCard({
  validator,
  allValidators,
  isSelected = false,
  onClick,
}: ValidatorCardProps) {
  const tier = getStakeTier(validator, allValidators);
  const tierColor = getTierColor(tier);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`
        group relative p-3 rounded-xl cursor-pointer transition-all duration-200
        border backdrop-blur-sm
        ${
          isSelected
            ? 'bg-iota-blue/10 border-iota-blue/40 shadow-lg shadow-iota-blue/5'
            : 'bg-iota-card/60 border-iota-border/50 hover:border-iota-blue/30 hover:bg-iota-card/80'
        }
      `}
    >
      {/* Tier indicator */}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ backgroundColor: tierColor }}
      />

      <div className="flex items-start gap-3 pl-2">
        {/* Avatar */}
        <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-iota-border/50 flex items-center justify-center">
          {validator.imageUrl ? (
            <img
              src={validator.imageUrl}
              alt={validator.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-sm font-bold text-iota-muted">
              {validator.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white truncate">
              {validator.name}
            </h3>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: tierColor }}
              title={`${tier} tier`}
            />
          </div>
          <p className="text-xs text-iota-muted mt-0.5 truncate">
            {truncateAddress(validator.iotaAddress)}
          </p>

          {/* Metrics row */}
          <div className="flex items-center gap-3 mt-2 text-xs">
            <div>
              <span className="text-iota-muted">Stake </span>
              <span className="text-white font-medium tabular-nums">
                {formatStakeCompact(validator.stakingPoolIotaBalance)}
              </span>
            </div>
            <div>
              <span className="text-iota-muted">APY </span>
              <span className="text-emerald-400 font-medium tabular-nums">
                {formatApy(validator.apy)}
              </span>
            </div>
            <div>
              <span className="text-iota-muted">Fee </span>
              <span className="text-white font-medium tabular-nums">
                {formatCommission(validator.commissionRate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
