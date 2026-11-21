// Event Gallery: Overview, Event Albums, Photos, Videos, Saved Media; album media, photo / video details,
// share, save and remove (designs 1, 18, 19, 20, 29, 30, 35, 44, 48, 55, 64, 66, 69, 79, 80, 85, 92, 95, 97).
// Albums are published events with photos (and videos, added in Admin > Events).
import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmt } from '../lib/format.js';
import { usePortal } from './Portal.jsx';
import { Card, Dialog, Empty, Head, KV, Load, Pager, Pill, Select, Tabs, ViewAll, useAction, useData, usePaged } from './parts.jsx';

const TABS = [['', 'Overview'], ['albums', 'Event Albums'], ['photos', 'Photos'], ['videos', 'Videos'], ['saved', 'Saved Media']];

const youtubeId = (url) => (String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/) || [])[1];

// Every photo and video as one list, newest event first.
function flatten(albums) {
  const items = [];
  for (const a of albums) {
    const event = { id: a.id, slug: a.slug, title: a.title, date: a.event_date, venue: a.venue_name };
    (a.photos || []).forEach((url, i) => items.push({ key: `${a.id}:p${i}`, type: 'photo', url, title: `${a.title} – Photo ${i + 1}`, event }));
    (a.videos || []).forEach((v, i) => items.push({ key: `${a.id}:v${i}`, type: 'video', url: v.url, title: v.title || `${a.title} – Video ${i + 1}`, event }));
  }
  return items;
}

export default function Gallery({ path, query }) {
  const state = useData('/gallery');
  const [a, b] = path;
  return (
    <Load state={state}>
      {(d) => {
        const items = flatten(d.albums);
        const saved = new Set(d.saved.map((s) => s.media_key));
        const ctx = { d, items, saved, reload: state.reload };
        if (a === 'media' && b) return <MediaDetails {...ctx} mediaKey={b} />;
        if (a === 'album' && b) return <Album {...ctx} id={Number(b)} />;
        const tab = TABS.some(([k]) => k === a) ? a || '' : '';
        return (
          <>
            <Head title="Event Gallery" sub="Explore moments from the HEH community" back="dashboard">
              {tab === '' && <a className="p-btn outline" href="#gallery/albums">Browse Albums</a>}
            </Head>
            <Tabs items={TABS} value={tab} base="gallery" />
            {tab === '' && (query.get('q') ? <Results {...ctx} q={query.get('q')} /> : <Overview {...ctx} />)}
            {tab === 'albums' && <Albums {...ctx} />}
            {tab === 'photos' && <MediaGrid {...ctx} type="photo" />}
            {tab === 'videos' && <MediaGrid {...ctx} type="video" />}
            {tab === 'saved' && <MediaGrid {...ctx} type="saved" />}
          </>
        );
      }}
    </Load>
  );
}

function Thumb({ m }) {
  const yt = m.type === 'video' && youtubeId(m.url);
  const img = m.type === 'photo' ? m.url : yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : '';
  return (
    <span className={`p-thumb${img ? '' : ' empty'}`} style={img ? { backgroundImage: `url('${img}')` } : undefined}>
      {!img && <Icon name={m.type === 'video' ? 'video' : 'image'} />}
      {m.type === 'video' && <span className="play"><Icon name="play" /></span>}
    </span>
  );
}

function MediaCard({ m, saved }) {
  return (
    <a className="p-media" href={`#gallery/media/${m.key}`}>
      <Thumb m={m} />
      <span className={`kind ${m.type}`}><Icon name={m.type === 'video' ? 'video' : 'image'} /> {m.type === 'video' ? 'Video' : 'Photo'}</span>
      {saved && <span className="saved" title="Saved"><Icon name="bookmark" /></span>}
      <b>{m.title}</b>
      <small>{m.event.title}</small>
      <small><Icon name="calendar" /> {fmt.date(m.event.date)}</small>
    </a>
  );
}

function Search({ value, onChange, placeholder }) {
  return (
    <label className="p-search-in"><Icon name="search" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {value && <button type="button" aria-label="Clear" onClick={() => onChange('')}><Icon name="x" /></button>}</label>
  );
}

