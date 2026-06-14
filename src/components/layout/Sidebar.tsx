import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShoppingBag, Target, Megaphone,
  Bot, BarChart3, Settings, LogOut, Zap, ShoppingCart, Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', id: 'nav-dashboard' },
  { to: '/customers', icon: Users, label: 'Customers', id: 'nav-customers' },
  { to: '/orders', icon: ShoppingBag, label: 'Orders', id: 'nav-orders' },
  { to: '/abandoned-carts', icon: ShoppingCart, label: 'Abandoned Carts', id: 'nav-abandoned-carts' },
  { to: '/segments', icon: Target, label: 'Segments', id: 'nav-segments' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns', id: 'nav-campaigns' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', id: 'nav-analytics' },
];

const BOTTOM_ITEMS = [
  { to: '/intelligence', icon: Sparkles, label: 'Intelligence', id: 'nav-intelligence', isAI: true },
  { to: '/ai-agent', icon: Bot, label: 'AI Agent', id: 'nav-ai-agent', isAI: true },
  { to: '/settings', icon: Settings, label: 'Settings', id: 'nav-settings' },
];

function NavItem({
  to, icon: Icon, label, id, end, isAI,
}: {
  to: string; icon: React.ElementType; label: string; id: string; end?: boolean; isAI?: boolean;
}) {
  return (
    <NavLink
      to={to}
      id={id}
      end={end}
      title={label}
      aria-label={label}
      className={({ isActive }) =>
        [
          'relative flex flex-col items-center justify-center gap-1 w-11 h-11 rounded-xl transition-all duration-150',
          isActive
            ? 'bg-white/15 text-white'
            : 'text-white/40 hover:bg-white/10 hover:text-white/80',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          {/* Active left accent bar */}
          {isActive && (
            <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-teal-400 rounded-r" />
          )}
          <Icon className="w-[17px] h-[17px] flex-shrink-0" />
          {isAI && (
            <span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-violet-500 border border-white/20 flex items-center justify-center"
              style={{ fontSize: '7px', color: '#fff', fontWeight: 700, lineHeight: 1 }}
            >
              AI
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <aside
      className="flex-shrink-0 flex flex-col items-center gap-2 py-5 px-2 m-3 mr-0 rounded-[22px]"
      style={{
        width: '62px',
        minWidth: '62px',
        background: 'hsl(var(--sidebar-bg))',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      }}
    >
      {/* Logo mark */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mb-3"
        style={{ background: 'linear-gradient(135deg, #00C9B1, #3b82f6)' }}
      >
        <Zap className="w-4 h-4 text-white" />
      </div>

      {/* Main nav */}
      <nav className="flex flex-col items-center gap-1 flex-1 w-full">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} end={item.to === '/'} />
        ))}

        {/* Divider */}
        <div className="w-7 my-2" style={{ height: '1px', background: 'rgba(255,255,255,0.10)' }} />

        {BOTTOM_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* User avatar + logout */}
      <div className="flex flex-col items-center gap-2 mt-2">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #9B59B6)', border: '2px solid rgba(255,255,255,0.25)' }}
          title={user?.name}
        >
          {initials}
        </div>
        {/* Logout */}
        <button
          id="btn-logout"
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150"
          style={{ color: 'rgba(255,255,255,0.40)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.85)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
          }}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
