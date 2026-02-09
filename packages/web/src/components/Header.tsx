'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Globe, Menu, X, Blocks, ArrowRightLeft, Wallet, BarChart3, Puzzle } from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  { name: 'Blocks', href: '/blocks', icon: Blocks },
  { name: 'Transactions', href: '/txs', icon: ArrowRightLeft },
  { name: 'Deposits', href: '/deposits', icon: Wallet },
  { name: 'Withdrawals', href: '/withdrawals', icon: Wallet },
  { name: 'Fragments', href: '/fragments', icon: Puzzle },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-page/80 backdrop-blur-lg border-b border-white/5">
      <nav className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Left: Globe + Logo */}
          <div className="flex items-center gap-4">
            <Globe className="w-5 h-5 text-text-muted hidden sm:block" />
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Twilight" className="w-auto h-6" />
            </Link>
          </div>

          {/* Desktop Navigation (Auction-like: 16px, tighter tracking) */}
          <div className="hidden lg:flex items-center ml-auto mr-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'px-3 py-4 transition-colors duration-150',
                    'text-[16px] font-semibold leading-[120%] tracking-[-0.01em] opacity-95',
                    isActive ? 'text-primary-light' : 'text-white/95 hover:text-white'
                  )}
                >
                  <span className="flex items-center gap-2">
                  <item.icon className="w-3 h-3 opacity-90 relative top-[-10px]" />
                  <span>{item.name}</span>
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right: Globe + Mobile Menu Toggle */}
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-text-muted hidden sm:block" />
            <button
              className="lg:hidden p-2 text-text-secondary hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/5">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium',
                      isActive
                        ? 'bg-primary/20 text-primary-light'
                        : 'text-text-secondary hover:text-white hover:bg-background-tertiary'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
