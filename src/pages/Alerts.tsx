import { AlertTriangle, Bell, DollarSign, Tag, Clock, CheckCircle, X, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { severityBadge } from '../components/ui/Badge';
import { fmtCurrency, fmtDate } from '../utils/formatters';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import type { AlertType, AlertSeverity } from '../types';

const ALERT_ICONS: Record<AlertType, React.ReactNode> = {
  bill_due: <Clock size={16} />,
  low_cash: <DollarSign size={16} />,
  uncategorized: <Tag size={16} />,
  large_expense: <AlertTriangle size={16} />,
  debt_payment: <DollarSign size={16} />,
  document_expiring: <Bell size={16} />,
};

const ALERT_BG: Record<AlertSeverity, string> = {
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-amber-50 border-amber-200',
  critical: 'bg-red-50 border-red-200',
};

const ALERT_ICON_BG: Record<AlertSeverity, string> = {
  info: 'bg-blue-100 text-blue-600',
  warning: 'bg-amber-100 text-amber-600',
  critical: 'bg-red-100 text-red-600',
};

const ALERT_LINKS: Partial<Record<AlertType, string>> = {
  bill_due: '/bills',
  low_cash: '/reports',
  uncategorized: '/transactions',
  large_expense: '/transactions',
  debt_payment: '/liabilities',
};

export function Alerts() {
  const { alerts, dismissAlert, dismissAllAlerts, entities } = useStore();

  const active = alerts.filter((a) => !a.dismissed);
  const dismissed = alerts.filter((a) => a.dismissed);

  const bySeverity = {
    critical: active.filter((a) => a.severity === 'critical'),
    warning: active.filter((a) => a.severity === 'warning'),
    info: active.filter((a) => a.severity === 'info'),
  };

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">Critical</p>
          <p className="text-2xl font-bold text-red-700">{bySeverity.critical.length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">Warnings</p>
          <p className="text-2xl font-bold text-amber-700">{bySeverity.warning.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Info</p>
          <p className="text-2xl font-bold text-blue-700">{bySeverity.info.length}</p>
        </div>
      </div>

      {active.length === 0 ? (
        <Card padding="lg" className="text-center">
          <CheckCircle size={40} className="mx-auto text-emerald-400 mb-3" />
          <p className="text-slate-600 font-medium">All clear!</p>
          <p className="text-sm text-slate-400 mt-1">No active alerts. Your finances are looking great.</p>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{active.length} active alert{active.length !== 1 ? 's' : ''}</p>
            <Button variant="ghost" size="sm" onClick={dismissAllAlerts}>
              <CheckCircle size={13} /> Dismiss All
            </Button>
          </div>

          {/* Alerts grouped by severity */}
          {(['critical', 'warning', 'info'] as AlertSeverity[]).map((severity) => {
            const group = bySeverity[severity];
            if (group.length === 0) return null;
            return (
              <div key={severity} className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  {severity === 'critical' && <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />}
                  {severity === 'warning' && <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />}
                  {severity === 'info' && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />}
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </h3>
                {group.map((alert) => {
                  const entity = entities.find((e) => e.id === alert.entityId);
                  const link = ALERT_LINKS[alert.type];
                  return (
                    <div key={alert.id} className={clsx('rounded-xl border p-4 flex items-start gap-4', ALERT_BG[alert.severity])}>
                      <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', ALERT_ICON_BG[alert.severity])}>
                        {ALERT_ICONS[alert.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-sm font-semibold text-slate-900">{alert.title}</h4>
                          {severityBadge(alert.severity)}
                          {entity && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entity.color }} />
                              {entity.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{alert.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {alert.amount && (
                            <span className="text-xs font-semibold text-slate-700">{fmtCurrency(alert.amount)}</span>
                          )}
                          {alert.dueDate && (
                            <span className="text-xs text-slate-500">Due: {fmtDate(alert.dueDate)}</span>
                          )}
                          <span className="text-xs text-slate-400">{new Date(alert.createdAt).toLocaleDateString()}</span>
                          {link && (
                            <Link to={link} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                              View →
                            </Link>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>
      )}

      {/* Alert configuration */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Alert Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">Configure when you want to be notified</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Bills due within', value: '7', unit: 'days', enabled: true },
            { label: 'Cash balance below', value: '10,000', unit: '$', enabled: true },
            { label: 'Uncategorized transactions above', value: '5', unit: 'count', enabled: true },
            { label: 'Large single expense above', value: '500', unit: '$', enabled: true },
            { label: 'Debt payment due within', value: '5', unit: 'days', enabled: true },
            { label: 'Email digest', value: 'Weekly', unit: '', enabled: false },
          ].map((config) => (
            <div key={config.label} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm text-slate-700">{config.label}</p>
                {config.value && <p className="text-xs font-semibold text-blue-600">{config.unit === '$' ? `$${config.value}` : `${config.value} ${config.unit}`}</p>}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={config.enabled} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <Bell size={13} className="flex-shrink-0" />
            Email report scheduling coming soon — connect your email to receive weekly summaries and critical alerts.
          </p>
        </div>
      </Card>

      {/* Dismissed alerts */}
      {dismissed.length > 0 && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Dismissed ({dismissed.length})</h3>
          </div>
          <div className="space-y-2">
            {dismissed.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 opacity-50">
                <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-slate-600 line-through truncate">{alert.title}</span>
                <span className="text-xs text-slate-400 ml-auto">{new Date(alert.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
