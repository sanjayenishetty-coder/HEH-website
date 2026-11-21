import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './styles.css';

// A tab opened before a deploy still asks for the old hashed files (e.g. the admin or portal bundle). If one is
// gone, Vite fires vite:preloadError and the page would stay blank: reload once to pick up the new build.
window.addEventListener('vite:preloadError', (e) => {
  let last = 0;
  try { last = Number(sessionStorage.getItem('heh-reloaded')) || 0; } catch { /* storage blocked */ }
  if (Date.now() - last < 15000) return; // reloaded a moment ago: let the error show instead of looping
  try { sessionStorage.setItem('heh-reloaded', String(Date.now())); } catch { /* storage blocked */ }
  e.preventDefault();
  window.location.reload();
});
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Membership from './pages/Membership.jsx';
import MembershipApply from './pages/MembershipApply.jsx';
import MembershipSubmitted from './pages/MembershipSubmitted.jsx';
import Contact from './pages/Contact.jsx';
import EnquirySubmitted from './pages/EnquirySubmitted.jsx';
import Events from './pages/Events.jsx';
import Event from './pages/Event.jsx';
import EventRegister from './pages/EventRegister.jsx';
import RegistrationConfirmed from './pages/RegistrationConfirmed.jsx';
import Community from './pages/Community.jsx';
import Members from './pages/Members.jsx';
import Member from './pages/Member.jsx';
import SuccessStories from './pages/SuccessStories.jsx';
import Story from './pages/Story.jsx';
import Faqs from './pages/Faqs.jsx';
import OurMembers from './pages/OurMembers.jsx';
import WhyHeh from './pages/WhyHeh.jsx';
import WhoCanJoin from './pages/WhoCanJoin.jsx';
import MemberVoices from './pages/MemberVoices.jsx';
import MembershipPlan from './pages/MembershipPlan.jsx';
import NotFound from './pages/NotFound.jsx';
import { STATIC } from './lib/static.js';

// The admin panel is its own bundle, loaded only at /admin/.
const Admin = lazy(() => import('./admin/Admin.jsx'));
// The Member Portal is its own bundle too, loaded only at /portal/.
const Portal = lazy(() => import('./portal/Portal.jsx'));
// /login: one sign-in page for members and admins.
const SignIn = lazy(() => import('./pages/SignIn.jsx'));

// Old addresses (/about.html, /index.html) go to the clean ones, keeping ?e=... etc.
function OldUrl() {
  const { pathname, search } = useLocation();
  const to = pathname.replace(/(index)?\.html$/, '') || '/';
  return <Navigate to={`${to}${search}`} replace />;
}

// Website-only build (lib/static.js): pages that need the API are not available; their addresses go home.
const OFF = ['admin/*', 'portal/*', 'login', 'membership-submitted', 'enquiry-submitted', 'events', 'past-events', 'event',
  'event-register', 'registration-confirmed', 'success-stories', 'story'];

function App() {
  if (STATIC) {
    return (
      <Routes>
        {OFF.map((p) => <Route key={p} path={p} element={<Navigate to="/" replace />} />)}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="membership" element={<Membership />} />
          <Route path="membership-apply" element={<MembershipApply />} />
          <Route path="contact" element={<Contact />} />
          <Route path="community" element={<Community />} />
          <Route path="members" element={<Members />} />
          <Route path="member" element={<Member />} />
          <Route path="faqs" element={<Faqs />} />
          <Route path="our-members" element={<OurMembers />} />
          <Route path="why-heh" element={<WhyHeh />} />
          <Route path="who-can-join" element={<WhoCanJoin />} />
          <Route path="member-voices" element={<MemberVoices />} />
          <Route path="membership-plan" element={<MembershipPlan />} />
          <Route path="*" element={<NotFoundOrOld />} />
        </Route>
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/admin/*" element={<Suspense fallback={null}><Admin /></Suspense>} />
      <Route path="/portal/*" element={<Suspense fallback={null}><Portal /></Suspense>} />
      <Route path="/login" element={<Suspense fallback={null}><SignIn /></Suspense>} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="membership" element={<Membership />} />
        <Route path="membership-apply" element={<MembershipApply />} />
        <Route path="membership-submitted" element={<MembershipSubmitted />} />
        <Route path="contact" element={<Contact />} />
        <Route path="enquiry-submitted" element={<EnquirySubmitted />} />
        <Route path="events" element={<Events when="upcoming" />} />
        <Route path="past-events" element={<Events when="past" />} />
        <Route path="event" element={<Event />} />
        <Route path="event-register" element={<EventRegister />} />
        <Route path="registration-confirmed" element={<RegistrationConfirmed />} />
        <Route path="community" element={<Community />} />
        <Route path="members" element={<Members />} />
        <Route path="member" element={<Member />} />
        <Route path="success-stories" element={<SuccessStories />} />
        <Route path="story" element={<Story />} />
        <Route path="faqs" element={<Faqs />} />
        <Route path="our-members" element={<OurMembers />} />
        <Route path="why-heh" element={<WhyHeh />} />
        <Route path="who-can-join" element={<WhoCanJoin />} />
        <Route path="member-voices" element={<MemberVoices />} />
        <Route path="membership-plan" element={<MembershipPlan />} />
        <Route path="*" element={<NotFoundOrOld />} />
      </Route>
    </Routes>
  );
}

function NotFoundOrOld() {
  const { pathname } = useLocation();
  return pathname.endsWith('.html') ? <OldUrl /> : <NotFound />;
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
