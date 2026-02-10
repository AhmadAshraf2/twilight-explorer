'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Menu,
  X,
  Blocks,
  ArrowRightLeft,
  Wallet,
  Puzzle,
  Users,
  ChevronDown,
  Activity,
  Bitcoin,
  ShieldCheck,
  Search,
} from 'lucide-react';
import clsx from 'clsx';
import { SearchBar } from '@/components/SearchBar';

type NavItem = { name: string; href: string; icon: any };
type NavGroup = { name: string; icon: any; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    name: 'Activity',
    icon: Activity,
    items: [
      { name: 'Blocks', href: '/blocks', icon: Blocks },
      { name: 'Transactions', href: '/txs', icon: ArrowRightLeft },
    ],
  },
  {
    name: 'Security',
    icon: ShieldCheck,
    items: [
      { name: 'Validators', href: '/validators', icon: Users },
      { name: 'Fragments', href: '/fragments', icon: Puzzle },
    ],
  },
  {
    name: 'Bitcoin',
    icon: Bitcoin,
    items: [
      { name: 'Deposits', href: '/deposits', icon: Wallet },
      { name: 'Withdrawals', href: '/withdrawals', icon: Wallet },
    ],
  },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null); // desktop dropdown
  const [mobileOpenGroup, setMobileOpenGroup] = useState<string | null>(null); // mobile accordion
