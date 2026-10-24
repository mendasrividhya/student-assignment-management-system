
import { useEffect, useState } from "react";
import {
  getAssignments,
  addAssignment,
  updateAssignment,
  deleteAssignment,
  registerUser,
  loginUser,
} from "./api";
import "./App.css";

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || ""
  );
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: "",
    dueDate: "",
    status: "Pending",
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  async function loadAssignments() {
    if (!token) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setError("");
      const data = await getAssignments(token);
      setAssignments(data);
    } catch (err) {
      setError(err.message || "Could not load assignments.");

      if (err.message.toLowerCase().includes("session")) {
        localStorage.removeItem("token");
        setToken("");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      setLoading(true);
      loadAssignments();
    } else {
      setAssignments([]);
      setLoading(false);
    }
  }, [token]);

  function handleAuthChange(event) {
    setAuthForm({
      ...authForm,
      [event.target.name]: event.target.value,
    });
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    try {
      setAuthLoading(true);
      setError("");
      setMessage("");

      if (authMode === "register") {
        const result = await registerUser(
          authForm.name,
          authForm.email,
          authForm.password
        );

        setAuthMode("login");
        setAuthForm({
          name: "",
          email: authForm.email,
          password: "",
        });
        setMessage(
          result.message || "Registration successful. Please log in."
        );
      } else {
        const result = await loginUser(
          authForm.email,
          authForm.password
        );

        localStorage.setItem("token", result.token);
        setToken(result.token);
        setAuthForm({
          name: "",
          email: "",
          password: "",
        });
        setMessage("");
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setAssignments([]);
    resetForm();
    setError("");
    setMessage("");
    setAuthMode("login");
  }

  const filteredAssignments = assignments.filter((assignment) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      (assignment.title || "").toLowerCase().includes(search) ||
      (assignment.subject || "").toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "All" || assignment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  function resetForm() {
    setForm({
      title: "",
      subject: "",
      description: "",
      dueDate: "",
      status: "Pending",
    });
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");

      if (editingId) {
        await updateAssignment(editingId, form, token);
      } else {
        await addAssignment(form, token);
      }

      resetForm();
      await loadAssignments();
    } catch (err) {
      setError(err.message || "Could not save assignment.");
    }
  }

  function handleEdit(assignment) {
    setForm({
      title: assignment.title,
      subject: assignment.subject,
      description: assignment.description || "",
      dueDate: assignment.dueDate
        ? assignment.dueDate.split("T")[0]
        : "",
      status: assignment.status,
    });

    setEditingId(assignment._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this assignment?")) {
      return;
    }

    try {
      setError("");
      await deleteAssignment(id, token);

      if (editingId === id) {
        resetForm();
      }

      await loadAssignments();
    } catch (err) {
      setError(err.message || "Could not delete assignment.");
    }
  }

  if (!token) {
    return (
      <div className="app">
        <header className="header">
          <div>
            <p className="eyebrow">STUDENT WORKSPACE</p>
            <h1>Assignment Manager</h1>
            <p className="subtitle">
              Organize your assignments. Stay ahead of deadlines.
            </p>
          </div>
          <div className="header-icon">✓</div>
        </header>

        <main className="container">
          <section className="panel">
            <h2>
              {authMode === "login" ? "Student Login" : "Create Account"}
            </h2>
            <p>
              {authMode === "login"
                ? "Log in to manage your assignments."
                : "Register to create your student account."}
            </p>

            {error && <p className="error">{error}</p>}
            {message && <p>{message}</p>}

            <form onSubmit={handleAuthSubmit} className="assignment-form">
              {authMode === "register" && (
                <div className="form-group full-width">
                  <label htmlFor="auth-name">Full Name *</label>
                  <input
                    id="auth-name"
                    name="name"
                    value={authForm.name}
                    onChange={handleAuthChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div className="form-group full-width">
                <label htmlFor="auth-email">Email *</label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  value={authForm.email}
                  onChange={handleAuthChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="auth-password">Password *</label>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  value={authForm.password}
                  onChange={handleAuthChange}
                  placeholder="At least 8 characters"
                  autoComplete={
                    authMode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  minLength={8}
                  required
                />
              </div>

              <div className="form-actions full-width">
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={authLoading}
                >
                  {authLoading
                    ? "Please wait..."
                    : authMode === "login"
                    ? "Log In"
                    : "Register"}
                </button>

                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => {
                    setAuthMode(
                      authMode === "login" ? "register" : "login"
                    );
                    setError("");
                    setMessage("");
                  }}
                >
                  {authMode === "login"
                    ? "Create an Account"
                    : "Back to Login"}
                </button>
              </div>
            </form>
          </section>
        </main>

        <footer className="footer">
          Student Assignment Management System
        </footer>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">STUDENT WORKSPACE</p>
          <h1>Assignment Manager</h1>
          <p className="subtitle">
            Organize your assignments. Stay ahead of deadlines.
          </p>
        </div>
        <div className="header-icon">✓</div>
        <button
          className="secondary-btn"
          type="button"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </header>

      <main className="container">
        <section className="stats">
          <div className="stat-card">
            <span>Total Assignments</span>
            <h2>{assignments.length}</h2>
          </div>

          <div className="stat-card">
            <span>Pending</span>
            <h2>
              {assignments.filter((a) => a.status === "Pending").length}
            </h2>
          </div>

          <div className="stat-card">
            <span>In Progress</span>
            <h2>
              {assignments.filter((a) => a.status === "In Progress").length}
            </h2>
          </div>

          <div className="stat-card">
            <span>Completed</span>
            <h2>
              {assignments.filter((a) => a.status === "Completed").length}
            </h2>
          </div>
        </section>

        {error && <p className="error">{error}</p>}

        <section className="panel">
          <h2>{editingId ? "Edit Assignment" : "Add New Assignment"}</h2>

          <form onSubmit={handleSubmit} className="assignment-form">
            <div className="form-group">
              <label htmlFor="title">Assignment Title *</label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Data Structures Lab"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="e.g. Advanced Data Structures"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Due Date *</label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Add assignment instructions or notes..."
                rows="3"
              />
            </div>

            <div className="form-actions full-width">
              <button className="primary-btn" type="submit">
                {editingId ? "Save Changes" : "Add Assignment"}
              </button>

              {editingId && (
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="assignments-section">
          <div className="section-heading">
            <div>
              <h2>Your Assignments</h2>
              <p>Keep track of your academic work.</p>
            </div>

            <span className="count">
              {filteredAssignments.length} shown
            </span>
          </div>

          <div className="filters">
            <input
              type="text"
              placeholder="Search by title or subject..."
              aria-label="Search assignments"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {loading ? (
            <p className="empty-state">Loading assignments...</p>
          ) : filteredAssignments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>
                {assignments.length === 0
                  ? "No assignments yet"
                  : "No matching assignments"}
              </h3>
              <p>
                {assignments.length === 0
                  ? "Add your first assignment using the form above."
                  : "Try another search term or status filter."}
              </p>

              {assignments.length > 0 && (
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All");
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="assignment-list">
              {filteredAssignments.map((assignment) => (
                <article className="assignment-card" key={assignment._id}>
                  <div className="assignment-info">
                    <div className="assignment-title-row">
                      <h3>{assignment.title}</h3>
                      <span
                        className={`status status-${(
                          assignment.status || "Pending"
                        )
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {assignment.status}
                      </span>
                    </div>

                    <p className="subject">{assignment.subject}</p>

                    {assignment.description && (
                      <p className="description">
                        {assignment.description}
                      </p>
                    )}

                    <p className="due-date">
                      Due:{" "}
                      {new Date(assignment.dueDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        }
                      )}
                    </p>
                  </div>

                  <div className="card-actions">
                    <button
                      className="edit-btn"
                      type="button"
                      onClick={() => handleEdit(assignment)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      type="button"
                      onClick={() => handleDelete(assignment._id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        Student Assignment Management System
      </footer>
    </div>
  );
}

export default App;
