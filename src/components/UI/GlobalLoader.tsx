import { IotaLogo } from './IotaLogo';

export function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0f]">
      <div className="animate-pulse scale-150">
        <IotaLogo />
      </div>
    </div>
  );
}
