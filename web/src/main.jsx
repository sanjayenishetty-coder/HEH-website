import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './styles.css';
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
import NotFound from './pages/NotFound.jsx';

// The admin panel is its own bundle, loaded only at /admin/.
const Admin = lazy(() => import('./admin/Admin.jsx'));

// Old addresses (/about.html, /index.html) go to the clean ones, keeping ?e=... etc.
function OldUrl() {
  const { pathname, search } = useLocation();
  const to = pathname.replace(/(index)?\.html$/, '') || '/';
  return <Navigate to={`${to}${search}`} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<Suspense fallback={null}><Admin /></Suspense>} />
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
