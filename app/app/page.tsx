"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { OrganizerWizard } from "@/components/OrganizerWizard";
import { SettingsModal } from "@/components/SettingsModal";
import { GenAiInspector, InspectorData } from "@/components/GenAiInspector";
import { Sparkles, ArrowLeft, ShieldCheck, Database, Cloud } from "lucide-react";

export default function AppWorkspacePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState("o3-mini");
  const [inspectorData, setInspectorData] = useState<InspectorData | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-fuchsia-500 selection:text-white">
      {/* App Workspace Banner */}
      <div className="bg-[#421d24] text-white px-4 py-2 text-xs border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold tracking-wide">app.festivai.com</span>
            <span className="text-white/60">• Organizer Command Workspace</span>
          </div>
          <Link
            href="/"
            className="hover:underline flex items-center space-x-1 text-white/90 text-[11px]"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Marketing Overview</span>
          </Link>
        </div>
      </div>

      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
        isInspectorOpen={isInspectorOpen}
      />

      <main className="flex-1">
        <OrganizerWizard
          onOpenSettings={() => setIsSettingsOpen(true)}
          selectedModel={currentModel}
        />
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>FestivAI Workspace — Hosted on Cloudflare Workers, D1 SQLite & R2</p>
      </footer>

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
