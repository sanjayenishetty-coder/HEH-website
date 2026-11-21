import { Link } from 'react-router-dom';
import { useTitle } from '../lib/hooks.js';

export default function NotFound() {
  useTitle('Page not found | Hyderabad Entrepreneurs Hub');
  return (
    <section className="section">
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <h1 className="title">Page not found</h1>
        <p style={{ margin: '14px 0 24px' }}>The page you are looking for does not exist or has moved.</p>
        <Link className="btn btn-primary" to="/">Go to Home</Link>
      </div>
    </section>
  );
}
