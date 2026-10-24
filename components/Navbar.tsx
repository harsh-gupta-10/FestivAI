"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Settings, Cloud, Calendar, ShieldCheck, Database } from "lucide-react";

interface NavbarProps {
  onOpenSettings?: () => void;
  onToggleInspector?: () => void;
  isInspectorOpen?: boolean;
}

export function Navbar({ onOpenSettings, onToggleInspector, isInspectorOpen }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-amber-400 p-0.5 shadow-lg shadow-fuchsia-500/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Festiv<span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-500">AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">
                CF Native
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
              GenAI Celebration & Event Planner
            </p>
          </div>
        </Link>

        {/* Center / Edge Badges */}
        <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-slate-400">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <Cloud className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
            Cloudflare Workers
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <Database className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            D1 SQLite & R2
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            href="/events/sample-wedding-2026/dashboard"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Sample Dashboard
          </Link>

          {onToggleInspector && (
            <button
              onClick={onToggleInspector}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isInspectorOpen
                  ? "bg-fuchsia-600/20 text-fuchsia-300 border-fuchsia-500/40 shadow-sm shadow-fuchsia-500/20"
                  : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800"
              }`}
              title="Toggle Live GenAI Prompt & Raw Response Inspector"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-fuchsia-400" />
              <span>GenAI Inspector</span>
              <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="Open AI Model & Key Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
