import { ICONS, FILLED } from '../lib/icons.js';

// <Icon name="calendar" />; solid picks the filled glyph when there is one.
export function Icon({ name, solid = false, className = '' }) {
  const filled = solid && FILLED[name];
  return (
    <svg
      className={`i ${filled ? 'f ' : ''}${className}`.trim()}
      viewBox="0 0 24 24"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: filled || ICONS[name] || '' }}
    />
  );
}

// Round icon badge from the designs: <Ic name="users" tone="blue" />
export function Ic({ name, tone = '', className = '' }) {
  return (
    <span className={`ic ${tone} ${className}`.replace(/\s+/g, ' ').trim()}>
      <Icon name={name} solid />
    </span>
  );
}
