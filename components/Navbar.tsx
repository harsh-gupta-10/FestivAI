"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Settings, Cloud, Calendar, Database } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { User, LogOut } from "lucide-react";

interface NavbarProps {
  onOpenSettings?: () => void;
  onToggleInspector?: () => void;
  isInspectorOpen?: boolean;
}

export function Navbar({ onOpenSettings, onToggleInspector, isInspectorOpen }: NavbarProps) {
  const { user, openAuthModal, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e3e3e2] bg-[#f2f0eb]/90 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#421d24] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm group-hover:scale-105 transition-transform duration-200">
            F
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg tracking-tight text-[#292827]">
                Festiv<span className="text-[#714cb6]">AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#d4c7ff]/60 text-[#292827] border border-[#292827]/10">
                Cloudflare Native
              </span>
            </div>
          </div>
        </Link>

        {/* Center / Edge Badges */}
        <div className="hidden md:flex items-center space-x-2 text-xs font-[460] text-[#666666]">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-[#e3e3e2] text-[#292827] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
            <span>Cloudflare Edge Network</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            href="/app"
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-[540] text-[#292827] hover:text-white hover:bg-[#421d24] bg-white border border-[#e3e3e2] shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#714cb6]" />
            <span>Workspace</span>
          </Link>

          {onToggleInspector && (
            <button
              onClick={onToggleInspector}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-[540] transition-all border ${
                isInspectorOpen
                  ? "bg-[#421d24] text-white border-[#421d24] shadow-sm"
                  : "bg-[#d4c7ff] text-[#292827] hover:bg-[#c4b5fa] border-[#292827]/20"
              }`}
              title="Toggle Live GenAI Prompt & Raw Response Inspector"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              <span>Inspector</span>
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-white hover:bg-[#f8f7f5] text-[#292827] border border-[#e3e3e2] transition-colors"
              title="Open AI Model & Key Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* User Auth Controls */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-1 pl-2 pr-2.5 rounded-xl bg-white border border-[#e3e3e2] hover:border-[#714cb6] transition-all shadow-sm text-xs"
              >
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User avatar"}
                    className="w-6 h-6 rounded-full object-cover border border-[#e3e3e2]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#421d24] text-white flex items-center justify-center font-bold text-[10px]">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-[#292827] max-w-[90px] truncate">
                  {user.displayName || user.email?.split("@")[0]}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-[#e3e3e2] shadow-xl py-1.5 z-50 animate-fade-in text-xs">
                  <div className="px-3 py-2 border-b border-[#e3e3e2]">
                    <p className="font-semibold text-[#292827] truncate">{user.displayName || "Organizer"}</p>
                    <p className="text-[11px] text-[#666666] truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/app"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-[#292827] hover:bg-[#f2f0eb] transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#714cb6]" />
                    <span>My Celebrations</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-rose-700 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal("signin")}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-[540] text-white bg-[#421d24] hover:bg-[#572730] transition-all shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
