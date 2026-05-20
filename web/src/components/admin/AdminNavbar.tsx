import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import Logo from "../Logo";

interface AdminNavbarProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  userEmail?: string;
  onLogout: () => void;
  onSettingsOpen: () => void;
  onLogsNavigate: () => void;
  onDownloadNavigate: () => void;
  actions?: ReactNode[];
}

export default function AdminNavbar({
  onMenuToggle,
  isMenuOpen,
  userEmail,
  onLogout,
  onSettingsOpen,
  onLogsNavigate,
  onDownloadNavigate,
  actions = [],
}: AdminNavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  return (
    <div className="sticky top-0 z-30">
      <header className="navbar min-h-16 border-b border-base-200 bg-base-100 px-4 sm:px-6">
        {/* Mobile menu toggle */}
        <button
          className="btn btn-ghost btn-sm btn-circle lg:hidden"
          onClick={onMenuToggle}
        >
          {isMenuOpen ? (
            <XMarkIcon className="w-5 h-5" />
          ) : (
            <Bars3Icon className="w-5 h-5" />
          )}
        </button>

        {/* Logo - centered on mobile, left-aligned on desktop */}
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 lg:static lg:translate-x-0">
          <a
            href="/"
            className="btn btn-ghost flex items-center gap-2 px-0 hover:bg-transparent"
          >
            <Logo variant="small" showText />
          </a>
          <span className="rounded bg-base-200 px-1.5 py-0.5 text-xs font-medium text-base-content/45">
            Admin
          </span>
        </div>

        <div className="flex-1" />

        {/* Right side */}
        <div className="flex flex-none items-center gap-2">
          {actions.map((action, index) => (
            <div key={index}>{action}</div>
          ))}

          {/* Download button */}
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onDownloadNavigate}
            title="下载"
            aria-label="下载"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <UserCircleIcon className="w-5 h-5" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-base-200 bg-base-100 shadow-sm">
                {userEmail && (
                  <div className="border-b border-base-200 px-4 py-3">
                    <p className="mb-0.5 text-xs text-base-content/50">
                      登录账号
                    </p>
                    <p className="truncate text-sm">{userEmail}</p>
                  </div>
                )}
                <ul className="menu menu-sm p-1.5">
                  <li>
                    <button
                      className="flex items-center gap-2"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onSettingsOpen();
                      }}
                    >
                      <Cog6ToothIcon className="w-4 h-4" />
                      设置
                    </button>
                  </li>
                  <li>
                    <button
                      className="flex items-center gap-2"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogsNavigate();
                      }}
                    >
                      <ClipboardDocumentListIcon className="w-4 h-4" />
                      活动日志
                    </button>
                  </li>
                  <li className="border-t border-base-200 mt-1 pt-1">
                    <button
                      className="flex items-center gap-2 text-error"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                    >
                      <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                      退出登录
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
