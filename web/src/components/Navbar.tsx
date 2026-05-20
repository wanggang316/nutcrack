import { useState, useRef, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  RssIcon,
  ArrowTopRightOnSquareIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Logo from "./Logo";
import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

interface NavbarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    placeholder?: string;
  };
  actions?: ReactNode[];
  theme?: "light" | "dark";
  onThemeToggle?: () => void;
  showRssLink?: boolean;
  rssHref?: string;
  navItems?: NavItem[];
  logoHref?: string;
  className?: string;
  onMobileMenuToggle?: () => void;
  isMobileSidebarOpen?: boolean;
}

export default function Navbar({
  search,
  actions = [],
  theme = "light",
  onThemeToggle,
  showRssLink = true,
  rssHref = "/feed.xml",
  navItems,
  logoHref = "/",
  className = "",
  onMobileMenuToggle,
  isMobileSidebarOpen = false,
}: NavbarProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when opened
  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [window.location.pathname]);

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    search?.onSubmit(e);
    setIsMobileSearchOpen(false);
  };

  return (
    <div className={`sticky top-0 z-30 ${className}`}>
      <nav className="navbar bg-base-100 border-b border-base-200">
        {/* Left side - Mobile menu icon + Logo */}
        <div className="flex-1 flex items-center gap-1">
          {/* Mobile sidebar toggle - left of logo, hidden on lg+ */}
          {onMobileMenuToggle && (
            <button
              className="btn btn-ghost btn-sm lg:hidden"
              onClick={onMobileMenuToggle}
              aria-label="切换侧边栏"
            >
              {isMobileSidebarOpen ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <Bars3Icon className="w-5 h-5" />
              )}
            </button>
          )}

          <a href={logoHref} className="btn btn-ghost flex items-center gap-2">
            <Logo variant="small" showText />
          </a>
        </div>

        {/* Right side - Actions */}
        <div className="flex-none gap-2">
          {/* Desktop Search */}
          {search && (
            <form onSubmit={search.onSubmit} className="join hidden lg:flex">
              <input
                className="input input-bordered input-sm join-item w-48"
                placeholder={search.placeholder || "搜索..."}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm join-item"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Mobile Search Icon */}
          {search && (
            <button
              className="btn btn-ghost btn-sm lg:hidden"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              aria-label="搜索"
            >
              {isMobileSearchOpen ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <MagnifyingGlassIcon className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Additional Actions */}
          {actions.map((action, index) => (
            <div key={index}>{action}</div>
          ))}

          {/* RSS Link */}
          {showRssLink && (
            <a href={rssHref} className="btn btn-ghost btn-sm" title="RSS Feed">
              <RssIcon className="w-5 h-5" />
            </a>
          )}

          {/* Theme Toggle */}
          {onThemeToggle && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onThemeToggle}
              title="切换主题"
            >
              {theme === "light" ? (
                <MoonIcon className="w-5 h-5" />
              ) : (
                <SunIcon className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Desktop Nav Menu Toggle (for navItems) */}
          {navItems && navItems.length > 0 && (
            <button
              className="btn btn-ghost btn-sm lg:hidden"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            >
              {isMobileNavOpen ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <Bars3Icon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Mobile Nav Items */}
        {isMobileNavOpen && navItems && navItems.length > 0 && (
          <div className="navbar-center lg:hidden absolute top-full left-0 right-0 bg-base-100 border-b border-base-200">
            <ul className="menu menu-horizontal px-4 gap-2 py-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="btn btn-sm btn-ghost"
                  >
                    {item.label}
                    {item.external && (
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Mobile Search Bar */}
      {search && isMobileSearchOpen && (
        <div className="lg:hidden bg-base-100 border-b border-base-200 px-4 py-2">
          <form onSubmit={handleMobileSearchSubmit} className="join w-full">
            <input
              ref={mobileSearchInputRef}
              className="input input-bordered input-sm join-item flex-1"
              placeholder={search.placeholder || "搜索..."}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm join-item">
              <MagnifyingGlassIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
