"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ChatWorkspace } from "@/components/ChatWorkspace";
import { SettingsModal } from "@/components/SettingsModal";
import { GenAiInspector, InspectorData } from "@/components/GenAiInspector";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  ArrowLeft,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function AppWorkspacePage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState("o3-mini");
  const [inspectorData, setInspectorData] = useState<InspectorData | null>(null);

  // Auth Gateway States
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("festivai_model");
      if (stored) setCurrentModel(stored);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setAuthError(err?.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !password) {
      setAuthError("Please fill in both email and password.");
      return;
    }

    if (authTab === "signup" && !displayName.trim()) {
      setAuthError("Please provide your full name.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (authTab === "signin") {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password, displayName.trim());
      }
    } catch (err: any) {
      console.error("Email auth error:", err);
      let msg = err?.message || "Authentication failed";
      if (
        msg.includes("user-not-found") ||
        msg.includes("wrong-password") ||
        msg.includes("invalid-credential")
      ) {
        msg = "Invalid email or password. Please verify your credentials.";
      } else if (msg.includes("email-already-in-use")) {
        msg = "An account with this email already exists. Please switch to Sign In.";
      } else if (msg.includes("weak-password")) {
        msg = "Password should be at least 6 characters long.";
      }
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Initial Loading Screen
  if (loading) {
    return (
      <div className="h-screen w-full bg-[#f2f0eb] flex flex-col items-center justify-center p-4 selection:bg-[#d4c7ff]">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-[#421d24] text-white flex items-center justify-center font-serif text-2xl font-bold shadow-lg">
            F
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#714cb6] animate-ping opacity-75" />
        </div>
        <div className="mt-6 flex items-center space-x-2.5 text-xs font-[460] text-[#666666]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Verifying Organizer Authentication...</span>
        </div>
      </div>
    );
  }

  // 2. Mandatory Authentication Gate
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f2f0eb] text-[#292827] flex flex-col selection:bg-[#d4c7ff] selection:text-[#292827]">
        {/* Top Minimal Header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-[#e3e3e2] bg-white/60 backdrop-blur-md">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#421d24] text-white flex items-center justify-center font-serif text-sm font-bold">
              F
            </div>
            <span className="font-serif text-base font-semibold tracking-tight text-[#292827]">
              FestivAI Concierge
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-[460] text-[#666666] hover:text-[#292827] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Overview</span>
          </Link>
        </header>

        {/* Central Auth Gateway Card */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-[440px] bg-white rounded-3xl border border-[#e3e3e2] shadow-xl p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#f8f7f4] border border-[#e3e3e2] text-[11px] font-[460] text-[#714cb6]">
                <Sparkles className="w-3 h-3" />
                <span>Protected Organizer Workspace</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#292827] tracking-tight">
                {authTab === "signin" ? "Welcome back" : "Create your workspace"}
              </h1>
              <p className="text-xs text-[#666666] max-w-xs mx-auto leading-relaxed">
                {authTab === "signin"
                  ? "Sign in to access your live celebration budgets, RSVPs, and AI planning assistant."
                  : "Register to manage weddings, birthdays, and galas with Cloudflare D1 persistence."}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-[#f8f7f4] border border-[#e3e3e2] rounded-xl text-xs font-[460]">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("signin");
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  authTab === "signin"
                    ? "bg-white text-[#292827] font-semibold shadow-xs"
                    : "text-[#666666] hover:text-[#292827]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("signup");
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  authTab === "signup"
                    ? "bg-white text-[#292827] font-semibold shadow-xs"
                    : "text-[#666666] hover:text-[#292827]"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{authError}</span>
              </div>
            )}

            {/* Google One-Click Auth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-[#e3e3e2] bg-white hover:bg-[#faf9f7] text-xs font-[540] text-[#292827] flex items-center justify-center space-x-2.5 transition-all shadow-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <div className="border-t border-[#e3e3e2] w-full" />
              <span className="bg-white px-3 text-[11px] text-[#666666] uppercase tracking-wider relative">
                or with email
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {authTab === "signup" && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#292827] uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-[#666666]" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required={authTab === "signup"}
                      className="w-full pl-9 pr-3 py-2 bg-[#f8f7f4] border border-[#e3e3e2] rounded-xl text-xs text-[#292827] placeholder:text-[#666666]/60 focus:outline-none focus:border-[#714cb6] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#292827] uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#666666]" />
                  <input
                    type="email"
                    placeholder="organizer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#f8f7f4] border border-[#e3e3e2] rounded-xl text-xs text-[#292827] placeholder:text-[#666666]/60 focus:outline-none focus:border-[#714cb6] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#292827] uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#666666]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-9 pr-10 py-2 bg-[#f8f7f4] border border-[#e3e3e2] rounded-xl text-xs text-[#292827] placeholder:text-[#666666]/60 focus:outline-none focus:border-[#714cb6] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#666666] hover:text-[#292827]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#421d24] hover:bg-[#5a2731] text-white text-xs font-[540] transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {authTab === "signin" ? "Sign In to Workspace" : "Create Free Account"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Trust Badge */}
            <div className="pt-2 text-center text-[10px] text-[#666666] flex items-center justify-center space-x-1.5 border-t border-[#e3e3e2]/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-tenant isolation backed by Firebase Auth & Cloudflare D1</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated App Workspace
  return (
    <div className="h-screen flex flex-col bg-[#f2f0eb] text-[#292827] selection:bg-[#d4c7ff] selection:text-[#292827] overflow-hidden">
      {/* App Workspace Banner */}
      <div className="bg-[#421d24] text-white px-4 py-2 text-xs border-b border-white/10 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wide">app.festivai.com</span>
            <span className="text-white/60">• Organizer Intelligence Workspace</span>
          </div>
          <Link
            href="/"
            className="hover:underline flex items-center space-x-1 text-white/90 text-[11px]"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Return to Marketing Overview</span>
          </Link>
        </div>
      </div>

      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
        isInspectorOpen={isInspectorOpen}
      />

      <main id="main-content" className="flex-1 overflow-hidden">
        <ChatWorkspace
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
          isInspectorOpen={isInspectorOpen}
          selectedModel={currentModel}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentModel={currentModel}
        onModelChange={(m) => setCurrentModel(m)}
      />

      {/* GenAI Inspector Drawer */}
      <GenAiInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        data={inspectorData}
      />
    </div>
  );
}
