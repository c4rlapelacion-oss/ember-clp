import {
  BarChart3, BookOpenText, Check, CheckCircle2, CircleAlert, Clock3, Download, FileDown,
  Flame, Plus, RefreshCcw, Save, ShieldCheck, Trash2, UserCheck, UserPlus,
  UsersRound, X
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import UserAvatar from '../components/UserAvatar';
import { downloadCsv, formatDateTime } from '../utils/app';
import { makeGroupCode, makeId } from '../utils/security';

const tabs = ['Overview', 'Registrations', 'Groups', 'Talks & Materials', 'CLP Progress', 'Events', 'Moderation', 'Reports', 'Settings'];
const blankGroup = { name: '', description: '', dglId: '' };
const blankMaterial = { talkId: 'talk-1', title: '', type: 'Link', url: '' };
const blankEvent = { title: '', schedule: '', venue: '', description: '' };

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { data, commit, addNotification, addAuditLog, resetAllData, exportBackup } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedProgressTalk, setSelectedProgressTalk] = useState(data.talks[0]?.id || 'talk-1');
  const [groupForm, setGroupForm] = useState(blankGroup);
  const [materialForm, setMaterialForm] = useState(blankMaterial);
  const [eventForm, setEventForm] = useState(blankEvent);
  const [message, setMessage] = useState('');

  const pending = data.users.filter((item) => item.accountStatus === 'pending');
  const approvedParticipants = data.users.filter((item) => item.role === 'participant' && item.accountStatus === 'approved');
  const approvedDgls = data.users.filter((item) => item.role === 'dgl' && item.accountStatus === 'approved');
  const openReports = data.contentReports.filter((item) => item.status === 'open');
  const attendanceRate = useMemo(() => {
    const records = data.attendance.filter((item) => ['present', 'late', 'excused', 'absent'].includes(item.status));
    if (!records.length) return 0;
    return Math.round(records.filter((item) => ['present', 'late'].includes(item.status)).length / records.length * 100);
  }, [data.attendance]);

  const notify = (text) => { setMessage(text); setTimeout(() => setMessage(''), 2200); };

  const approve = (applicant, groupId = '') => {
    const role = applicant.requestedRole === 'dgl' ? 'dgl' : 'participant';
    commit((current) => ({
      ...current,
      users: current.users.map((item) => item.uid === applicant.uid ? {
        ...item, role, accountStatus: 'approved', groupId: groupId || item.groupId || null, approvedAt: new Date().toISOString()
      } : item),
      groups: groupId && role === 'dgl' ? current.groups.map((group) => group.id === groupId ? { ...group, dglIds: [...new Set([...(group.dglIds || []), applicant.uid])] } : group) : current.groups
    }));
    addNotification({ userId: applicant.uid, title: 'Registration approved', message: `Your ${role === 'dgl' ? 'DGL' : 'participant'} account is now active.` });
    addAuditLog('Approved registration', user.uid, `${applicant.fullName} as ${role}`);
    notify(`${applicant.fullName} was approved.`);
  };

  const reject = (applicant) => {
    if (!confirm(`Reject ${applicant.fullName}'s registration?`)) return;
    commit((current) => ({ ...current, users: current.users.map((item) => item.uid === applicant.uid ? { ...item, accountStatus: 'rejected', rejectedAt: new Date().toISOString() } : item) }));
    addAuditLog('Rejected registration', user.uid, applicant.fullName);
  };

  const changeStatus = (member, accountStatus) => {
    commit((current) => ({ ...current, users: current.users.map((item) => item.uid === member.uid ? { ...item, accountStatus } : item) }));
    addNotification({ userId: member.uid, title: 'Account status changed', message: `Your EMBER account is now ${accountStatus}.` });
    addAuditLog('Changed account status', user.uid, `${member.fullName}: ${accountStatus}`);
  };

  const deleteMember = (member) => {
    if (!member || member.uid === 'admin-teamleader' || member.role === 'admin') return;
    const confirmed = confirm(
      `Permanently delete ${member.fullName}?\n\nThis removes the account, group assignment, posts, comments, reactions, attendance, progress, poll responses, notifications, and related records. This action cannot be undone.`
    );
    if (!confirmed) return;

    commit((current) => {
      const authoredPostIds = new Set(
        current.posts.filter((post) => post.authorId === member.uid).map((post) => post.id)
      );
      const createdPollIds = new Set(
        current.polls.filter((poll) => poll.creatorId === member.uid).map((poll) => poll.id)
      );

      return {
        ...current,
        users: current.users.filter((item) => item.uid !== member.uid),
        groups: current.groups.map((group) => ({
          ...group,
          dglIds: (group.dglIds || []).filter((id) => id !== member.uid)
        })),
        joinRequests: current.joinRequests.filter((item) => item.userId !== member.uid),
        posts: current.posts.filter((post) => post.authorId !== member.uid),
        comments: current.comments.filter((comment) => comment.userId !== member.uid && !authoredPostIds.has(comment.postId)),
        reactions: current.reactions.filter((reaction) => reaction.userId !== member.uid && !authoredPostIds.has(reaction.postId)),
        savedPosts: current.savedPosts.filter((saved) => saved.userId !== member.uid && !authoredPostIds.has(saved.postId)),
        polls: current.polls.filter((poll) => poll.creatorId !== member.uid),
        pollResponses: current.pollResponses.filter((response) => response.userId !== member.uid && !createdPollIds.has(response.pollId)),
        attendance: current.attendance.filter((record) => record.userId !== member.uid),
        progress: current.progress.filter((record) => record.userId !== member.uid),
        materials: current.materials.filter((material) => material.uploadedBy !== member.uid),
        eventResponses: current.eventResponses.filter((response) => response.userId !== member.uid),
        notifications: current.notifications.filter((notification) => notification.userId !== member.uid),
        contentReports: current.contentReports.filter((report) => report.reportedBy !== member.uid && !authoredPostIds.has(report.postId))
      };
    });

    addAuditLog('Permanently deleted member', user.uid, `${member.fullName} (${member.email})`);
    notify(`${member.fullName} was permanently deleted.`);
  };

  const setParticipantProgress = (memberId, completed) => {
    commit((current) => {
      const existing = current.progress.find((item) => item.userId === memberId && item.talkId === selectedProgressTalk);
      const record = {
        id: existing?.id || makeId('progress'),
        userId: memberId,
        talkId: selectedProgressTalk,
        reflectionSubmitted: false,
        challengeCompleted: false,
        ...existing,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
        completedBy: completed ? user.uid : null,
        updatedAt: new Date().toISOString()
      };
      return { ...current, progress: [...current.progress.filter((item) => !(item.userId === memberId && item.talkId === selectedProgressTalk)), record] };
    });
    const member = data.users.find((item) => item.uid === memberId);
    const talk = data.talks.find((item) => item.id === selectedProgressTalk);
    addAuditLog(completed ? 'Marked participant talk complete' : 'Reopened participant talk', user.uid, `${member?.fullName || memberId} · ${talk?.title || selectedProgressTalk}`);
    notify(`${member?.fullName || 'Participant'} is now ${completed ? 'completed' : 'not completed'} for this talk.`);
  };

  const createGroup = (event) => {
    event.preventDefault();
    if (!groupForm.name.trim()) return;
    const group = {
      id: makeId('group'), name: groupForm.name.trim(), description: groupForm.description.trim(),
      code: makeGroupCode(groupForm.name), batchId: 'tayabas-clp', dglIds: groupForm.dglId ? [groupForm.dglId] : [],
      createdBy: user.uid, status: 'active', createdAt: new Date().toISOString()
    };
    commit((current) => ({
      ...current,
      groups: [...current.groups, group],
      users: current.users.map((item) => item.uid === groupForm.dglId ? { ...item, groupId: group.id } : item)
    }));
    if (groupForm.dglId) addNotification({ userId: groupForm.dglId, title: 'Group assignment', message: `You were assigned to ${group.name}.` });
    addAuditLog('Created group', user.uid, group.name);
    setGroupForm(blankGroup); notify(`${group.name} was created.`);
  };

  const assignGroup = (memberId, groupId) => {
    const member = data.users.find((item) => item.uid === memberId);
    commit((current) => ({
      ...current,
      users: current.users.map((item) => item.uid === memberId ? { ...item, groupId: groupId || null } : item),
      groups: current.groups.map((group) => ({
        ...group,
        dglIds: member?.role === 'dgl'
          ? (group.id === groupId ? [...new Set([...(group.dglIds || []), memberId])] : (group.dglIds || []).filter((id) => id !== memberId))
          : (group.dglIds || [])
      }))
    }));
    if (groupId) {
      const group = data.groups.find((item) => item.id === groupId);
      addNotification({ userId: memberId, title: 'Discussion group assigned', message: `You are now assigned to ${group?.name}.` });
    }
    addAuditLog('Changed group assignment', user.uid, `${member?.fullName || memberId} → ${groupId || 'None'}`);
  };

  const removeGroup = (group) => {
    if (!confirm(`Delete ${group.name}? Members will become unassigned.`)) return;
    commit((current) => ({
      ...current,
      groups: current.groups.filter((item) => item.id !== group.id),
      users: current.users.map((item) => item.groupId === group.id ? { ...item, groupId: null } : item),
      joinRequests: current.joinRequests.filter((item) => item.groupId !== group.id)
    }));
    addAuditLog('Deleted group', user.uid, group.name);
  };

  const saveTalk = (talkId, updates) => {
    commit((current) => ({ ...current, talks: current.talks.map((talk) => talk.id === talkId ? { ...talk, ...updates, updatedAt: new Date().toISOString() } : talk) }));
    addAuditLog('Updated talk', user.uid, talkId); notify('Talk details saved.');
  };

  const addMaterial = (event) => {
    event.preventDefault();
    if (!materialForm.title.trim()) return;
    const material = { id: makeId('material'), ...materialForm, title: materialForm.title.trim(), audience: 'batch', groupId: null, uploadedBy: user.uid, createdAt: new Date().toISOString() };
    commit((current) => ({ ...current, materials: [material, ...current.materials] }));
    setMaterialForm(blankMaterial); notify('Material added.');
  };

  const createEvent = (event) => {
    event.preventDefault();
    if (!eventForm.title.trim()) return;
    const item = { id: makeId('event'), ...eventForm, title: eventForm.title.trim(), batchId: 'tayabas-clp', groupId: null, createdBy: user.uid, createdAt: new Date().toISOString() };
    commit((current) => ({ ...current, events: [...current.events, item] }));
    data.users.filter((item) => item.accountStatus === 'approved' && item.uid !== user.uid).forEach((member) => addNotification({ userId: member.uid, title: 'New event', message: item.title }));
    setEventForm(blankEvent); notify('Event published.');
  };

  const resolveReport = (report, removeContent = false) => {
    commit((current) => ({
      ...current,
      contentReports: current.contentReports.map((item) => item.id === report.id ? { ...item, status: 'resolved', resolvedAt: new Date().toISOString(), resolvedBy: user.uid } : item),
      posts: removeContent ? current.posts.filter((item) => item.id !== report.postId) : current.posts,
      comments: removeContent ? current.comments.filter((item) => item.postId !== report.postId) : current.comments
    }));
    addAuditLog(removeContent ? 'Removed reported content' : 'Dismissed report', user.uid, report.id);
  };

  const exportUsers = () => downloadCsv('ember-members.csv', data.users.map((item) => ({
    Name: item.fullName, Email: item.email, Role: item.role, RequestedRole: item.requestedRole,
    Status: item.accountStatus, Group: data.groups.find((group) => group.id === item.groupId)?.name || '', Registered: formatDateTime(item.createdAt)
  })));
  const exportAttendance = () => downloadCsv('ember-attendance.csv', data.attendance.map((item) => ({
    Participant: data.users.find((member) => member.uid === item.userId)?.fullName || '',
    Talk: data.talks.find((talk) => talk.id === item.talkId)?.title || '', Status: item.status,
    RecordedBy: data.users.find((member) => member.uid === item.recordedBy)?.fullName || '', Updated: formatDateTime(item.updatedAt)
  })));

  const reset = async () => {
    const confirmation = prompt('Type RESET EMBER to permanently clear all registrations, groups, posts, attendance, polls, and progress.');
    if (confirmation !== 'RESET EMBER') return;
    resetAllData(); await logout(); navigate('/login', { replace: true });
  };

  return (
    <div className="page-stack admin-console">
      <header className="page-heading admin-heading"><div><span>TEAM LEADER CENTER</span><h1>Admin dashboard</h1><p>Manage registrations, groups, talks, activities, reports, and community safety.</p></div><button className="button button--soft" onClick={exportBackup}><Download size={18} /> Backup data</button></header>
      {message && <div className="toast-message"><Check size={18} /> {message}</div>}
      <div className="admin-tabs">{tabs.map((tab) => <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>

      {activeTab === 'Overview' && <>
        <section className="metric-grid">
          <Metric label="Approved participants" value={approvedParticipants.length} detail={`${data.users.length - 1} total registrations`} icon={UsersRound} />
          <Metric label="DGLs" value={approvedDgls.length} detail={`${data.groups.length} discussion groups`} icon={ShieldCheck} />
          <Metric label="Pending registrations" value={pending.length} detail={`${pending.filter((item) => item.requestedRole === 'dgl').length} DGL applicants`} icon={Clock3} />
          <Metric label="Attendance rate" value={`${attendanceRate}%`} detail={`${data.attendance.length} recorded entries`} icon={BarChart3} />
        </section>
        <div className="admin-layout">
          <section className="content-card"><Heading kicker="NEEDS ATTENTION" title="Pending registrations" right={<span className="chip chip--ember">{pending.length} waiting</span>} />
            {pending.length ? <div className="applicant-list">{pending.slice(0, 5).map((person) => <div key={person.uid} className="applicant-row"><UserAvatar user={person} /><div><strong>{person.fullName}</strong><span>{person.requestedRole === 'dgl' ? 'DGL applicant' : 'Participant'} · {formatDateTime(person.createdAt)}</span></div><button className="button button--small" onClick={() => { setActiveTab('Registrations'); }}>Review</button></div>)}</div> : <Empty text="No registrations are waiting for approval." />}
          </section>
          <aside className="admin-rail"><article className="content-card"><Heading kicker="SYSTEM STATUS" title="Clean operating data" /><div className="status-list"><span><UserCheck /> {data.users.filter((item) => item.accountStatus === 'approved').length} approved accounts</span><span><Flame /> {data.posts.length} posts</span><span><CircleAlert /> {openReports.length} open reports</span></div></article></aside>
        </div>
      </>}

      {activeTab === 'Registrations' && <section className="content-card"><Heading kicker="ACCOUNT APPROVAL" title="Registration queue and member access" />
        {pending.length ? <div className="management-list">{pending.map((person) => <article key={person.uid} className="management-row"><UserAvatar user={person} className="avatar--large" /><div className="management-row__main"><strong>{person.fullName}</strong><span>{person.email} · {person.requestedRole === 'dgl' ? 'DGL applicant' : 'Participant'}</span><small>{person.mobileNumber || 'No mobile number'} · {person.location || 'No location provided'}</small></div><select id={`group-${person.uid}`} defaultValue=""><option value="">No group yet</option>{data.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select><button className="button button--small" onClick={() => approve(person, document.getElementById(`group-${person.uid}`)?.value || '')}><Check size={16} /> Approve</button><button className="icon-button danger" onClick={() => reject(person)}><X size={18} /></button></article>)}</div> : <Empty text="There are no pending registrations." />}
        <Heading kicker="ACTIVE ACCOUNTS" title="Approved members" />
        <div className="responsive-table"><table><thead><tr><th>Name</th><th>Role</th><th>Group</th><th>Status</th><th>Access</th><th>Actions</th></tr></thead><tbody>{data.users.filter((item) => item.uid !== 'admin-teamleader' && item.accountStatus !== 'pending').map((member) => <tr key={member.uid}><td><strong>{member.fullName}</strong><br/><small>{member.email}</small></td><td>{member.role === 'dgl' ? 'DGL' : 'Participant'}</td><td><select value={member.groupId || ''} onChange={(event) => assignGroup(member.uid, event.target.value)}><option value="">Unassigned</option>{data.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></td><td><span className={`member-status member-status--${member.accountStatus}`}>{member.accountStatus}</span></td><td><select value={member.accountStatus} onChange={(event) => changeStatus(member, event.target.value)}><option value="approved">Approved</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option></select></td><td><button type="button" className="button button--small danger-button member-delete-button" onClick={() => deleteMember(member)} title={`Permanently delete ${member.fullName}`}><Trash2 size={16} /> Delete member</button></td></tr>)}</tbody></table></div>
      </section>}

      {activeTab === 'Groups' && <div className="admin-layout"><section className="content-card"><Heading kicker="DISCUSSION GROUPS" title="Create and manage groups" />
        <form className="inline-admin-form" onSubmit={createGroup}><input placeholder="Group name" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} required /><input placeholder="Short description" value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} /><select value={groupForm.dglId} onChange={(e) => setGroupForm({ ...groupForm, dglId: e.target.value })}><option value="">Assign DGL later</option>{approvedDgls.map((dgl) => <option key={dgl.uid} value={dgl.uid}>{dgl.fullName}</option>)}</select><button className="button"><Plus size={17} /> Create group</button></form>
        {data.groups.length ? <div className="group-admin-list">{data.groups.map((group) => { const members = data.users.filter((item) => item.groupId === group.id && item.accountStatus === 'approved'); return <article key={group.id}><div><strong>{group.name}</strong><span>Code: {group.code} · {members.length} members</span><small>{group.description || 'No description'}</small></div><select value={group.dglIds?.[0] || ''} onChange={(event) => { const old = group.dglIds?.[0]; if (old && old !== event.target.value) assignGroup(old, ''); if (event.target.value) assignGroup(event.target.value, group.id); }}><option value="">No DGL assigned</option>{approvedDgls.map((dgl) => <option key={dgl.uid} value={dgl.uid}>{dgl.fullName}</option>)}</select><button className="icon-button danger" onClick={() => removeGroup(group)}><Trash2 size={18} /></button></article>; })}</div> : <Empty text="No groups have been created yet." />}
      </section><aside className="admin-rail"><article className="content-card"><Heading kicker="UNASSIGNED" title="Members needing a group" />{data.users.filter((item) => item.accountStatus === 'approved' && item.role !== 'admin' && !item.groupId).map((member) => <div className="mini-member" key={member.uid}><UserAvatar user={member} /><span><strong>{member.fullName}</strong><small>{member.role === 'dgl' ? 'DGL' : 'Participant'}</small></span></div>)}{!data.users.some((item) => item.accountStatus === 'approved' && item.role !== 'admin' && !item.groupId) && <Empty text="Everyone is assigned." />}</article></aside></div>}

      {activeTab === 'Talks & Materials' && <div className="page-stack"><section className="content-card"><Heading kicker="OFFICIAL CLP CONTENT" title="Talk schedules and details" />
        <div className="talk-admin-list">{data.talks.map((talk) => <TalkEditor key={talk.id} talk={talk} onSave={saveTalk} />)}</div>
      </section><section className="content-card"><Heading kicker="RESOURCES" title="Add talk materials" /><form className="inline-admin-form" onSubmit={addMaterial}><select value={materialForm.talkId} onChange={(e) => setMaterialForm({ ...materialForm, talkId: e.target.value })}>{data.talks.map((talk) => <option key={talk.id} value={talk.id}>Talk {talk.number}: {talk.title}</option>)}</select><input placeholder="Material title" value={materialForm.title} onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })} required /><select value={materialForm.type} onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value })}><option>Link</option><option>PDF</option><option>Video</option><option>Guide</option></select><input type="url" placeholder="https://..." value={materialForm.url} onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })} /><button className="button"><Plus size={17} /> Add</button></form><div className="resource-admin-list">{data.materials.filter((item) => !item.groupId).map((material) => <div key={material.id}><span><strong>{material.title}</strong><small>{data.talks.find((talk) => talk.id === material.talkId)?.title} · {material.type}</small></span>{material.url && <a href={material.url} target="_blank" rel="noreferrer">Open</a>}<button className="icon-button danger" onClick={() => commit((current) => ({ ...current, materials: current.materials.filter((item) => item.id !== material.id) }))}><Trash2 size={17} /></button></div>)}</div></section></div>}

      {activeTab === 'CLP Progress' && <section className="content-card"><Heading kicker="PARTICIPANT JOURNEY" title="Manage talk completion" right={<select value={selectedProgressTalk} onChange={(e) => setSelectedProgressTalk(e.target.value)}>{data.talks.map((talk) => <option key={talk.id} value={talk.id}>Talk {talk.number}: {talk.title}</option>)}</select>} /><div className="completion-manager-note"><CheckCircle2 /><div><strong>Choose a talk, then mark each Participant completed.</strong><span>This is separate from attendance. Participants can also mark their own progress from the Talks page.</span></div></div>{approvedParticipants.length ? <div className="progress-management-list">{approvedParticipants.map((member) => { const record = data.progress.find((item) => item.userId === member.uid && item.talkId === selectedProgressTalk); const attendanceRecord = data.attendance.find((item) => item.userId === member.uid && item.talkId === selectedProgressTalk); const groupName = data.groups.find((group) => group.id === member.groupId)?.name || 'Unassigned'; return <article key={member.uid} className={record?.completed ? 'is-complete' : ''}><UserAvatar user={member} /><div className="progress-management-list__main"><strong>{member.fullName}</strong><span>{groupName} · Attendance: {attendanceRecord?.status || 'not recorded'} · Reflection: {record?.reflectionSubmitted ? 'submitted' : 'not submitted'}</span></div><label className="completion-switch"><input type="checkbox" checked={Boolean(record?.completed)} onChange={(e) => setParticipantProgress(member.uid, e.target.checked)} /><span>{record?.completed ? 'Completed' : 'Mark complete'}</span></label></article>; })}</div> : <Empty text="No approved Participants are available yet." />}</section>}

      {activeTab === 'Events' && <section className="content-card"><Heading kicker="CLP CALENDAR" title="Events and activities" /><form className="event-form" onSubmit={createEvent}><input placeholder="Event title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} required /><input type="datetime-local" value={eventForm.schedule} onChange={(e) => setEventForm({ ...eventForm, schedule: e.target.value })} /><input placeholder="Venue" value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} /><textarea placeholder="Description" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} /><button className="button"><Plus size={17} /> Publish event</button></form><div className="event-list">{data.events.map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{formatDateTime(item.schedule)} · {item.venue || 'Venue TBA'}</span><p>{item.description}</p></div><button className="icon-button danger" onClick={() => commit((current) => ({ ...current, events: current.events.filter((event) => event.id !== item.id) }))}><Trash2 /></button></article>)}</div>{!data.events.length && <Empty text="No events are scheduled." />}</section>}

      {activeTab === 'Moderation' && <section className="content-card"><Heading kicker="COMMUNITY SAFETY" title="Reported content" right={<span className="chip chip--ember">{openReports.length} open</span>} />{openReports.length ? <div className="report-list">{openReports.map((report) => { const post = data.posts.find((item) => item.id === report.postId); const reporter = data.users.find((item) => item.uid === report.reportedBy); return <article key={report.id}><div><strong>{report.reason}</strong><span>Reported by {reporter?.fullName || 'Member'} · {formatDateTime(report.createdAt)}</span><p>{post?.content || 'The original content is no longer available.'}</p></div><button className="button button--small button--soft" onClick={() => resolveReport(report, false)}>Dismiss</button><button className="button button--small danger-button" onClick={() => resolveReport(report, true)}>Remove content</button></article>; })}</div> : <Empty text="No content reports require action." />}</section>}

      {activeTab === 'Reports' && <section className="content-card"><Heading kicker="EXPORTABLE REPORTS" title="CLP records" /><div className="report-download-grid"><button onClick={exportUsers}><UsersRound /><strong>Member master list</strong><span>Accounts, roles, status, and groups</span><FileDown /></button><button onClick={exportAttendance}><BarChart3 /><strong>Attendance report</strong><span>Participant status for every talk</span><FileDown /></button><button onClick={() => downloadCsv('ember-progress.csv', data.progress.map((item) => ({ Participant: data.users.find((u) => u.uid === item.userId)?.fullName || '', Talk: data.talks.find((t) => t.id === item.talkId)?.title || '', Reflection: item.reflectionSubmitted ? 'Yes' : 'No', Challenge: item.challengeCompleted ? 'Yes' : 'No', Completed: item.completed ? 'Yes' : 'No' })))}><BookOpenText /><strong>CLP progress report</strong><span>Reflections, challenges, and completion</span><FileDown /></button><button onClick={() => downloadCsv('ember-engagement.csv', data.users.filter((u) => u.role !== 'admin').map((u) => ({ Participant: u.fullName, Posts: data.posts.filter((p) => p.authorId === u.uid).length, Comments: data.comments.filter((c) => c.userId === u.uid).length, PollResponses: data.pollResponses.filter((r) => r.userId === u.uid).length })))}><Flame /><strong>Engagement summary</strong><span>Posts, comments, and poll responses</span><FileDown /></button></div></section>}

      {activeTab === 'Settings' && <div className="admin-layout"><section className="content-card"><Heading kicker="APPLICATION SETTINGS" title="Community configuration" /><label className="setting-row"><span><strong>Registration</strong><small>Allow new Participant and DGL applications.</small></span><input type="checkbox" checked={data.settings.registrationOpen} onChange={(e) => commit((current) => ({ ...current, settings: { ...current.settings, registrationOpen: e.target.checked } }))} /></label><label className="field-group"><span>CLP batch name</span><input value={data.settings.batchName} onChange={(e) => commit((current) => ({ ...current, settings: { ...current.settings, batchName: e.target.value } }))} /></label><button className="button button--soft" onClick={exportBackup}><Download size={18} /> Download JSON backup</button></section><aside className="admin-rail"><article className="content-card danger-zone"><Heading kicker="DANGER ZONE" title="Reset EMBER" /><p>This permanently removes all registrations, groups, posts, comments, polls, attendance, materials, events, and progress from this browser. The Team Leader account remains.</p><button className="button danger-button" onClick={reset}><RefreshCcw size={17} /> Clear all system data</button></article><article className="content-card"><Heading kicker="AUDIT LOG" title="Recent admin actions" />{data.auditLogs.slice(0, 8).map((log) => <div className="audit-row" key={log.id}><strong>{log.action}</strong><span>{log.details}</span><small>{formatDateTime(log.createdAt)}</small></div>)}{!data.auditLogs.length && <Empty text="No administrative actions yet." />}</article></aside></div>}
    </div>
  );
}

function Metric({ label, value, detail, icon: Icon }) { return <article className="metric-card"><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div><i><Icon /></i></article>; }
function Heading({ kicker, title, right }) { return <div className="content-card__heading"><div><span>{kicker}</span><h2>{title}</h2></div>{right}</div>; }
function Empty({ text }) { return <div className="empty-inline">{text}</div>; }
function TalkEditor({ talk, onSave }) {
  const [form, setForm] = useState({ schedule: talk.schedule || '', speaker: talk.speaker || '', venue: talk.venue || '', status: talk.status || 'published' });
  return <article><div><span>Talk {talk.number}</span><strong>{talk.title}</strong></div><input type="datetime-local" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} /><input placeholder="Speaker" value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} /><input placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="published">Published</option><option value="draft">Draft</option><option value="locked">Locked</option></select><button className="icon-button" onClick={() => onSave(talk.id, form)} title="Save"><Save size={18} /></button></article>;
}
