import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';

export function Login() {
  const [email, setEmail] = useState('demo@propertyflow.com');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const ok = login(email, password);
    setLoading(false);
    if (ok) {
      navigate('/');
    } else {
      setError('Invalid email or password. Try the demo credentials below.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-blue-900 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-xl mb-4">
            <Globe size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Property Flow</h1>
          <p className="text-blue-300 text-sm mt-1">Global Finance Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full justify-center py-2.5" loading={loading}>
              Sign In
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Demo Credentials</p>
            <div className="space-y-1">
              {[
                { email: 'demo@propertyflow.com', password: 'demo1234' },
                { email: 'admin@propertyflow.com', password: 'admin123' },
                { email: 'michael@johnson.com', password: 'johnson2025' },
              ].map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => { setEmail(cred.email); setPassword(cred.password); setError(''); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors group"
                >
                  <span className="text-xs text-slate-600 group-hover:text-blue-600 font-mono">{cred.email}</span>
                  <span className="text-xs text-slate-400 ml-2">/ {cred.password}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-blue-300/60 mt-6">
          Private & Encrypted · Property Flow Global Finance v1.0
        </p>
      </div>
    </div>
  );
}
