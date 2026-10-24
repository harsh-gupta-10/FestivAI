"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Settings, Cloud, Calendar, Database } from "lucide-react";

interface NavbarProps {
  onOpenSettings?: () => void;
  onToggleInspector?: () => void;
  isInspectorOpen?: boolean;
}

export function Navbar({ onOpenSettings, onToggleInspector, isInspectorOpen }: NavbarProps) {
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
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-[#e3e3e2] text-[#292827]">
            <Cloud className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            Workers Runtime
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-[#e3e3e2] text-[#292827]">
            <Database className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            D1 SQLite & R2
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            href="/app"
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-[540] text-[#292827] hover:text-white hover:bg-[#421d24] bg-white border border-[#e3e3e2] shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#714cb6]" />
            New Event
          </Link>

          <Link
            href="/events/sample-wedding-2026/dashboard"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-[460] text-[#292827] hover:text-[#714cb6] bg-white hover:bg-[#f8f7f5] border border-[#e3e3e2] transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#714cb6]" />
            Sample Dashboard
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
              <span>GenAI Inspector</span>
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
        </div>
      </div>
    </header>
  );
}
