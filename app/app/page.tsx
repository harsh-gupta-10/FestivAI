"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ChatWorkspace } from "@/components/ChatWorkspace";
import { SettingsModal } from "@/components/SettingsModal";
import { GenAiInspector, InspectorData } from "@/components/GenAiInspector";
import { ArrowLeft } from "lucide-react";

export default function AppWorkspacePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState("o3-mini");
  const [inspectorData, setInspectorData] = useState<InspectorData | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("festivai_model");
      if (stored) setCurrentModel(stored);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#f2f0eb] text-[#292827] selection:bg-[#d4c7ff] selection:text-[#292827] overflow-hidden">
      {/* App Workspace Banner */}
      <div className="bg-[#421d24] text-white px-4 py-2 text-xs border-b border-white/10 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold tracking-wide">app.festivai.com</span>
            <span className="text-white/60">• Organizer Intelligence Workspace</span>
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
