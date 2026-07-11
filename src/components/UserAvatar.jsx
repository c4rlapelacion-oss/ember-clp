export default function UserAvatar({ user, className = '', size, decorative = false }) {
  const label = user?.fullName ? `${user.fullName}'s profile picture` : 'Profile picture';
  const fallback = user?.avatar || 'EM';
  const photoURL = user?.photoURL && user?.photoConsent !== false ? user.photoURL : '';
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`avatar ${className}`.trim()} style={style} aria-label={decorative ? undefined : label} aria-hidden={decorative || undefined}>
      {photoURL ? <img src={photoURL} alt={decorative ? '' : label} /> : <span>{fallback}</span>}
    </div>
  );
}
