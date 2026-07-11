import { ArrowRight, BookOpenText, HeartHandshake, ShieldCheck, UsersRound } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import Brand from '../components/Brand';
import { useAuth } from '../contexts/AuthContext';
import emberIcon from '../assets/ember-icon.png';

export default function LandingPage() {
  const { user } = useAuth();
  if (user) return <Navigate to={user.accountStatus === 'approved' ? '/app' : '/pending'} replace />;

  return (
    <div className="public-page landing-page">
      <header className="public-header container">
        <Brand />
        <nav><a href="#journey">CLP Journey</a><a href="#community">Community</a><Link className="button button--ghost" to="/login">Sign in</Link><Link className="button" to="/register">Join EMBER</Link></nav>
      </header>
      <main>
        <section className="hero container">
          <div className="hero__copy">
            <div className="eyebrow"><span /> Christian Life Program · Tayabas City</div>
            <h1>Let your faith<br /><em>burn brighter.</em></h1>
            <p>EMBER is the private CLP community of Singles for Christ Tayabas City—where every talk, reflection, prayer, and friendship helps your journey grow.</p>
            <div className="hero__actions"><Link className="button button--large" to="/register">Begin your journey <ArrowRight size={19} /></Link><Link className="button button--large button--soft" to="/login">Sign in</Link></div>
            <div className="hero__trust"><ShieldCheck size={20} /><span>A private and moderated community for CLP participants and servants.</span></div>
          </div>
          <div className="hero__visual" aria-label="EMBER application preview">
            <div className="hero-orb hero-orb--one" /><div className="hero-orb hero-orb--two" />
            <div className="phone-mockup"><div className="phone-mockup__screen">
              <div className="phone-mockup__top"><img src={emberIcon} alt="" /><div><strong>Welcome to EMBER</strong><span>Your CLP journey in one place.</span></div></div>
              <div className="mini-progress"><div><span>Your CLP Journey</span><strong>0 / 8 talks</strong></div><div className="progress-track"><i style={{ width: '0%' }} /></div></div>
              <div className="mini-card mini-card--talk"><small>CHRISTIAN LIFE PROGRAM</small><strong>Eight talks. One transformed life.</strong><span>Learn · Reflect · Share · Grow</span></div>
              <div className="mini-card"><div className="mini-person"><b>EM</b><span><strong>Your private community</strong><small>Participants · DGLs · Team Leaders</small></span></div><p>Share reflections and encourage one another in faith.</p><div className="mini-reactions">Love · Amen · Praying · Inspired</div></div>
            </div></div>
          </div>
        </section>
        <section id="community" className="feature-strip"><div className="container feature-grid">
          <article><div><BookOpenText /></div><strong>Eight guided talks</strong><span>Follow the complete CLP journey in one place.</span></article>
          <article><div><UsersRound /></div><strong>Private discussion groups</strong><span>Connect with your DGL and fellow participants.</span></article>
          <article><div><HeartHandshake /></div><strong>Faith-filled community</strong><span>Share reflections, prayer requests, and testimonies.</span></article>
        </div></section>
        <section id="journey" className="landing-journey container"><div className="section-heading section-heading--center"><span>THE EMBER JOURNEY</span><h2>Eight talks. One transformed life.</h2><p>Move from discovering God’s love to living a Spirit-filled life of discipleship and service.</p></div><div className="journey-line">{[1,2,3,4,5,6,7,8].map((number) => <span key={number}>{number}</span>)}</div></section>
      </main>
      <footer className="public-footer"><div className="container"><Brand light /><span>Singles for Christ · Tayabas City</span></div></footer>
    </div>
  );
}
