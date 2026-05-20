import { Link, Outlet } from "react-router-dom";
import Logo from "../Logo";

export default function PublicLayout() {
  return (
    <div className="min-h-screen text-base-content">
      <header className="border-b border-parchment-200/70 bg-parchment-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="transition-opacity hover:opacity-80">
            <Logo variant="default" />
          </Link>
          <Link
            to="/admin"
            className="text-sm text-base-content/55 transition-colors hover:text-base-content"
          >
            管理
          </Link>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
