"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { OrganizerWizard } from "@/components/OrganizerWizard";
import { SettingsModal } from "@/components/SettingsModal";
import { GenAiInspector, InspectorData } from "@/components/GenAiInspector";
import { Sparkles, Cloud, Database, Cpu, Lock, CheckCircle2, Share2, Layers } from "lucide-react";

export default function HomePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState("o3-mini");
  const [inspectorData, setInspectorData] = useState<InspectorData | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
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

        {/* Feature Highlights Banner */}
        <section className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Cloudflare Workers Native</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deployed globally to Cloudflare Workers via OpenNext with <code>nodejs_compat</code> runtime support.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">D1 SQLite & R2 Buckets</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Serverless database persistence for events, budgets, checklists, guest RSVPs, and cover images.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">OpenAI o3-mini & GPT-4o</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Structured JSON schema generation and live multi-parameter dynamic re-planning on the fly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Live Public RSVP Links</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Shareable invite URLs work globally with real-time guest list and dietary preferences synchronization.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>FestivAI — Built for PromptWars Virtual Competition: [Challenge 5] Celebration & Event Planner</p>
        <p className="mt-1">Powered by Next.js App Router, @opennextjs/cloudflare, Cloudflare D1 & R2, OpenAI API</p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentModel={currentModel}
        onModelChange={(model) => setCurrentModel(model)}
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
