import type { ValidatorWithGeo, Validator } from '../../types';
import { formatStakeCompact, formatApy, formatCommission, truncateAddress } from '../../utils/formatters';

export function getValidatorTooltipHtml(v: ValidatorWithGeo, _all: Validator[]): string {
  const avatar = v.imageUrl
    ? `<img src="${v.imageUrl}" style="width:28px;height:28px;border-radius:6px;object-fit:cover" onerror="this.style.display='none'" />`
    : `<div style="width:28px;height:28px;border-radius:6px;background:rgba(0,194,255,.15);display:flex;align-items:center;justify-content:center;color:#00c2ff;font-weight:700;font-size:12px">${v.name.charAt(0)}</div>`;

  return `<div style="background:rgba(18,18,26,.95);backdrop-filter:blur(12px);border:1px solid rgba(30,30,46,.8);border-radius:12px;padding:12px 16px;min-width:200px;max-width:280px;font-family:Inter,system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.4)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">${avatar}<div><div style="color:#fff;font-weight:600;font-size:13px">${v.name}</div><div style="color:#8888aa;font-size:11px;font-family:monospace">${truncateAddress(v.iotaAddress, 8)}</div></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px">
      <div><div style="color:#8888aa;font-size:10px;text-transform:uppercase">Stake</div><div style="color:#fff;font-size:12px;font-weight:500">${formatStakeCompact(v.stakingPoolIotaBalance)} IOTA</div></div>
      <div><div style="color:#8888aa;font-size:10px;text-transform:uppercase">APY</div><div style="color:#34d399;font-size:12px;font-weight:500">${formatApy(v.apy)}</div></div>
      <div><div style="color:#8888aa;font-size:10px;text-transform:uppercase">Commission</div><div style="color:#fff;font-size:12px;font-weight:500">${formatCommission(v.commissionRate)}</div></div>
      <div><div style="color:#8888aa;font-size:10px;text-transform:uppercase">Voting Power</div><div style="color:#fff;font-size:12px;font-weight:500">${v.votingPower}</div></div>
    </div></div>`;
}
