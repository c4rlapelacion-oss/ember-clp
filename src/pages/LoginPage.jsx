import { ArrowLeft, Eye, EyeOff, Flame, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.accountStatus === 'approved' ? '/app' : '/pending'} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const profile = await login(form);
      const requested = location.state?.from?.pathname;
      navigate(profile.accountStatus === 'approved' ? (requested || '/app') : '/pending', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Link className="auth-back" to="/"><ArrowLeft size={17} /> Back to EMBER</Link>
        <div className="auth-story__content">
          <div className="auth-story__flame"><Flame size={43} /></div>
          <h1>Welcome back to your CLP community.</h1>
          <p>Continue learning, sharing, praying, and growing with Singles for Christ Tayabas City.</p>
          <blockquote>“Fan into flame the gift of God.”<span>2 Timothy 1:6</span></blockquote>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo-mobile"><Brand /></div>
          <div className="auth-card__heading"><h2>Sign in</h2><p>Enter the email and password connected to your EMBER account.</p></div>
          {error && <div className="form-alert form-alert--error"><ShieldCheck size={18} /><span>{error}</span></div>}
          <form className="form-stack" onSubmit={submit}>
            <label><span>Email address</span><input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
            <label><span>Password</span><div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label="Show or hide password">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            <button className="button button--large button--full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to EMBER'}</button>
          </form>
          <p className="auth-switch">New participant or DGL applicant? <Link to="/register">Create an account</Link></p>
        </div>
      </section>
    </div>
  );
}
