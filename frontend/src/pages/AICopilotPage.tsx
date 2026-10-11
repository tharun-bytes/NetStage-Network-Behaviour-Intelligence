import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Info,
  Lightbulb,
  MessageSquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Square,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import {
  ChatMessageItem,
  ConversationSummary,
  CopilotAction,
  CopilotChatResponse,
  CopilotFinding,
} from "../types";
import { PageBackground } from "../components/common/PageBackground";

const SUGGESTED_PROMPTS = [
  "Analyze my current dataset.",
  "Explain the most unusual traffic records.",
  "Why did the model flag this record?",
  "Explain the model's performance.",
  "Compare traffic categories.",
  "Generate an investigation report.",
];

export const AICopilotPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { profile, activeModelDetail, notify } = useApp();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>("conv_default");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversationList();
  }, []);

  // When active conversation changes, load its message history
  useEffect(() => {
    if (activeConvId) {
      loadHistory(activeConvId);
    }
  }, [activeConvId]);

  // Scroll to bottom
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const loadConversationList = async () => {
    try {
      const list = await api.getConversations();
      if (list && list.length > 0) {
        setConversations(list);
        if (!activeConvId || activeConvId === "conv_default") {
          setActiveConvId(list[0].conversation_id);
        }
      } else {
        // Create initial session
        const created = await api.createConversation("Network Intelligence Session");
        setConversations([created]);
        setActiveConvId(created.conversation_id);
      }
    } catch {
      // Fallback local initial state
      setConversations([
        {
          conversation_id: "conv_default",
          title: "Network Intelligence Session",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message_count: 0,
        },
      ]);
    }
  };

  const loadHistory = async (cid: string) => {
    try {
      const res = await api.getConversationHistory(cid);
      if (res && res.messages) {
        setMessages(res.messages);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  };

  const handleNewConversation = async () => {
    try {
      const created = await api.createConversation("New Analysis Session");
      setConversations((prev) => [created, ...prev]);
      setActiveConvId(created.conversation_id);
      setMessages([]);
      notify("New conversation initialized", "info");
    } catch (err: any) {
      notify(`Failed to create conversation: ${err.message}`, "error");
    }
  };

  const handleDeleteConversation = async (cid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(cid);
      setConversations((prev) => prev.filter((c) => c.conversation_id !== cid));
      if (activeConvId === cid) {
        const remaining = conversations.filter((c) => c.conversation_id !== cid);
        if (remaining.length > 0) {
          setActiveConvId(remaining[0].conversation_id);
        } else {
          handleNewConversation();
        }
      }
      notify("Conversation deleted", "info");
    } catch (err: any) {
      notify(`Delete failed: ${err.message}`, "error");
    }
  };

  const handleClearAll = async () => {
    try {
      await api.clearAllConversations();
      setConversations([]);
      setMessages([]);
      handleNewConversation();
      notify("All conversations cleared", "info");
    } catch (err: any) {
      notify(`Clear failed: ${err.message}`, "error");
    }
  };

  const handleSend = async (msgToSend?: string) => {
    const text = (msgToSend || inputMessage).trim();
    if (!text || loading) return;

    const userEntry: ChatMessageItem = {
      id: `user_${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userEntry]);
    if (!msgToSend) setInputMessage("");
    setLoading(true);

    try {
      const response = await api.chatWithCopilot(text, activeConvId, "general");
      const copilotEntry: ChatMessageItem = {
        id: `copilot_${Date.now()}`,
        sender: "copilot",
        text: response.reply,
        data: response,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, copilotEntry]);
      loadConversationList();
    } catch (err: any) {
      const errorEntry: ChatMessageItem = {
        id: `err_${Date.now()}`,
        sender: "copilot",
        text: `Analysis error: ${err.message || "Failed to reach security copilot engine."}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorEntry]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
    notify("Response copied to clipboard", "success");
  };

  const handleRetry = (lastUserMsgText: string) => {
    handleSend(lastUserMsgText);
  };

  const handleActionClick = (action: CopilotAction) => {
    if (action.action_type === "navigate" && action.payload?.tab && onNavigate) {
      onNavigate(action.payload.tab);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-rose-950/80 text-rose-300 border-rose-800";
      case "high":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "medium":
        return "bg-yellow-950/80 text-yellow-300 border-yellow-800";
      default:
        return "bg-cyan-950/80 text-cyan-300 border-cyan-800";
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Background Graphic Asset */}
      <PageBackground imageSrc="/assets/netsage/copilot-bg.jpg" overlayVariant="dark" opacity={0.25} />

      <div className="relative z-10 space-y-4">
        {/* Header Bar */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0e1424]/90 p-5 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-indigo-700/60 shadow-lg shadow-indigo-950/50">
              <img
                src="/assets/netsage/ai-analysis-core.jpg"
                alt="AI Analysis Core"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">NetSage AI Copilot</h2>
                <span className="rounded bg-indigo-950 px-2 py-0.5 text-[10px] font-mono font-medium text-indigo-300 border border-indigo-800">
                  Grounded Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Conversational cybersecurity data analyst equipped with real dataset and model analysis tools.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewConversation}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-cyan-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> New Session
            </button>
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-400 hover:border-rose-800 transition-colors"
              title="Clear all conversation history"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Main Workspace Layout (Sidebar + Chat Area) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[680px]">
          {/* Left Conversations Sidebar (3 cols) */}
          <div className="lg:col-span-3 flex flex-col rounded-2xl border border-slate-800/80 bg-[#0c101d]/90 shadow-xl backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-[#0f1528]">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-cyan-400" /> Recent Sessions
              </span>
              <span className="text-[10px] font-mono text-slate-500">{conversations.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.map((c, cIdx) => {
                const isActive = c.conversation_id === activeConvId;
                return (
                  <div
                    key={c.conversation_id || `conv_${cIdx}`}
                    onClick={() => setActiveConvId(c.conversation_id)}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-cyan-950/70 border border-cyan-800/80 text-white shadow-sm"
                        : "border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                    }`}
                  >
                    <div className="overflow-hidden pr-2">
                      <p className="font-medium truncate">{c.title}</p>
                      <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                        {new Date(c.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {c.message_count} msgs
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteConversation(c.conversation_id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                      title="Delete session"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Central Chat Area (9 cols) */}
          <div className="lg:col-span-9 flex flex-col rounded-2xl border border-slate-800/80 bg-[#0c101d]/90 shadow-xl backdrop-blur-xl overflow-hidden">
            {/* Messages Scroll View */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {messages.length === 0 ? (
                /* Welcome Screen */
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5 max-w-lg mx-auto">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-cyan-500/40 shadow-xl shadow-cyan-950/60">
                    <img src="/assets/netsage/netsage-mark.jpg" alt="NetSage" className="h-full w-full object-cover" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Your Network Intelligence Copilot
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ask questions about traffic patterns, anomalies, model predictions, and investigation findings.
                      I'll help you understand the evidence and decide what to examine next.
                    </p>
                  </div>

                  {/* Suggested Prompts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2">
                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
                      <button
                        key={`prompt_btn_${idx}`}
                        onClick={() => handleSend(prompt)}
                        className="rounded-xl border border-slate-800 bg-[#12192e] p-3 text-left text-xs text-slate-300 hover:border-cyan-800 hover:text-cyan-300 hover:bg-[#151f38] transition-all shadow-sm group"
                      >
                        <div className="flex items-center justify-between">
                          <span>{prompt}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Message Thread */
                messages.map((m, idx) => (
                  <div
                    key={m.id || `msg_${idx}`}
                    className={`flex gap-3 text-xs leading-relaxed ${
                      m.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {m.sender === "copilot" && (
                      <div className="h-8 w-8 rounded-xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0 shadow-md">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] rounded-2xl p-4 shadow-md space-y-3 ${
                        m.sender === "user"
                          ? "bg-cyan-950/80 border border-cyan-800/80 text-cyan-50"
                          : "bg-[#131b2e] border border-slate-800 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-300">
                          {m.sender === "user" ? "Security Analyst" : "NetSage AI Copilot"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{m.timestamp}</span>
                          {m.sender === "copilot" && (
                            <button
                              onClick={() => handleCopy(m.text, idx)}
                              className="text-slate-500 hover:text-slate-300"
                              title="Copy response"
                            >
                              {copiedIdx === idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="whitespace-pre-wrap">{m.text}</p>

                      {/* Structured Response Model Rendering */}
                      {m.data && (
                        <div className="space-y-3 pt-2.5 border-t border-slate-800/80">
                          {/* Summary Pill */}
                          {m.data.summary && (
                            <div className="rounded-lg bg-cyan-950/50 border border-cyan-800/50 p-2 text-[11px] text-cyan-200 font-mono">
                              <span className="font-semibold text-cyan-400 uppercase text-[9px] block">Conclusion:</span>
                              {m.data.summary}
                            </div>
                          )}

                          {/* Key Findings Cards */}
                          {m.data.findings && m.data.findings.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                                Verified Telemetry Evidence
                              </span>
                              {m.data.findings.map((f: CopilotFinding, fi: number) => (
                                <div
                                  key={fi}
                                  className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-200">{f.title}</span>
                                    <span
                                      className={`rounded px-1.5 py-0.5 text-[9px] font-mono border ${getSeverityBadge(
                                        f.severity
                                      )}`}
                                    >
                                      {f.severity.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">{f.description}</p>
                                  {f.supporting_features?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {f.supporting_features.map((feat, feati) => (
                                        <span
                                          key={feati}
                                          className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-slate-300 border border-slate-700/60"
                                        >
                                          {feat}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Evidence References */}
                          {m.data.evidence_references && m.data.evidence_references.length > 0 && (
                            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-2.5 text-[11px] space-y-1">
                              <span className="text-[10px] font-mono text-slate-400 block font-semibold">
                                Telemetry Grounding Facts:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {m.data.evidence_references.map((ev, evi) => (
                                  <span
                                    key={evi}
                                    className="rounded bg-cyan-950/70 border border-cyan-800/70 px-2 py-0.5 font-mono text-[10px] text-cyan-300"
                                  >
                                    {ev}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommendations & Next Steps */}
                          {m.data.recommendations && m.data.recommendations.length > 0 && (
                            <div className="rounded-xl bg-emerald-950/30 border border-emerald-900/50 p-2.5 text-[11px] space-y-1">
                              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                                <Lightbulb className="h-3 w-3" /> Recommended Actions:
                              </span>
                              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                                {m.data.recommendations.map((rec, reci) => (
                                  <li key={reci}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Clickable Related Actions */}
                          {m.data.related_actions && m.data.related_actions.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {m.data.related_actions.map((act, actIdx) => (
                                <button
                                  key={act.id || `act_${actIdx}`}
                                  onClick={() => handleActionClick(act)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-cyan-800 bg-cyan-950/80 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-900 transition-colors"
                                >
                                  {act.label} <ExternalLink className="h-3 w-3" />
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Uncertainty & Engine Notice */}
                          <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                            <span>Engine: {m.data.provider}</span>
                            <span>{m.data.is_rule_based_fallback ? "Transparent Fallback Mode" : "LLM Augmented"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div className="flex gap-3 text-xs leading-relaxed justify-start">
                  <div className="h-8 w-8 rounded-xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0 animate-pulse">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl p-4 bg-[#131b2e] border border-slate-800 text-slate-400 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Analyzing network telemetry and synthesizing evidence...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer Area */}
            <div className="border-t border-slate-800/80 bg-[#0f152a] p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={2}
                  placeholder="Ask NetSage Copilot (Press Enter to send, Shift+Enter for new line)..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
                  disabled={loading}
                />
                <div className="flex flex-col gap-1.5 shrink-0">
                  {loading ? (
                    <button
                      onClick={() => setLoading(false)}
                      className="rounded-xl bg-rose-600/80 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors flex items-center gap-1.5"
                      title="Stop generation"
                    >
                      <Square className="h-3.5 w-3.5" /> Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSend()}
                      disabled={!inputMessage.trim()}
                      className="rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-4 py-3 text-xs font-semibold text-white hover:from-cyan-500 hover:to-indigo-500 transition-all disabled:opacity-50 shadow-md"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Enter to Send · Shift+Enter for New Line</span>
                <span>Context: {profile ? profile.source_name : "No Dataset"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
