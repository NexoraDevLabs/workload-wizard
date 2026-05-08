'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="
          flex h-10 w-10 items-center justify-center
          rounded-full
          border border-border
          bg-background/80
          backdrop-blur-md
        "
      >
        <div className="h-4 w-4" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label="Toggle theme"
      className="
        relative
        flex h-10 w-10 items-center justify-center
        rounded-full

        border border-border/80
        bg-background/80

        text-foreground

        shadow-sm
        backdrop-blur-md

        transition-all duration-300

        hover:bg-accent
        hover:text-accent-foreground
        hover:border-border
      "
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 90, scale: 0 }}
            transition={{
              duration: 0.25,
              ease: 'easeInOut',
            }}
            className="absolute"
          >
            <Sun className="h-4 w-4" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: -90, scale: 0 }}
            transition={{
              duration: 0.25,
              ease: 'easeInOut',
            }}
            className="absolute"
          >
            <Moon className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}