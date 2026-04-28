import { IotaLogo } from './IotaLogo';

export function Footer() {
  return (
    <footer className="mt-10 bg-[#000000] border-t border-iota-border/20 text-iota-muted relative z-50">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 flex flex-col items-center text-center gap-2">
        <div className="flex items-center gap-3 mb-4">
          <IotaLogo />
        </div>

        <div className="text-sm text-iota-muted">
          © {new Date().getFullYear()} DEV-Industry
        </div>
      </div>
    </footer>
  );
}

export default Footer;
