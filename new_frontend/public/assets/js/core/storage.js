export function readStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function authToken() {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

export function saveSession(data) {
  if (typeof data?.token !== "string" || !data.token || !data.user) {
    throw new Error("invalid_response");
  }
  try {
    writeStorage("auth_user", data.user);
    localStorage.setItem("auth_token", data.token);
  } catch {
    clearSession();
    throw new Error("storage_unavailable");
  }
  document.dispatchEvent(new CustomEvent("auth:changed"));
}

export function clearSession() {
  try {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  } catch {
    /* Storage may be disabled by the browser. */
  }
  document.dispatchEvent(new CustomEvent("auth:changed"));
}
