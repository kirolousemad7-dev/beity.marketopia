"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema, RegisterFormData } from "@/lib/schemas";
import { submitForm } from "@/lib/actions/register";
import { Dictionary } from "@/i18n/getDictionary";
import { arrow } from "@/lib/helper_functions";

export function RegisterForm({lang, dict}: {lang: 'ar' | 'en', dict: Dictionary}) {
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
    details?: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validations, setValidations] = useState<Record<string, string[]> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: RegisterFormData) => {
    setStatus(null);
    try {
      const result = await submitForm(data);

      if (result.success) {
        setStatus({
          type: "success",
          text: result.message || "Your account has been registered successfully!",
        });
        reset();
      } else {
        setStatus({
          type: "error",
          text: result.message || "Unable to complete registration.",
        });

        if (result.errors) {
          setValidations(result.errors);
        }
      }
    } catch {
      setStatus({
        type: "error",
        text: "An unexpected error occurred. Please check your connection and try again.",
      });
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <h1 className="auth-card__title">{dict.auth.register_title}</h1>
        <p className="auth-card__description">
          {dict.auth.register_slogan}
        </p>
      </div>

      {status && (
        <div
          className={`auth-alert auth-alert--${status.type}`}
          role="alert"
          aria-live="polite"
        >
          <div className="auth-alert__icon" aria-hidden="true">
            {status.type === "success" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <div className="auth-alert__content">
            <p className="auth-alert__message">{status.text}</p>
            {status.type === "success" && (
              <div className="auth-alert__actions">
                <Link href="/auth/login" className="auth-alert__link">
                  {dict.auth.proceed_signin} {lang == 'en' ? <>&rarr;</> : <>&larr;</>}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="fullName" className="form-label">
            {dict.auth.fullname}
            <span className="form-label__required" aria-hidden="true">*</span>
          </label>
          <div className="form-input-wrapper">
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="e.g. Alex Morgan"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              className={`form-input ${errors.fullName ? "form-input--error" : ""}`}
              {...register("fullName")}
            />
          </div>
          {errors.fullName && (
            <span id="fullName-error" className="form-error" role="alert">
              {errors.fullName.message}
            </span>
          )}
          {validations?.full_name && (
            <span id="fullName-error" className="form-error" role="alert">
              {validations.full_name.join(", ")}
            </span>
          )}
        </div>

        {/* Email Address */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            {dict.auth.email}
            <span className="form-label__required" aria-hidden="true">*</span>
          </label>
          <div className="form-input-wrapper">
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`form-input ${errors.email ? "form-input--error" : ""}`}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <span id="email-error" className="form-error" role="alert">
              {errors.email.message}
            </span>
          )}
          {validations?.email && (
            <span id="email-error" className="form-error" role="alert">
              {validations.email.join(", ")}
            </span>
          )}
        </div>

        {/* Password */}
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            {dict.auth.password}
            <span className="form-label__required" aria-hidden="true">*</span>
          </label>
          <div className="form-input-wrapper">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              aria-invalid={!!errors.password}
              aria-describedby="password-hint password-error"
              className={`form-input form-input--has-action ${errors.password ? "form-input--error" : ""}`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="form-input__toggle-btn"
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
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
          <span id="password-hint" className="form-hint">
            {dict.auth.password_rule}
          </span>
          {errors.password && (
            <span id="password-error" className="form-error" role="alert">
              {errors.password.message}
            </span>
          )}
          {validations?.password && (
            <span id="password-error" className="form-error" role="alert">
              {validations.password.join(", ")}
            </span>
          )}
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            {dict.auth.confirm_password}
            <span className="form-label__required" aria-hidden="true">*</span>
          </label>
          <div className="form-input-wrapper">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              className={`form-input form-input--has-action ${errors.confirmPassword ? "form-input--error" : ""}`}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="form-input__toggle-btn"
              aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
              title={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
            >
              {showConfirmPassword ? (
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
          {errors.confirmPassword && (
            <span id="confirmPassword-error" className="form-error" role="alert">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="auth-form__submit-btn"
        >
          {isSubmitting ? (
            <span className="auth-form__submitting-state">
              <svg className="spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" />
              </svg>
              <span>{dict.auth.register_loading}</span>
            </span>
          ) : (
            <span>{dict.auth.register} {arrow(lang)}</span>
          )}
        </button>
      </form>

      <div className="auth-card__footer">
        <p className="auth-card__login-prompt">
          {dict.auth.registered}
          <Link href={`/${lang}/login`} className="auth-card__login-link">
            {dict.auth.login}
          </Link>
        </p>
        <p className="auth-card__disclaimer">
          {dict.auth.register_footer}
        </p>
      </div>
    </div>
  );
}
