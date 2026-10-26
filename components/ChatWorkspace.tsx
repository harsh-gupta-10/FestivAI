"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Sparkles,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Cake,
  Heart,
  PartyPopper,
  Sliders,
  Eye,
  RefreshCw,
  Copy,
  Check,
  Bell,
  X,
  Menu,
  LogOut,
  LogIn,
  Wand2,
  ChevronDown,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OrganizerWizard } from "@/components/OrganizerWizard";
import confetti from "canvas-confetti";

interface EventItem {
  id: string;
  slug: string;
  organizer_name: string;
  organizer_email: string;
  event_type: string;
  title: string;
  event_date: string;
  location: string;
  guest_count: number;
  total_budget: number;
  currency: string;
  vibe: string;
  banner_r2_key?: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  actionCard?: {
    type: "budget_summary" | "rsvp_summary" | "event_created" | "milestone_list" | "ideas_grid" | "alert";
    title?: string;
    data?: any;
  };
}

interface ProactiveAlert {
  id: string;
  type: "rsvp" | "budget" | "timeline";
  title: string;
  message: string;
  promptAction: string;
  badge: string;
}

interface ChatWorkspaceProps {
  onOpenSettings: () => void;
  onToggleInspector: () => void;
  isInspectorOpen: boolean;
  selectedModel: string;
}

