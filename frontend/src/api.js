
const API_URL =
  "https://student-assignment-management-system-g3cd.onrender.com/api/assignments";
const AUTH_URL =
  "https://student-assignment-management-system-g3cd.onrender.com/api/auth";

// Register a student
export async function registerUser(name, email, password) {
  return sendRequest(`${AUTH_URL}/register`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

// Log in a student
export async function loginUser(email, password) {
  return sendRequest(`${AUTH_URL}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Common request function
async function sendRequest(url, options = {}, token = null) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

// Get assignments
export function getAssignments(token) {
  return sendRequest(API_URL, {}, token);
}

// Add assignment
export function addAssignment(assignment, token) {
  return sendRequest(
    API_URL,
    {
      method: "POST",
      body: JSON.stringify(assignment),
    },
    token
  );
}

// Update assignment
export function updateAssignment(id, assignment, token) {
  return sendRequest(
    `${API_URL}/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(assignment),
    },
    token
  );
}

// Delete assignment
export function deleteAssignment(id, token) {
  return sendRequest(
    `${API_URL}/${id}`,
    {
      method: "DELETE",
    },
    token
  );
}
