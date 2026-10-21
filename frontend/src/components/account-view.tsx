"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSessionUser, logoutAction } from "@/lib/actions/login";
import { UserProfile } from "@/lib/types";
import { Dictionary } from "@/i18n/getDictionary";

export function AccountView({ lang, dict }: { lang: 'ar' | 'en', dict: Dictionary }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      await logoutAction();
      router.push(`/${lang}/login`);
      router.refresh();
    } catch {
      router.push(`/${lang}/login`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getSessionUser();
        setUser(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadUsers();
  }, []);

  if (!user) {
    return (
      <div className="home-container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="auth-card" style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
          <div className="empty-state__icon" aria-hidden="true" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
            🔐
          </div>
          <h1 className="auth-card__title">Sign In to Your Account</h1>
          <p className="auth-card__description" style={{ marginBottom: "1.75rem" }}>
            {dict.auth.authorize_warning}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <Link href={`/${lang}/login`} className="hero__btn">
              {dict.auth.login}
            </Link>
            <Link
              href={`/${lang}/register`}
              className="hero__btn"
              style={{
                background: "transparent",
                color: "var(--color-ink)",
                borderColor: "var(--color-line)",
              }}
            >
              {dict.auth.register}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container account-page" style={{ maxWidth: "900px", padding: "2.5rem 1.5rem 5rem" }}>
      <div className="account-card">
        {/* Profile Header */}
        <div className="account-card__header">
          <div className="account-card__identity">
            <div className="account-avatar">
              <span>
                {user.name
                  ? user.name.charAt(0).toUpperCase()
                  : user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="account-info">
              <div className="account-badge">
                <span>{dict.auth.authenticated}</span>
              </div>
              <h1 className="account-name">{user.name || "Valued Customer"}</h1>
              <p className="account-email">{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="account-logout-btn">
            {isLoggingOut ? dict.auth.logout_loading : dict.auth.logout}
          </button>
        </div>

        {/* Security & Token Status */}
        {/* <div className="account-section">
          <h2 className="account-section__title">Authentication &amp; Outsource Token</h2>
          <div className="account-security-grid">
            <div className="account-security-card">
              <div className="account-security-card__icon">🛡️</div>
              <div>
                <span className="account-security-label">Session Token Status</span>
                <p className="account-security-value">Active &bull; Verified via External Identity Provider</p>
              </div>
            </div>
            <div className="account-security-card">
              <div className="account-security-card__icon">🔒</div>
              <div>
                <span className="account-security-label">Storage Method</span>
                <p className="account-security-value">HTTP-Only Cookie &bull; Client Local Storage Synced</p>
              </div>
            </div>
          </div>
        </div> */}

        {/* Quick Navigation */}
        <div className="account-section">
          <h2 className="account-section__title">{dict.auth.quick_access}</h2>
          <div className="account-tiles-grid">
            <Link href={`/${lang}/orders`} className="account-tile">
              <span className="account-tile__icon">📦</span>
              <h3 className="account-tile__title">{dict.auth.order_history}</h3>
              <p className="account-tile__desc">{dict.auth.order_history_desc}</p>
            </Link>
            <Link href={`/${lang}/cart`} className="account-tile">
              <span className="account-tile__icon">🛒</span>
              <h3 className="account-tile__title">{dict.auth.shopping_cart}</h3>
              <p className="account-tile__desc">{dict.auth.shopping_cart_desc}</p>
            </Link>
            <Link href={`/${lang}/products`} className="account-tile">
              <span className="account-tile__icon">⚡</span>
              <h3 className="account-tile__title">{dict.auth.appliance_catalog}</h3>
              <p className="account-tile__desc">{dict.auth.appliance_catalog_desc}</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