export function ChatWorkspace({
  onOpenSettings,
  onToggleInspector,
  isInspectorOpen,
  selectedModel,
}: ChatWorkspaceProps) {
  const { user, openAuthModal, logout } = useAuth();

  // Sidebar & Layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isWizardModalOpen, setIsWizardModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Events & Active Event
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Proactive Notification state
  const [activeAlerts, setActiveAlerts] = useState<ProactiveAlert[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Fetch Events for active user (or all default events)
  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
      const res = await fetch(`/api/events${emailQuery}`);
      if (res.ok) {
        const data = (await res.json()) as any;
        const evs = (data.events || []) as EventItem[];
        setEvents(evs);
        if (evs.length > 0 && !activeEventId) {
          setActiveEventId(evs[0].id);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch events:", err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  // Active event object
  const activeEvent = events.find((e) => e.id === activeEventId) || events[0] || null;

  // 2. Initialize Proactive Alerts & Welcome message
  useEffect(() => {
    if (activeEvent) {
      setActiveAlerts([
        {
          id: "alert-rsvp",
          type: "rsvp",
          title: "Guest RSVP Pulse",
          message: `72 of ${activeEvent.guest_count} guests confirmed for "${activeEvent.title}". 3 guests specified vegan & nut allergies.`,
          promptAction: `Show me RSVP breakdown and dietary requests for ${activeEvent.title}`,
          badge: "72% Confirmed",
        },
        {
          id: "alert-budget",
          type: "budget",
          title: "Budget Optimization Tip",
          message: `Catering contract utilized 92% of allocated tier. Would you like AI to suggest a 10% venue buffer reallocation?`,
          promptAction: `What's my budget status for ${activeEvent.title} and where can we optimize?`,
          badge: "Smart Buffer",
        },
      ]);
    }

    // Default welcoming message
    const hostName = user?.displayName || user?.email?.split("@")[0] || "Organizer";
    const welcomeText = `Hello **${hostName}**! Welcome to your FestivAI Concierge.\n\nI'm ready to help you plan, optimize, and coordinate your celebrations. You can query budgets, track RSVPs, adjust timelines, or simply say **"Plan a 30th Birthday party in Brooklyn for 40 guests with $4,000"** to generate a masterplan instantly!`;

    setMessages([
      {
        id: "msg-welcome",
        role: "assistant",
        content: welcomeText,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [activeEventId, user]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiLoading]);

  // 3. Handle Send Chat Message
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue.trim();
    if (!textToSend || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!customPrompt) setInputValue("");
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          eventId: activeEvent?.id,
          userEmail: user?.email || undefined,
          userName: user?.displayName || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Chat assistant response failed");
      }

      const data = (await res.json()) as any;

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: data.response || "I have updated your celebration plan.",
        createdAt: new Date().toISOString(),
        actionCard: data.actionCard,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If an event was created conversationally, reload events and trigger confetti
      if (data.actionCard?.type === "event_created") {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#714cb6", "#421d24", "#d4c7ff", "#292827"],
        });
        await fetchEvents();
        if (data.actionCard.data?.id) {
          setActiveEventId(data.actionCard.data.id);
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          role: "assistant",
          content: "I encountered a hiccup processing your request. Please verify your query or Cloudflare connection and try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle Form Wizard Creation Success
  const handleWizardSuccess = async (createdData: any) => {
    setIsWizardModalOpen(false);
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#714cb6", "#421d24", "#d4c7ff"],
    });

    await fetchEvents();
    if (createdData.eventId) {
      setActiveEventId(createdData.eventId);
    }

    // Add celebration announcement in chat
    const eventName = createdData.title || "New Celebration";
    setMessages((prev) => [
      ...prev,
      {
        id: `asst-created-${Date.now()}`,
        role: "assistant",
        content: `🎉 **${eventName}** has been generated and saved natively to Cloudflare D1!\n\nI have loaded it into your active context. You can query its budget, review milestones, or open the interactive Command Center:`,
        createdAt: new Date().toISOString(),
        actionCard: {
          type: "event_created",
          title: eventName,
          data: {
            id: createdData.eventId,
            slug: createdData.slug || createdData.eventId,
            title: eventName,
            eventType: createdData.eventType || "celebration",
            totalBudget: createdData.totalBudget || 15000,
            currency: createdData.currency || "USD",
            guestCount: createdData.guestCount || 100,
            location: createdData.location || "San Francisco",
            eventDate: createdData.eventDate || "2026-09-18",
          },
        },
      },
    ]);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter events based on search
  const filteredEvents = events.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.event_type.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q)
    );
  });

  // Helper for event type icon
  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "wedding":
        return <Heart className="w-4 h-4 text-rose-600" />;
      case "birthday":
        return <Cake className="w-4 h-4 text-amber-600" />;
      case "community":
        return <Users className="w-4 h-4 text-emerald-600" />;
      default:
        return <PartyPopper className="w-4 h-4 text-[#714cb6]" />;
    }
  };

  // Helper to format assistant markdown text
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return (
      <div className="space-y-2 text-[14px] leading-relaxed text-[#292827]">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1.5" />;

          // Header line
          if (line.startsWith("### ")) {
            return (
              <h4 key={idx} className="font-semibold text-[15px] text-[#421d24] mt-2">
                {line.replace("### ", "")}
              </h4>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h3 key={idx} className="font-semibold text-[16px] text-[#421d24] mt-3">
                {line.replace("## ", "")}
              </h3>
            );
          }
          if (line.startsWith("# ")) {
            return (
              <h2 key={idx} className="font-bold text-[18px] text-[#421d24] mt-4">
                {line.replace("# ", "")}
              </h2>
            );
          }

          // Bullet points
          if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
            const clean = line.trim().replace(/^[-•]\s*/, "");
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2">
                <span className="text-[#714cb6] mt-1 font-bold">•</span>
                <span className="flex-1">{parseInlineStyles(clean)}</span>
              </div>
            );
          }

          // Numbered list
          const numMatch = line.trim().match(/^([0-9]+)\.\s*(.+)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2">
                <span className="font-semibold text-[#714cb6] min-w-[18px]">{numMatch[1]}.</span>
                <span className="flex-1">{parseInlineStyles(numMatch[2])}</span>
              </div>
            );
          }

          return <p key={idx}>{parseInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  // Simple parser for bold **text** and `code`
  const parseInlineStyles = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-[#292827]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-[#f2f0eb] border border-[#e3e3e2] text-xs font-mono text-[#421d24]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex h-[calc(100vh-41px)] bg-[#f2f0eb] text-[#292827] overflow-hidden">
      {/* ----------------- MOBILE SIDEBAR OVERLAY ----------------- */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ----------------- LEFT SIDEBAR (ChatGPT Style) ----------------- */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-[300px] sm:w-[320px] bg-white border-r border-[#e3e3e2] transition-transform duration-200 ease-in-out ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${!isSidebarOpen && "md:hidden"}`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#e3e3e2] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#421d24] text-white flex items-center justify-center font-serif text-lg font-bold">
              F
            </div>
            <div>
              <div className="font-serif text-sm font-semibold tracking-tight text-[#292827]">
                FestivAI Concierge
              </div>
              <div className="text-[10px] text-[#666666] tracking-wide uppercase">
                Event Directory
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setIsMobileSidebarOpen(false);
            }}
            className="p-1 rounded-md hover:bg-[#f2f0eb] text-[#666666] transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action: + New Celebration Button */}
        <div className="p-3">
          <button
            onClick={() => setIsWizardModalOpen(true)}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#421d24] hover:bg-[#5a2731] text-white font-[460] text-sm shadow-sm transition-all group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>New Celebration</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90 ml-auto">
              Wizard
            </span>
          </button>
        </div>

        {/* Search Past Events */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#666666]" />
            <input
              type="text"
              placeholder="Search celebrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#f8f7f4] border border-[#e3e3e2] rounded-lg text-xs text-[#292827] placeholder:text-[#666666]/60 focus:outline-none focus:border-[#714cb6]"
            />
          </div>
        </div>

        {/* Events List Label */}
        <div className="px-4 py-1.5 flex items-center justify-between text-[11px] font-medium text-[#666666] tracking-wider uppercase border-b border-[#e3e3e2]/50">
          <span>Organized Events ({filteredEvents.length})</span>
          <button
            onClick={fetchEvents}
            className="hover:text-[#292827] transition-colors"
            title="Refresh events list"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Events Scroll Area */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {isLoadingEvents ? (
            <div className="p-4 text-center text-xs text-[#666666] space-y-2">
              <div className="w-5 h-5 border-2 border-[#714cb6] border-t-transparent rounded-full animate-spin mx-auto" />
              <span>Querying Cloudflare D1...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#666666] space-y-2">
              <p>No celebrations found.</p>
              <button
                onClick={() => setIsWizardModalOpen(true)}
                className="text-[#714cb6] hover:underline font-medium"
              >
                + Plan your first event
              </button>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isActive = ev.id === activeEventId;
              return (
                <div
                  key={ev.id}
                  onClick={() => {
                    setActiveEventId(ev.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`group relative p-2.5 rounded-xl cursor-pointer border transition-all ${
                    isActive
                      ? "bg-[#f8f7f4] border-[#714cb6]/40 shadow-sm"
                      : "bg-white hover:bg-[#faf9f7] border-transparent hover:border-[#e3e3e2]"
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white border border-[#e3e3e2] flex items-center justify-center shrink-0 shadow-xs">
                      {getEventIcon(ev.event_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-[460] text-xs text-[#292827] truncate">
                          {ev.title}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#714cb6] shrink-0 ml-1" />
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] text-[#666666] mt-0.5 truncate">
                        <span>{ev.event_date || "Upcoming"}</span>
                        <span>•</span>
                        <span className="truncate">{ev.location}</span>
                      </div>

                      <div className="flex items-center space-x-1.5 mt-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#e3e3e2] text-[#292827]">
                          ${Number(ev.total_budget || 0).toLocaleString()} {ev.currency}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f2f0eb] text-[#666666]">
                          {ev.guest_count} guests
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action: Jump to Full Command Center */}
                  <Link
                    href={`/events/${ev.id}/dashboard`}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white text-[#666666] hover:text-[#421d24] transition-all border border-transparent hover:border-[#e3e3e2]"
                    title="Open Event Command Center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer: User Account */}
        <div className="p-3 border-t border-[#e3e3e2] bg-[#faf9f7]">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#421d24] text-white flex items-center justify-center font-medium text-xs uppercase shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user.displayName?.charAt(0) || user.email?.charAt(0) || "U"
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-[460] text-xs text-[#292827] truncate">
                    {user.displayName || "Celebration Host"}
                  </div>
                  <div className="text-[10px] text-[#666666] truncate">{user.email}</div>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#e3e3e2] text-[#666666] hover:text-rose-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[11px] text-[#666666] leading-tight">
                Sign in to sync your celebrations across devices and save directly to your profile.
              </div>
              <button
                onClick={() => openAuthModal("signin")}
                className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-[#f2f0eb] border border-[#e3e3e2] text-xs font-[460] text-[#292827] flex items-center justify-center space-x-1.5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#714cb6]" />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ----------------- MAIN CHAT WORKSPACE AREA ----------------- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f2f0eb] relative">
        {/* Workspace Top Bar */}
        <header className="h-14 px-4 bg-white/80 backdrop-blur-md border-b border-[#e3e3e2] flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center space-x-3">
            {/* Toggle Sidebar Button */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="hidden md:flex p-1.5 rounded-lg border border-[#e3e3e2] bg-white hover:bg-[#f2f0eb] text-[#666666] transition-colors"
                title="Open Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex md:hidden p-1.5 rounded-lg border border-[#e3e3e2] bg-white text-[#666666]"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Active Celebration Context Pill */}
            {activeEvent ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#666666] hidden sm:inline">Active Context:</span>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#f8f7f4] border border-[#e3e3e2] text-xs font-[460] text-[#292827]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="max-w-[160px] sm:max-w-[260px] truncate">{activeEvent.title}</span>
                </div>
                <Link
                  href={`/events/${activeEvent.id}/dashboard`}
                  className="hidden sm:inline-flex items-center space-x-1 text-xs text-[#714cb6] hover:underline font-medium ml-1"
                >
                  <span>Command Center</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <span className="text-xs text-[#666666]">FestivAI Intelligent Concierge</span>
            )}
          </div>

          {/* Top Bar Actions & Model Badge */}
          <div className="flex items-center space-x-2">
            <span className="hidden lg:inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-[#d4c7ff]/30 text-[#714cb6] text-[11px] font-mono border border-[#d4c7ff]">
              <Sparkles className="w-3 h-3" />
              <span>{selectedModel}</span>
            </span>

            <button
              onClick={onToggleInspector}
              className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 transition-colors ${
                isInspectorOpen
                  ? "bg-[#421d24] text-white border-[#421d24]"
                  : "bg-white text-[#666666] border-[#e3e3e2] hover:bg-[#f2f0eb]"
              }`}
              title="Inspect GenAI payload"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">GenAI Logs</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg border border-[#e3e3e2] bg-white text-[#666666] hover:bg-[#f2f0eb] transition-colors"
              title="AI & API Settings"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Proactive Notification / Automated Alert Drawer */}
        {activeAlerts.length > 0 && (
          <div className="bg-[#fcfbf9] border-b border-[#e3e3e2] px-4 py-2.5">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start sm:items-center space-x-2.5">
                <div className="w-6 h-6 rounded-md bg-[#714cb6]/10 text-[#714cb6] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-[#421d24]">
                      {activeAlerts[0].title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#d4c7ff]/40 text-[#714cb6] font-medium">
                      {activeAlerts[0].badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#666666] line-clamp-1">{activeAlerts[0].message}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => handleSendMessage(activeAlerts[0].promptAction)}
                  className="px-2.5 py-1 rounded-md bg-white hover:bg-[#f2f0eb] border border-[#e3e3e2] text-[11px] font-[460] text-[#714cb6] transition-colors flex items-center space-x-1"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Ask Concierge to Resolve</span>
                </button>
                <button
                  onClick={() => setActiveAlerts((prev) => prev.slice(1))}
                  className="p-1 text-[#666666] hover:text-[#292827]"
                  title="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Initial Welcome & Quick Starter Prompts */}
            {messages.length <= 1 && (
              <div className="p-6 rounded-2xl bg-white border border-[#e3e3e2] shadow-xs space-y-4 text-center sm:text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#421d24] text-white flex items-center justify-center font-serif text-xl font-bold">
                    F
                  </div>
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#292827]">
                      FestivAI Planning Concierge
                    </h2>
                    <p className="text-xs text-[#666666]">
                      GenAI reasoning over your Cloudflare D1 events, budgets, and guest pulse.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs font-semibold text-[#421d24] mb-2 uppercase tracking-wide">
                    Suggested Quick Prompts:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() =>
                        handleSendMessage(
                          "Plan a Tuscan Garden Wedding in Napa Valley for 90 guests with $25,000 total budget."
                        )
                      }
                      className="p-2.5 rounded-xl border border-[#e3e3e2] bg-[#f8f7f4] hover:bg-white hover:border-[#714cb6] text-left transition-all group"
                    >
                      <div className="font-[460] text-[#292827] group-hover:text-[#714cb6] flex items-center space-x-1.5">
                        <span>💍 Plan Napa Valley Wedding</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                      <div className="text-[11px] text-[#666666] mt-0.5">
                        90 guests • $25k budget • Floral aesthetic
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        handleSendMessage(
                          "Plan a 30th Rooftop Birthday Bash in Brooklyn for 40 guests with $4,500 budget."
                        )
                      }
                      className="p-2.5 rounded-xl border border-[#e3e3e2] bg-[#f8f7f4] hover:bg-white hover:border-[#714cb6] text-left transition-all group"
                    >
                      <div className="font-[460] text-[#292827] group-hover:text-[#714cb6] flex items-center space-x-1.5">
                        <span>🎂 Plan Rooftop Birthday</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                      <div className="text-[11px] text-[#666666] mt-0.5">
                        40 guests • $4.5k budget • Sunset vibe
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        handleSendMessage("What is our current budget status and where can we optimize?")
                      }
                      className="p-2.5 rounded-xl border border-[#e3e3e2] bg-[#f8f7f4] hover:bg-white hover:border-[#714cb6] text-left transition-all group"
                    >
                      <div className="font-[460] text-[#292827] group-hover:text-[#714cb6] flex items-center space-x-1.5">
                        <span>📊 Analyze Budget Status</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                      <div className="text-[11px] text-[#666666] mt-0.5">
                        Allocated vs actual spent & variance
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        handleSendMessage("Show me confirmed RSVPs and dietary requirements")
                      }
                      className="p-2.5 rounded-xl border border-[#e3e3e2] bg-[#f8f7f4] hover:bg-white hover:border-[#714cb6] text-left transition-all group"
                    >
                      <div className="font-[460] text-[#292827] group-hover:text-[#714cb6] flex items-center space-x-1.5">
                        <span>💌 Check RSVP Pulse</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                      <div className="text-[11px] text-[#666666] mt-0.5">
                        Live attendance counts & dietary notes
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`flex items-start space-x-3 max-w-[90%] sm:max-w-[85%] ${
                      isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-medium text-xs shadow-xs ${
                        isUser
                          ? "bg-[#292827] text-white"
                          : "bg-[#421d24] text-white font-serif"
                      }`}
                    >
                      {isUser ? (
                        user?.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="Me"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          "You"
                        )
                      ) : (
                        <Sparkles className="w-4 h-4 text-[#d4c7ff]" />
                      )}
                    </div>

                    {/* Content Bubble */}
                    <div
                      className={`rounded-2xl p-4 sm:p-5 shadow-xs ${
                        isUser
                          ? "bg-[#421d24] text-white rounded-tr-xs"
                          : "bg-white border border-[#e3e3e2] text-[#292827] rounded-tl-xs"
                      }`}
                    >
                      {isUser ? (
                        <div className="text-sm font-[460] whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        renderFormattedText(msg.content)
                      )}

                      {/* Generative UI Action Card */}
                      {msg.actionCard && (
                        <div className="mt-4 pt-3 border-t border-[#e3e3e2]">
                          {/* 1. Event Created Action Card */}
                          {msg.actionCard.type === "event_created" && (
                            <div className="p-4 rounded-xl bg-[#f8f7f4] border border-[#e3e3e2] space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                  <span className="text-xs font-semibold uppercase text-[#421d24] tracking-wider">
                                    Stored on Cloudflare D1
                                  </span>
                                </div>
                                <span className="text-xs font-mono font-medium text-[#714cb6]">
                                  ${Number(msg.actionCard.data.totalBudget).toLocaleString()}{" "}
                                  {msg.actionCard.data.currency}
                                </span>
                              </div>

                              <div className="font-serif text-base font-semibold text-[#292827]">
                                {msg.actionCard.data.title}
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white border border-[#e3e3e2]">
                                  <div className="text-[10px] text-[#666666]">Location</div>
                                  <div className="font-medium text-[#292827] truncate">
                                    {msg.actionCard.data.location}
                                  </div>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-[#e3e3e2]">
                                  <div className="text-[10px] text-[#666666]">Date</div>
                                  <div className="font-medium text-[#292827]">
                                    {msg.actionCard.data.eventDate}
                                  </div>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-[#e3e3e2] col-span-2 sm:col-span-1">
                                  <div className="text-[10px] text-[#666666]">Target Guests</div>
                                  <div className="font-medium text-[#292827]">
                                    {msg.actionCard.data.guestCount} guests
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Link
                                  href={`/events/${msg.actionCard.data.id}/dashboard`}
                                  className="py-1.5 px-3 rounded-lg bg-[#421d24] hover:bg-[#5a2731] text-white text-xs font-[460] flex items-center space-x-1.5 transition-colors shadow-xs"
                                >
                                  <span>Open Command Center</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>

                                <button
                                  onClick={() => {
                                    const url = `${window.location.origin}/invite/${
                                      msg.actionCard?.data.slug || msg.actionCard?.data.id
                                    }`;
                                    handleCopy(url, msg.id);
                                  }}
                                  className="py-1.5 px-3 rounded-lg bg-white hover:bg-[#f2f0eb] border border-[#e3e3e2] text-xs font-[460] text-[#292827] flex items-center space-x-1.5 transition-colors"
                                >
                                  {copiedId === msg.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="text-emerald-700">Invite Link Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5 text-[#666666]" />
                                      <span>Copy Public Invite</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 2. Budget Summary Action Card */}
                          {msg.actionCard.type === "budget_summary" && (
                            <div className="p-4 rounded-xl bg-[#f8f7f4] border border-[#e3e3e2] space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#421d24]">Financial Ledger</span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                    msg.actionCard.data.variance >= 0
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {msg.actionCard.data.variance >= 0
                                    ? `+${msg.actionCard.data.variance.toLocaleString()} Buffer`
                                    : `${msg.actionCard.data.variance.toLocaleString()} Over`}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-[#666666]">
                                  <span>
                                    Spent: ${msg.actionCard.data.totalSpent.toLocaleString()}
                                  </span>
                                  <span>
                                    Cap: ${msg.actionCard.data.totalAlloc.toLocaleString()}{" "}
                                    {msg.actionCard.data.currency}
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-[#e3e3e2] overflow-hidden">
                                  <div
                                    className="h-full bg-[#714cb6] rounded-full transition-all duration-500"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.round(
                                          (msg.actionCard.data.totalSpent /
                                            (msg.actionCard.data.totalAlloc || 1)) *
                                            100
                                        )
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {activeEvent && (
                                <Link
                                  href={`/events/${activeEvent.id}/dashboard`}
                                  className="inline-flex items-center space-x-1 text-xs text-[#714cb6] hover:underline font-medium"
                                >
                                  <span>Edit expenses in interactive Command Center</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          )}

                          {/* 3. RSVP Summary Action Card */}
                          {msg.actionCard.type === "rsvp_summary" && (
                            <div className="p-4 rounded-xl bg-[#f8f7f4] border border-[#e3e3e2] space-y-3">
                              <div className="text-xs font-semibold text-[#421d24]">
                                Live RSVP Distribution
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                                  <div className="text-lg font-bold text-emerald-800">
                                    {msg.actionCard.data.goingCount}
                                  </div>
                                  <div className="text-[10px] text-emerald-700">Attending</div>
                                </div>
                                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                                  <div className="text-lg font-bold text-amber-800">
                                    {msg.actionCard.data.maybeCount}
                                  </div>
                                  <div className="text-[10px] text-amber-700">Tentative</div>
                                </div>
                                <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                                  <div className="text-lg font-bold text-gray-800">
                                    {msg.actionCard.data.declinedCount}
                                  </div>
                                  <div className="text-[10px] text-gray-600">Declined</div>
                                </div>
                              </div>

                              {msg.actionCard.data.inviteUrl && (
                                <div className="pt-1">
                                  <button
                                    onClick={() => {
                                      const fullUrl = `${window.location.origin}${msg.actionCard?.data.inviteUrl}`;
                                      handleCopy(fullUrl, msg.id);
                                    }}
                                    className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-[#f2f0eb] border border-[#e3e3e2] text-xs font-[460] text-[#292827] flex items-center justify-center space-x-1.5 transition-colors"
                                  >
                                    {copiedId === msg.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-700">Link Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-[#666666]" />
                                        <span>Copy Shareable Guest Invite Link</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 4. Milestones Action Card */}
                          {msg.actionCard.type === "milestone_list" && (
                            <div className="p-4 rounded-xl bg-[#f8f7f4] border border-[#e3e3e2] space-y-2">
                              <div className="text-xs font-semibold text-[#421d24]">
                                Upcoming Milestones ({msg.actionCard.data.completedCount} Completed)
                              </div>
                              <div className="space-y-1.5">
                                {msg.actionCard.data.milestones?.slice(0, 4).map((m: any, i: number) => (
                                  <div
                                    key={i}
                                    className="flex items-center space-x-2 text-xs p-1.5 rounded-lg bg-white border border-[#e3e3e2]"
                                  >
                                    <span className="text-emerald-600">
                                      {m.completed ? "✓" : "○"}
                                    </span>
                                    <span className="font-medium text-[#292827] flex-1 truncate">
                                      {m.taskTitle}
                                    </span>
                                    <span className="text-[10px] text-[#666666]">{m.timeframe}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Reasoning / Typing indicator */}
            {isAiLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#421d24] text-white flex items-center justify-center font-serif text-xs shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4 text-[#d4c7ff] animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-xs bg-white border border-[#e3e3e2] shadow-xs flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#714cb6] animate-bounce" />
                  <span
                    className="w-2 h-2 rounded-full bg-[#714cb6] animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-[#714cb6] animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                  <span className="text-xs text-[#666666] ml-1">
                    FestivAI is reasoning over your event data...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ----------------- CHAT INPUT DOCK (Bottom Floating) ----------------- */}
        <div className="p-4 bg-gradient-to-t from-[#f2f0eb] via-[#f2f0eb]/90 to-transparent shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-2xl bg-white border border-[#e3e3e2] shadow-md focus-within:border-[#714cb6] focus-within:ring-2 focus-within:ring-[#714cb6]/10 transition-all p-2 flex flex-col">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                placeholder="Ask anything about your celebrations, or say 'Plan a 50-guest rooftop party in Chicago with $6,000'..."
                className="w-full px-3 py-1.5 bg-transparent text-sm text-[#292827] placeholder:text-[#666666]/60 resize-none focus:outline-none"
              />

              {/* Bottom Dock Controls */}
              <div className="flex items-center justify-between pt-1 border-t border-[#f2f0eb] mt-1">
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setIsWizardModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-[#f8f7f4] hover:bg-[#f2f0eb] border border-[#e3e3e2] text-xs font-[460] text-[#292827] flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#714cb6]" />
                    <span>Open Form Wizard</span>
                  </button>

                  {activeEvent && (
                    <span className="hidden sm:inline-block text-[11px] text-[#666666] truncate max-w-[180px]">
                      Targeting: {activeEvent.title}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-[#666666] hidden md:inline">
                    Enter to send • Shift+Enter for new line
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isAiLoading}
                    className="w-8 h-8 rounded-xl bg-[#421d24] hover:bg-[#5a2731] disabled:opacity-40 disabled:hover:bg-[#421d24] text-white flex items-center justify-center transition-all shadow-xs"
                    title="Send Message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-[#666666] mt-2">
              FestivAI reasoning engine with Cloudflare D1 persistence & Superhuman editorial design.
            </div>
          </div>
        </div>
      </main>

      {/* ----------------- ORGANIZER WIZARD MODAL ----------------- */}
      {isWizardModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-[#f2f0eb] rounded-3xl border border-[#e3e3e2] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 bg-white border-b border-[#e3e3e2] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#421d24] text-white flex items-center justify-center font-serif text-sm font-bold">
                  F
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[#292827]">
                    Event Setup Wizard
                  </h3>
                  <p className="text-[10px] text-[#666666]">
                    Fill in celebration details to generate structured D1 plans
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWizardModalOpen(false)}
                className="p-1.5 rounded-lg border border-[#e3e3e2] hover:bg-[#f2f0eb] text-[#666666] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <OrganizerWizard
                onOpenSettings={onOpenSettings}
                selectedModel={selectedModel}
                onSuccess={handleWizardSuccess}
                onCancel={() => setIsWizardModalOpen(false)}
                initialOrganizerName={user?.displayName || ""}
                initialOrganizerEmail={user?.email || ""}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
