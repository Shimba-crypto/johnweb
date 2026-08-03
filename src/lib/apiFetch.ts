const origFetch = window.fetch.bind(window);

export function installAuthFetch() {
  window.fetch = async (input, init) => {
    const token = localStorage.getItem("token");
    const adminSecret = localStorage.getItem("adminSecret");
    const headers: any = { ...(init?.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (adminSecret) headers["x-admin-secret"] = adminSecret;

    const res = await origFetch(input, { ...init, headers });

    if (res.status === 401 && token && typeof input === "string" && !input.includes("/api/auth/login") && !input.includes("/api/auth/refresh")) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const rr = await origFetch("/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          if (rr.ok) {
            const data = await rr.json();
            localStorage.setItem("token", data.token);
            localStorage.setItem("refreshToken", data.refreshToken);
            const user = localStorage.getItem("user");
            if (user && data.user) {
              try { localStorage.setItem("user", JSON.stringify({ ...JSON.parse(user), ...data.user })); } catch {}
            }
            const headers2: any = { ...(init?.headers || {}) };
            headers2["Authorization"] = `Bearer ${data.token}`;
            return origFetch(input, { ...init, headers: headers2 });
          }
        } catch {}
      }
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      if (window.location.pathname !== "/login") window.location.href = "/login";
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
