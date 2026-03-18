import React, { useRef, useState } from "react";

import { sendChatMessage } from "../../services/weddingApi";
import type { ChatMessage, WeddingData } from "../../types/wedding";

interface Props {
  weddingData: WeddingData;
  onClose: () => void;
}

export default function AIChatPanel({ weddingData, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const reply = await sendChatMessage(next, weddingData);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>Wedding Assistant</h2>
        <button className="chat-close" onClick={onClose} type="button">✕</button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="chat-bubble chat-bubble-assistant chat-welcome">
            Ask me anything about your wedding — venues, budget, guests, tasks...
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble chat-bubble-${m.role}`}>
            <pre className="chat-content">{m.content}</pre>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble chat-bubble-assistant chat-loading">...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ask a question..."
          disabled={loading}
        />
        <button className="btn" onClick={handleSend} disabled={loading || !input.trim()} type="button">
          Send
        </button>
      </div>
      {error && <p className="muted chat-error">{error}</p>}
    </div>
  );
}
