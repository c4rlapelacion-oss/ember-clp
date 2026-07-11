import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import emberIcon from '../assets/ember-icon.png';

export default function ProtectedRoute({ children, roles, allowPending = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="full-screen-loader" aria-live="polite">
        <img src={emberIcon} alt="EMBER" />
        <span>Lighting EMBER…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (!allowPending && user.accountStatus !== 'approved') {
    return <Navigate to="/pending" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }

  return children;
}