function Overview({ d, items, saved }) {
  const [q, setQ] = useState('');
  const photos = items.filter((m) => m.type === 'photo');
  const videos = items.filter((m) => m.type === 'video');
  return (
    <>
      <form className="p-searchbar" onSubmit={(e) => { e.preventDefault(); if (q.trim()) window.location.hash = `gallery?q=${encodeURIComponent(q.trim())}`; }}>
        <Search value={q} onChange={setQ} placeholder="Search photos, videos or events…" />
        <button className="p-btn" type="submit"><Icon name="search" /> Search</button>
      </form>
      <div className="p-stats">
        <a className="p-stat orange" href="#gallery/albums"><span className="p-stat-ico orange"><Icon name="image" /></span><span className="p-stat-text"><small>Published Albums</small><b>{d.albums.length}</b></span></a>
        <a className="p-stat blue" href="#gallery/photos"><span className="p-stat-ico blue"><Icon name="image" /></span><span className="p-stat-text"><small>Event Photos</small><b>{photos.length}</b></span></a>
        <a className="p-stat green" href="#gallery/videos"><span className="p-stat-ico green"><Icon name="video" /></span><span className="p-stat-text"><small>Event Videos</small><b>{videos.length}</b></span></a>
      </div>
      <Card title="Featured Event Albums" bar action={<ViewAll href="#gallery/albums" />}>
        {d.albums.length ? <div className="p-media-grid">{d.albums.slice(0, 3).map((a) => <AlbumCard key={a.id} a={a} />)}</div>
          : <Empty icon="image" title="No albums yet">Photos from HEH events will appear here after each event.</Empty>}
      </Card>
      <div className="p-grid-2">
        <Card title="Recent Photos" bar action={photos.length > 0 && <ViewAll href="#gallery/photos">View Photos</ViewAll>}>
          {photos.length ? <div className="p-media-grid two">{photos.slice(0, 4).map((m) => <MediaCard key={m.key} m={m} saved={saved.has(m.key)} />)}</div>
            : <Empty icon="image">Published photos will appear here.</Empty>}
        </Card>
        <Card title="Latest Videos" bar action={videos.length > 0 && <ViewAll href="#gallery/videos">View Videos</ViewAll>}>
          {videos.length ? <div className="p-media-grid two">{videos.slice(0, 4).map((m) => <MediaCard key={m.key} m={m} saved={saved.has(m.key)} />)}</div>
            : <Empty icon="video">Published videos will appear here.</Empty>}
        </Card>
      </div>
    </>
  );
}

function Results({ items, saved, q }) {
  const [type, setType] = useState('');
  const t = q.toLowerCase();
  const rows = items.filter((m) => (!type || m.type === type) && `${m.title} ${m.event.title} ${m.event.venue || ''}`.toLowerCase().includes(t));
  return (
    <Card title="Gallery Search Results" sub="Find albums, photos and videos from HEH events" bar action={<Pill tone="orange">{rows.length} Results</Pill>}>
      <div className="p-seg wide">
        {[['', `All Results (${rows.length})`], ['photo', 'Photos'], ['video', 'Videos']].map(([k, label]) => <button key={k} type="button" className={type === k ? 'on' : ''} onClick={() => setType(k)}>{label}</button>)}
      </div>
      {rows.length ? <div className="p-media-grid">{rows.map((m) => <MediaCard key={m.key} m={m} saved={saved.has(m.key)} />)}</div>
        : <Empty icon="search">Nothing matches “{q}”.</Empty>}
      <p className="p-muted small">Showing {rows.length} results for “{q}” · <a className="p-link" href="#gallery">Clear Search</a></p>
    </Card>
  );
}

function AlbumCard({ a }) {
  const cover = a.photos?.[0] || a.image_url;
  return (
    <a className="p-media" href={`#gallery/album/${a.id}`}>
      <span className={`p-thumb${cover ? '' : ' empty'}`} style={cover ? { backgroundImage: `url('${cover}')` } : undefined}>{!cover && <Icon name="image" />}</span>
      <b>{a.title}</b>
      <small><Icon name="calendar" /> {fmt.date(a.event_date)}</small>
      <small>{(a.photos || []).length} photos{(a.videos || []).length ? ` · ${a.videos.length} videos` : ''}</small>
      <span className="p-btn outline sm">View Album <Icon name="arrow-right" /></span>
    </a>
  );
}

