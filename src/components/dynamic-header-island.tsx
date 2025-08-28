'use client';

import { WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function DynamicIslandHeader() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl px-4 transition-all duration-300 ${
        isScrolled ? 'top-2' : 'top-4'
      }`}
    >
      <div
        className={`bg-black/90 backdrop-blur-md rounded-full px-6 py-3 border border-white/10 transition-all duration-300 ${
          isScrolled
            ? 'rounded-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)]'
            : 'rounded-full'
        }`}
      >
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F59FF] to-[#0F59FF] flex items-center justify-center">
                <WandSparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">
                WorkloadWizard
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {!isHomePage && (
              <Button
                variant="ghost"
                className="text-white hover:text-white hover:bg-white/10 rounded-full"
                asChild
              >
                <Link href="/">Home</Link>
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-white hover:text-white hover:bg-white/10 rounded-full"
              asChild
            >
              <Link href="/blog">Blog</Link>
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:text-white hover:bg-white/10 rounded-full"
              asChild
            >
              <Link href="/support">Help Centre</Link>
            </Button>
          </nav>

          {/* Search and Actions */}
          <div className="flex items-center gap-4">
            {/* Search Bar 
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search"
                className="pl-10 pr-4 py-2 w-64 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-full focus:bg-white/20 focus:border-white/30"
              />
            </div>
            */}

            {/* Notification Bell 
            <div className="relative">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                <Bell className="h-5 w-5" />
              </Button>
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                1
              </Badge>
            </div>
            */}
            <ThemeToggle />
            {/* Conditional User Button */}
            {isLoaded &&
              (user ? (
                <Button
                  variant="outline"
                  className="text-white border-white hover:text-white hover:bg-white/20 rounded-full px-4 py-2 h-8 bg-transparent"
                  asChild
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-white/10 rounded-full px-4 py-2 h-8"
                  asChild
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              ))}
          </div>
        </div>
      </div>
    </header>
  );
}
