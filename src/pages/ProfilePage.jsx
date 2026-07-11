import {
  BadgeCheck,
  Bookmark,
  BookOpenCheck,
  CalendarCheck2,
  Camera,
  Check,
  Church,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { groupForUser } from '../utils/app';
import { prepareProfilePhoto } from '../utils/image';
import { initialsFromName } from '../utils/security';

const roleName = (role) => role === 'admin'
  ? 'Team Leader'
  : role === 'dgl'
    ? 'Discussion Group Leader'
    : 'Participant';

const formatJoinedDate = (value) => {
  if (!value) return 'Recently joined';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently joined';
  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(date);
};

const statusLabel = (status) => status ? `${status.charAt(0).toUpperCase()}${status.slice(1)}` : 'Pending';

function StatCard({ icon: Icon, value, label, note }) {
  return (
    <article className="profile-stat-card">
      <span className="profile-stat-card__icon"><Icon /></span>
      <div><strong>{value}</strong><span>{label}</span>{note && <small>{note}</small>}</div>
    </article>
  );
}

function DetailRow({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="profile-detail-row">
      <span className="profile-detail-row__icon"><Icon /></span>
      <span><small>{label}</small><strong className={accent ? 'profile-detail-row__accent' : ''}>{value}</strong></span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser, changePassword } = useAuth();
  const { data } = useData();
  const group = groupForUser(user, data.groups);
  const fileInput = useRef(null);
  const formSection = useRef(null);
  const [saved, setSaved] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [form, setForm] = useState({
    fullName: '',
    mobileNumber: '',
    mobileNumberVisible: false,
    location: '',
    parish: '',
    bio: '',
    photoURL: '',
    photoConsent: false
  });

  useEffect(() => {
    setForm({
      fullName: user.fullName || '',
      mobileNumber: user.mobileNumber || '',
      mobileNumberVisible: Boolean(user.mobileNumberVisible),
      location: user.location || '',
      parish: user.parish || '',
      bio: user.bio || '',
      photoURL: user.photoURL || '',
      photoConsent: Boolean(user.photoConsent)
    });
  }, [user]);

  const stats = useMemo(() => {
    const progress = data.progress.filter((item) => item.userId === user.uid);
    const completedTalks = progress.filter((item) => item.completed).length;
    const attendanceRecords = data.attendance.filter((item) => item.userId === user.uid && item.status !== 'not-recorded');
    const attended = attendanceRecords.filter((item) => ['present', 'late', 'excused'].includes(item.status)).length;
    const reflectionPosts = data.posts.filter((item) => item.authorId === user.uid && item.type === 'Reflection').length;
    const savedPosts = data.savedPosts.filter((item) => item.userId === user.uid).length;
    return { completedTalks, attended, attendanceRecords: attendanceRecords.length, reflectionPosts, savedPosts };
  }, [data.attendance, data.posts, data.progress, data.savedPosts, user.uid]);

  const profileCompletion = useMemo(() => {
    const fields = [form.fullName, form.photoURL, form.mobileNumber, form.location, form.parish, form.bio];
    return Math.round(fields.filter((value) => Boolean(String(value || '').trim())).length / fields.length * 100);
  }, [form]);

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
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const submit = (event) => {
    event.preventDefault();
    setError('');
    if (form.photoURL && !form.photoConsent) {
      setError('Please allow profile photo display or remove the selected picture before saving.');
      return;
    }
    updateUser({
      ...form,
      fullName: form.fullName.trim(),
      mobileNumber: form.mobileNumber.trim(),
      location: form.location.trim(),
      parish: form.parish.trim(),
      bio: form.bio.trim(),
      avatar: initialsFromName(form.fullName)
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    setPasswordBusy(true);
    try {
      await changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage('Password changed successfully.');
    } catch (passwordChangeError) {
      setPasswordError(passwordChangeError.message || 'Unable to change your password.');
    } finally {
      setPasswordBusy(false);
    }
  };

  const removePhoto = () => setForm((current) => ({ ...current, photoURL: '', photoConsent: false }));
  const scrollToEdit = () => formSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="profile-page profile-page--polished">
      <section className="profile-identity-card">
        <div className="profile-identity-card__cover">
          <div className="profile-identity-card__glow" />
          <div className="profile-identity-card__flame" />
        </div>
        <div className="profile-identity-card__body">
          <div className="profile-avatar profile-avatar--round">
            {form.photoURL
              ? <img src={form.photoURL} alt={`${user.fullName}'s profile`} />
              : <span>{initialsFromName(form.fullName || user.fullName)}</span>}
            <button type="button" onClick={() => fileInput.current?.click()} aria-label="Upload profile picture" title="Upload profile picture">
              <Camera size={17} />
            </button>
            <input
              ref={fileInput}
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => choosePhoto(event.target.files?.[0])}
            />
          </div>

          <div className="profile-identity-card__copy">
            <div className="profile-identity-card__badges">
              <span className={`profile-role-pill profile-role-pill--${user.role}`}>{roleName(user.role)}</span>
              <span className={`profile-status-pill profile-status-pill--${user.accountStatus}`}><BadgeCheck /> {statusLabel(user.accountStatus)}</span>
            </div>
            <h1>{form.fullName || user.fullName}</h1>
            <p>{form.bio || 'Add a short introduction so your CLP community can know you better.'}</p>
            <div className="profile-identity-card__meta">
              <span><UsersRound /> {group?.name || 'Not assigned to a group'}</span>
              <span><CalendarCheck2 /> Joined {formatJoinedDate(user.createdAt)}</span>
            </div>
          </div>

          <button className="button button--soft profile-edit-button" type="button" onClick={scrollToEdit}>
            <UserRound size={17} /> Edit profile
          </button>
        </div>
      </section>

      <section className="profile-stats-grid" aria-label="Profile statistics">
        <StatCard icon={BookOpenCheck} value={`${stats.completedTalks}/8`} label="Talks completed" note={`${Math.round(stats.completedTalks / 8 * 100)}% of your journey`} />
        <StatCard icon={CalendarCheck2} value={stats.attended} label="Attendance records" note={`${stats.attendanceRecords} talk entries recorded`} />
        <StatCard icon={FileText} value={stats.reflectionPosts} label="Reflections shared" note="Posts marked as Reflection" />
        <StatCard icon={Bookmark} value={stats.savedPosts} label="Saved posts" note="Community posts bookmarked" />
      </section>

      <div className="profile-main-grid">
        <main className="profile-main-column">
          <section ref={formSection} className="content-card profile-edit-card">
            <div className="profile-section-heading">
              <div><span>PROFILE SETTINGS</span><h2>Personal information</h2><p>Keep your profile accurate so your DGL and Team Leaders can support you well.</p></div>
              <UserRound />
            </div>

            <form id="profile-form" className="profile-form profile-form--polished" onSubmit={submit}>
              <div className="profile-photo-editor">
                <div className="profile-photo-editor__preview">
                  {form.photoURL
                    ? <img src={form.photoURL} alt="Selected profile preview" />
                    : <span>{initialsFromName(form.fullName || user.fullName)}</span>}
                </div>
                <div className="profile-photo-editor__copy">
                  <strong>Profile picture</strong>
                  <span>Use a clear square photo. EMBER resizes and compresses it automatically.</span>
                  <div className="profile-photo-actions">
                    <button className="button button--soft button--small" type="button" onClick={() => fileInput.current?.click()} disabled={photoBusy}><Camera size={15} /> {photoBusy ? 'Preparing…' : form.photoURL ? 'Replace photo' : 'Choose photo'}</button>
                    {form.photoURL && <button className="text-button text-button--danger" type="button" onClick={removePhoto}><Trash2 size={15} /> Remove</button>}
                  </div>
                </div>
              </div>

              {error && <div className="form-alert form-alert--error"><Camera size={18} /><span>{error}</span></div>}

              <div className="profile-form-section">
                <div className="profile-form-section__title"><Sparkles /><span><strong>About you</strong><small>Your name and introduction are visible inside your CLP community.</small></span></div>
                <div className="form-grid profile-form-grid">
                  <label className="form-grid__wide"><span>Full name</span><input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></label>
                  <label className="form-grid__wide"><span>Short introduction</span><textarea rows="4" maxLength="300" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Share a little about yourself and your CLP journey." /><small>{form.bio.length} / 300 characters</small></label>
                </div>
              </div>

              <div className="profile-form-section">
                <div className="profile-form-section__title"><Phone /><span><strong>Contact and community</strong><small>Your email cannot be changed in this version.</small></span></div>
                <div className="form-grid profile-form-grid">
                  <label><span>Email address</span><input value={user.email} disabled /></label>
                  <label><span>Mobile number</span><input inputMode="tel" value={form.mobileNumber} onChange={(event) => setForm({ ...form, mobileNumber: event.target.value })} placeholder="e.g. 09XX XXX XXXX" /></label>
                  <label><span>City / Barangay</span><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="e.g. Tayabas City" /></label>
                  <label><span>Parish or SFC chapter</span><input value={form.parish} onChange={(event) => setForm({ ...form, parish: event.target.value })} /></label>
                </div>
              </div>

              <div className="profile-form-section">
                <div className="profile-form-section__title"><ShieldCheck /><span><strong>Privacy</strong><small>Choose how your profile information is shown within EMBER.</small></span></div>
                <div className="profile-toggle-list">
                  <label className="profile-toggle-row">
                    <span><Camera /><i><strong>Show my profile picture</strong><small>Display it beside posts, comments, attendance, and group lists.</small></i></span>
                    <input type="checkbox" checked={form.photoConsent} onChange={(event) => setForm({ ...form, photoConsent: event.target.checked })} />
                  </label>
                  <label className="profile-toggle-row">
                    <span>{form.mobileNumberVisible ? <Eye /> : <EyeOff />}<i><strong>Show my mobile number to group members</strong><small>DGLs and Team Leaders can still access the number for CLP coordination.</small></i></span>
                    <input type="checkbox" checked={form.mobileNumberVisible} onChange={(event) => setForm({ ...form, mobileNumberVisible: event.target.checked })} />
                  </label>
                </div>
              </div>

              <div className="profile-save-bar">
                <span>{saved ? <><Check /> Changes saved successfully.</> : 'Review your information before saving.'}</span>
                <button className="button" disabled={photoBusy}><Save size={18} /> Save changes</button>
              </div>
            </form>
          </section>
        </main>

        <aside className="profile-side-column">
          <article className="content-card profile-completion-card">
            <div className="profile-completion-card__top"><span><Sparkles /> Profile completion</span><strong>{profileCompletion}%</strong></div>
            <div className="progress-track"><span style={{ width: `${profileCompletion}%` }} /></div>
            <p>{profileCompletion === 100 ? 'Your profile is complete and ready for your community.' : 'Add your photo, contact details, location, parish, and introduction to complete your profile.'}</p>
          </article>

          <article className="content-card profile-journey-card">
            <div className="profile-section-heading profile-section-heading--compact"><div><span>MY CLP JOURNEY</span><h3>Growing in faith</h3></div><BookOpenCheck /></div>
            <div className="profile-journey-score"><strong>{Math.round(stats.completedTalks / 8 * 100)}%</strong><span>{stats.completedTalks} of 8 talks completed</span></div>
            <div className="progress-track"><span style={{ width: `${stats.completedTalks / 8 * 100}%` }} /></div>
            <div className="profile-journey-dots">{data.talks.slice(0, 8).map((talk) => {
              const complete = data.progress.some((item) => item.userId === user.uid && item.talkId === talk.id && item.completed);
              return <span key={talk.id} className={complete ? 'complete' : ''} title={`Talk ${talk.number}: ${talk.title}`}>{complete ? <Check /> : talk.number}</span>;
            })}</div>
          </article>

          <article className="content-card profile-details-card">
            <div className="profile-section-heading profile-section-heading--compact"><div><span>ACCOUNT OVERVIEW</span><h3>Your CLP identity</h3></div></div>
            <DetailRow icon={Mail} label="Email" value={user.email} />
            <DetailRow icon={UsersRound} label="Discussion group" value={group?.name || 'Not assigned yet'} />
            <DetailRow icon={BadgeCheck} label="Account status" value={statusLabel(user.accountStatus)} accent />
            <DetailRow icon={MapPin} label="Location" value={form.location || 'Not provided'} />
            <DetailRow icon={Phone} label="Mobile number" value={form.mobileNumber || 'Not provided'} />
            <DetailRow icon={Church} label="Parish / chapter" value={form.parish || 'Not provided'} />
          </article>

          <article className="content-card profile-security-card">
            <div className="profile-section-heading profile-section-heading--compact"><div><span>ACCOUNT SECURITY</span><h3>Change password</h3></div><LockKeyhole /></div>
            <p>Use at least eight characters and keep your account password private.</p>
            <form className="profile-password-form" onSubmit={submitPassword}>
              <label><span>Current password</span><div className="profile-password-field"><input type={showPasswords ? 'text' : 'password'} autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} required /><KeyRound /></div></label>
              <label><span>New password</span><div className="profile-password-field"><input type={showPasswords ? 'text' : 'password'} autoComplete="new-password" minLength="8" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} required /><KeyRound /></div></label>
              <label><span>Confirm new password</span><div className="profile-password-field"><input type={showPasswords ? 'text' : 'password'} autoComplete="new-password" minLength="8" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} required /><KeyRound /></div></label>
              <label className="profile-password-toggle"><input type="checkbox" checked={showPasswords} onChange={(event) => setShowPasswords(event.target.checked)} /><span>{showPasswords ? <EyeOff /> : <Eye />} Show passwords</span></label>
              {passwordError && <div className="profile-inline-message profile-inline-message--error">{passwordError}</div>}
              {passwordMessage && <div className="profile-inline-message profile-inline-message--success"><Check /> {passwordMessage}</div>}
              <button className="button button--soft button--full" disabled={passwordBusy}><KeyRound size={17} /> {passwordBusy ? 'Updating…' : 'Update password'}</button>
            </form>
          </article>
        </aside>
      </div>

      {saved && <div className="toast-inline"><Check /> Profile updated successfully</div>}
    </div>
  );
}