function Albums({ d }) {
  const [q, setQ] = useState('');
  const [year, setYear] = useState('');
  const years = [...new Set(d.albums.map((a) => String(a.event_date || '').slice(0, 4)).filter(Boolean))];
  const rows = d.albums.filter((a) => (!year || String(a.event_date).startsWith(year)) && (!q || a.title.toLowerCase().includes(q.toLowerCase())));
  return (
    <Card title="Event Albums" sub="Browse photo and video collections from HEH events" bar action={<Pill tone="orange" icon="image">Published Albums</Pill>}>
      <div className="p-filters"><Search value={q} onChange={setQ} placeholder="Search event albums…" />
        <Select all="All Years" options={years} value={year} onChange={setYear} aria-label="Year" /></div>
      {rows.length ? <div className="p-media-grid">{rows.map((a) => <AlbumCard key={a.id} a={a} />)}</div>
        : <Empty icon="image">{d.albums.length ? 'No albums match.' : 'Albums will appear here after HEH events.'}</Empty>}
      <p className="p-muted small">Showing {rows.length} albums</p>
    </Card>
  );
}

function MediaGrid({ items, saved, type }) {
  const [q, setQ] = useState('');
  const [event, setEvent] = useState('');
  const [sort, setSort] = useState('recent');
  const base = type === 'saved' ? items.filter((m) => saved.has(m.key)) : items.filter((m) => m.type === type);
  const events = [...new Map(base.map((m) => [m.event.id, m.event.title])).entries()];
  const rows = useMemo(() => {
    const r = base.filter((m) => (!event || String(m.event.id) === event) && (!q || `${m.title} ${m.event.title}`.toLowerCase().includes(q.toLowerCase())));
    return sort === 'oldest' ? [...r].reverse() : r;
  }, [base, event, q, sort]);
  const { rows: page, ...pg } = usePaged(rows, 12);
  const title = { photo: ['Photo Gallery', 'Browse photographs from HEH events', 'Published Photos'], video: ['Video Gallery', 'Watch highlights and recordings from HEH events', 'Published Videos'],
    saved: ['My Saved Media', 'Your bookmarked HEH event photos and videos', `Saved Items (${base.length})`] }[type];
  return (
    <Card title={title[0]} sub={title[1]} bar action={<Pill tone="orange" icon={type === 'video' ? 'video' : type === 'saved' ? 'bookmark' : 'image'}>{title[2]}</Pill>}>
      <div className="p-filters"><Search value={q} onChange={setQ} placeholder={`Search ${type === 'saved' ? 'saved media' : `${type}s`} or events…`} />
        <Select all="All Events" options={events.map(([id, t]) => [String(id), t])} value={event} onChange={setEvent} aria-label="Event" />
        <Select options={[['recent', 'Most Recent'], ['oldest', 'Oldest First']]} value={sort} onChange={setSort} aria-label="Sort" /></div>
      {page.length ? <div className="p-media-grid">{page.map((m) => <MediaCard key={m.key} m={m} saved={saved.has(m.key)} />)}</div>
        : <Empty icon={type === 'video' ? 'video' : type === 'saved' ? 'bookmark' : 'image'}>
          {type === 'saved' ? 'Save photos and videos from the gallery to find them here.' : `Published ${type}s will appear here.`}</Empty>}
      <Pager {...pg} onPage={pg.setPage} total={rows.length} shown={page.length} noun={type === 'saved' ? 'saved items' : `${type} entries`} />
    </Card>
  );
}

