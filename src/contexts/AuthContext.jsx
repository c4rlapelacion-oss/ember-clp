import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useData } from './DataContext';
import { SESSION_KEY } from '../data/initialData';
import { hashPassword, initialsFromName, makeId } from '../utils/security';

const AuthContext = createContext(null);

function publicProfile(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export function AuthProvider({ children }) {
  const { data, commit, addNotification } = useData();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = localStorage.getItem(SESSION_KEY);
    const current = data.users.find((item) => item.uid === uid);
    setUser(publicProfile(current));
    setLoading(false);
  }, []); // restore once; later changes are synchronized below

  useEffect(() => {
    if (!user) return;
    const fresh = data.users.find((item) => item.uid === user.uid);
    if (!fresh) {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
      return;
    }
    const safe = publicProfile(fresh);
    if (JSON.stringify(safe) !== JSON.stringify(user)) setUser(safe);
  }, [data.users, user]);

  const login = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const candidate = data.users.find((item) => item.email === normalizedEmail);
    if (!candidate) throw new Error('No EMBER account was found for that email address.');
    if (candidate.accountStatus === 'rejected') throw new Error('This registration was not approved. Please contact a Team Leader.');
    if (candidate.accountStatus === 'suspended') throw new Error('This account is suspended. Please contact a Team Leader.');
    const passwordHash = await hashPassword(password);
    if (passwordHash !== candidate.passwordHash) throw new Error('Incorrect email or password.');
    localStorage.setItem(SESSION_KEY, candidate.uid);
    const safe = publicProfile(candidate);
    setUser(safe);
    return safe;
  };

  const register = async (formData) => {
    const email = formData.email.trim().toLowerCase();
    if (data.users.some((item) => item.email === email)) {
      throw new Error('An account with this email address already exists.');
    }
    const now = new Date().toISOString();
    const created = {
      uid: makeId('user'),
      fullName: formData.fullName.trim(),
      email,
      passwordHash: await hashPassword(formData.password),
      role: 'participant',
      requestedRole: formData.requestedRole,
      accountStatus: 'pending',
      groupId: null,
      batchId: 'tayabas-clp',
      mobileNumber: formData.mobileNumber.trim(),
      mobileNumberVisible: false,
      location: formData.location.trim(),
      parish: formData.parish.trim(),
      bio: formData.bio.trim(),
      privacyConsent: Boolean(formData.privacyConsent),
      communityConsent: Boolean(formData.communityConsent),
      photoConsent: Boolean(formData.photoConsent),
      avatar: initialsFromName(formData.fullName),
      photoURL: formData.photoURL || '',
      createdAt: now
    };
    commit((current) => ({ ...current, users: [...current.users, created] }));
    localStorage.setItem(SESSION_KEY, created.uid);
    setUser(publicProfile(created));
    const admins = data.users.filter((item) => item.role === 'admin' && item.accountStatus === 'approved');
    admins.forEach((admin) => addNotification({
      userId: admin.uid,
      type: 'registration',
      title: 'New registration',
      message: `${created.fullName} registered as ${created.requestedRole === 'dgl' ? 'a DGL applicant' : 'a participant'}.`
    }));
    return publicProfile(created);
  };

  const logout = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const updateUser = (updates) => {
    if (!user) return;
    commit((current) => ({
      ...current,
      users: current.users.map((item) => item.uid === user.uid ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item)
    }));
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    if (!user) throw new Error('Please sign in again before changing your password.');
    const storedUser = data.users.find((item) => item.uid === user.uid);
    if (!storedUser) throw new Error('Your account could not be found.');
    const currentHash = await hashPassword(currentPassword);
    if (currentHash !== storedUser.passwordHash) throw new Error('Your current password is incorrect.');
    if (newPassword.length < 8) throw new Error('Your new password must contain at least 8 characters.');
    const newPasswordHash = await hashPassword(newPassword);
    if (newPasswordHash === storedUser.passwordHash) throw new Error('Choose a new password that is different from your current password.');
    commit((current) => ({
      ...current,
      users: current.users.map((item) => item.uid === user.uid ? { ...item, passwordHash: newPasswordHash, passwordChangedAt: new Date().toISOString() } : item)
    }));
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser, changePassword }),
    [user, loading, data.users]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
