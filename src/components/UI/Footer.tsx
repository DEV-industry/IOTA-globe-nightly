import { IotaLogo } from './IotaLogo';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-10 bg-[#000000] border-t border-iota-border/20 text-iota-muted relative z-50">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 relative">

        {/* Left: Logo */}
        <div className="flex items-center gap-3 md:w-1/3 justify-start opacity-50">
          <Link to="/" className="block hover:opacity-80 transition-opacity">
            <IotaLogo />
          </Link>
        </div>

        {/* Center: Copyright */}
        <div className="text-sm text-iota-muted md:w-1/3 flex justify-center">
          Nightly Recruitment Project :D
        </div>

        {/* Right: GitHub Link */}
        <div className="md:w-1/3 flex justify-end">
          <a
            href="https://github.com/DEV-industry"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:text-white transition-colors duration-200 group"
          >
            <img
              src="/profile.jpg"
              alt="GitHub Profile"
              className="w-8 h-8 rounded-full border border-iota-border/50 object-cover opacity-55 group-hover:opacity-100 transition-opacity duration-200"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">DEV-Industry</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 group-hover:scale-110 transition-transform"
              >
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
            </div>
          </a>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
