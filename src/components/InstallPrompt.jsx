import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!installEvent || hidden) return null;

  const install = async () => {
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <aside className="install-prompt">
      <div className="install-prompt__icon"><Download size={20} /></div>
      <div>
        <strong>Install EMBER</strong>
        <span>Add it to your phone for faster access.</span>
      </div>
      <button className="button button--small" onClick={install}>Install</button>
      <button className="icon-button" onClick={() => setHidden(true)} aria-label="Dismiss install prompt">
        <X size={18} />
      </button>
    </aside>
  );
}
