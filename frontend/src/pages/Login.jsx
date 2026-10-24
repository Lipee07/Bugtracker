import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api";

export default function Login() {
const navigate = useNavigate();

const [formData, setFormData] = useState({
email: "",
password: "",
});

const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

function handleChange(event) {
setFormData({
...formData,
[event.target.name]: event.target.value,
});
}

async function handleSubmit(event) {
event.preventDefault();
setError("");
setLoading(true);

try {
  await axios.post(
    `${API_URL}/login`,
    {
      email: formData.email.trim(),
      password: formData.password,
    },
    {
      withCredentials: true,
    }
  );

  navigate("/dashboard");
} catch (err) {
  setError(
    err.response?.data?.message ||
      err.response?.data?.error ||
      "Login failed. Check your credentials and backend."
  );
} finally {
  setLoading(false);
}


}

return ( <div className="auth-page"> <nav className="auth-navbar"> <Link to="/" className="auth-brand"> <span className="brand-icon">B</span>
BugTrack </Link> </nav>

  <main className="auth-container">
    <h1>Welcome back</h1>

    <p className="auth-description">
      Sign in to manage your projects and track bugs.
    </p>

    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>

      {error && (
        <p role="alert" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        className="auth-submit"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>

    <p className="auth-footer">
      Don't have an account? <Link to="/register">Create account</Link>
    </p>
  </main>
</div>


);
}
