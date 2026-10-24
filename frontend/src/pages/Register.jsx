import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api";

export default function Register() {
const navigate = useNavigate();

const [formData, setFormData] = useState({
name: "",
email: "",
password: "",
});

const [error, setError] = useState("");
const [success, setSuccess] = useState("");
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
setSuccess("");

if (formData.password.length < 8) {
  setError("Password must contain at least 8 characters.");
  return;
}

try {
  setLoading(true);

  const response = await axios.post(`${API_URL}/register`, {
    name: formData.name.trim(),
    email: formData.email.trim(),
    password: formData.password,
  });

  setSuccess(response.data.message || "Account created successfully!");

  setTimeout(() => {
    navigate("/login");
  }, 1200);
} catch (err) {
  setError(
    err.response?.data?.message ||
      err.response?.data?.error ||
      "Registration failed. Check that the backend is running."
  );
} finally {
  setLoading(false);
}


}

return ( <div className="auth-page"> <nav className="auth-navbar"> <Link to="/" className="auth-brand"> <span className="brand-icon">B</span>
BugTrack </Link> </nav>

  <main className="auth-container">
    <h1>Create an account</h1>
    <p className="auth-description">
      Start organizing your projects and tracking bugs.
    </p>

    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-field">
        <label htmlFor="name">Full name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Your full name"
          autoComplete="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

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
          placeholder="Create a password"
          autoComplete="new-password"
          minLength={8}
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

      {success && (
        <p role="status" style={{ color: "#15803d" }}>
          {success}
        </p>
      )}

      <button
        type="submit"
        className="auth-submit"
        disabled={loading}
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>
    </form>

    <p className="auth-footer">
      Already have an account? <Link to="/login">Login</Link>
    </p>
  </main>
</div>


);
}