function Album({ d, items, saved, id }) {
  const a = d.albums.find((x) => x.id === id);
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  if (!a) return <><Head title="Event Gallery" back="gallery/albums" /><Empty icon="image" title="Album not available">This album has no published media yet.</Empty></>;
  const media = items.filter((m) => m.event.id === id);
  const rows = media.filter((m) => (!type || m.type === type) && (!q || m.title.toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <Head title="Event Gallery" sub="Explore moments from the HEH community" back="gallery/albums" />
      <Tabs items={TABS} value="albums" base="gallery" />
      <Card title={`${a.title} — Album Media`} sub={`${fmt.date(a.event_date)}${a.venue_name ? ` · ${a.venue_name}` : ''}`} bar
        action={<Pill tone="orange" icon="image">{media.length} Media Items</Pill>}>
        <div className="p-filters">
          <div className="p-seg">{[['', `All Media (${media.length})`], ['photo', `Photos (${media.filter((m) => m.type === 'photo').length})`], ['video', `Videos (${media.filter((m) => m.type === 'video').length})`]]
            .map(([k, label]) => <button key={k} type="button" className={type === k ? 'on' : ''} onClick={() => setType(k)}>{label}</button>)}</div>
          <Search value={q} onChange={setQ} placeholder="Search within album…" />
        </div>
        {rows.length ? <div className="p-media-grid">{rows.map((m) => <MediaCard key={m.key} m={m} saved={saved.has(m.key)} />)}</div> : <Empty icon="image">Nothing to show.</Empty>}
        <div className="p-form-acts"><a className="p-btn outline" href="#gallery/albums"><Icon name="arrow-left" /> Back to Albums</a>
          <a className="p-btn outline" href={`#events/${a.slug}`}>View Event</a></div>
      </Card>
    </>
  );
}

function MediaDetails({ items, saved, reload, mediaKey }) {
  const { call, toast, openModal, closeModal, go } = usePortal();
  const [busy, run] = useAction();
  const i = items.findIndex((m) => m.key === mediaKey);
  const m = items[i];
  if (!m) {
    return (
      <>
        <Head title="Event Gallery" back="gallery" />
        <Dialog icon="image" tone="orange" title="Media Unavailable" onClose={() => go('gallery')}
          actions={<><button type="button" className="p-btn outline" onClick={() => go('gallery/saved')}>Close</button><a className="p-btn" href="#gallery">Browse Gallery</a></>}>
          <p>This photograph or video is no longer available in the Event Gallery. It may have been removed or unpublished by the HEH administrator.</p>
        </Dialog>
      </>
    );
  }
  const siblings = items.filter((x) => x.event.id === m.event.id && x.type === m.type);
  const pos = siblings.findIndex((x) => x.key === m.key);
  const isSaved = saved.has(m.key);
  const toggleSave = () => {
    if (isSaved) {
      openModal(
        <Dialog icon="bookmark" tone="red" title="Remove from Saved?"
          actions={<><button type="button" className="p-btn outline" onClick={closeModal}>Cancel</button>
            <button type="button" className="p-btn danger" onClick={() => run(async () => { await call(`/gallery/saved/${encodeURIComponent(m.key)}`, { method: 'DELETE' }); closeModal(); toast('Removed from saved media'); reload(); }).catch(() => {})}><Icon name="trash" /> Remove</button></>}>
          <p>Remove this item from your saved collection? The original will remain in the Event Gallery.</p>
          <div className="p-mini-member"><Thumb m={m} /><span><b>{m.title}</b><small>{m.event.title} · {fmt.date(m.event.date)}</small></span></div>
        </Dialog>,
      );
      return;
    }
    openModal(
      <Dialog icon="bookmark" tone="orange" title="Save to My Gallery?"
        actions={<><button type="button" className="p-btn outline" onClick={closeModal}>Cancel</button>
          <button type="button" className="p-btn" onClick={() => run(async () => { await call('/gallery/saved', { method: 'POST', body: { key: m.key } }); closeModal(); toast('Saved to My Media'); reload(); }).catch(() => {})}><Icon name="bookmark" /> Save Media</button></>}>
        <p>Add this {m.type === 'video' ? 'video' : 'photograph'} to your saved collection for easy access later.</p>
        <div className="p-mini-member"><Thumb m={m} /><span><b>{m.title}</b><small>{m.event.title} · {fmt.date(m.event.date)}</small></span></div>
      </Dialog>,
    );
  };
  const share = () => openModal(<ShareDialog m={m} />);
  const yt = m.type === 'video' && youtubeId(m.url);
  return (
    <>
      <Head title="Event Gallery" sub="Explore moments from the HEH community" back={isSaved ? 'gallery/saved' : m.type === 'video' ? 'gallery/videos' : `gallery/album/${m.event.id}`} />
      <Tabs items={TABS} value={isSaved ? 'saved' : m.type === 'video' ? 'videos' : 'photos'} base="gallery" />
      <div className="p-grid-2 wide-left">
        <section className="p-card">
          <div className="p-card-head bar"><div><h2>{m.type === 'video' ? 'Video Details' : 'Photo Details'}</h2><p>{m.event.title}</p></div>
            {siblings.length > 1 && <Pill>{m.type === 'video' ? 'Video' : 'Photo'} {pos + 1} of {siblings.length}</Pill>}</div>
          <div className="p-viewer">
            {m.type === 'photo' ? <img src={m.url} alt={m.title} />
              : yt ? <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title={m.title} allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
                : <video src={m.url} controls preload="metadata" />}
            {siblings.length > 1 && <>
              <button type="button" className="nav prev" aria-label="Previous" onClick={() => go(`gallery/media/${siblings[(pos - 1 + siblings.length) % siblings.length].key}`)}><Icon name="arrow-left" /></button>
              <button type="button" className="nav next" aria-label="Next" onClick={() => go(`gallery/media/${siblings[(pos + 1) % siblings.length].key}`)}><Icon name="arrow-right" /></button>
            </>}
            {m.type === 'photo' && <a className="full" href={m.url} target="_blank" rel="noopener" aria-label="Open full size"><Icon name="expand" /></a>}
          </div>
          {siblings.length > 1 && (
            <div className="p-strip-thumbs">{siblings.slice(Math.max(0, pos - 3), pos + 4).map((x) => (
              <a key={x.key} href={`#gallery/media/${x.key}`} className={x.key === m.key ? 'on' : ''}><Thumb m={x} /></a>
            ))}</div>
          )}
        </section>
        <Card title={m.type === 'video' ? 'Video Information' : 'Photo Information'} bar>
          <KV rows={[['Title', m.title], ['Event', m.event.title], ['Event Date', fmt.date(m.event.date)], m.event.venue && ['Venue', m.event.venue], ['Media Type', m.type === 'video' ? 'Video' : 'Photo']]} />
          <button type="button" className={`p-btn block${isSaved ? ' danger-outline' : ''}`} disabled={busy} onClick={toggleSave}>
            <Icon name={isSaved ? 'trash' : 'bookmark'} /> {isSaved ? 'Remove from Saved' : 'Save to My Media'}</button>
          <button type="button" className="p-btn outline block" onClick={share}><Icon name="share" /> Share {m.type === 'video' ? 'Video' : 'Photo'}</button>
          {m.type === 'photo' && <a className="p-btn outline block" href={m.url} download><Icon name="download" /> Download</a>}
          <a className="p-link" href={`#gallery/album/${m.event.id}`}>Back to Album</a>
        </Card>
      </div>
    </>
  );
}

function ShareDialog({ m }) {
  const { closeModal, toast } = usePortal();
  const link = new URL(m.type === 'photo' ? m.url : m.url, window.location.origin).href;
  const text = `${m.title} – ${m.event.title} (HEH)`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast('Link copied'); } catch { toast('Could not copy. Select the link and copy it.', true); }
  };
  return (
    <Dialog title="Share Media" actions={<button type="button" className="p-btn outline block" onClick={closeModal}>Close</button>}>
      <div className="p-mini-member"><Thumb m={m} /><span><b>{m.title}</b><small>{m.event.title} · {fmt.date(m.event.date)}</small></span></div>
      <h3 className="p-sec">Share via</h3>
      <div className="p-share">
        <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`} target="_blank" rel="noopener"><Icon name="whatsapp" /> WhatsApp</a>
        <a href={`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(link)}`}><Icon name="mail" /> Email</a>
        <button type="button" onClick={copy}><Icon name="link" /> Copy Link</button>
      </div>
      <h3 className="p-sec">Media Link</h3>
      <div className="p-copy"><input className="p-input" readOnly value={link} onFocus={(e) => e.target.select()} /><button type="button" className="p-btn outline sm" onClick={copy}><Icon name="copy" /> Copy</button></div>
      <p className="p-muted small"><Icon name="shield" /> Sharing is subject to HEH media permissions and access settings.</p>
    </Dialog>
  );
}
