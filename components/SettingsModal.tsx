"use client";

import React, { useState, useEffect } from "react";
import { X, Key, Cpu, ShieldCheck, Check, Sparkles, ExternalLink } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: string;
  onModelChange: (model: string) => void;
}

export function SettingsModal({ isOpen, onClose, currentModel, onModelChange }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("festivai_openai_key") || "";
      setApiKey(stored);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      if (apiKey.trim()) {
        localStorage.setItem("festivai_openai_key", apiKey.trim());
      } else {
        localStorage.removeItem("festivai_openai_key");
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Engine & Cloud Settings</h2>
              <p className="text-xs text-slate-400">Configure models and optional direct OpenAI API key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* AI Model Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Default OpenAI Model
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "o3-mini", name: "o3-mini", desc: "Flagship Reasoning" },
                { id: "gpt-4o", name: "GPT-4o", desc: "Omni Multimodal" },
                { id: "gpt-4o-mini", name: "GPT-4o mini", desc: "Fast & Agile" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onModelChange(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    currentModel === m.id
                      ? "bg-fuchsia-500/15 border-fuchsia-500 text-white shadow-sm shadow-fuchsia-500/20"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{m.name}</span>
                    {currentModel === m.id && <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* OpenAI API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center">
                <Key className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                OpenAI API Key (Optional)
              </label>
              <span className="text-[11px] text-slate-500">Stored in browser localStorage</span>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all font-mono"
            />
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              In production, keys are stored securely in Cloudflare Worker secrets via{" "}
              <code className="text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                npx wrangler secret put OPENAI_API_KEY
              </code>
              . If left blank, FestivAI operates in smart Demo Mode with realistic, mathematically consistent plans.
            </p>
          </div>

          {/* Cloudflare Architecture Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Cloudflare Native Runtime Active</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="block font-medium text-slate-200">Database Binding:</span>
                <code>env.DB</code> (festivai-db D1)
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="block font-medium text-slate-200">Storage Binding:</span>
                <code>env.BUCKET</code> (festivai-assets R2)
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white shadow-lg shadow-fuchsia-600/25 transition-all"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-300" />
                Saved Preferences!
              </>
            ) : (
              "Save & Apply"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
