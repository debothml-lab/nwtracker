import { Menu, Bell, ChevronDown, Globe } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/entities': 'Entities',
  '/assets': 'Assets',
  '/liabilities': 'Liabilities',
  '/loans': 'Loans & Debt Schedules',
  '/bills': 'Bills & Calendar',
  '/income': 'Income',
  '/transactions': 'Transactions',
  '/documents': 'Documents',
  '/reports': 'Reports',
  '/alerts': 'Alerts',
  '/settings': 'Settings',
};

export function Header() {
  const { setSidebarOpen, sidebarOpen, entities, selectedEntityId, setSelectedEntity, alerts } = useStore();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'Property Flow';
  const activeAlerts = alerts.filter((a) => !a.dismissed).length;
  const selectedEntity = entities.find((e) => e.id === selectedEntityId);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 flex-shrink-0">
      {/* Mobile hamburger */}
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
      </div>

      {/* Entity Selector */}
      <div className="relative group">
        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm transition-colors">
          <Globe size={14} className="text-slate-500" />
          <span className="font-medium text-slate-700 max-w-[160px] truncate">
            {selectedEntity ? selectedEntity.name : 'All Entities'}
          </span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-64 py-1 hidden group-hover:block">
          <button
            onClick={() => setSelectedEntity(null)}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
              !selectedEntityId ? 'text-blue-600 font-medium' : 'text-slate-700'
            )}
          >
            <Globe size={14} className="flex-shrink-0" />
            <span>All Entities</span>
          </button>
          <div className="border-t border-slate-100 my-1" />
          {entities.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedEntity(e.id)}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
                selectedEntityId === e.id ? 'text-blue-600 font-medium' : 'text-slate-700'
              )}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
              <span className="truncate">{e.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Alerts bell */}
      <a href="/alerts" className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
        <Bell size={18} />
        {activeAlerts > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {activeAlerts}
          </span>
        )}
      </a>
    </header>
  );
}
