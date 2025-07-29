// Get the token from local storage
export const getAuthToken = () => {
  return (
    localStorage.getItem("sb-ftnicgwmghquikbwwxql-auth-token") ||
    localStorage.getItem("sb-auth-token")
  );
};

// Set the token in local storage
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("sb-ftnicgwmghquikbwwxql-auth-token", token);
  } else {
    localStorage.removeItem("sb-ftnicgwmghquikbwwxql-auth-token");
    localStorage.removeItem("sb-auth-token");
  }
};

// Get current user from session storage
export const getCurrentUser = () => {
  const userStr = sessionStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

// Set current user in session storage
export const setCurrentUser = (user) => {
  if (user) {
    sessionStorage.setItem("user", JSON.stringify(user));
  } else {
    sessionStorage.removeItem("user");
  }
};

// Get auth header
export const authHeader = () => {
  const token = getAuthToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
  return {
    "Content-Type": "application/json",
  };
};
