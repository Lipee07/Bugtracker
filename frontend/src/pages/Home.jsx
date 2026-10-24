import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home-page">
      <nav className="home-navbar">
        <Link to="/" className="home-brand">
          <span className="brand-icon">B</span>
          BugTrack
        </Link>

        <div className="home-nav-links">
          <Link to="/login" className="secondary-button">
            Login
          </Link>

          <Link to="/register" className="primary-button">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="home-hero">
        <div className="home-badge">
          Simple issue tracking for better software
        </div>

        <h1>
          Find bugs.
          <br />
          <span>Fix them faster.</span>
        </h1>

        <p>
          Organize projects, report issues, track progress, and keep
          your development work under control with BugTrack.
        </p>

        <div className="home-hero-actions">
          <Link to="/register" className="primary-button">
            Get Started Free →
          </Link>

          <Link to="/login" className="secondary-button">
            Sign In
          </Link>
        </div>

        <div className="home-features">
          <article>
            <div className="feature-icon">▣</div>
            <h3>Project Management</h3>
            <p>Keep your projects organized in one place.</p>
          </article>

          <article>
            <div className="feature-icon">◉</div>
            <h3>Bug Tracking</h3>
            <p>Report issues and assign priorities.</p>
          </article>

          <article>
            <div className="feature-icon">✓</div>
            <h3>Progress Tracking</h3>
            <p>Monitor bugs from open to resolved.</p>
          </article>
        </div>
      </main>

      <footer className="home-footer">
        © {new Date().getFullYear()} BugTrack. Built for better software.
      </footer>
    </div>
  );
}

