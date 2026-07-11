import { useMemo, useState } from 'react';
import { Bookmark, Flag, Heart, MessageCircle, Send, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { makeId } from '../utils/security';
import { timeAgo } from '../utils/app';
import UserAvatar from './UserAvatar';

const reactions = ['Love', 'Amen', 'Praying', 'Inspired'];

export default function PostCard({ post }) {
  const { user } = useAuth();
  const { data, commit, addNotification } = useData();
  const [comment, setComment] = useState('');
  const author = data.users.find((item) => item.uid === post.authorId);
  const group = data.groups.find((item) => item.id === post.groupId);
  const comments = data.comments.filter((item) => item.postId === post.id);
  const postReactions = data.reactions.filter((item) => item.postId === post.id);
  const ownReaction = postReactions.find((item) => item.userId === user.uid);
  const saved = data.savedPosts.some((item) => item.postId === post.id && item.userId === user.uid);
  const canDelete = user.role === 'admin' || post.authorId === user.uid || (user.role === 'dgl' && group?.dglIds?.includes(user.uid));

  const reactionSummary = useMemo(() => reactions.map((label) => ({ label, count: postReactions.filter((item) => item.type === label).length })).filter((item) => item.count), [postReactions]);

  const react = (type) => commit((current) => {
    const existing = current.reactions.find((item) => item.postId === post.id && item.userId === user.uid);
    const filtered = current.reactions.filter((item) => !(item.postId === post.id && item.userId === user.uid));
    return { ...current, reactions: existing?.type === type ? filtered : [...filtered, { id: makeId('reaction'), postId: post.id, userId: user.uid, type }] };
  });

  const addComment = (event) => {
    event.preventDefault();
    if (!comment.trim()) return;
    const created = { id: makeId('comment'), postId: post.id, userId: user.uid, content: comment.trim(), createdAt: new Date().toISOString() };
    commit((current) => ({ ...current, comments: [...current.comments, created] }));
    if (post.authorId !== user.uid) addNotification({ userId: post.authorId, type: 'comment', title: 'New comment', message: `${user.fullName} commented on your post.` });
    setComment('');
  };

  const toggleSave = () => commit((current) => ({ ...current, savedPosts: saved ? current.savedPosts.filter((item) => !(item.postId === post.id && item.userId === user.uid)) : [...current.savedPosts, { id: makeId('saved'), postId: post.id, userId: user.uid }] }));
  const remove = () => { if (confirm('Delete this post and its comments?')) commit((current) => ({ ...current, posts: current.posts.filter((item) => item.id !== post.id), comments: current.comments.filter((item) => item.postId !== post.id), reactions: current.reactions.filter((item) => item.postId !== post.id) })); };
  const report = () => { const reason = prompt('Why are you reporting this post?'); if (reason?.trim()) commit((current) => ({ ...current, contentReports: [...current.contentReports, { id: makeId('report'), postId: post.id, reportedBy: user.uid, reason: reason.trim(), status: 'open', createdAt: new Date().toISOString() }] })); };

  return <article className="post-card">
    {post.pinned && <div className="post-card__pinned">Pinned announcement</div>}
    <header className="post-card__header"><UserAvatar user={author} className="avatar--warm" /><div className="post-card__identity"><strong>{author?.fullName || 'EMBER Member'}</strong><span>{author?.role === 'admin' ? 'Team Leader' : author?.role === 'dgl' ? 'DGL' : 'Participant'} · {group?.name || 'CLP Community'} · {timeAgo(post.createdAt)}</span></div>{canDelete ? <button className="icon-button" onClick={remove} title="Delete"><Trash2 size={18} /></button> : <button className="icon-button" onClick={report} title="Report"><Flag size={18} /></button>}</header>
    <div className="post-card__badges"><span className="chip chip--ember">{post.type}</span>{post.talkTitle && <span className="chip">{post.talkTitle}</span>}<span className="chip chip--muted"><ShieldCheck size={13} /> {post.visibilityLabel}</span></div>
    <p className="post-card__content">{post.content}</p>{post.imageData && <img className="post-image" src={post.imageData} alt="Post upload" />}
    <div className="post-card__summary"><span><Heart size={15} fill="currentColor" /> {postReactions.length}{reactionSummary.length ? ` · ${reactionSummary.map((item) => `${item.label} ${item.count}`).join(' · ')}` : ''}</span><span>{comments.length} comments</span></div>
    <div className="post-card__actions"><div className="reaction-menu"><button className={`post-action ${ownReaction ? 'post-action--active' : ''}`}><Heart size={19} /> {ownReaction?.type || 'React'}</button><div className="reaction-menu__options">{reactions.map((type) => <button key={type} onClick={() => react(type)}>{type}</button>)}</div></div><button className={`post-action ${saved ? 'post-action--active' : ''}`} onClick={toggleSave}><Bookmark size={19} fill={saved ? 'currentColor' : 'none'} /> Save</button></div>
    <div className="comment-list">{comments.map((item) => { const owner = data.users.find((u) => u.uid === item.userId); return <div key={item.id} className="comment-item"><UserAvatar user={owner} /><div><strong>{owner?.fullName || 'EMBER Member'}</strong><p>{item.content}</p><small>{timeAgo(item.createdAt)}</small></div>{(item.userId === user.uid || user.role === 'admin') && <button onClick={() => commit((current) => ({ ...current, comments: current.comments.filter((commentItem) => commentItem.id !== item.id) }))}><Trash2 size={14} /></button>}</div>; })}</div>
    <form className="comment-form" onSubmit={addComment}><MessageCircle size={18} /><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a respectful comment…" /><button aria-label="Send comment"><Send size={18} /></button></form>
  </article>;
}
