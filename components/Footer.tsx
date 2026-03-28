import Link from 'next/link';

type FooterProps = {
  page: 'timeis' | 'timewas';
};

/**
 * @description Modern minimal footer component
 */
const Footer = ({ page }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-(--border-subtle) bg-(--bg-secondary)">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-(--accent-primary)/10 flex items-center justify-center border border-(--accent-primary)/20 overflow-hidden">
              <img
                src="/favicon.ico"
                alt="Logo"
                className="w-5 h-5 object-contain"
              />
            </div>
            <span className="text-sm font-medium text-(--text-secondary)">
              And The Time {page === 'timeis' ? 'Is' : 'Was'}...
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm transition-colors ${
                page === 'timeis'
                  ? 'text-(--accent-primary)'
                  : 'text-(--text-secondary) hover:text-(--text-primary)'
              }`}
            >
              Time Now
            </Link>
            <Link
              href="/TimeWas"
              className={`text-sm transition-colors ${
                page === 'timewas'
                  ? 'text-(--accent-primary)'
                  : 'text-(--text-secondary) hover:text-(--text-primary)'
              }`}
            >
              Time Was
            </Link>
            <div className="w-px h-4 bg-(--border-default)" />
            <a
              href="mailto:support@astrx.dev?subject=Feedback on And The Time Is"
              className="text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors"
            >
              Feedback
            </a>
            <a
              href="https://github.com/dev-asterix/and-the-time-is/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors"
            >
              Report Bug
            </a>
            <a
              href="https://github.com/dev-asterix/and-the-time-is"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-linear-to-r from-transparent via-(--border-default) to-transparent" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-(--text-muted)">
          <p>
            © {currentYear} And The Time Is. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span>
              Data source:{' '}
              <a
                href="https://www.iana.org/time-zones"
                target="_blank"
                rel="noopener noreferrer"
                className="text-(--accent-primary) hover:underline"
              >
                IANA Time Zone Database
              </a>
            </span>
            <span className="text-(--text-muted)">•</span>
            <span className="text-red-400/80">
              *Data inaccuracies may occur
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
