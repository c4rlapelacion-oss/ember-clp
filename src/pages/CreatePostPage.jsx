import { Check, ChevronDown, ImagePlus, LockKeyhole, Send, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import UserAvatar from '../components/UserAvatar';
import { makeId } from '../utils/security';
import { groupForUser } from '../utils/app';

const memberPostTypes = ['Reflection', 'Photo', 'Testimony', 'Prayer Request', 'Question', 'General Post'];
const visibilityOptions = [
  { value: 'dgl', label: 'My DGL only' }, { value: 'group', label: 'My discussion group' }, { value: 'batch', label: 'Entire CLP batch' }, { value: 'admins', label: 'Admins only' }
];

export default function CreatePostPage() {
  const { user } = useAuth();
  const { data, commit, addNotification } = useData();
  const group = groupForUser(user, data.groups);
  const postTypes = ['admin', 'dgl'].includes(user.role) ? ['Announcement', ...memberPostTypes] : memberPostTypes;
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ type: 'Reflection', talkId: params.get('talk') || '', visibility: group ? 'group' : 'batch', content: '', imageData: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const readImage = (file) => {
    if (!file) return setForm({ ...form, imageData: '' });
    if (file.size > 1200000) return setError('Please choose an image smaller than 1.2 MB for this local build.');
    const reader = new FileReader(); reader.onload = () => setForm((current) => ({ ...current, imageData: reader.result })); reader.readAsDataURL(file);
  };
  const submit = (event) => {
    event.preventDefault(); setError('');
    if (!form.content.trim()) return setError('Please write a message before publishing.');
    if ((form.visibility === 'group' || form.visibility === 'dgl') && !group) return setError('You need a discussion group before using this visibility.');
    const talk = data.talks.find((item) => item.id === form.talkId);
    const labels = { dgl: 'My DGL only', group: 'My Group', batch: 'Entire Batch', admins: 'Admins only' };
    const post = { id: makeId('post'), authorId: user.uid, groupId: group?.id || null, batchId: user.batchId, type: form.type, talkId: form.talkId || null, talkTitle: talk ? `Talk ${talk.number} · ${talk.title}` : '', visibility: form.visibility, visibilityLabel: labels[form.visibility], content: form.content.trim(), imageData: form.imageData, createdAt: new Date().toISOString(), pinned: form.type === 'Announcement' };
    commit((current) => ({ ...current, posts: [post, ...current.posts] }));
    if (form.type === 'Reflection' && form.talkId) commit((current) => ({ ...current, progress: [...current.progress.filter((item) => !(item.userId === user.uid && item.talkId === form.talkId)), { ...(current.progress.find((item) => item.userId === user.uid && item.talkId === form.talkId) || {}), id: current.progress.find((item) => item.userId === user.uid && item.talkId === form.talkId)?.id || makeId('progress'), userId: user.uid, talkId: form.talkId, reflectionSubmitted: true, completed: current.progress.find((item) => item.userId === user.uid && item.talkId === form.talkId)?.completed || false }] }));
    if (form.visibility === 'admins') data.users.filter((item) => item.role === 'admin').forEach((admin) => addNotification({ userId: admin.uid, title: 'Private post received', message: `${user.fullName} sent a private ${form.type.toLowerCase()}.` }));
    setSubmitted(true);
  };
  if (submitted) return <div className="success-state"><div><Check size={38} /></div><span>POST PUBLISHED</span><h1>Your {form.type.toLowerCase()} was saved.</h1><p>It is now visible to the audience you selected.</p><button className="button" onClick={() => navigate('/app')}>Return to feed</button></div>;
  return <div className="create-page page-stack"><header className="page-heading"><div><span>SHARE WITH INTENTION</span><h1>Create a post</h1><p>Share a reflection, testimony, prayer request, question, or meaningful moment.</p></div></header><form className="create-layout" onSubmit={submit}><section className="content-card create-main"><div className="composer-identity"><UserAvatar user={user} className="avatar--large" /><div><strong>{user.fullName}</strong><span>Posting to {group?.name || 'the CLP community'}</span></div></div><div className="field-group"><span>Post type</span><div className="post-type-grid">{postTypes.map((type) => <button type="button" key={type} className={form.type === type ? 'active' : ''} onClick={() => setForm({ ...form, type })}>{type}</button>)}</div></div><label className="field-group"><span>Connect to a CLP talk</span><div className="select-wrap"><select value={form.talkId} onChange={(e) => setForm({ ...form, talkId: e.target.value })}><option value="">Not connected to a talk</option>{data.talks.map((talk) => <option key={talk.id} value={talk.id}>Talk {talk.number}: {talk.title}</option>)}</select><ChevronDown /></div></label><label className="field-group"><span>Your message</span><textarea className="composer-textarea" rows="8" maxLength="1500" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /><small className="character-count">{form.content.length} / 1500</small></label><label className="upload-box"><input type="file" accept="image/*" onChange={(e) => readImage(e.target.files?.[0])} /><ImagePlus /><strong>{form.imageData ? 'Photo selected' : 'Add a photo'}</strong><span>JPEG or PNG · maximum 1.2 MB in local mode.</span></label>{form.imageData && <img className="image-preview" src={form.imageData} alt="Preview" />}{error && <div className="form-alert form-alert--error"><ShieldCheck size={18} />{error}</div>}</section><aside className="create-aside"><article className="content-card privacy-card"><div className="content-card__heading"><div><span>PRIVACY</span><h3>Who can see this?</h3></div><LockKeyhole /></div><div className="visibility-list">{visibilityOptions.map((option) => <label key={option.value} className={form.visibility === option.value ? 'selected' : ''}><input type="radio" name="visibility" checked={form.visibility === option.value} onChange={() => setForm({ ...form, visibility: option.value })} /><span><strong>{option.label}</strong></span></label>)}</div></article><button className="button button--large button--full"><Send size={19} /> Publish post</button></aside></form></div>;
}
