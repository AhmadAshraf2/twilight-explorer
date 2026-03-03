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
      {/* Left Technical Element - hidden on tablet/mobile to avoid overlap */}
      <div 
        className="absolute left-20 hidden lg:block"
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
        {/* Logo - always visible; positioned for mobile/tablet and desktop */}
        <div 
          className="absolute block lg:left-[181px] left-4 sm:left-6 top-1/2 -translate-y-1/2 w-[90px] sm:w-[107.6px] h-5 sm:h-6"
        >
          <Link href="/" className="block w-full h-full">
            <img src="/logo.svg" alt="Twilight" className="w-full h-full object-contain object-left" />
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
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-full border border-card-border/60 bg-black/30 text-white/90 hover:text-white hover:bg-background-tertiary/30 transition-colors duration-150"
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-text-secondary hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Right Technical Element - hidden on tablet/mobile to avoid overlap */}
      <div 
        className="absolute right-20 hidden lg:block"
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

      {/* Mobile Menu - full-screen overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] flex items-start justify-center pt-20 pb-8 px-4"
          onClick={() => {
            setMobileMenuOpen(false);
            setMobileOpenGroup(null);
          }}
        >
          {/* Semi-transparent backdrop - click anywhere to close */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Menu panel - centered, click inside does not close */}
          <div
            className="relative w-full max-w-md max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[14px] border border-white/10 bg-background-secondary shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b border-white/5 bg-background-secondary rounded-t-[14px]">
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
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-text-secondary hover:text-white"
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
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-text-secondary hover:text-white"
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

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {navGroups.map((group) => {
                const active = isGroupActive.get(group.name) || false;
                const isOpen = mobileOpenGroup === group.name;
                return (
                  <div key={group.name} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setMobileOpenGroup((prev) => (prev === group.name ? null : group.name))}
                      className={clsx(
                        'w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left',
                        active
                          ? 'bg-primary/20 text-primary-light'
                          : 'text-white hover:bg-background-tertiary'
                      )}
                      aria-expanded={isOpen}
                    >
                      <span className="flex items-center gap-2">
                        <group.icon className="w-4 h-4 shrink-0" />
                        {group.name}
                      </span>
                      <ChevronDown className={clsx('w-4 h-4 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                    </button>

                    {isOpen && (
                      <div className="pl-4 pr-2 pb-2 space-y-0.5">
                        {group.items.map((child) => {
                          const isChildActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={clsx(
                                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                isChildActive
                                  ? 'bg-primary/15 text-primary-light'
                                  : 'text-text-secondary hover:text-white hover:bg-background-tertiary'
                              )}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobileOpenGroup(null);
                              }}
                            >
                              <child.icon className="w-4 h-4 shrink-0" />
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
