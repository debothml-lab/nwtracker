import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Entities } from './pages/Entities';
import { Assets } from './pages/Assets';
import { Liabilities } from './pages/Liabilities';
import { Loans } from './pages/Loans';
import { Bills } from './pages/Bills';
import { Income } from './pages/Income';
import { Transactions } from './pages/Transactions';
import { Documents } from './pages/Documents';
import { Reports } from './pages/Reports';
import { Alerts } from './pages/Alerts';
import { Settings } from './pages/Settings';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStore();
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/entities" element={<PrivateRoute><Entities /></PrivateRoute>} />
      <Route path="/assets" element={<PrivateRoute><Assets /></PrivateRoute>} />
      <Route path="/liabilities" element={<PrivateRoute><Liabilities /></PrivateRoute>} />
      <Route path="/loans" element={<PrivateRoute><Loans /></PrivateRoute>} />
      <Route path="/bills" element={<PrivateRoute><Bills /></PrivateRoute>} />
      <Route path="/income" element={<PrivateRoute><Income /></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
      <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/alerts" element={<PrivateRoute><Alerts /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
