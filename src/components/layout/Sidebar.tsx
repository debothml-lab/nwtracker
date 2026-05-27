import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard, Building2, Landmark, CreditCard, Car,
  CalendarDays, TrendingUp, Receipt, FileText, BarChart3,
  Bell, Settings, ChevronLeft, ChevronRight, LogOut, Globe
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/entities', label: 'Entities', icon: Building2 },
  { path: '/assets', label: 'Assets', icon: Landmark },
  { path: '/liabilities', label: 'Liabilities', icon: CreditCard },
  { path: '/loans', label: 'Loans & Debt', icon: Car },
  { path: '/bills', label: 'Bills', icon: CalendarDays },
  { path: '/income', label: 'Income', icon: TrendingUp },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/alerts', label: 'Alerts', icon: Bell },
];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, logout, userEmail, alerts } = useStore();
  const location = useLocation();
  const activeAlerts = alerts.filter((a) => !a.dismissed).length;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={clsx(
        'fixed top-0 left-0 h-screen z-30 flex flex-col transition-all duration-300 ease-in-out',
        'bg-navy-900',
        sidebarOpen ? 'w-60' : 'w-16',
        'lg:relative lg:flex'
      )}>
        {/* Logo */}
        <div className={clsx(
          'flex items-center px-4 py-4 border-b border-white/10 min-h-[64px]',
          sidebarOpen ? 'gap-3' : 'justify-center'
        )}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Globe size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-white font-bold text-xs leading-tight">Property Flow</p>
              <p className="text-blue-300 text-xs leading-tight">Global Finance</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);

            return (
              <NavLink
                key={path}
                to={path}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-colors text-sm group relative',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                )}
              >
                <span className="relative flex-shrink-0">
                  <Icon size={18} />
                  {label === 'Alerts' && activeAlerts > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {activeAlerts > 9 ? '9+' : activeAlerts}
                    </span>
                  )}
                </span>
                {sidebarOpen && <span className="truncate font-medium">{label}</span>}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-lg">
                    {label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 py-3 px-2 space-y-1">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-sm"
          >
            <Settings size={18} />
            {sidebarOpen && <span className="font-medium">Settings</span>}
          </NavLink>

          {sidebarOpen && (
            <div className="px-3 py-2">
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle – desktop */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center shadow-sm hover:shadow-md transition-shadow text-slate-500"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>
    </>
  );
}
