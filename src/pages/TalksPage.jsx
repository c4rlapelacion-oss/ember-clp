import { BookOpen, CheckCircle2, ChevronRight, Clock3, LockKeyhole, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { formatDateTime } from '../utils/app';
import { makeId } from '../utils/security';

function TalkStatus({ talk, complete }) {
  if (complete) return <span className="talk-status talk-status--available"><CheckCircle2 size={14} /> Completed</span>;
  if (talk.status === 'published') return <span className="talk-status talk-status--available"><CheckCircle2 size={14} /> Available</span>;
  if (talk.status === 'draft') return <span className="talk-status talk-status--upcoming"><Clock3 size={14} /> Draft</span>;
  return <span className="talk-status"><LockKeyhole size={14} /> Locked</span>;
}

export default function TalksPage() {
  const { user } = useAuth();
  const { data, commit } = useData();
  const completed = data.progress.filter((item) => item.userId === user.uid && item.completed).length;
  const visibleTalks = data.talks.filter((talk) => user.role === 'admin' || talk.status === 'published' || user.role === 'dgl');

  const toggleComplete = (talkId) => commit((current) => {
    const existing = current.progress.find((item) => item.userId === user.uid && item.talkId === talkId);
    const completedNow = !existing?.completed;
    const record = {
      id: existing?.id || makeId('progress'),
      userId: user.uid,
      talkId,
      reflectionSubmitted: false,
      challengeCompleted: false,
      ...existing,
      completed: completedNow,
      completedAt: completedNow ? new Date().toISOString() : null,
      completedBy: completedNow ? user.uid : null,
      updatedAt: new Date().toISOString()
    };
    return {
      ...current,
      progress: [...current.progress.filter((item) => !(item.userId === user.uid && item.talkId === talkId)), record]
    };
  });

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <span>MY CLP JOURNEY</span>
          <h1>The eight talks</h1>
          <p>Open a talk to read the materials, write a reflection, and clearly mark it completed.</p>
        </div>
        <div className="journey-summary">
          <strong>{Math.round(completed / 8 * 100)}%</strong>
          <span>{completed} of 8 talks completed</span>
          <div className="progress-track"><i style={{ width: `${completed / 8 * 100}%` }} /></div>
        </div>
      </header>

      <div className="completion-help-card">
        <CheckCircle2 />
        <div><strong>How completion works</strong><span>Use the “Mark complete” button on any available talk. Team Leaders and DGLs can also update a Participant’s progress from their dashboards.</span></div>
      </div>

      {[1, 2].map((moduleNumber) => {
        const moduleTalks = visibleTalks.filter((talk) => talk.module === moduleNumber);
        if (!moduleTalks.length) return null;
        return (
          <section key={moduleNumber} className="module-section">
            <div className="module-heading">
              <span>MODULE {moduleNumber}</span>
              <div>
                <h2>{moduleTalks[0].moduleTitle}</h2>
                <p>{moduleNumber === 1 ? 'Discover the central truths of God’s love, Jesus Christ, and the call to repentance and faith.' : 'Learn how the Holy Spirit shapes our relationships, families, habits, and mission.'}</p>
              </div>
            </div>
            <div className="talk-grid">
              {moduleTalks.map((talk) => {
                const progress = data.progress.find((item) => item.userId === user.uid && item.talkId === talk.id);
                const open = talk.status === 'published' || user.role !== 'participant';
                return (
                  <article key={talk.id} className={`talk-card talk-card--${talk.accent} ${!open ? 'talk-card--locked' : ''} ${progress?.completed ? 'talk-card--completed' : ''}`}>
                    <div className="talk-card__number">{String(talk.number).padStart(2, '0')}</div>
                    <div className="talk-card__icon"><BookOpen /></div>
                    <TalkStatus talk={talk} complete={progress?.completed} />
                    <small>TALK {talk.number}</small>
                    <h3>{talk.title}</h3>
                    <p>{talk.description}</p>
                    <span className="talk-card__schedule">{talk.schedule ? formatDateTime(talk.schedule) : 'Schedule to be announced'}</span>
                    {open ? (
                      <div className="talk-card__actions">
                        <Link to={`/app/talks/${talk.id}`}>Open talk <ChevronRight size={17} /></Link>
                        <button
                          type="button"
                          className={`talk-card__complete ${progress?.completed ? 'is-complete' : ''}`}
                          onClick={() => toggleComplete(talk.id)}
                          aria-pressed={Boolean(progress?.completed)}
                        >
                          {progress?.completed ? <><RotateCcw size={16} /> Undo completion</> : <><CheckCircle2 size={16} /> Mark complete</>}
                        </button>
                      </div>
                    ) : <button disabled>Not yet published</button>}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
