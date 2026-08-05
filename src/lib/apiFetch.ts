const origFetch = window.fetch.bind(window);
let refreshPromise: Promise<string> | null = null;

function storeUser(userData: any) {
  const user = localStorage.getItem("user");
  if (user && userData) {
    try { localStorage.setItem("user", JSON.stringify({ ...JSON.parse(user), ...userData })); } catch {}
  }
}

// Dedupe concurrent refreshes (refresh tokens are one-time use)
async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return Promise.reject({ invalid: true });
    refreshPromise = origFetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (r.status === 401) throw { invalid: true }; // refresh token expired/revoked → real logout
        if (!r.ok || !data.token) throw { invalid: false }; // transient server error → keep session
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken || "");
        storeUser(data.user);
        return data.token;
      })
      .catch((e) => {
        // Network failure (offline, timeout): keep the session, don't log out.
        if (e && e.invalid === undefined) throw { invalid: false };
        throw e;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export function installAuthFetch() {
  window.fetch = async (input, init) => {
    const token = localStorage.getItem("token");
    const adminSecret = localStorage.getItem("adminSecret");
    const headers: any = { ...(init?.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (adminSecret) headers["x-admin-secret"] = adminSecret;

    let res = await origFetch(input, { ...init, headers });

    if (res.status === 401 && token && typeof input === "string" && !input.includes("/api/auth/login") && !input.includes("/api/auth/refresh")) {
      try {
        const newToken = await refreshAccessToken();
        const headers2: any = { ...(init?.headers || {}) };
        headers2["Authorization"] = `Bearer ${newToken}`;
        res = await origFetch(input, { ...init, headers: headers2 });
      } catch (e: any) {
        // Only log out when the refresh token is genuinely invalid/revoked.
        // Transient network/server errors must NOT clear the session (mobile data is flaky).
        if (e && e.invalid) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          if (window.location.pathname !== "/login") window.location.href = "/login";
        }
      }
    }
    return res;
  };
}

export function setAuthTokens(token: string, refreshToken: string, user?: any) {
  localStorage.setItem("token", token);
  localStorage.setItem("refreshToken", refreshToken);
  if (user) localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}
