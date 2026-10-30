"use client";

import React, { useState, useEffect } from "react";
import { X, Key, Cpu, ShieldCheck, Check, Sparkles } from "lucide-react";

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
      const storedKey = localStorage.getItem("festivai_openai_key") || "";
      setApiKey(storedKey);
      const storedModel = localStorage.getItem("festivai_model");
      if (storedModel && storedModel !== currentModel) {
        onModelChange(storedModel);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      if (apiKey.trim()) {
        localStorage.setItem("festivai_openai_key", apiKey.trim());
      } else {
        localStorage.removeItem("festivai_openai_key");
      }
      localStorage.setItem("festivai_model", currentModel);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 900);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-[#e3e3e2] shadow-xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e3e3e2]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#421d24] text-white">
              <Cpu className="w-5 h-5 text-[#d4c7ff]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#292827]">AI Engine & Cloud Settings</h2>
              <p className="text-xs text-[#666666]">Configure models and API keys (OpenAI or Google Gemini)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#666666] hover:text-[#292827] hover:bg-[#f2f0eb] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* AI Model Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] mb-2">
              Select AI Reasoning Engine
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "o3-mini", name: "o3-mini", desc: "OpenAI Reasoning" },
                { id: "gpt-4o", name: "GPT-4o", desc: "OpenAI Flagship" },
                { id: "gpt-4o-mini", name: "GPT-4o mini", desc: "OpenAI Agile" },
                { id: "gemini-2.5-flash", name: "Gemini Flash", desc: "Google Thinking" },
                { id: "gemini-1.5-pro", name: "Gemini Pro", desc: "Google Deep Reasoning" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onModelChange(m.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    currentModel === m.id
                      ? "bg-[#d4c7ff] border-[#292827] text-[#292827] shadow-sm font-semibold"
                      : "bg-[#f8f7f5] border-[#e3e3e2] text-[#666666] hover:text-[#292827]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#292827] truncate">{m.name}</span>
                    {currentModel === m.id && <Sparkles className="w-3.5 h-3.5 text-[#714cb6] flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-[#666666] mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#666666] flex items-center">
                <Key className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                API Key (OpenAI or Google Gemini)
              </label>
              <span className="text-[11px] text-[#999999]">Optional client override</span>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-... or AIza..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#e3e3e2] text-sm text-[#292827] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#714cb6]/40 focus:border-[#714cb6] transition-all font-mono"
            />
            <p className="mt-1.5 text-xs text-[#666666] leading-relaxed">
              Accepts OpenAI (<code className="text-[#421d24] font-mono">sk-...</code>) or Gemini (<code className="text-[#421d24] font-mono">AIza...</code>). Can also be provided in <code className="text-[#421d24] bg-[#f2f0eb] px-1 py-0.5 rounded border border-[#e3e3e2]">.env.local</code> as <code className="font-mono">OPENAI_API_KEY</code> or <code className="font-mono">GEMINI_API_KEY</code>.
            </p>
          </div>

          {/* Cloudflare Architecture Card */}
          <div className="p-3.5 rounded-xl bg-[#f8f7f5] border border-[#e3e3e2] text-xs text-[#292827] space-y-2">
            <div className="flex items-center space-x-2 text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Cloudflare Native Runtime Active</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#666666]">
              <div className="p-2 rounded bg-white border border-[#e3e3e2]">
                <span className="block font-medium text-[#292827]">D1 SQLite Database:</span>
                <code>env.DB</code> (festivai-db)
              </div>
              <div className="p-2 rounded bg-white border border-[#e3e3e2]">
                <span className="block font-medium text-[#292827]">R2 Storage Bucket:</span>
                <code>env.BUCKET</code> (festivai-assets)
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#e3e3e2] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#666666] hover:text-[#292827] hover:bg-[#f2f0eb] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 rounded-buttons text-xs font-[540] bg-[#421d24] text-white hover:bg-[#572730] shadow-sm transition-all"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-[#d4c7ff]" />
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
