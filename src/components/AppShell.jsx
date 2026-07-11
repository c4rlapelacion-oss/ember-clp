import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, BookOpenText, CirclePlus, Flame, Home, LayoutDashboard, LogOut, Menu, PieChart, Shield, Users, UserRound, X } from 'lucide-react';
import Brand from './Brand';
import InstallPrompt from './InstallPrompt';
import UserAvatar from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const baseLinks = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/talks', label: 'Talks', icon: BookOpenText },
  { to: '/app/create', label: 'Create', icon: CirclePlus, central: true },
  { to: '/app/group', label: 'My Group', icon: Users },
  { to: '/app/polls', label: 'Polls', icon: PieChart },
  { to: '/app/profile', label: 'Profile', icon: UserRound }
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const { data, commit } = useData();
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notifications = data.notifications.filter((item) => item.userId === user.uid).slice(0, 8);
  const unread = notifications.filter((item) => !item.read).length;
  const completedTalks = data.progress.filter((item) => item.userId === user.uid && item.completed).length;

  const desktopLinks = useMemo(() => {
    const links = [...baseLinks.filter((item) => !item.central && !(user.role === 'admin' && item.label === 'My Group'))];
    if (user.role === 'dgl') links.splice(1, 0, { to: '/app/dgl', label: 'DGL Dashboard', icon: LayoutDashboard });
    if (user.role === 'admin') links.splice(1, 0, { to: '/app/admin', label: 'Admin Dashboard', icon: Shield });
    return links;
  }, [user.role]);

  const mobileLinks = useMemo(() => {
    if (user.role === 'admin') return [
      baseLinks[0], { to: '/app/admin', label: 'Admin', icon: Shield }, baseLinks[2], baseLinks[1], baseLinks[5]
    ];
    if (user.role === 'dgl') return [
      baseLinks[0], { to: '/app/dgl', label: 'DGL', icon: LayoutDashboard }, baseLinks[2], baseLinks[3], baseLinks[5]
    ];
    return baseLinks.filter((item) => ['Home','Talks','Create','My Group','Profile'].includes(item.label));
  }, [user.role]);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const markRead = () => commit((current) => ({ ...current, notifications: current.notifications.map((item) => item.userId === user.uid ? { ...item, read: true } : item) }));

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar--open' : ''}`}>
        <div className="sidebar__top"><Brand light /><button className="icon-button sidebar__close" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={22} /></button></div>
        <nav className="sidebar__nav" aria-label="Main navigation">{desktopLinks.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileMenu(false)}><Icon size={20} /><span>{label}</span></NavLink>)}</nav>
        <div className="sidebar__journey"><div className="sidebar__journey-heading"><Flame size={17} /><strong>Your CLP Journey</strong></div><div className="progress-track"><span style={{ width: `${completedTalks / 8 * 100}%` }} /></div><small>{completedTalks} of 8 talks completed</small></div>
        <button className="sidebar__logout" onClick={handleLogout}><LogOut size={19} /> Sign out</button>
      </aside>
      {mobileMenu && <button className="sidebar-backdrop" onClick={() => setMobileMenu(false)} aria-label="Close menu" />}
      <section className="app-stage">
        <header className="topbar"><button className="icon-button topbar__menu" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={23} /></button><div className="topbar__mobile-brand"><Brand compact /></div><div className="topbar__greeting"><span>Welcome back,</span><strong>{user.fullName.split(' ')[0]}!</strong></div><div className="topbar__actions"><div className="notification-wrap"><button className="icon-button icon-button--notification" onClick={() => setNotificationOpen((value) => !value)} aria-label="Notifications"><Bell size={21} />{unread > 0 && <span />}</button>{notificationOpen && <div className="notification-panel"><div><strong>Notifications</strong><button className="text-button" onClick={markRead}>Mark all read</button></div>{notifications.length ? notifications.map((item) => <article key={item.id} className={item.read ? '' : 'unread'}><strong>{item.title}</strong><span>{item.message}</span></article>) : <p>No notifications yet.</p>}</div>}</div><div className="user-pill"><UserAvatar user={user} /><div><strong>{user.fullName}</strong><span>{user.role === 'dgl' ? 'Discussion Group Leader' : user.role === 'admin' ? 'Team Leader' : 'Participant'}</span></div></div></div></header>
        <main className="app-main"><Outlet /></main>
      </section>
      <nav className="bottom-nav" aria-label="Mobile navigation">{mobileLinks.map(({ to, label, icon: Icon, end, central }) => <NavLink key={to} to={to} end={end} className={central ? 'bottom-nav__create' : ''}><Icon size={central ? 27 : 22} /><span>{label}</span></NavLink>)}</nav>
      <InstallPrompt />
    </div>
  );
}
