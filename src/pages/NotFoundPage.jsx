import { ArrowLeft, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <div className="not-found"><Flame /><span>404</span><h1>This path has gone cold.</h1><p>The page you tried to open does not exist or is not available to your account.</p><Link className="button" to="/"><ArrowLeft size={18} /> Return to EMBER</Link></div>;
}