const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Clear timeout on unmount
useEffect(() => {
  return () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };
}, []);
  const isGroupActive = useMemo(() => {
    const active = new Map<string, boolean>();
    for (const g of navGroups) {
      active.set(g.name, g.items.some((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)));
    }
    return active;
  }, [pathname]);

  // Close dropdown on outside click / escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenGroup(null);
        setMobileMenuOpen(false);
        setMobileOpenGroup(null);
        setSearchOpen(false);
      }
    }
    function onMouseDown(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setOpenGroup(null);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  const activityGroup = navGroups.find((g) => g.name === 'Activity')!;
  const securityGroup = navGroups.find((g) => g.name === 'Security')!;
  const bitcoinGroup = navGroups.find((g) => g.name === 'Bitcoin')!;

  const renderDesktopGroup = (group: NavGroup) => {
    const active = isGroupActive.get(group.name) || false;
    const isOpen = openGroup === group.name;

    return (
      <div
        key={group.name}
        className="relative"
         onMouseEnter={() => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        setOpenGroup(group.name);
      }}
      onMouseLeave={() => {
        // Delay closing to allow mouse to reach dropdown
        closeTimeoutRef.current = setTimeout(() => setOpenGroup(null), 200);
      }}
      >
        <button
          type="button"
          onClick={() => setOpenGroup((prev) => (prev === group.name ? null : group.name))}
          className={clsx(
            'px-3 py-4 transition-colors duration-300',
            'text-[18px] font-semibold leading-[130%] tracking-[-0.01em] opacity-95',
            active ? 'text-primary-light' : 'text-white/95 hover:text-white'
          )}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <span className="flex flex col items-center gap-1">
            <group.icon className="w-4 h-4 opacity-80" />
            <span className="flex items-center gap-1">
            <span>{group.name}</span>
            <ChevronDown className={clsx('w-3 h-3 opacity-70 transition-transform', isOpen && 'rotate-180')} />
            </span>
            </span>
        </button>

        {isOpen && (
          <div
            role="menu"
            className="absolute left-0 mt-2 w-56 rounded-[10.5px] border border-card-border bg-card/95 backdrop-blur-lg shadow-card overflow-hidden"
            onMouseEnter={() => {
            // Keep open when hovering dropdown
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
          }}
          onMouseLeave={() => {
            // Close when leaving dropdown
            closeTimeoutRef.current = setTimeout(() => setOpenGroup(null), 200);
          }}
          >
            <div className="py-2">
              {group.items.map((child) => {
                const isActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    role="menuitem"
                    onClick={() => setOpenGroup(null)}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                      isActive
                        ? 'bg-primary/15 text-primary-light'
                        : 'text-text-secondary hover:text-white hover:bg-background-tertiary/40'
                    )}
                  >
                    <child.icon className="w-4 h-4 opacity-90" />
                    <span className="font-medium">{child.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <header 
      className="sticky top-0 z-50 bg-page/80 backdrop-blur-lg border-b border-white/5 w-full"
      style={{
        height: '72px'
      }}
    >
      {/* Left Technical Element - absolute positioned at screen edge (full width) */}
      <div 
        className="absolute left-20 hidden sm:block"
        style={{ 
          width: '15px', 
          height: '15px',
          top: 'calc(50% - 15px/2 - 0.5px)'
        }}
      >
        <img src="/technical_element.svg" alt="" className="w-full h-full" />
      </div>

      {/* Main nav content - centered, constrained to 1432px, padding matches main content */}
      <nav className="relative max-w-[1432px] mx-auto px-4 sm:px-6 lg:px-[156px]">
        {/* Logo - positioned relative to nav container (constrained) */}
        <div 
          className="absolute hidden sm:block"
          style={{ 
            width: '107.6px',
            height: '24px',
            left: '181px',
            top: 'calc(50% - 24px/2)'
          }}
        >
          <Link href="/" className="block w-full h-full">
            <img src="/logo.svg" alt="Twilight" className="w-full h-full" />
          </Link>
        </div>

        <div className="flex items-center h-16 lg:h-[72px]">

          {/* Center Navigation (Desktop) */}
          <div className="hidden lg:flex flex-1 justify-end mr-12" ref={dropdownRef}>
            <div className="flex items-center gap-2">
              {renderDesktopGroup(activityGroup)}
              {renderDesktopGroup(securityGroup)}

              {/* Divider between Security and Bitcoin */}
              <div className="mx-6 w-px h-8 bg-white/30" aria-hidden="true" />

              {renderDesktopGroup(bitcoinGroup)}
            </div>
          </div>

          {/* Right: Search + Mobile Menu Toggle (globe removed from here) */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              className="p-2.5 rounded-full border border-card-border/60 bg-black/30 text-white/90 hover:text-white hover:bg-background-tertiary/30 transition-colors duration-150"
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              className="lg:hidden p-2 text-text-secondary hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Right Technical Element - absolute positioned at screen edge */}
      <div 
        className="absolute right-20 hidden sm:block"
        style={{ 
          width: '15px', 
          height: '15px',
          top: 'calc(50% - 15px/2 - 0.5px)'
        }}
      >
        <img src="/technical_element.svg" alt="" className="w-full h-full" />
      </div>

{/* Search Modal */}
{searchOpen && (
  <div 
    className="fixed inset-0 z-50 bg-black/50"
    onClick={() => setSearchOpen(false)}
  >
    {/* Content positioned above overlay */}
    <div className="flex items-start justify-center pt-24 px-4 min-h-screen">
      <div 
        className="card w-full max-w-2xl relative z-10" 
        onClick={(e) => e.stopPropagation()}
      >
        <SearchBar size="lg" autoFocus onSubmitted={() => setSearchOpen(false)} />
      </div>
    </div>
  </div>
)}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setMobileMenuOpen(false);
              setMobileOpenGroup(null);
            }}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div className="absolute right-0 top-0 h-full w-[340px] max-w-[85vw] bg-card border-l border-white/5 shadow-card">
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setMobileOpenGroup(null);
                }}
              >
                <img src="/logo.svg" alt="Twilight" className="w-auto h-6" />
              </Link>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-2 text-text-secondary hover:text-white"
                  aria-label="Open search"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setMobileOpenGroup(null);
                    setSearchOpen(true);
                  }}
                >
                  <Search className="w-5 h-5" />
                </button>
                <button
                  className="p-2 text-text-secondary hover:text-white"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setMobileOpenGroup(null);
                  }}
                  aria-label="Close navigation menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-64px)]">
              {navGroups.map((group) => {
                const active = isGroupActive.get(group.name) || false;
                const isOpen = mobileOpenGroup === group.name;
                return (
                  <div key={group.name} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setMobileOpenGroup((prev) => (prev === group.name ? null : group.name))}
                      className={clsx(
                        'w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/20 text-primary-light'
                          : 'text-text-secondary hover:text-white hover:bg-background-tertiary'
                      )}
                      aria-expanded={isOpen}
                    >
                      <span className="flex items-center gap-2">
                        <group.icon className="w-4 h-4" />
                        {group.name}
                      </span>
                      <ChevronDown className={clsx('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
                    </button>

                    {isOpen && (
                      <div className="pl-2">
                        {group.items.map((child) => {
                          const isActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={clsx(
                                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                  ? 'bg-primary/15 text-primary-light'
                                  : 'text-text-secondary hover:text-white hover:bg-background-tertiary'
                              )}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobileOpenGroup(null);
                              }}
                            >
                              <child.icon className="w-4 h-4" />
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
