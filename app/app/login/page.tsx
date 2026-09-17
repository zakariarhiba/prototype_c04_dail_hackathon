"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TransitionOverlay from "../components/TransitionOverlay";
import { EyeIcon, EyeOffIcon } from "../components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlayName, setOverlayName] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSigningIn(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
      setSigningIn(false);
      return;
    }
    setOverlayName(data.user.name);
  }

  return (
    <div className="login-screen">
      <TransitionOverlay
        active={overlayName !== null}
        label={`Signing in as ${overlayName ?? ""}`}
        durationMs={1000}
        onDone={() => router.push("/dashboard")}
      />
      <div className="login-screen__visual">
        <div className="login-screen__visual-text">
          <h1>trast</h1>
          <p>Case C04 &middot; delivery vs. invoice reconciliation, synthetic data.</p>
        </div>
      </div>
      <div className="login-screen__panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <Image src="/trast-logo.png" alt="trast digital GmbH" width={140} height={46} priority />
          <p className="login-card__intro">Log in to access your workspace.</p>

          <div className="champ">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              autoFocus
              disabled={signingIn}
            />
          </div>

          <div className="champ">
            <label htmlFor="login-password">Password</label>
            <div className="login-card__password">
              <input
                id="login-password"
                name="c04-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                disabled={signingIn}
              />
              <button
                type="button"
                className="login-card__reveal"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
                disabled={signingIn}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && (
            <p className="login-card__note" style={{ color: "var(--color-danger)" }}>
              {error}
            </p>
          )}

          <button type="submit" className="bouton login-card__submit" disabled={signingIn}>
            {signingIn ? "Signing in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
