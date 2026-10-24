import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api";

export default function Account() {
const navigate = useNavigate();
const [user, setUser] = useState(null);
const [error, setError] = useState("");
const [loading, setLoading] = useState(true);

useEffect(() => {
async function loadAccount() {
try {
const response = await axios.get(`${API_URL}/account`, {
withCredentials: true,
});


    setUser(response.data.user);
  } catch (err) {
    if (err.response?.status === 401) {
      navigate("/login", { replace: true });
      return;
    }

    setError("Could not load account details.");
  } finally {
    setLoading(false);
  }
}

loadAccount();


}, [navigate]);

return ( <div className="auth-page"> <nav className="auth-navbar"> <Link to="/dashboard" className="auth-brand"> <span className="brand-icon">B</span>
BugTrack </Link> </nav>

  <main className="auth-container">
    <h1>My Account</h1>
    <p className="auth-description">
      View your BugTrack account details.
    </p>

    {loading && <p>Loading account...</p>}

    {error && <p role="alert">{error}</p>}

    {user && (
      <div className="auth-form">
        <div className="auth-field">
          <label>Full name</label>
          <input value={user.name} readOnly />
        </div>

        <div className="auth-field">
          <label>Email address</label>
          <input value={user.email} readOnly />
        </div>

        <div className="auth-field">
          <label>User ID</label>
          <input value={user.id} readOnly />
        </div>

        <button
          className="auth-submit"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    )}
  </main>
</div>

);
}