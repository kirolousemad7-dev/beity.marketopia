"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginFormData } from "@/lib/schemas";
import { login } from "@/lib/actions/login";
import Alert from "./alert";
import PageLoading from "./page-loading";
import { Dictionary } from "@/i18n/getDictionary";
import { arrow } from "@/lib/helper_functions";

export function LoginForm({lang, dict}: {lang: 'ar' | 'en', dict: Dictionary}) {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginFormData) => {
    setStatus(null);
    try {
      const result = await login(data);

      if (result.success) {
        const data = result.data!;
        if (data.token) {
          try {
            localStorage.setItem("auth_token", data.token);
            if (data.user) {
              localStorage.setItem("auth_user", JSON.stringify(data.user));
            }
          } catch (storageErr) {
            console.warn("Could not save token to localStorage:", storageErr);
          }
        }

        setStatus({
          type: "success",
          text: result.message || "Signed in successfully! Redirecting...",
        });

        setTimeout(() => {
          router.push(`/${lang}/account`);
          router.refresh();
        }, 500);
      } else {
        setStatus({
          type: "error",
          text: result.message || "Failed to sign in. Please verify your credentials.",
        });
      }
    } catch {
      setStatus({
        type: "error",
        text: "Network error: Unable to connect to the login service.",
      });
    }
  };

  useEffect(() => {
    if (localStorage.getItem('auth_token')) {
      redirect(`/${lang}/account`)
    }
    setLoading(false)
  })

  return ( loading
    ? <PageLoading />
    : <div className="auth-card">
      <div className="auth-card__header">
        <h1 className="auth-card__title">{dict.auth.welcome_back}</h1>
        <p className="auth-card__description">
          {dict.auth.sign_in_slogan}
        </p>
      </div>

      {status && <Alert type={status.type} text={status.text} /> }

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        {/* Email Address */}
        <div className="form-group">
          <label htmlFor="login-email" className="form-label">
            {dict.auth.email}
            <span className="form-label__required" aria-hidden="true">*</span>
          </label>
          <div className="form-input-wrapper">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className={`form-input ${errors.email ? "form-input--error" : ""}`}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <span id="login-email-error" className="form-error" role="alert">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password */}
        <div className="form-group">
          <label htmlFor="login-password" className="form-label">
            {dict.auth.password}
            <span className="form-label__required" aria-hidden="true">*</span>
          </label>
          <div className="form-input-wrapper">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              className={`form-input form-input--has-action ${errors.password ? "form-input--error" : ""}`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="form-input__toggle-btn"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <span id="login-password-error" className="form-error" role="alert">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={isSubmitting} className="auth-form__submit-btn">
          {isSubmitting ? (
            <span className="auth-form__submitting-state">
              <svg className="spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" />
              </svg>
              <span>{dict.auth.login_loading}</span>
            </span>
          ) : (

            <span>{dict.auth.login} {arrow(lang)}</span>
          )}
        </button>
      </form>

      <div className="auth-card__footer">
        <p className="auth-card__login-prompt">
          {dict.auth.dont_have_account}
          <Link href={`/${lang}/register`} className="auth-card__login-link">
            {dict.auth.register}
          </Link>
        </p>
      </div>
    </div>
  );
}
