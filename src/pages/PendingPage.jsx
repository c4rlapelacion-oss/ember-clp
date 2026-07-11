import { CheckCircle2, Clock3, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import { useAuth } from '../contexts/AuthContext';

export default function PendingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => { await logout(); navigate('/login'); };
  return (
    <div className="pending-page"><div className="pending-glow" /><section className="pending-card">
      <Brand />
      <div className="pending-card__icon"><Clock3 size={34} /></div>
      <span className="chip chip--ember">Registration received</span>
      <h1>Your account is waiting for approval.</h1>
      <p>Thank you, {user.fullName}. A Team Leader will review your {user.requestedRole === 'dgl' ? 'DGL application' : 'participant registration'} before you can enter the EMBER community.</p>
      <div className="pending-steps">
        <div className="pending-step pending-step--done"><span><CheckCircle2 /></span><div><strong>Registration submitted</strong><small>Your account information has been saved.</small></div></div>
        <div className="pending-step pending-step--active"><span><ShieldCheck /></span><div><strong>Team Leader review</strong><small>Your role and CLP access will be checked.</small></div></div>
        <div className="pending-step"><span><UserCheck /></span><div><strong>Account approval</strong><small>You can sign in and join a discussion group after approval.</small></div></div>
      </div>
      <div className="pending-note">You may sign out and return later. Use the same email address and password.</div>
      <button className="button button--soft button--full" onClick={signOut}><LogOut size={18} /> Sign out</button>
    </section></div>
  );
}
