import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { CATEGORY_BADGE, IndustryBadge, Media } from '../components/ui.jsx';
import { fmt } from '../lib/format.js';

// Card components shared by the community, members and success-stories pages.

export function MemberCard({ m }) {
  const url = `/member?m=${encodeURIComponent(m.slug)}`;
  return (
    <article className="tile member-tile">
      <Media url={m.photo_url} label={m.photo_url ? m.full_name : ''} icon="user" className={m.photo_url ? '' : 'person'} />
      <div className="body">
        <h3><Link to={url}>{m.full_name}</Link></h3>
        <div className="role">{m.designation}<br />{m.company}</div>
        {m.industry && <IndustryBadge industry={m.industry} />}
        <Link className="btn btn-outline-orange btn-sm" to={url}>View Profile <Icon name="arrow-right" /></Link>
      </div>
    </article>
  );
}

export function StoryCard({ s }) {
  const url = `/story?s=${encodeURIComponent(s.slug)}`;
  return (
    <article className="tile story-tile">
      <Media url={s.image_url} label={s.image_url ? s.title : 'Admin Upload Photograph'} />
      <div className="body">
        <span className={`badge ${CATEGORY_BADGE[s.category] || ''}`} style={{ alignSelf: 'flex-start' }}>{s.category}</span>
        <h3><Link to={url}>{s.title}</Link></h3>
        <p className="summary">{s.summary}</p>
        <div className="foot" style={{ paddingTop: 14 }}>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'var(--orange)', display: 'inline-flex' }}><Icon name="calendar" /></span>
            {fmt.date(s.published_on)}
          </span>
          <Link className="link-arrow" to={url}>Read Story <Icon name="arrow-right" /></Link>
        </div>
      </div>
    </article>
  );
}

// "Grid is empty / failed" message spanning the whole grid.
export const GridNote = ({ children, className = 'empty', style }) => (
  <div className={className} style={{ gridColumn: '1/-1', ...style }}>{children}</div>
);
