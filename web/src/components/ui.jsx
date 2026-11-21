import { Icon } from './Icon.jsx';

// Image, or the grey "image will be uploaded here" placeholder from the designs.
export function Media({ url, label = '', icon = 'image', className = '' }) {
  if (url) return <div className={`ph has-img ${className}`.trim()}><img src={url} alt={label} loading="lazy" /></div>;
  return <div className={`ph ${className}`.trim()}><Icon name={icon} />{label && <span>{label}</span>}</div>;
}

export const CATEGORY_BADGE = {
  'Business Collaboration': '', 'Business Referral': 'blue', 'Growth Story': 'green',
  'Community Impact': 'purple', 'New Business Opportunity': '', 'Knowledge Sharing': '',
};

export const INDUSTRY_STYLE = {
  'Technology & IT Services': ['blue', 'laptop'],
  Manufacturing: ['', 'gear'],
  'Real Estate & Construction': ['purple', 'building'],
  Healthcare: ['green', 'heart'],
  'Financial & Professional Services': ['', 'chart'],
  'Retail & Trading': ['', 'cart'],
  'Education & Training': ['blue', 'cap'],
  'Automobile & Allied Services': ['blue', 'car'],
  'Hospitality & Food Services': ['', 'cloche'],
  'Other Services': ['purple', 'grid'],
};

const INDUSTRY_TONE = { 'Technology & IT Services': 'blue', 'Real Estate & Construction': '', Healthcare: 'green', 'Financial & Professional Services': 'purple' };
export const IndustryBadge = ({ industry }) => <span className={`badge ${INDUSTRY_TONE[industry] ?? 'grey'}`}>{industry}</span>;

export const EventBadge = ({ category }) =>
  category === 'workshop' ? <span className="badge caps blue">HEH Workshop</span> : <span className="badge caps">HEH Spotlight</span>;

export const Loading = ({ text = 'Loading…' }) => <p className="muted" style={{ padding: '40px 0' }}>{text}</p>;
