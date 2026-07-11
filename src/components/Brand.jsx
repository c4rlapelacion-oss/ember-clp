import emberIcon from '../assets/ember-icon.png';

export default function Brand({ compact = false, light = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''} ${light ? 'brand--light' : ''}`}>
      <img className="brand__icon" src={emberIcon} alt="" />
      <div>
        <strong>EMBER</strong>
        {!compact && <span>SFC Tayabas CLP</span>}
      </div>
    </div>
  );
}
