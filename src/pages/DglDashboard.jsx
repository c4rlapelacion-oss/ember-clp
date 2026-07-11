import {
  BarChart3, BellPlus, Check, CheckCircle2, ClipboardCheck, FileText, MessageSquareText,
  Plus, Save, Trash2, UserCheck, UsersRound, X
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import UserAvatar from '../components/UserAvatar';
import { formatDateTime, groupForUser } from '../utils/app';
import { makeGroupCode, makeId } from '../utils/security';

const tabs = ['Overview', 'Join Requests', 'Attendance', 'CLP Progress', 'Announcements', 'Materials'];

export default function DglDashboard() {
  const { user } = useAuth();
  const { data, commit, addNotification, addAuditLog } = useData();
  const [activeTab, setActiveTab] = useState('Overview');
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [selectedTalk, setSelectedTalk] = useState(data.talks[0]?.id || 'talk-1');
  const [announcement, setAnnouncement] = useState({ content: '', talkId: '' });
  const [material, setMaterial] = useState({ talkId: data.talks[0]?.id || 'talk-1', title: '', type: 'Link', url: '' });
  const [message, setMessage] = useState('');
  const group = groupForUser(user, data.groups);

  const members = data.users.filter((item) => item.groupId === group?.id && item.accountStatus === 'approved');
  const participants = members.filter((item) => item.role === 'participant');
  const requests = data.joinRequests.filter((item) => item.groupId === group?.id && item.status === 'pending');
  const groupPosts = data.posts.filter((item) => item.groupId === group?.id);
  const reflections = groupPosts.filter((item) => item.type === 'Reflection');
  const attendanceForTalk = data.attendance.filter((item) => item.talkId === selectedTalk && participants.some((member) => member.uid === item.userId));
  const attendanceRate = attendanceForTalk.length ? Math.round(attendanceForTalk.filter((item) => ['present', 'late'].includes(item.status)).length / participants.length * 100) : 0;
  const notify = (text) => { setMessage(text); setTimeout(() => setMessage(''), 2200); };

  const createGroup = (event) => {
    event.preventDefault();
    if (!groupForm.name.trim()) return;
    const created = {
      id: makeId('group'), name: groupForm.name.trim(), description: groupForm.description.trim(),
      code: makeGroupCode(groupForm.name), batchId: user.batchId, dglIds: [user.uid], createdBy: user.uid,
      status: 'active', createdAt: new Date().toISOString()
    };
    commit((current) => ({
      ...current,
      groups: [...current.groups, created],
      users: current.users.map((item) => item.uid === user.uid ? { ...item, groupId: created.id } : item)
    }));
    addAuditLog('DGL created group', user.uid, created.name);
    setGroupForm({ name: '', description: '' });
  };

  const decideRequest = (request, approved) => {
    const applicant = data.users.find((item) => item.uid === request.userId);
    commit((current) => ({
      ...current,
      joinRequests: current.joinRequests.map((item) => item.id === request.id ? { ...item, status: approved ? 'approved' : 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: user.uid } : item),
      users: approved ? current.users.map((item) => item.uid === request.userId ? { ...item, groupId: request.groupId } : item) : current.users
    }));
    addNotification({ userId: request.userId, title: approved ? 'Group request approved' : 'Group request declined', message: approved ? `Welcome to ${group.name}.` : `Your request to join ${group.name} was declined.` });
    addAuditLog(approved ? 'Approved join request' : 'Rejected join request', user.uid, applicant?.fullName || request.userId);
  };

  const setAttendance = (memberId, status) => {
    commit((current) => {
      const existing = current.attendance.find((item) => item.userId === memberId && item.talkId === selectedTalk);
      const record = { id: existing?.id || makeId('attendance'), userId: memberId, talkId: selectedTalk, groupId: group.id, status, recordedBy: user.uid, updatedAt: new Date().toISOString() };
      return { ...current, attendance: [...current.attendance.filter((item) => !(item.userId === memberId && item.talkId === selectedTalk)), record] };
    });
  };

  const setTalkCompletion = (memberId, completed) => {
    commit((current) => {
      const existing = current.progress.find((item) => item.userId === memberId && item.talkId === selectedTalk);
      const record = {
        id: existing?.id || makeId('progress'),
        userId: memberId,
        talkId: selectedTalk,
        reflectionSubmitted: false,
        challengeCompleted: false,
        ...existing,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
        completedBy: completed ? user.uid : null,
        updatedAt: new Date().toISOString()
      };
      return { ...current, progress: [...current.progress.filter((item) => !(item.userId === memberId && item.talkId === selectedTalk)), record] };
    });
    const member = data.users.find((item) => item.uid === memberId);
    const talk = data.talks.find((item) => item.id === selectedTalk);
    addAuditLog(completed ? 'Marked participant talk complete' : 'Reopened participant talk', user.uid, `${member?.fullName || memberId} · ${talk?.title || selectedTalk}`);
    notify(`${member?.fullName || 'Participant'} is now ${completed ? 'completed' : 'not completed'} for this talk.`);
  };

  const publishAnnouncement = (event) => {
    event.preventDefault();
    if (!announcement.content.trim()) return;
    const talk = data.talks.find((item) => item.id === announcement.talkId);
    const post = {
      id: makeId('post'), authorId: user.uid, groupId: group.id, batchId: user.batchId, type: 'Announcement',
      talkId: announcement.talkId || null, talkTitle: talk ? `Talk ${talk.number} · ${talk.title}` : '', visibility: 'group',
      visibilityLabel: 'My Group', content: announcement.content.trim(), imageData: '', createdAt: new Date().toISOString(), pinned: true
    };
    commit((current) => ({ ...current, posts: [post, ...current.posts] }));
    participants.forEach((member) => addNotification({ userId: member.uid, title: 'New group announcement', message: announcement.content.trim().slice(0, 90) }));
    setAnnouncement({ content: '', talkId: '' }); notify('Announcement published.');
  };

  const addMaterial = (event) => {
    event.preventDefault();
    if (!material.title.trim()) return;
    const created = { id: makeId('material'), ...material, title: material.title.trim(), audience: 'group', groupId: group.id, uploadedBy: user.uid, createdAt: new Date().toISOString() };
    commit((current) => ({ ...current, materials: [created, ...current.materials] }));
    participants.forEach((member) => addNotification({ userId: member.uid, title: 'New group material', message: material.title.trim() }));
    setMaterial({ talkId: data.talks[0]?.id || 'talk-1', title: '', type: 'Link', url: '' }); notify('Material added.');
  };

  const removeMember = (member) => {
    if (!confirm(`Remove ${member.fullName} from ${group.name}?\n\nTheir EMBER account will remain active, but they will no longer belong to this discussion group.`)) return;
    commit((current) => ({ ...current, users: current.users.map((item) => item.uid === member.uid ? { ...item, groupId: null } : item) }));
    addNotification({ userId: member.uid, title: 'Group membership changed', message: `You were removed from ${group.name}.` });
    addAuditLog('Removed participant from group', user.uid, `${member.fullName} from ${group.name}`);
    notify(`${member.fullName} was removed from the group.`);
  };

  if (!group) return <div className="page-stack"><header className="page-heading"><div><span>DISCUSSION GROUP LEADER</span><h1>Create your discussion group</h1><p>Your DGL account is approved. Create a group now, or wait for a Team Leader to assign you to an existing one.</p></div></header><form className="content-card dgl-create-group" onSubmit={createGroup}><label><span>Group name</span><input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="Enter group name" required /></label><label><span>Description</span><textarea rows="4" value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} placeholder="Describe the spirit and purpose of your group." /></label><button className="button"><Plus size={18} /> Create discussion group</button></form></div>;

  return (
    <div className="page-stack dgl-console">
      <header className="page-heading"><div><span>DISCUSSION GROUP LEADER</span><h1>{group.name} dashboard</h1><p>Manage your members, attendance, announcements, and group resources.</p></div><Link className="button" to="/app/create"><BellPlus size={18} /> Create post</Link></header>
      {message && <div className="toast-message"><Check size={18} /> {message}</div>}
      <section className="metric-grid">
        <Metric label="Active participants" value={participants.length} detail={`${requests.length} pending join requests`} icon={UsersRound} />
        <Metric label="Selected talk attendance" value={`${attendanceRate}%`} detail={`${attendanceForTalk.length} of ${participants.length} recorded`} icon={ClipboardCheck} />
        <Metric label="Reflections submitted" value={reflections.length} detail="Across all talks" icon={MessageSquareText} />
        <Metric label="Group posts" value={groupPosts.length} detail={`${data.comments.filter((item) => groupPosts.some((post) => post.id === item.postId)).length} comments`} icon={BarChart3} />
      </section>
      <div className="admin-tabs">{tabs.map((tab) => <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>

      {activeTab === 'Overview' && <div className="admin-layout"><section className="content-card"><Heading kicker="YOUR PEOPLE" title="Group members" right={<span className="chip">Code: {group.code}</span>} />{members.length ? <div className="management-list">{members.map((member) => <article key={member.uid} className="management-row"><UserAvatar user={member} /><div className="management-row__main"><strong>{member.fullName}</strong><span>{member.role === 'dgl' ? 'Discussion Group Leader' : 'Participant'}</span><small>{member.email}</small></div>{member.uid !== user.uid && member.role === 'participant' && <button type="button" className="button button--small danger-button member-remove-button" onClick={() => removeMember(member)} title={`Remove ${member.fullName} from this group`}><Trash2 size={16} /> Remove from group</button>}</article>)}</div> : <Empty text="No participants are assigned yet. Share the group code so they can request to join." />}</section><aside className="admin-rail"><article className="content-card"><Heading kicker="GROUP INFORMATION" title="Join code" /><div className="large-code">{group.code}</div><p>Participants enter this code on their My Group page. You must approve each request.</p></article><article className="content-card"><Heading kicker="RECENT REFLECTIONS" title="Participant sharing" />{reflections.slice(0, 4).map((post) => <div className="reflection-preview" key={post.id}><strong>{data.users.find((item) => item.uid === post.authorId)?.fullName}</strong><p>{post.content}</p></div>)}{!reflections.length && <Empty text="No reflections have been submitted." />}</article></aside></div>}

      {activeTab === 'Join Requests' && <section className="content-card"><Heading kicker="MEMBERSHIP" title="Pending group requests" right={<span className="chip chip--ember">{requests.length} waiting</span>} />{requests.length ? <div className="management-list">{requests.map((request) => { const applicant = data.users.find((item) => item.uid === request.userId); return <article key={request.id} className="management-row"><UserAvatar user={applicant} /><div className="management-row__main"><strong>{applicant?.fullName}</strong><span>{applicant?.email}</span><small>Requested {formatDateTime(request.createdAt)}</small></div><button className="button button--small" onClick={() => decideRequest(request, true)}><UserCheck size={16} /> Approve</button><button className="icon-button danger" onClick={() => decideRequest(request, false)}><X size={18} /></button></article>; })}</div> : <Empty text="No participants are waiting to join." />}</section>}

      {activeTab === 'Attendance' && <section className="content-card"><Heading kicker="TALK ATTENDANCE" title="Record participant attendance" right={<select value={selectedTalk} onChange={(e) => setSelectedTalk(e.target.value)}>{data.talks.map((talk) => <option key={talk.id} value={talk.id}>Talk {talk.number}: {talk.title}</option>)}</select>} />{participants.length ? <div className="attendance-list">{participants.map((member) => { const record = data.attendance.find((item) => item.userId === member.uid && item.talkId === selectedTalk); return <article key={member.uid}><UserAvatar user={member} /><div><strong>{member.fullName}</strong><span>{record ? `Last updated ${formatDateTime(record.updatedAt)}` : 'Not yet recorded'}</span></div><select value={record?.status || 'not-recorded'} onChange={(e) => setAttendance(member.uid, e.target.value)}><option value="not-recorded">Not yet recorded</option><option value="present">Present</option><option value="late">Late</option><option value="excused">Excused</option><option value="absent">Absent</option></select></article>; })}</div> : <Empty text="Add participants to your group before recording attendance." />}</section>}


      {activeTab === 'CLP Progress' && <section className="content-card"><Heading kicker="PARTICIPANT JOURNEY" title="Mark talks completed" right={<select value={selectedTalk} onChange={(e) => setSelectedTalk(e.target.value)}>{data.talks.map((talk) => <option key={talk.id} value={talk.id}>Talk {talk.number}: {talk.title}</option>)}</select>} /><div className="completion-manager-note"><CheckCircle2 /><div><strong>Completion is separate from attendance.</strong><span>Use the switch below after the Participant has attended or otherwise fulfilled your group’s completion requirement.</span></div></div>{participants.length ? <div className="progress-management-list">{participants.map((member) => { const record = data.progress.find((item) => item.userId === member.uid && item.talkId === selectedTalk); const attendanceRecord = data.attendance.find((item) => item.userId === member.uid && item.talkId === selectedTalk); return <article key={member.uid} className={record?.completed ? 'is-complete' : ''}><UserAvatar user={member} /><div className="progress-management-list__main"><strong>{member.fullName}</strong><span>Attendance: {attendanceRecord?.status || 'not recorded'} · Reflection: {record?.reflectionSubmitted ? 'submitted' : 'not submitted'}</span></div><label className="completion-switch"><input type="checkbox" checked={Boolean(record?.completed)} onChange={(e) => setTalkCompletion(member.uid, e.target.checked)} /><span>{record?.completed ? 'Completed' : 'Mark complete'}</span></label></article>; })}</div> : <Empty text="Add participants to your group before managing progress." />}</section>}

      {activeTab === 'Announcements' && <div className="admin-layout"><section className="content-card"><Heading kicker="GROUP COMMUNICATION" title="Post an announcement" /><form className="dgl-form" onSubmit={publishAnnouncement}><label><span>Connect to a talk (optional)</span><select value={announcement.talkId} onChange={(e) => setAnnouncement({ ...announcement, talkId: e.target.value })}><option value="">General announcement</option>{data.talks.map((talk) => <option key={talk.id} value={talk.id}>Talk {talk.number}: {talk.title}</option>)}</select></label><label><span>Announcement</span><textarea rows="6" value={announcement.content} onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })} required /></label><button className="button"><BellPlus size={17} /> Publish to group</button></form></section><aside className="admin-rail"><article className="content-card"><Heading kicker="PUBLISHED" title="Group announcements" />{groupPosts.filter((item) => item.type === 'Announcement').map((post) => <div className="resource-admin-list" key={post.id}><div><span><strong>{post.content}</strong><small>{formatDateTime(post.createdAt)}</small></span><button className="icon-button danger" onClick={() => commit((current) => ({ ...current, posts: current.posts.filter((item) => item.id !== post.id) }))}><Trash2 size={16} /></button></div></div>)}{!groupPosts.some((item) => item.type === 'Announcement') && <Empty text="No group announcements yet." />}</article></aside></div>}

      {activeTab === 'Materials' && <section className="content-card"><Heading kicker="FACILITATOR RESOURCES" title="Share group materials" /><form className="inline-admin-form" onSubmit={addMaterial}><select value={material.talkId} onChange={(e) => setMaterial({ ...material, talkId: e.target.value })}>{data.talks.map((talk) => <option key={talk.id} value={talk.id}>Talk {talk.number}: {talk.title}</option>)}</select><input placeholder="Material title" value={material.title} onChange={(e) => setMaterial({ ...material, title: e.target.value })} required /><select value={material.type} onChange={(e) => setMaterial({ ...material, type: e.target.value })}><option>Link</option><option>PDF</option><option>Video</option><option>Guide</option></select><input type="url" placeholder="https://..." value={material.url} onChange={(e) => setMaterial({ ...material, url: e.target.value })} /><button className="button"><Plus size={17} /> Add</button></form><div className="resource-admin-list">{data.materials.filter((item) => item.groupId === group.id).map((item) => <div key={item.id}><span><strong>{item.title}</strong><small>{data.talks.find((talk) => talk.id === item.talkId)?.title} · {item.type}</small></span>{item.url && <a href={item.url} target="_blank" rel="noreferrer">Open</a>}<button className="icon-button danger" onClick={() => commit((current) => ({ ...current, materials: current.materials.filter((materialItem) => materialItem.id !== item.id) }))}><Trash2 size={17} /></button></div>)}</div>{!data.materials.some((item) => item.groupId === group.id) && <Empty text="No group materials have been added." />}</section>}
    </div>
  );
}

function Metric({ label, value, detail, icon: Icon }) { return <article className="metric-card"><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div><i><Icon /></i></article>; }
function Heading({ kicker, title, right }) { return <div className="content-card__heading"><div><span>{kicker}</span><h2>{title}</h2></div>{right}</div>; }
function Empty({ text }) { return <div className="empty-inline">{text}</div>; }
