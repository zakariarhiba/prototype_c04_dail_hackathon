"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "../components/Logo";
import TransitionOverlay from "../components/TransitionOverlay";
import { EyeIcon, EyeOffIcon } from "../components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const displayName = name.trim() || "Clerk on duty";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("c04_user_name", displayName);
    setSigningIn(true);
  }

  return (
    <div className="login-screen">
      <TransitionOverlay
        active={signingIn}
        label={`Signing in as ${displayName}`}
        durationMs={1000}
        onDone={() => router.push("/dashboard")}
      />
      <div className="login-screen__visual">
        <div className="login-screen__visual-text">
          <h1>Dockline</h1>
          <p>Case C04 &middot; delivery vs. invoice reconciliation, synthetic data.</p>
        </div>
      </div>
      <div className="login-screen__panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <Logo size={36} />
          <p className="login-card__intro">Log in to access your workspace.</p>

          <div className="champ">
            <label htmlFor="login-name">Name</label>
            <input
              id="login-name"
              name="c04-display-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Clerk on duty"
              autoComplete="off"
              autoFocus
              disabled={signingIn}
            />
          </div>

          <div className="champ">
            <label htmlFor="login-password">Password</label>
            <div className="login-card__password">
              <input
                id="login-password"
                name="c04-cosmetic-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Not checked, cosmetic only"
                autoComplete="new-password"
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

          <button type="submit" className="bouton login-card__submit" disabled={signingIn}>
            {signingIn ? "Signing in…" : "Log in"}
          </button>

          <p className="login-card__note">
            Simulated login: no real authentication. The name entered here
            stands in for the clerk / approver identity, per{" "}
            <code>docs/01-system-design.md</code>.
          </p>
        </form>
      </div>
    </div>
  );
}
