import { NavLink } from "react-router-dom";

export interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  navGroups: NavGroup[];
  onLinkClick?: () => void;
  className?: string;
}

export default function AdminSidebar({
  navGroups,
  onLinkClick,
  className = "",
}: AdminSidebarProps) {
  return (
    <nav className={className}>
      <div>
        {navGroups.map((group) => (
          <div key={group.group} className="mb-6">
            <p className="mb-2 px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-base-content/40">
              {group.group}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onLinkClick}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all before:absolute before:left-1.5 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:opacity-0 before:transition-opacity ${
                        isActive
                          ? "bg-white text-base-content shadow-[0_1px_2px_rgba(16,24,40,0.04)] before:bg-ember-500 before:opacity-100"
                          : "text-base-content/58 hover:bg-white/80 hover:text-base-content"
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
