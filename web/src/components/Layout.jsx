import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icon } from './Icon.jsx';
import { STATIC } from '../lib/static.js';

// Header menu; the logo links to Home, so Home is only listed in the footer.
const NAV = [
  ['/about', 'About HEH'],
  ['/membership', 'Membership'],
  ['/events', 'Events'],
  ['/community', 'Our Community'],
  ['/contact', 'Contact Us'],
].filter(([to]) => !(STATIC && to === '/events')); // website-only build: no Events section

// Drop-down under "About HEH" (opens on hover/focus on desktop, taps open it in the phone menu).
const ABOUT_MENU = [
  ['/about', 'About Us'],
  ['/our-members', 'Board Members'],
  ['/why-heh', 'Why HEH'],
  ['/who-can-join', 'Who Can Join'],
  ['/membership-plan', 'Membership Details'],
  ['/member-voices', 'Member Voices'],
  ['/faqs', 'FAQs'],
];

// Pages under a section keep its nav item highlighted (e.g. /event -> Events).
const SECTION = {
  '/membership-apply': '/membership', '/membership-submitted': '/membership',
  '/past-events': '/events', '/event': '/events', '/event-register': '/events', '/registration-confirmed': '/events',
  '/members': '/community', '/member': '/community', '/success-stories': '/community', '/story': '/community',
  '/enquiry-submitted': '/contact', '/faqs': '/about', '/our-members': '/about', '/why-heh': '/about', '/who-can-join': '/about', '/member-voices': '/about', '/membership-plan': '/about',
};

// Logo from entrepreneurhub.in; the light version has white text for the navy footer.
const Logo = ({ light }) => (
  <Link className="logo" to="/">
    <img src={`/assets/brand/logo${light ? '-light' : ''}.png`} alt="Hyderabad Entrepreneurs Hub" width="448" height="136" />
  </Link>
);

function AboutMenu({ active, onNavigate }) {
  const { pathname, hash } = useLocation();
  const [open, setOpen] = useState(false); // phone menu: sub-list expanded
  const [hide, setHide] = useState(false); // desktop: close after a click until the pointer leaves
  useEffect(() => { setOpen(false); }, [pathname]);
  const here = pathname + hash;

  return (
    <div className={`nav-drop${open ? ' open' : ''}${hide ? ' hide' : ''}`} onMouseLeave={() => setHide(false)}>
      <NavLink to="/about" end className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={onNavigate}>
        About HEH
      </NavLink>
      <button type="button" className="drop-toggle" aria-label="About HEH menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="chevron-down" />
      </button>
      <div className="drop-menu">
        {ABOUT_MENU.map(([to, label]) => (
          <Link key={to} to={to} className={to === here || (to === pathname && !hash) ? 'current' : ''}
            onClick={(e) => { e.currentTarget.blur(); setHide(true); onNavigate(); }}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Header() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const active = SECTION[pathname] || pathname;
  useEffect(() => { setOpen(false); }, [pathname]);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="container">
        <Logo />
        <button className="menu-toggle" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? '✕' : '☰'}
        </button>
        <nav className={`nav${open ? ' open' : ''}`}>
          {NAV.map(([to, label]) => to === '/about' ? <AboutMenu key={to} active={active === '/about'} onNavigate={close} /> : (
            <NavLink key={to} to={to} end className={to === active ? 'active' : ''} aria-current={to === active ? 'page' : undefined}
              onClick={close}>
              {label}
            </NavLink>
          ))}
          {/* the header Login button is hidden at tablet/phone width, so the menu has it instead */}
          {!STATIC && <Link className="nav-login" to="/login" onClick={close}>Login</Link>}
        </nav>
        {STATIC
          ? <Link className="btn btn-primary btn-sm header-cta" to="/membership-apply">Become a Member <Icon name="arrow-right" /></Link>
          : <Link className="btn btn-primary btn-sm header-cta" to="/login">Login <Icon name="arrow-right" /></Link>}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container cols">
        <div>
          <Logo light />
          <p>Hyderabad Entrepreneurs Hub (HEH) brings together entrepreneurs, SME business owners, start-up founders and business leaders to build meaningful relationships, share knowledge and explore business opportunities.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>{[['/', 'Home'], ...NAV].map(([to, label]) => <li key={to}><Link to={to}>{label}</Link></li>)}</ul>
        </div>
        <div>
          <h4>Connect With Us</h4>
          <ul className="social">
            <li><a href="mailto:heh@entrepreneurhub.in"><Icon name="mail" /> heh@entrepreneurhub.in</a></li>
            <li><a href="tel:+916300799266"><Icon name="phone" /> +91 63007 99266</a></li>
            <li><a href="https://wa.me/916300799266" target="_blank" rel="noopener"><Icon name="chat" /> Chat on WhatsApp</a></li>
            <li><a href="https://www.linkedin.com/in/entrepreneur-hub-hyderabad-a56587356/" target="_blank" rel="noopener"><Icon name="linkedin" /> Follow us on LinkedIn</a></li>
            <li><a href="https://www.facebook.com/entrepreneurhubhyderabad/" target="_blank" rel="noopener"><Icon name="facebook" /> Follow us on Facebook</a></li>
          </ul>
        </div>
        <div>
          <h4>Be Part of HEH</h4>
          <p style={{ marginTop: 0 }}>Join a growing community of ambitious entrepreneurs.</p>
          <Link className="btn btn-primary" to="/membership-apply">Become a Member <Icon name="arrow-right" /></Link>
        </div>
      </div>
      <div className="legal">
        <div className="container">
          <span>© {new Date().getFullYear()} Hyderabad Entrepreneurs Hub. All rights reserved.</span>
          <span>Secunderabad, Telangana 500062, India</span>
          <span className="powered-by">Powered by <a className="powered" href="https://visutechnologies.in/" target="_blank" rel="noopener">Visu Technologies Pvt Ltd</a></span>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { pathname, search, hash } = useLocation();
  // New page: start at the top, or at the #section the link points to (e.g. /membership#who-can-join).
  useEffect(() => {
    const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo(0, 0);
  }, [pathname, search, hash]);
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <Footer />
    </>
  );
}
