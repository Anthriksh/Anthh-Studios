"use client";

import { useEffect, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const session = await fetch("/api/admin/session", { cache: "no-store" }).then((r) => r.json());
        if (session.authenticated) {
          window.location.replace("/studio");
          return;
        }
        const pk = await fetch("/api/admin/passkey/auth-options", { cache: "no-store" });
        setPasskeyAvailable(pk.ok);
      } catch {}
      setLoading(false);
    })();
  }, []);

  async function login(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Login failed (${res.status})`);
      window.location.replace("/studio");
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  async function loginWithTouchID() {
    setPasskeyLoading(true);
    setError("");
    try {
      const optionsRes = await fetch("/api/admin/passkey/auth-options", { cache: "no-store" });
      const options = await optionsRes.json();
      if (!optionsRes.ok) throw new Error(options.error || "Touch ID is not enrolled.");
      const credential = await startAuthentication({ optionsJSON: options });
      const verifyRes = await fetch("/api/admin/passkey/auth-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credential),
      });
      const data = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) throw new Error(data.error || "Touch ID verification failed.");
      window.location.replace("/studio");
    } catch (e) {
      setError(e.message || "Touch ID was cancelled or unavailable.");
      setPasskeyLoading(false);
    }
  }

  if (loading) return <main style={styles.page}><div style={styles.card}>CHECKING SESSION…</div></main>;

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.kicker}>ANTHH / STUDIO</div>
        <h1 style={styles.title}>Private access.</h1>
        <p style={styles.copy}>Sign in once. Your Studio session stays active for 30 days on this browser.</p>

        {passkeyAvailable && (
          <>
            <button type="button" onClick={loginWithTouchID} disabled={passkeyLoading} style={styles.touchButton}>
              {passkeyLoading ? "WAITING FOR TOUCH ID…" : "USE TOUCH ID / PASSKEY"}
            </button>
            <div style={styles.or}><span>OR USE PASSWORD</span></div>
          </>
        )}

        <form onSubmit={login} style={styles.form}>
          <label style={styles.label}>ADMIN PASSWORD</label>
          <input
            autoFocus={!passkeyAvailable}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            autoComplete="current-password"
          />
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" disabled={!password || loading} style={styles.button}>
            {loading ? "SIGNING IN…" : "ENTER STUDIO"}
          </button>
        </form>
        <a href="/" style={styles.back}>← VIEW PUBLIC SITE</a>
      </div>
    </main>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d0d0d", color: "#f3f0e8", padding: 24, fontFamily: "Arial, Helvetica, sans-serif" },
  card: { width: "min(520px, 100%)", border: "1px solid #303030", padding: "clamp(28px, 6vw, 56px)" },
  kicker: { fontSize: 11, letterSpacing: ".18em", opacity: .6 },
  title: { fontSize: "clamp(42px, 8vw, 72px)", fontWeight: 400, lineHeight: .95, margin: "14px 0" },
  copy: { color: "#999", lineHeight: 1.6, marginBottom: 34 },
  form: { display: "grid", gap: 12 },
  label: { fontSize: 10, letterSpacing: ".14em", color: "#aaa" },
  input: { width: "100%", boxSizing: "border-box", background: "#151515", color: "#fff", border: "1px solid #444", padding: "15px 14px", outline: "none", fontSize: 16 },
  error: { background: "#281616", border: "1px solid #6f3333", color: "#ffb7b7", padding: 12, fontSize: 13 },
  button: { border: 0, background: "#f3f0e8", color: "#0d0d0d", padding: "16px", fontWeight: 700, letterSpacing: ".13em", cursor: "pointer", marginTop: 4 },
  touchButton: { width: "100%", border: "1px solid #f3f0e8", background: "transparent", color: "#f3f0e8", padding: "16px", fontWeight: 700, letterSpacing: ".11em", cursor: "pointer", marginBottom: 20 },
  or: { textAlign: "center", color: "#666", fontSize: 10, letterSpacing: ".12em", margin: "0 0 20px" },
  back: { display: "inline-block", marginTop: 28, color: "#999", fontSize: 11, letterSpacing: ".12em", textDecoration: "none" },
};
