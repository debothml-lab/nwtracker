import { useState } from 'react';
import { Globe, Shield, Database, Bell, Plug, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Settings() {
  const { resetToSampleData, userEmail } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-5 max-w-screen-lg mx-auto">
      {/* Profile */}
      <Card padding="md">
        <div className="flex items-center gap-4 mb-4">
          <Globe size={18} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">Account</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Logged in as</span>
            <span className="text-sm font-medium text-slate-900">{userEmail}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Version</span>
            <span className="text-sm text-slate-500">Property Flow Global Finance v1.0.0</span>
          </div>
        </div>
      </Card>

      {/* Integrations */}
      <Card padding="md">
        <div className="flex items-center gap-4 mb-4">
          <Plug size={18} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Integrations</h3>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Plaid Bank Sync', desc: 'Connect bank accounts for automatic transaction import', status: 'coming_soon' },
            { name: 'QuickBooks', desc: 'Sync business transactions and chart of accounts', status: 'coming_soon' },
            { name: 'Retirement Account Sync', desc: 'Fidelity, Vanguard, Schwab balance sync', status: 'coming_soon' },
            { name: 'AI Document Parsing', desc: 'Extract data from PDFs using Claude AI', status: 'coming_soon' },
            { name: 'AI Transaction Categorization', desc: 'Automatically categorize transactions using AI', status: 'coming_soon' },
            { name: 'Email Report Scheduling', desc: 'Weekly/monthly email summaries', status: 'coming_soon' },
          ].map((integration) => (
            <div key={integration.name} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-900">{integration.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{integration.desc}</p>
              </div>
              <Button variant="outline" size="sm" disabled>Coming Soon</Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Data management */}
      <Card padding="md">
        <div className="flex items-center gap-4 mb-4">
          <Database size={18} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Data Management</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <div>
              <p className="text-sm font-medium text-slate-900">Data Storage</p>
              <p className="text-xs text-slate-400">All data is stored locally in your browser (localStorage)</p>
            </div>
            <Shield size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50">
            <div>
              <p className="text-sm font-medium text-amber-900">Reset to Sample Data</p>
              <p className="text-xs text-amber-700">This will overwrite all current data with the demo dataset</p>
            </div>
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>Cancel</Button>
                <Button variant="danger" size="sm" onClick={() => { resetToSampleData(); setConfirmReset(false); }}>
                  Confirm Reset
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
                <RefreshCw size={13} /> Reset
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
