import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icon } from './Icon.jsx';

const NAV = [
  ['/', 'Home'],
  ['/about', 'About HEH'],
  ['/membership', 'Membership'],
  ['/events', 'Events'],
  ['/community', 'Our Community'],
  ['/contact', 'Contact Us'],
];

// Pages under a section keep its nav item highlighted (e.g. /event -> Events).
const SECTION = {
  '/membership-apply': '/membership', '/membership-submitted': '/membership',
  '/past-events': '/events', '/event': '/events', '/event-register': '/events', '/registration-confirmed': '/events',
  '/members': '/community', '/member': '/community', '/success-stories': '/community', '/story': '/community',
  '/enquiry-submitted': '/contact',
};

// Logo from entrepreneurhub.in; the light version has white text for the navy footer.
const Logo = ({ light }) => (
  <Link className="logo" to="/">
    <img src={`/assets/brand/logo${light ? '-light' : ''}.png`} alt="Hyderabad Entrepreneurs Hub" width="448" height="136" />
  </Link>
);

function Header() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const active = SECTION[pathname] || pathname;
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="site-header">
      <div className="container">
        <Logo />
        <button className="menu-toggle" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? '✕' : '☰'}
        </button>
        <nav className={`nav${open ? ' open' : ''}`}>
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to} end className={to === active ? 'active' : ''} aria-current={to === active ? 'page' : undefined}
              onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
        </nav>
        <Link className="btn btn-primary btn-sm header-cta" to="/membership-apply">Become a Member <Icon name="arrow-right" /></Link>
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
          <ul>{NAV.map(([to, label]) => <li key={to}><Link to={to}>{label}</Link></li>)}</ul>
        </div>
        <div>
          <h4>Connect With Us</h4>
          <ul className="social">
            <li><a href="mailto:info@heh.in"><Icon name="mail" /> info@heh.in</a></li>
            <li><a href="#" rel="noopener"><Icon name="linkedin" /> Follow us on LinkedIn</a></li>
            <li><a href="#" rel="noopener"><Icon name="instagram" /> Follow us on Instagram</a></li>
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
          <span>Hyderabad, Telangana, India</span>
          <span className="powered-by">Powered by <a className="powered" href="https://visutechnologies.in/" target="_blank" rel="noopener">Visu Technologies Pvt Ltd</a></span>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { pathname, search } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname, search]);
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <Footer />
    </>
  );
}
