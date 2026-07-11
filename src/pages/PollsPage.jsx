import { BarChart3, CheckCircle2, Lock, Plus, Trash2, Vote } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { groupForUser } from '../utils/app';
import { makeId } from '../utils/security';

export default function PollsPage() {
  const { user } = useAuth();
  const { data, commit, addNotification } = useData();
  const group = groupForUser(user, data.groups);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ question: '', options: ['', ''], audience: user.role === 'admin' ? 'batch' : 'group', multiple: false });
  const visible = data.polls.filter((poll) => poll.audience === 'batch' || (poll.audience === 'group' && poll.groupId === user.groupId));
  const canCreate = user.role === 'admin' || (user.role === 'dgl' && group);

  const create = (event) => {
    event.preventDefault();
    const options = form.options.map((item) => item.trim()).filter(Boolean);
    if (!form.question.trim() || options.length < 2) return;
    const poll = {
      id: makeId('poll'), creatorId: user.uid, groupId: form.audience === 'group' ? group?.id : null,
      batchId: user.batchId, audience: form.audience, question: form.question.trim(),
      options: options.map((label) => ({ id: makeId('option'), label })), multiple: form.multiple,
      open: true, createdAt: new Date().toISOString()
    };
    commit((current) => ({ ...current, polls: [poll, ...current.polls] }));
    data.users.filter((item) => item.accountStatus === 'approved' && (poll.audience === 'batch' ? item.batchId === user.batchId : item.groupId === group?.id)).forEach((item) => {
      if (item.uid !== user.uid) addNotification({ userId: item.uid, title: 'New poll', message: poll.question });
    });
    setForm({ question: '', options: ['', ''], audience: user.role === 'admin' ? 'batch' : 'group', multiple: false });
    setShowCreate(false);
  };

  const vote = (poll, optionId) => {
    if (!poll.open) return;
    commit((current) => {
      const prior = current.pollResponses.find((item) => item.pollId === poll.id && item.userId === user.uid);
      let selected = prior?.optionIds || [];
      selected = poll.multiple ? (selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId]) : [optionId];
      const response = { id: prior?.id || makeId('response'), pollId: poll.id, userId: user.uid, optionIds: selected, updatedAt: new Date().toISOString() };
      return { ...current, pollResponses: [...current.pollResponses.filter((item) => !(item.pollId === poll.id && item.userId === user.uid)), response] };
    });
  };

  const canManage = (poll) => user.role === 'admin' || poll.creatorId === user.uid;
  const toggleOpen = (poll) => commit((current) => ({ ...current, polls: current.polls.map((item) => item.id === poll.id ? { ...item, open: !item.open } : item) }));
  const remove = (poll) => {
    if (!confirm('Delete this poll and all its responses?')) return;
    commit((current) => ({ ...current, polls: current.polls.filter((item) => item.id !== poll.id), pollResponses: current.pollResponses.filter((item) => item.pollId !== poll.id) }));
  };

  return <div className="page-stack"><header className="page-heading"><div><span>COMMUNITY VOICE</span><h1>Polls</h1><p>Answer group questions and help Team Leaders understand the community.</p></div>{canCreate && <button className="button" onClick={() => setShowCreate((value) => !value)}><Plus size={18} /> Create poll</button>}</header>
    {showCreate && <form className="content-card poll-create" onSubmit={create}><h2>Create a poll</h2><label><span>Question</span><input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required /></label>{form.options.map((option, index) => <label key={index}><span>Option {index + 1}</span><input value={option} onChange={(e) => setForm({ ...form, options: form.options.map((item, i) => i === index ? e.target.value : item) })} required /></label>)}<div className="form-row"><button type="button" className="button button--soft" onClick={() => setForm({ ...form, options: [...form.options, ''] })}>Add option</button>{user.role === 'admin' && <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}><option value="batch">Entire CLP batch</option><option value="group" disabled={!group}>My group</option></select>}<label className="check-label"><input type="checkbox" checked={form.multiple} onChange={(e) => setForm({ ...form, multiple: e.target.checked })} /><span>Allow multiple answers</span></label><button className="button">Publish poll</button></div></form>}
    {!canCreate && user.role === 'dgl' && <div className="form-alert">Create or receive a group assignment before publishing group polls.</div>}
    <div className="poll-grid">{visible.length ? visible.map((poll) => { const response = data.pollResponses.find((item) => item.pollId === poll.id && item.userId === user.uid); const all = data.pollResponses.filter((item) => item.pollId === poll.id); return <article key={poll.id} className="content-card poll-card"><div className="content-card__heading"><div><span>{poll.audience === 'batch' ? 'CLP BATCH' : 'DISCUSSION GROUP'} · {poll.open ? 'OPEN' : 'CLOSED'}</span><h2>{poll.question}</h2></div><Vote /></div><div className="poll-options">{poll.options.map((option) => { const count = all.filter((item) => item.optionIds.includes(option.id)).length; const percent = all.length ? Math.round(count / all.length * 100) : 0; const selected = response?.optionIds.includes(option.id); return <button key={option.id} className={selected ? 'selected' : ''} onClick={() => vote(poll, option.id)} disabled={!poll.open}><span>{selected ? <CheckCircle2 /> : <i />}{option.label}</span>{(response || !poll.open || canManage(poll)) && <small>{count} vote{count !== 1 ? 's' : ''} · {percent}%</small>}</button>; })}</div><footer><span><BarChart3 size={16} /> {all.length} response{all.length !== 1 ? 's' : ''}</span>{canManage(poll) && <span className="poll-manage"><button onClick={() => toggleOpen(poll)}>{poll.open ? <><Lock size={15}/> Close</> : 'Reopen'}</button><button onClick={() => remove(poll)}><Trash2 size={15}/> Delete</button></span>}</footer></article>; }) : <div className="empty-state empty-state--large"><Vote /><h2>No polls yet</h2><p>DGLs and Team Leaders can create the first poll.</p></div>}</div>
  </div>;
}
