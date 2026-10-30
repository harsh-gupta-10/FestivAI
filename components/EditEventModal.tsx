"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  Save,
  AlertTriangle,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { getCurrencySymbol } from "@/lib/currency";
import { validateBudget, validateEventDate, validateGuestCount, sanitizeString } from "@/lib/validation";
import { EventRecord, EventItem } from "@/types";
import { getErrorMessage } from "@/lib/error";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventRecord | EventItem | null;
  userEmail?: string;
  onEventUpdated: (updatedEvent: any) => void;
}

export function EditEventModal({
  isOpen,
  onClose,
  event,
  userEmail,
  onEventUpdated,
}: EditEventModalProps) {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("birthday");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [guestCount, setGuestCount] = useState<number>(75);
  const [totalBudget, setTotalBudget] = useState<number>(10000);
  const [currency, setCurrency] = useState("USD");
  const [vibe, setVibe] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setEventType(event.event_type || "birthday");
      setEventDate(event.event_date || "");
      setLocation(event.location || "");
      setGuestCount(event.guest_count || 75);
      setTotalBudget(event.total_budget || 10000);
      setCurrency(event.currency || "USD");
      setVibe(event.vibe || "");
      setErrorMsg(null);
    }
  }, [event, isOpen]);

  if (!isOpen || !event) return null;

  const currSym = getCurrencySymbol(currency);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    const cleanTitle = sanitizeString(title, 120);
    if (!cleanTitle) {
      setErrorMsg("Celebration title cannot be empty.");
      return;
    }

    const dateCheck = validateEventDate(eventDate);
    if (!dateCheck.isValid) {
      setErrorMsg(dateCheck.error || "Please select a valid future event date.");
      return;
    }

    const cleanLocation = sanitizeString(location, 120);
    if (!cleanLocation) {
      setErrorMsg("Venue location cannot be empty.");
      return;
    }

    const guestCheck = validateGuestCount(guestCount);
    if (!guestCheck.isValid) {
      setErrorMsg(guestCheck.error || "Guest count must be at least 1.");
      return;
    }

    const budgetCheck = validateBudget(totalBudget, currency);
    if (!budgetCheck.isValid) {
      setErrorMsg(budgetCheck.error || "Please enter a realistic celebration budget.");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(userEmail ? { "x-user-email": userEmail } : {}),
        },
        body: JSON.stringify({
          title: cleanTitle,
          event_type: eventType,
          event_date: eventDate,
          location: cleanLocation,
          guest_count: guestCheck.sanitizedValue,
          total_budget: budgetCheck.sanitizedValue,
          currency,
          vibe: sanitizeString(vibe, 120),
          userEmail,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to save event details");
      }

      const result = (await res.json()) as { success?: boolean; event?: EventRecord };
      setSaveSuccess(true);
      if (result.event) {
        onEventUpdated(result.event);
      } else {
        onEventUpdated({
          ...event,
          title: cleanTitle,
          event_type: eventType,
          event_date: eventDate,
          location: cleanLocation,
          guest_count: guestCheck.sanitizedValue ?? guestCount,
          total_budget: budgetCheck.sanitizedValue ?? totalBudget,
          currency,
          vibe,
        });
      }

      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 800);
    } catch (err: unknown) {
      console.error("Save error:", err);
      setErrorMsg(getErrorMessage(err) || "Failed to update celebration in Cloudflare D1.");
    } finally {
      setIsSaving(false);
    }
  };

  const autoFixBudget = () => {
    let minBudget = 10000;
    if (currency === "INR") {
      minBudget = eventType === "wedding" ? 1200000 : 250000;
    } else {
      minBudget = eventType === "wedding" ? 15000 : 3500;
    }
    setTotalBudget(minBudget);
    setErrorMsg(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-event-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white border border-[#e3e3e2] shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e3e3e2] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#421d24] text-white">
              <Sliders className="w-5 h-5 text-[#d4c7ff]" aria-hidden="true" />
            </div>
            <div>
              <h2 id="edit-event-modal-title" className="text-lg font-bold text-[#292827]">Edit Celebration Details</h2>
              <p className="text-xs text-[#666666]">
                Modify logistical parameters stored natively in Cloudflare D1
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit event dialog"
            className="p-1.5 text-[#666666] hover:text-[#292827] rounded-lg hover:bg-[#f2f0eb] transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-[#421d24]/10 border border-[#421d24]/20 flex items-start justify-between text-xs text-[#421d24]">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#421d24]" />
              <span>{errorMsg}</span>
            </div>
            {errorMsg.toLowerCase().includes("budget") && (
              <button
                type="button"
                onClick={autoFixBudget}
                className="ml-2 font-semibold underline hover:opacity-80 shrink-0"
              >
                Auto-Fix
              </button>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-4 pt-4 overflow-y-auto flex-1 pr-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#292827] mb-1">
              Celebration Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Maya & Alex's Golden Hour Wedding"
              className="w-full px-3 py-2 rounded-xl border border-[#e3e3e2] bg-white text-sm text-[#292827] focus:outline-none focus:border-[#714cb6] transition-colors"
              required
            />
          </div>

          {/* Category & Currency Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#292827] mb-1">
                Category
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e3e3e2] bg-white text-sm text-[#292827] focus:outline-none focus:border-[#714cb6]"
              >
                <option value="wedding">💍 Wedding</option>
                <option value="birthday">🎂 Birthday</option>
                <option value="community">🎉 Community Event</option>
                <option value="corporate">💼 Corporate Gala</option>
                <option value="anniversary">🥂 Anniversary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#292827] mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e3e3e2] bg-white text-sm text-[#292827] focus:outline-none focus:border-[#714cb6]"
              >
                <option value="INR">₹ INR (Indian Rupee)</option>
                <option value="USD">$ USD (US Dollar)</option>
                <option value="EUR">€ EUR (Euro)</option>
                <option value="GBP">£ GBP (British Pound)</option>
                <option value="AED">AED (UAE Dirham)</option>
                <option value="CAD">CA$ (Canadian Dollar)</option>
                <option value="AUD">A$ (Australian Dollar)</option>
                <option value="JPY">¥ JPY (Japanese Yen)</option>
              </select>
            </div>
          </div>

          {/* Date & Location Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#292827] mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-[#714cb6]" />
                <span>Celebration Date</span>
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e3e3e2] bg-white text-sm text-[#292827] focus:outline-none focus:border-[#714cb6]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#292827] mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-[#714cb6]" />
                <span>Venue / City</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai, India"
                className="w-full px-3 py-2 rounded-xl border border-[#e3e3e2] bg-white text-sm text-[#292827] focus:outline-none focus:border-[#714cb6]"
                required
              />
            </div>
          </div>

          {/* Guests & Total Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#292827] mb-1 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-[#714cb6]" />
                <span>Target Headcount</span>
              </label>
              <input
                type="number"
                min="1"
                max="5000"
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-[#e3e3e2] bg-white text-sm text-[#292827] focus:outline-none focus:border-[#714cb6]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#292827] mb-1 flex items-center space-x-1">
                <span className="font-serif font-bold text-[#714cb6]">{currSym}</span>
                <span>Total Budget</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-semibold text-[#666666]">
                  {currSym}
                </span>
                <input
                  type="number"
                  min="50"
                  step="100"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#e3e3e2] bg-white text-sm text-[#292827] focus:outline-none focus:border-[#714cb6]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Vibe / Theme */}
          <div>
            <label className="block text-xs font-semibold text-[#292827] mb-1 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-[#714cb6]" />
              <span>Theme & Aesthetic Vibe</span>
            </label>
            <input
              type="text"
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="e.g. Boho Chic & Botanical Elegance, Royal Heritage"
              className="w-full px-3 py-2 rounded-xl border border-[#e3e3e2] bg-white text-sm text-[#292827] focus:outline-none focus:border-[#714cb6]"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#e3e3e2]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#666666] hover:bg-[#f2f0eb] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[#421d24] hover:bg-[#5a2931] text-white text-xs font-semibold transition-all shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#d4c7ff]" />
                  <span>Saved!</span>
                </>
              ) : isSaving ? (
                <span>Saving to Cloudflare D1...</span>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#d4c7ff]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
