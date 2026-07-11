export function formatDateTime(value) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(date);
}

export function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(value);
}

export function canSeePost(post, viewer, users, groups) {
  if (!viewer) return false;
  if (viewer.role === 'admin' || post.authorId === viewer.uid) return true;
  if (post.batchId && viewer.batchId !== post.batchId) return false;
  if (post.visibility === 'batch') return viewer.accountStatus === 'approved';
  if (post.visibility === 'group') return Boolean(viewer.groupId && post.groupId === viewer.groupId);
  if (post.visibility === 'admins') return false;
  if (post.visibility === 'dgl') {
    const author = users.find((item) => item.uid === post.authorId);
    const group = groups.find((item) => item.id === author?.groupId || item.id === post.groupId);
    return viewer.role === 'dgl' && group?.dglIds?.includes(viewer.uid);
  }
  return false;
}

export function groupForUser(user, groups) {
  return groups.find((group) => group.id === user?.groupId) || null;
}

export function userDisplayName(uid, users) {
  return users.find((item) => item.uid === uid)?.fullName || 'EMBER Member';
}

export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map((row) => headers.map((key) => escape(row[key])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
