import {
  ArrowLeft, BookMarked, CalendarDays, CheckCircle2, Circle, ExternalLink,
  FileText, MapPin, MessageSquareText, RotateCcw, Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { formatDateTime, groupForUser } from '../utils/app';
import { makeId } from '../utils/security';

export default function TalkDetailPage() {
  const { talkId } = useParams();
  const { user } = useAuth();
  const { data, commit } = useData();
  const talk = data.talks.find((item) => item.id === talkId);
  const group = groupForUser(user, data.groups);
  const progress = data.progress.find((item) => item.userId === user.uid && item.talkId === talkId);
  const attendance = data.attendance.find((item) => item.userId === user.uid && item.talkId === talkId);
  const [draft, setDraft] = useState(progress?.privateDraft || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(progress?.privateDraft || ''), [talkId, progress?.privateDraft]);

  if (!talk || (talk.status !== 'published' && user.role === 'participant')) {
    return <Navigate to="/app/talks" replace />;
  }

  const updateProgress = (updates) => commit((current) => {
    const currentProgress = current.progress.find((item) => item.userId === user.uid && item.talkId === talk.id);
    const record = {
      id: currentProgress?.id || makeId('progress'),
      userId: user.uid,
      talkId: talk.id,
      reflectionSubmitted: false,
      challengeCompleted: false,
      completed: false,
      ...currentProgress,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return {
      ...current,
      progress: [
        ...current.progress.filter((item) => !(item.userId === user.uid && item.talkId === talk.id)),
        record
      ]
    };
  });

  const saveDraft = () => {
    updateProgress({ privateDraft: draft });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const toggleComplete = () => {
    const completed = !progress?.completed;
    updateProgress({
      completed,
      completedAt: completed ? new Date().toISOString() : null,
      completedBy: completed ? user.uid : null
    });
  };

  const materials = data.materials.filter(
    (item) => item.talkId === talk.id && (!item.groupId || item.groupId === group?.id)
  );

  return (
    <div className="page-stack">
      <Link to="/app/talks" className="back-link"><ArrowLeft size={17} /> Back to all talks</Link>

      <section className={`talk-hero talk-card--${talk.accent}`}>
        <div className="talk-hero__number">{String(talk.number).padStart(2, '0')}</div>
        <div className="talk-hero__copy">
          <span>MODULE {talk.module} · TALK {talk.number}</span>
          <h1>{talk.title}</h1>
          <p>{talk.description}</p>
          <div>
            <span><CalendarDays /> {talk.schedule ? formatDateTime(talk.schedule) : 'Schedule to be announced'}</span>
            <span><MapPin /> {talk.venue || 'Venue to be announced'}</span>
          </div>
          {talk.speaker && <small className="speaker-line">Speaker: {talk.speaker}</small>}
        </div>
        <div className="talk-hero__badge"><BookMarked size={34} /><span>{talk.status === 'published' ? 'Talk available' : 'Leader preview'}</span></div>
      </section>

      <section className={`talk-completion-panel ${progress?.completed ? 'is-complete' : ''}`}>
        <div className="talk-completion-panel__icon">
          {progress?.completed ? <CheckCircle2 /> : <Circle />}
        </div>
        <div className="talk-completion-panel__copy">
          <span>YOUR CLP JOURNEY</span>
          <h2>{progress?.completed ? `Talk ${talk.number} is completed` : `Ready to complete Talk ${talk.number}?`}</h2>
          <p>
            {progress?.completed
              ? 'This talk is already counted in your personal CLP progress. You can undo it if it was marked by mistake.'
              : 'After attending or reviewing the session, use the button to count this talk in your personal progress.'}
          </p>
          <div className="talk-completion-checks">
            <span className={attendance ? 'done' : ''}><CheckCircle2 /> Attendance {attendance ? attendance.status : 'not recorded'}</span>
            <span className={progress?.reflectionSubmitted ? 'done' : ''}><MessageSquareText /> Reflection {progress?.reflectionSubmitted ? 'shared' : 'optional'}</span>
            <span className={progress?.challengeCompleted ? 'done' : ''}><Sparkles /> Weekly challenge {progress?.challengeCompleted ? 'completed' : 'optional'}</span>
          </div>
        </div>
        <button
          type="button"
          className={`button button--large talk-completion-button ${progress?.completed ? 'button--soft' : ''}`}
          onClick={toggleComplete}
          aria-pressed={Boolean(progress?.completed)}
        >
          {progress?.completed ? <><RotateCcw size={19} /> Mark as not completed</> : <><CheckCircle2 size={19} /> Mark Talk {talk.number} complete</>}
        </button>
      </section>

      <div className="detail-layout">
        <section className="detail-main">
          <article className="content-card">
            <div className="content-card__heading"><div><span>ABOUT THIS TALK</span><h2>What you will discover</h2></div><BookMarked /></div>
            <p>{talk.description} This session combines the main teaching, personal reflection, small-group discussion, and a practical response for the coming week.</p>
            <div className="scripture-box"><span>KEY SCRIPTURE</span><strong>{talk.scripture}</strong></div>
            {attendance && <div className="form-alert"><CheckCircle2 size={18} /> Attendance: <strong>{attendance.status}</strong></div>}
          </article>

          <article className="content-card">
            <div className="content-card__heading"><div><span>PRIVATE REFLECTION DRAFT</span><h2>Pause and listen</h2></div><MessageSquareText /></div>
            <p className="reflection-question">{talk.reflectionPrompt}</p>
            <textarea rows="7" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a private draft. It remains visible only in this account until you choose to publish a reflection." />
            <div className="content-card__footer">
              <small>{saved ? 'Draft saved.' : 'Save this privately or continue to a shareable reflection.'}</small>
              <div className="button-row">
                <button className="button button--soft" onClick={saveDraft}>Save private draft</button>
                <Link className="button" to={`/app/create?talk=${talk.id}`}>Share reflection</Link>
              </div>
            </div>
          </article>
        </section>

        <aside className="detail-aside">
          <article className="content-card">
            <div className="content-card__heading"><div><span>RESOURCES</span><h3>Talk materials</h3></div></div>
            {materials.length ? (
              <div className="resource-list">
                {materials.map((material) => (
                  <a key={material.id} href={material.url || '#'} target={material.url ? '_blank' : undefined} rel="noreferrer">
                    <span><FileText /><i><strong>{material.title}</strong><small>{material.type}{material.groupId ? ' · Group resource' : ''}</small></i></span><ExternalLink />
                  </a>
                ))}
              </div>
            ) : <div className="empty-inline">No materials have been uploaded for this talk.</div>}
          </article>

          <article className="content-card action-step-card">
            <span>WEEKLY ACTION STEP</span>
            <h3>Carry the talk into daily life.</h3>
            <p>{talk.reflectionPrompt}</p>
            <label>
              <input type="checkbox" checked={Boolean(progress?.challengeCompleted)} onChange={(e) => updateProgress({ challengeCompleted: e.target.checked })} />
              <span><CheckCircle2 /> I completed this challenge</span>
            </label>
          </article>
        </aside>
      </div>

      <div className="mobile-completion-bar">
        <div><small>Talk {talk.number}</small><strong>{progress?.completed ? 'Completed' : 'Not completed'}</strong></div>
        <button type="button" className={`button ${progress?.completed ? 'button--soft' : ''}`} onClick={toggleComplete}>
          {progress?.completed ? <><RotateCcw size={17} /> Undo</> : <><CheckCircle2 size={17} /> Mark complete</>}
        </button>
      </div>
    </div>
  );
}
