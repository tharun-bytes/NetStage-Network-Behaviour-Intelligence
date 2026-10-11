import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronRight,
  ExternalLink,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { api } from "../../api/client";
import { useApp } from "../../context/AppContext";
import { ChatMessageItem, CopilotChatResponse } from "../../types";

interface FloatingCopilotWidgetProps {
  onExpandToFullPage: () => void;
  contextData?: {
    type?: string;
    record?: Record<string, any>;
    prompt?: string;
  } | null;
  onClearContext?: () => void;
}

export const FloatingCopilotWidget: React.FC<FloatingCopilotWidgetProps> = ({
  onExpandToFullPage,
  contextData,
  onClearContext,
}) => {
  const { profile, copilotPayload, clearCopilotPayload } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: "msg_init",
      sender: "copilot",
      text: "NetSage Copilot standing by. Ask me about your telemetry, anomalies, or predictions.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string>("conv_floating");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      if (typeof messagesEndRef.current?.scrollIntoView === "function") {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, isOpen]);

  // Handle incoming contextual prompt trigger from global AppContext
  useEffect(() => {
    if (copilotPayload && copilotPayload.prompt) {
      setIsOpen(true);
      handleSendMessage(copilotPayload.prompt, copilotPayload.record);
      clearCopilotPayload();
    }
  }, [copilotPayload]);

  // Handle incoming contextual prompt trigger from props
  useEffect(() => {
    if (contextData && contextData.prompt) {
      setIsOpen(true);
      handleSendMessage(contextData.prompt, contextData.record);
      if (onClearContext) onClearContext();
    }
  }, [contextData]);

  const handleSendMessage = async (msgToSend?: string, recordOverride?: Record<string, any>) => {
    const text = (msgToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg: ChatMessageItem = {
      id: `user_${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!msgToSend) setInputText("");
    setLoading(true);

    try {
      const res = await api.chatWithCopilot(
        text,
        activeConvId,
        "general",
        recordOverride || contextData?.record
      );
      if (res.conversation_id) setActiveConvId(res.conversation_id);

      const copilotMsg: ChatMessageItem = {
        id: `copilot_${Date.now()}`,
        sender: "copilot",
        text: res.reply,
        timestamp: new Date().toLocaleTimeString(),
        data: res,
      };
      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "copilot",
          text: `Error: ${err.message || "Failed to reach security copilot engine."}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button in Bottom-Right Corner */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Open NetSage AI Copilot"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full border border-cyan-500/50 bg-[#0d1222]/95 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl shadow-cyan-950/70 backdrop-blur-xl hover:border-cyan-400 hover:scale-105 transition-all group"
        >
          <div className="relative h-6 w-6 overflow-hidden rounded-full border border-cyan-400/60 shrink-0">
            <img src="/assets/netsage/netsage-mark.jpg" alt="AI" className="h-full w-full object-cover" />
          </div>
          <span className="font-medium text-slate-200 group-hover:text-cyan-300">NetSage Copilot</span>
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col h-[520px] w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-800 bg-[#0b0f1d] shadow-2xl shadow-black/80 backdrop-blur-2xl overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-slate-800/80 bg-[#0f152a] px-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg overflow-hidden border border-cyan-500/50">
                <img src="/assets/netsage/netsage-mark.jpg" alt="NetSage" className="h-full w-full object-cover" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  NetSage Copilot
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {profile ? `${profile.rows_count} flows active` : "Telemetry ready"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onExpandToFullPage();
                }}
                className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-white transition-colors"
                title="Expand to Full Page"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-white transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs leading-relaxed">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "copilot" && (
                  <div className="h-6 w-6 rounded-md bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl p-3 shadow-sm space-y-1.5 ${
                    m.sender === "user"
                      ? "bg-cyan-950/80 border border-cyan-800/80 text-cyan-50"
                      : "bg-[#131b2e] border border-slate-800 text-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.data?.summary && (
                    <div className="text-[10px] font-mono text-cyan-300 pt-1 border-t border-slate-800/80">
                      Summary: {m.data.summary}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start text-xs">
                <div className="h-6 w-6 rounded-md bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0 animate-pulse">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-xl p-2.5 bg-[#131b2e] border border-slate-800 text-slate-400 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>Analyzing telemetry...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="border-t border-slate-800/80 bg-[#0a0e1c] p-2 flex gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => handleSendMessage("Analyze my current dataset.")}
              disabled={loading}
              className="shrink-0 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300 hover:text-cyan-300 transition-colors"
            >
              Analyze Dataset
            </button>
            <button
              onClick={() => handleSendMessage("Did our dataset contain any unusual records?")}
              disabled={loading}
              className="shrink-0 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300 hover:text-cyan-300 transition-colors"
            >
              Check Anomalies
            </button>
            <button
              onClick={() => handleSendMessage("Generate a report.")}
              disabled={loading}
              className="shrink-0 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300 hover:text-cyan-300 transition-colors"
            >
              Generate Report
            </button>
          </div>

          {/* Composer Input */}
          <div className="border-t border-slate-800 bg-[#0f152a] p-2.5 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask NetSage Copilot..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputText.trim()}
              className="rounded-lg bg-cyan-600 p-2 text-white hover:bg-cyan-500 transition-colors disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
