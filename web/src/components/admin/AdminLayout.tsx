import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import {
  HomeIcon,
  ClockIcon,
  LinkIcon,
  PlusCircleIcon,
  Bars3Icon,
  ArrowDownTrayIcon,
  ArrowRightStartOnRectangleIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ChevronUpDownIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import AdminSidebar, { type NavGroup } from "./AdminSidebar";
import SettingsModal from "./SettingsModal";
import Logo from "../Logo";

const navGroups: NavGroup[] = [
  {
    group: "仪表盘",
    items: [{ to: "/admin", icon: HomeIcon, label: "概览", end: true }],
  },
  {
    group: "链接管理",
    items: [
      { to: "/admin/pending", icon: ClockIcon, label: "待处理" },
      { to: "/admin/links", icon: LinkIcon, label: "全部链接" },
      { to: "/admin/add", icon: PlusCircleIcon, label: "添加链接" },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const desktopUserMenuRef = useRef<HTMLDivElement>(null);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavigate = (to: string) => {
    setUserMenuOpen(false);
    setMobileNavOpen(false);
    navigate(to);
  };

  useEffect(() => {
    setMobileNavOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        desktopUserMenuRef.current &&
        desktopUserMenuRef.current.contains(event.target as Node)
      ) {
        return;
      }

      if (
        mobileUserMenuRef.current &&
        mobileUserMenuRef.current.contains(event.target as Node)
      ) {
        return;
      }

      setUserMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  return (
    <div className="min-h-screen bg-parchment-50 text-base-content">
      <div className="sticky top-0 z-40 border-b border-black/5 bg-parchment-50/95 px-3 py-2 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-base-content/65 transition-colors hover:bg-white hover:text-base-content"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label={mobileNavOpen ? "关闭导航" : "打开导航"}
          >
            {mobileNavOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>

          <a
            href="/"
            className="absolute left-1/2 inline-flex -translate-x-1/2 items-center justify-center rounded-xl px-2 py-1 transition-opacity hover:opacity-80"
          >
            <span className="inline-flex items-center gap-3">
              <Logo variant="default" showText />
            </span>
          </a>

          <div className="h-10 w-10 shrink-0" aria-hidden="true" />
        </div>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setMobileNavOpen(false)}
            aria-label="关闭导航遮罩"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(22rem,88vw)] bg-parchment-50 shadow-[0_18px_48px_rgba(16,24,40,0.18)]">
            <div className="flex h-full flex-col bg-parchment-50 px-3 py-3">
              <div className="flex items-center justify-between bg-parchment-50 px-2 py-2">
                <a
                  href="/"
                  className="inline-flex items-center gap-3 rounded-xl transition-opacity hover:opacity-80"
                >
                  <Logo variant="default" showText />
                </a>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-base-content/55 transition-colors hover:bg-white hover:text-base-content"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="关闭导航"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-2 min-h-0 flex-1 overflow-y-auto bg-parchment-50 px-1">
                <AdminSidebar
                  navGroups={navGroups}
                  onLinkClick={() => setMobileNavOpen(false)}
                />
              </div>

              <div
                className="relative mt-2 bg-parchment-50 px-1"
                ref={mobileUserMenuRef}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-white/80"
                  onClick={() => setUserMenuOpen((open) => !open)}
                >
                  <UserCircleIcon className="h-8 w-8 shrink-0 text-base-content/45" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-base-content/80">
                      {user?.email ?? "未登录"}
                    </span>
                  </span>
                  <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-base-content/35" />
                </button>

                {userMenuOpen ? (
                  <div className="absolute inset-x-1 bottom-full z-20 mb-2 rounded-2xl border border-black/6 bg-white p-1.5 shadow-[0_12px_40px_rgba(16,24,40,0.10)]">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-base-content/65 transition-colors hover:bg-parchment-100 hover:text-base-content"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setSettingsOpen(true);
                      }}
                    >
                      <Cog6ToothIcon className="h-4 w-4 shrink-0" />
                      设置
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-base-content/65 transition-colors hover:bg-parchment-100 hover:text-base-content"
                      onClick={() => handleNavigate("/admin/tools/logs")}
                    >
                      <ClipboardDocumentListIcon className="h-4 w-4 shrink-0" />
                      活动日志
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-base-content/65 transition-colors hover:bg-parchment-100 hover:text-base-content"
                      onClick={() => handleNavigate("/admin/tools/download")}
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 shrink-0" />
                      下载
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error/8"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <ArrowRightStartOnRectangleIcon className="h-4 w-4 shrink-0" />
                      退出登录
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="mx-auto min-h-[calc(100dvh-3.75rem)] w-full max-w-[1600px] gap-1.5 bg-parchment-50 px-1 py-1 sm:px-1.5 sm:py-1.5 lg:grid lg:min-h-screen lg:grid-cols-[220px_minmax(0,1fr)] lg:px-1.5 lg:py-1.5 xl:px-2">
        <aside className="hidden bg-parchment-50 lg:sticky lg:top-2.5 lg:block lg:h-[calc(100vh-1.25rem)]">
          <div className="flex h-full flex-col bg-parchment-50 px-0.5 py-0.5">
            <div className="bg-parchment-50 px-2 py-2">
              <a
                href="/"
                className="inline-flex items-center gap-3 rounded-xl transition-opacity hover:opacity-80"
              >
                <Logo variant="default" showText />
              </a>
            </div>

            <div className="mt-2 min-h-0 flex-1 overflow-y-auto bg-parchment-50 px-1">
              <AdminSidebar navGroups={navGroups} />
            </div>

            <div
              className="relative mt-2 bg-parchment-50 px-1"
              ref={desktopUserMenuRef}
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-white/80"
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                <UserCircleIcon className="h-8 w-8 shrink-0 text-base-content/45" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-base-content/80">
                    {user?.email ?? "未登录"}
                  </span>
                </span>
                <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-base-content/35" />
              </button>

              {userMenuOpen ? (
                <div className="absolute inset-x-1 bottom-full z-20 mb-2 rounded-2xl border border-black/6 bg-white p-1.5 shadow-[0_12px_40px_rgba(16,24,40,0.10)]">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-base-content/65 transition-colors hover:bg-parchment-100 hover:text-base-content"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSettingsOpen(true);
                    }}
                  >
                    <Cog6ToothIcon className="h-4 w-4 shrink-0" />
                    设置
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-base-content/65 transition-colors hover:bg-parchment-100 hover:text-base-content"
                    onClick={() => handleNavigate("/admin/tools/logs")}
                  >
                    <ClipboardDocumentListIcon className="h-4 w-4 shrink-0" />
                    活动日志
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-base-content/65 transition-colors hover:bg-parchment-100 hover:text-base-content"
                    onClick={() => handleNavigate("/admin/tools/download")}
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 shrink-0" />
                    下载
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error/8"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <ArrowRightStartOnRectangleIcon className="h-4 w-4 shrink-0" />
                    退出登录
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <main className="min-w-0 min-h-0 bg-parchment-50 pt-1 lg:pt-0">
          <div className="h-full min-h-0">
            <Outlet />
          </div>
        </main>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
