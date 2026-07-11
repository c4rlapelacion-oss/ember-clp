import { Camera, Check, ShieldCheck, Trash2, UserRound, UsersRound } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { prepareProfilePhoto } from '../utils/image';
import { initialsFromName } from '../utils/security';

const blankForm = {
  requestedRole: 'participant', fullName: '', email: '', password: '', confirmPassword: '', mobileNumber: '', location: '', parish: '', bio: '', photoURL: '', privacyConsent: false, communityConsent: false, photoConsent: false
};

export default function RegisterPage() {
  const { user, register } = useAuth();
  const { data } = useData();
  const navigate = useNavigate();
  const photoInput = useRef(null);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const choosePhoto = async (file) => {
    if (!file) return;
    setPhotoBusy(true);
    setError('');
    try {
      const photoURL = await prepareProfilePhoto(file);
      setForm((current) => ({ ...current, photoURL, photoConsent: true }));
    } catch (photoError) {
      setError(photoError.message || 'Unable to prepare the selected photo.');
    } finally {
      setPhotoBusy(false);
      if (photoInput.current) photoInput.current.value = '';
    }
  };

  if (user) return <Navigate to={user.accountStatus === 'approved' ? '/app' : '/pending'} replace />;
  if (!data.settings.registrationOpen) return <div className="not-found"><Brand /><h1>Registration is currently closed.</h1><p>Please contact the SFC Tayabas Team Leaders for assistance.</p><Link className="button" to="/login">Return to sign in</Link></div>;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must contain at least 6 characters.');
    if (form.password !== form.confirmPassword) return setError('The passwords do not match.');
    if (!form.privacyConsent || !form.communityConsent) return setError('Please accept the privacy agreement and community guidelines.');
    if (form.photoURL && !form.photoConsent) return setError('Please allow profile photo display or remove the selected picture.');
    setBusy(true);
    try {
      await register(form);
      navigate('/pending', { replace: true });
    } catch (registrationError) {
      setError(registrationError.message || 'Unable to register.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="register-page">
      <header className="register-header container"><Brand /><span>Already registered? <Link to="/login">Sign in</Link></span></header>
      <div className="register-heading section-heading section-heading--center"><span>JOIN THE COMMUNITY</span><h1>Create your EMBER account</h1><p>Choose how you are joining the CLP. Every account is reviewed by a Team Leader before full access is granted.</p></div>
      <form className="registration-card" onSubmit={submit}>
        <section>
          <div className="form-section-title"><span>1</span><div><strong>Registration type</strong><small>DGL applicants receive DGL access only after Team Leader approval.</small></div></div>
          <div className="role-choice-grid">
            <button type="button" className={`role-choice ${form.requestedRole === 'participant' ? 'role-choice--selected' : ''}`} onClick={() => setForm({ ...form, requestedRole: 'participant' })}><UserRound /><div><strong>Participant</strong><span>Join a group, attend talks, post reflections, and interact with the CLP community.</span></div>{form.requestedRole === 'participant' && <i><Check size={14} /></i>}</button>
            <button type="button" className={`role-choice ${form.requestedRole === 'dgl' ? 'role-choice--selected' : ''}`} onClick={() => setForm({ ...form, requestedRole: 'dgl' })}><UsersRound /><div><strong>DGL applicant</strong><span>Apply to facilitate a discussion group. A Team Leader will review and assign your role.</span></div>{form.requestedRole === 'dgl' && <i><Check size={14} /></i>}</button>
          </div>
        </section>
        <section>
          <div className="form-section-title"><span>2</span><div><strong>Account information</strong><small>Use an active email address that you can remember.</small></div></div>
          <div className="registration-photo">
            <div className="registration-photo__preview">{form.photoURL ? <img src={form.photoURL} alt="Profile preview" /> : <span>{initialsFromName(form.fullName || 'EMBER Member')}</span>}</div>
            <div><strong>Profile picture <small>(optional)</small></strong><p>Add a clear photo now, or upload one later from your profile.</p><div><button type="button" className="button button--soft button--small" onClick={() => photoInput.current?.click()} disabled={photoBusy}><Camera size={15} /> {photoBusy ? 'Preparing…' : form.photoURL ? 'Change photo' : 'Choose photo'}</button>{form.photoURL && <button type="button" className="text-button text-button--danger" onClick={() => setForm({ ...form, photoURL: '' })}><Trash2 size={15} /> Remove</button>}</div></div>
            <input ref={photoInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choosePhoto(event.target.files?.[0])} />
          </div>
          <div className="form-grid">
            <label><span>Full name</span><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></label>
            <label><span>Email address</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
            <label><span>Password</span><input type="password" minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
            <label><span>Confirm password</span><input type="password" minLength="6" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required /></label>
            <label><span>Mobile number</span><input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} /></label>
            <label><span>City / Barangay</span><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
            <label><span>Parish or SFC chapter <small>(optional)</small></span><input value={form.parish} onChange={(e) => setForm({ ...form, parish: e.target.value })} /></label>
            <label className="form-grid__wide"><span>Short introduction <small>(optional)</small></span><textarea rows="3" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
          </div>
        </section>
        <section>
          <div className="form-section-title"><span>3</span><div><strong>Consent and community safety</strong><small>Your information is visible only according to EMBER permissions.</small></div></div>
          <div className="consent-list">
            <label className="check-label"><input type="checkbox" checked={form.privacyConsent} onChange={(e) => setForm({ ...form, privacyConsent: e.target.checked })} /><span>I agree to the EMBER data privacy agreement.</span></label>
            <label className="check-label"><input type="checkbox" checked={form.communityConsent} onChange={(e) => setForm({ ...form, communityConsent: e.target.checked })} /><span>I agree to communicate respectfully and follow the community guidelines.</span></label>
            <label className="check-label"><input type="checkbox" checked={form.photoConsent} onChange={(e) => setForm({ ...form, photoConsent: e.target.checked })} /><span>I allow photos that I personally upload to be displayed according to the visibility I select.</span></label>
          </div>
        </section>
        {error && <div className="form-alert form-alert--error registration-error"><ShieldCheck size={18} /><span>{error}</span></div>}
        <footer className="registration-card__footer"><p>After registration, wait for a Team Leader to approve your account. Admin accounts cannot be created here.</p><button className="button button--large" disabled={busy || photoBusy}>{busy ? 'Submitting…' : photoBusy ? 'Preparing photo…' : 'Submit registration'}</button></footer>
      </form>
    </div>
  );
}
