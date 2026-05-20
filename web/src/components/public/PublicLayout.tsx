import { Link, Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <header className="border-b border-base-200">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-lg font-semibold">
            Nutcrack
          </Link>
          <Link to="/admin" className="link link-hover text-sm text-base-content/60">
            管理
          </Link>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
