"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Mail, Lock, User as UserIcon, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    setAuthMode,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authMode === "signup") {
        if (!displayName.trim()) {
          throw new Error("Please enter your name or couple name.");
        }
        await signUpWithEmail(email.trim(), password, displayName.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || "Authentication failed. Please check your credentials.";
      if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password")) {
        msg = "Invalid email or password. Please try again.";
      } else if (msg.includes("auth/email-already-in-use")) {
        msg = "An account with this email already exists. Try signing in.";
      } else if (msg.includes("auth/weak-password")) {
        msg = "Password should be at least 6 characters.";
      } else if (msg.includes("auth/popup-closed-by-user")) {
        msg = "Sign-in popup closed before completing.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (!err.message?.includes("popup-closed")) {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292827]/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md bg-[#ffffff] rounded-2xl border border-[#e3e3e2] shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-[#666666] hover:text-[#292827] rounded-full hover:bg-[#f2f0eb] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-[#d4c7ff]/50 border border-[#714cb6]/20 text-[11px] font-semibold text-[#421d24]">
            <Sparkles className="w-3.5 h-3.5 text-[#714cb6]" />
            <span>FestivAI Account</span>
          </div>
          <h2
            id="auth-modal-title"
            className="text-2xl font-[460] tracking-tight text-[#292827]"
          >
            {authMode === "signup" ? "Create your organizer account" : "Welcome back to FestivAI"}
          </h2>
          <p className="text-xs text-[#666666] max-w-xs mx-auto">
            {authMode === "signup"
              ? "Save your celebration masterplans, guest RSVPs, and budgets across devices."
              : "Access your organized celebrations and continue chatting with your GenAI concierge."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google One-Click Auth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl border border-[#e3e3e2] hover:border-[#292827] bg-[#ffffff] hover:bg-[#f8f7f5] text-[#292827] font-semibold text-xs flex items-center justify-center space-x-2.5 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#e3e3e2]" />
          <span className="absolute bg-[#ffffff] px-2 text-[11px] text-[#666666] uppercase tracking-wider font-medium">
            or email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === "signup" && (
            <div>
              <label
                htmlFor="auth-name"
                className="block text-xs font-semibold uppercase tracking-wider text-[#666666] mb-1.5"
              >
                Full Name / Organizer Title
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-[#666666]" />
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f8f7f5] border border-[#e3e3e2] text-sm text-[#292827] focus:outline-none focus:ring-2 focus:ring-[#714cb6]/40 focus:border-[#714cb6] transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold uppercase tracking-wider text-[#666666] mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#666666]" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f8f7f5] border border-[#e3e3e2] text-sm text-[#292827] focus:outline-none focus:ring-2 focus:ring-[#714cb6]/40 focus:border-[#714cb6] transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold uppercase tracking-wider text-[#666666] mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#666666]" />
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f8f7f5] border border-[#e3e3e2] text-sm text-[#292827] focus:outline-none focus:ring-2 focus:ring-[#714cb6]/40 focus:border-[#714cb6] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#421d24] hover:bg-[#572730] text-white font-[540] text-sm shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{authMode === "signup" ? "Create Account" : "Sign In"}</span>
                <ArrowRight className="w-4 h-4 text-[#d4c7ff]" />
              </>
            )}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="text-center text-xs text-[#666666]">
          {authMode === "signup" ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className="text-[#714cb6] font-semibold hover:underline ml-1"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don&apos;t have an account yet?{" "}
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className="text-[#714cb6] font-semibold hover:underline ml-1"
              >
                Sign Up for Free
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
