import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";



const API_URL = "http://127.0.0.1:5000/api";

function Dashboard() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Bug reporting form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    project_id: "",
  });

  // Fetch all bugs
  async function loadBugs() {
    try {
      const response = await axios.get(`${API_URL}/bugs`);
      setBugs(response.data);
      setError("");
    } catch (err) {
      setError("Could not load bugs. Check whether the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  // Fetch all projects
  async function loadProjects() {
    try {
      const response = await axios.get(`${API_URL}/projects`);
      setProjects(response.data);
    } catch (err) {
      setError("Could not load projects. Check whether the backend is running.");
    }
  }

  // Check backend and load data when the dashboard opens
  useEffect(() => {
    axios
      .get(`${API_URL}/health`)
      .then((response) => {
        setBackendStatus(response.data.message);
      })
      .catch(() => {
        setBackendStatus("Backend unavailable");
      });

    loadBugs();
    loadProjects();
  }, []);

  // Handle changes in the bug form
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Submit a new bug
  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...formData,
        project_id: formData.project_id
          ? Number(formData.project_id)
          : null,
      };

      const response = await axios.post(`${API_URL}/bugs`, payload);

      setMessage(response.data.message || "Bug created successfully!");

      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        project_id: "",
      });

      setShowForm(false);

      await loadBugs();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to report the bug. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Create a new project
  async function handleProjectSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await axios.post(`${API_URL}/projects`, {
        name: projectName,
        description: projectDescription,
      });

      setMessage(response.data.message || "Project created successfully!");

      setProjectName("");
      setProjectDescription("");
      setShowProjectForm(false);

      await loadProjects();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not create the project."
      );
    }
  }

  // Update the status of a bug
  async function updateStatus(bugId, newStatus) {
    setMessage("");
    setError("");

    try {
      await axios.patch(`${API_URL}/bugs/${bugId}/status`, {
        status: newStatus,
      });

      setMessage("Bug status updated successfully!");

      await loadBugs();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to update the bug status."
      );
    }
  }

  // Delete a bug
  async function deleteBug(bugId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this bug?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await axios.delete(`${API_URL}/bugs/${bugId}`);

      setMessage("Bug deleted successfully!");

      await loadBugs();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to delete the bug."
      );
    }
  }

  async function handleLogout() {
  try {
    await axios.post(
      `${API_URL}/logout`,
      {},
      { withCredentials: true }
    );

    navigate("/login", { replace: true });
  } catch (error) {
    console.error("Logout failed:", error);
    alert("Could not log out. Please try again.");
  }
}

  // Dashboard statistics
  const totalBugs = bugs.length;

  const openBugs = bugs.filter(
    (bug) => bug.status === "Open"
  ).length;

  const inProgressBugs = bugs.filter(
    (bug) => bug.status === "In Progress"
  ).length;

  const resolvedBugs = bugs.filter(
    (bug) => bug.status === "Resolved"
  ).length;

  // Find a project's name using its ID
  function getProjectName(projectId) {
    const project = projects.find(
      (item) => Number(item.id) === Number(projectId)
    );

    return project ? project.name : "No project assigned";
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">B</div>
          <h2>BugTrack</h2>
        </div>

        <div className="account-actions">
  <button onClick={() => navigate("/account")}>
    Account
  </button>

  <button onClick={handleLogout}>
    Logout
  </button>
</div>

        <p className="menu-heading">WORKSPACE</p>

        <nav className="navigation">
          <a href="#dashboard" className="nav-item active">
            <span>▦</span> Dashboard
          </a>

          <a href="#projects" className="nav-item">
            <span>▣</span> Projects
          </a>

          <a href="#issues" className="nav-item">
            <span>◉</span> All Issues
          </a>

          <a href="#tasks" className="nav-item">
            <span>☑</span> My Tasks
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">U</div>

          <div>
            <strong>My Workspace</strong>
            <p>BugTrack Project</p>
          </div>
        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / Overview</p>
            <h1>Dashboard</h1>
          </div>

          <div className="topbar-right">
            <span className="status-dot"></span>

            <span className="connection-status">
              {backendStatus}
            </span>
          </div>
        </header>

        {/* Welcome Section */}
        <section className="welcome-section">
          <div>
            <p className="eyebrow">PROJECT OVERVIEW</p>

            <h2>Welcome to BugTrack 👋</h2>

            <p>
              Track issues, collaborate with your team, and ship better
              software.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              setMessage("");
              setError("");
              setShowForm(!showForm);
            }}
          >
            + Report an Issue
          </button>
        </section>

        {/* Projects Section */}
        <section
          className="content-card project-section"
          id="projects"
        >
          <div className="card-header">
            <div>
              <h2>My Projects</h2>
              <p>Organize your bugs by project.</p>
            </div>

            <button
              className="primary-button"
              onClick={() => {
                setShowProjectForm(!showProjectForm);
                setMessage("");
                setError("");
              }}
            >
              + New Project
            </button>
          </div>

          {showProjectForm && (
            <form
              onSubmit={handleProjectSubmit}
              className="bug-form"
            >
              <label htmlFor="projectName">Project Name</label>

              <input
                id="projectName"
                value={projectName}
                onChange={(event) =>
                  setProjectName(event.target.value)
                }
                placeholder="e.g. E-Commerce Website"
                maxLength={150}
                required
              />

              <label htmlFor="projectDescription">
                Description
              </label>

              <textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(event) =>
                  setProjectDescription(event.target.value)
                }
                placeholder="Describe your project..."
                rows={3}
              />

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowProjectForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Create Project
                </button>
              </div>
            </form>
          )}

          <div className="projects-grid">
            {projects.length === 0 ? (
              <p className="projects-empty">
                No projects yet. Create your first project!
              </p>
            ) : (
              projects.map((project) => (
                <article
                  className="project-card"
                  key={project.id}
                >
                  <div className="project-icon">▣</div>

                  <h3>{project.name}</h3>

                  <p>
                    {project.description ||
                      "No description provided."}
                  </p>

                  <span>Project #{project.id}</span>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Success and Error Messages */}
        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Report Bug Form */}
        {showForm && (
          <section className="content-card report-form-card">
            <div className="card-header">
              <div>
                <h2>Report a Bug</h2>
                <p>Describe the issue you discovered.</p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bug-form"
            >
              <label htmlFor="title">Bug Title</label>

              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Login button is not working"
                value={formData.title}
                onChange={handleChange}
                maxLength={200}
                required
              />

              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                placeholder="Explain what happened and how to reproduce it..."
                value={formData.description}
                onChange={handleChange}
                rows={5}
                required
              />

              {/* New Project Dropdown */}
              <label htmlFor="project_id">Project</label>

              <select
                id="project_id"
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select a project
                </option>

                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </option>
                ))}
              </select>

              <label htmlFor="priority">Priority</label>

              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Bug"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Statistics */}
        <section className="statistics-grid">
          {[
            {
              title: "Total Issues",
              number: totalBugs,
              symbol: "▤",
            },
            {
              title: "Open Issues",
              number: openBugs,
              symbol: "◷",
            },
            {
              title: "In Progress",
              number: inProgressBugs,
              symbol: "⚙",
            },
            {
              title: "Resolved",
              number: resolvedBugs,
              symbol: "✓",
            },
          ].map((item) => (
            <article
              className="stat-card"
              key={item.title}
            >
              <div className="stat-top">
                <span>{item.title}</span>
                <span className="stat-symbol">
                  {item.symbol}
                </span>
              </div>

              <h3>{item.number}</h3>

              <p className="stat-description">
                Live database statistics
              </p>
            </article>
          ))}
        </section>

        {/* Recent Issues Table */}
        <section className="content-card" id="issues">
          <div className="card-header">
            <div>
              <h2>Recent Issues</h2>
              <p>Review and manage reported bugs.</p>
            </div>

            <button
              className="secondary-button"
              onClick={() => {
                loadBugs();
                loadProjects();
              }}
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ISSUE</th>
                  <th>PROJECT</th>
                  <th>STATUS</th>
                  <th>PRIORITY</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      Loading issues...
                    </td>
                  </tr>
                ) : bugs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      <div className="empty-icon">▤</div>
                      <strong>No issues yet</strong>
                      <p>
                        Click "Report an Issue" to create your first bug.
                      </p>
                    </td>
                  </tr>
                ) : (
                  bugs.map((bug) => (
                    <tr key={bug.id}>
                      <td>#{bug.id}</td>

                      <td>
                        <strong>{bug.title}</strong>

                        <p className="issue-description">
                          {bug.description}
                        </p>
                      </td>

                      <td>
                        {getProjectName(bug.project_id)}
                      </td>

                      <td>
                        <select
                          className="status-select"
                          value={bug.status}
                          onChange={(event) =>
                            updateStatus(
                              bug.id,
                              event.target.value
                            )
                          }
                          aria-label={`Change status for bug ${bug.id}`}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">
                            In Progress
                          </option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>

                      <td>
                        <span
                          className={`priority-badge ${
                            (bug.priority || "Medium").toLowerCase()
                          }`}
                        >
                          {bug.priority || "Medium"}
                        </span>
                      </td>

                      <td>
                        <button
                          className="delete-button"
                          onClick={() => deleteBug(bug.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="footer">
          BugTrack · Built for better software development
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;