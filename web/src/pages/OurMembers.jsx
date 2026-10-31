import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { Loading } from '../components/ui.jsx';
import { api, meta } from '../lib/api.js';
import { useTitle } from '../lib/hooks.js';

const INTRO = {
  core_team: 'The people who run HEH day to day, so that every session is worth your time.',
  working_committee: 'Members who plan and run HEH sessions, programmes and member activities.',
  advisory_board: 'Experienced entrepreneurs and mentors who guide the direction and growth of the HEH community.',
};

// The API sends up to 40 members at a time; keep asking until we have them all.
async function allMembers() {
  const all = [];
  for (;;) {
    const page = await api(`/members?limit=40&offset=${all.length}`);
    all.push(...page.items);
    if (!page.items.length || all.length >= page.total) return all;
  }
}

// Photo and name only; designations and roles are shown on the member's own profile page.
function PersonCard({ m }) {
  return (
    <Link className="team-card" to={`/member?m=${encodeURIComponent(m.slug)}`}>
      {m.photo_url
        ? <img src={m.photo_url} alt={m.full_name} loading="lazy" />
        : <div className="team-ph"><Icon name="user" /></div>}
      <div className="team-cap">
        <h3>{m.full_name}</h3>
      </div>
    </Link>
  );
}

// "About HEH > Members": members grouped by member type (set per member in /admin/).
export default function OurMembers() {
  useTitle('Our Members | Hyderabad Entrepreneurs Hub');
  const [state, setState] = useState({ members: [], types: [], loading: true, error: null });

  useEffect(() => {
    let live = true;
    Promise.all([allMembers(), meta()]).then(
      ([members, m]) => live && setState({ members, types: m.memberTypes || [], loading: false, error: null }),
      (error) => live && setState((s) => ({ ...s, loading: false, error })),
    );
    return () => { live = false; };
  }, []);

  const { members, types, loading, error } = state;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow tracked rule">HEH Members</span>
          <h1>The People Behind<br /><span className="accent">Hyderabad Entrepreneurs Hub</span></h1>
        </div>
      </section>

      {loading && <div className="container"><Loading text="Loading members…" /></div>}
      {error && <div className="container" style={{ padding: '40px 0' }}><p className="form-error">Could not load the members. Please refresh the page.</p></div>}

      {!loading && !error && types.map(([key, label], i) => {
        // team_order 1, 2, 3… first (as set in /admin/), then the rest in directory order (the API's order)
        const rank = (m) => (m.team_order > 0 ? m.team_order : 1e9);
        const group = members.filter((m) => (m.member_types || []).includes(key)).sort((a, b) => rank(a) - rank(b));
        return (
          <section className={`team member-group${i % 2 ? ' alt' : ''}`} id={key.replace(/_/g, '-')} key={key}>
            <div className="container">
              <span className="eyebrow tracked rule">{label}</span>
              <h2>{label}</h2>
              <p>{INTRO[key]}</p>
              {group.length
                ? <div className="team-grid">{group.map((m) => <PersonCard m={m} key={m.slug} />)}</div>
                : <p className="muted member-group-empty">{label} members will be announced soon.</p>}
            </div>
          </section>
        );
      })}

      <section className="section divided">
        <div className="container member-group-cta">
          <div>
            <h2 className="title">Want to be part of HEH?</h2>
            <p>Join a growing community of entrepreneurs who connect, collaborate and grow together.</p>
          </div>
          <div className="btn-row">
            <Link className="btn btn-primary" to="/membership-apply">Become a Member <Icon name="arrow-right" /></Link>
            <Link className="btn btn-outline" to="/members">Browse the Member Directory</Link>
          </div>
        </div>
      </section>
    </>
  );
}
