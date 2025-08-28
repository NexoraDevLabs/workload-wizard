import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="absolute bottom-0 left-0 right-0 px-6 py-4 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between text-black/60 dark:text-white/60 text-sm">
        <div className="flex items-center space-x-1">
          <span>© 2025 WorkloadWizard</span>
        </div>

        <div className="flex items-center space-x-6">
          <a
            href="/terms"
            className="hover:text-black/80 dark:hover:text-white/80 transition-colors"
          >
            Terms
          </a>
          <a
            href="/privacy"
            className="hover:text-black/80 dark:hover:text-white/80 transition-colors"
          >
            Privacy
          </a>
          <Link
            href="/blog/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Blog
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
