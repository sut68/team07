"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { GetAllChat, InsertChat, DropChat, GetProcessIDbyGroupID } from "../../services/chat";
import { ProcessInterface } from "../../interfaces/Chat";

/* =========================
   FIXED IDs (edit these)
   ========================= */
const GROUP_PROJECT_ID = 1; // ✅ group_project_id
const USER_ID = 2;          // ✅ user_id (sender)
/* ========================= */

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: "flex", flexDirection: "column", height: "100vh", background: "#f5f5f5" },
  header: {
    padding: "12px 16px",
    background: "linear-gradient(100deg, #8A011D 0%, #7F666B 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" },
  title: { margin: 0, fontSize: "18px", fontWeight: 700 },
  subtitle: { fontSize: "13px", opacity: 0.85 },
  messageArea: { flex: 1, overflowY: "auto", padding: "16px", background: "#f5f5f5" },
  empty: { textAlign: "center", marginTop: "30%", color: "#666" },
  row: { display: "flex", marginBottom: "8px" },
  bubble: { padding: "8px 12px", borderRadius: "14px", maxWidth: "70%", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" },
  meta: { marginTop: "4px", fontSize: "11px", opacity: 0.75, display: "flex", gap: "8px", alignItems: "center" },
  footer: { padding: "10px", borderTop: "1px solid #ddd", display: "flex", gap: "8px", background: "#fff" },
  input: { flex: 1, padding: "10px 12px", borderRadius: "10px", border: "1px solid #ccc", outline: "none" },
  btn: { padding: "10px 12px", borderRadius: "10px", border: "none", cursor: "pointer" },
  select: { padding: "8px 10px", borderRadius: "10px", border: "none", outline: "none" },
};

function safeToNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isImageUrl(url: string) {
  if (!url) return false;
  return /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(url) || url.startsWith("data:image/");
}

function formatTime(dateString: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

interface TopicSelectorProps {
  processes: ProcessInterface[];
  processId: number | null;
  onSelect: (id: number) => void;
  disabled?: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ processes, processId, onSelect, disabled }) => {
  return (
    <select
      style={styles.select}
      disabled={disabled || processes.length === 0}
      value={processId ?? ""}
      onChange={(e) => onSelect(safeToNumber(e.target.value))}
    >
      {processes.length === 0 ? (
        <option value="">No Topics</option>
      ) : (
        processes.map((p) => (
          <option key={safeToNumber(p.id)} value={safeToNumber(p.id)}>
            {p.file}
          </option>
        ))
      )}
    </select>
  );
};

export default function ChatTestPage() {
  const [processes, setProcesses] = useState<ProcessInterface[]>([]);
  const [processId, setProcessId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const idsOk = GROUP_PROJECT_ID > 0 && USER_ID > 0;
  const hasTopic = !!processId && processId > 0;

  const currentProcess = useMemo(() => {
    const pid = safeToNumber(processId);
    return processes.find((p) => safeToNumber(p.id) === pid);
  }, [processes, processId]);

  const getIds = () => ({
    group_project_id: GROUP_PROJECT_ID,
    process_id: safeToNumber(processId),
    sender_id: USER_ID,
  });

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const loadChats = async (silent = false) => {
    if (!idsOk || !hasTopic) {
      setChats([]);
      return;
    }
    const { group_project_id, process_id } = getIds();
    try {
      if (!silent) setLoadingChats(true);
      const res = await GetAllChat({ group_project_id, process_id });
      if (Array.isArray(res)) setChats(res);
    } catch (e) {
      console.error("GetAllChat error:", e);
    } finally {
      if (!silent) setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (!idsOk) return;

    setLoadingTopics(true);
    GetProcessIDbyGroupID(GROUP_PROJECT_ID)
      .then((res) => {
        const normalized = (res ?? []).map((p: any) => ({
          ...p,
          id: safeToNumber(p.id),
        })) as ProcessInterface[];

        setProcesses(normalized);

        const firstId = normalized[0]?.id ? safeToNumber(normalized[0].id) : 0;
        setProcessId(firstId > 0 ? firstId : null);
      })
      .catch((e) => {
        console.error("GetProcessIDbyGroupID error:", e);
        setProcesses([]);
        setProcessId(null);
      })
      .finally(() => setLoadingTopics(false));
  }, []);

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    if (idsOk && hasTopic) {
      loadChats();
      pollingRef.current = setInterval(() => loadChats(true), 2000);
    } else {
      setChats([]);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [processId]);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idsOk || !hasTopic || !message) return;

    try {
      await InsertChat({ ...getIds(), message });
      setMessage("");
      await loadChats(true);
      setTimeout(scrollToBottom, 80);
    } catch (e) {
      console.error("InsertChat error:", e);
      alert("Failed to send message.");
    }
  };

  const deleteChat = async (targetId: number) => {
    if (!confirm("Remove this message?")) return;
    const { group_project_id, process_id } = getIds();
    try {
      await DropChat({ id: targetId, group_project_id, process_id });
      await loadChats(true);
    } catch (e) {
      console.error("DropChat error:", e);
      alert("Failed to delete message.");
    }
  };

  const headerTitle = currentProcess?.file ?? "Chat";
  const statusText = !idsOk
    ? "Missing IDs"
    : loadingTopics
    ? "Loading topics..."
    : !hasTopic
    ? processes.length === 0
      ? "No topics for this group"
      : "Choose a topic"
    : loadingChats
    ? "Syncing..."
    : "● Live";

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerRow}>
          <div>
            <h3 style={styles.title}>{headerTitle}</h3>
            <div style={styles.subtitle}>
              Group: {GROUP_PROJECT_ID} | User: {USER_ID} | Topic: {processId ?? "-"}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <TopicSelector
              processes={processes}
              processId={processId}
              onSelect={(id) => setProcessId(id > 0 ? id : null)}
              disabled={!idsOk || loadingTopics}
            />
            <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.9 }}>{statusText}</div>
          </div>
        </div>
      </div>

      <div style={styles.messageArea}>
        {!idsOk ? (
          <div style={styles.empty}>Set GROUP_PROJECT_ID and USER_ID to numbers &gt; 0</div>
        ) : loadingTopics ? (
          <div style={styles.empty}>Loading topics...</div>
        ) : !hasTopic ? (
          <div style={styles.empty}>
            {processes.length === 0 ? "No topics found for this group." : "Please choose a topic."}
          </div>
        ) : chats.length === 0 && !loadingChats ? (
          <div style={styles.empty}>No messages yet.</div>
        ) : (
          chats.map((c) => {
            const isMe = safeToNumber(c.sender_id) === USER_ID;
            const isDeleted = c.DeletedAt !== null && c.DeletedAt !== undefined;
            const msg = String(c.message ?? "");
            const isImg = !isDeleted && isImageUrl(msg);

            return (
              <div
                key={c.ID}
                style={{
                  ...styles.row,
                  justifyContent: isMe ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    background: isDeleted ? "#e4e6eb" : isMe ? "#8A011D" : "#ffffff",
                    color: isDeleted ? "#666" : isMe ? "#ffffff" : "#000000",
                    fontStyle: isDeleted ? "italic" : "normal",
                  }}
                >
                  {isDeleted ? (
                    "This message was removed"
                  ) : isImg ? (
                    <img
                      src={msg}
                      alt="content"
                      style={{ maxWidth: "320px", width: "100%", borderRadius: "12px", display: "block" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    msg
                  )}

                  <div style={styles.meta}>
                    <span>{formatTime(c.UpdatedAt)}</span>
                    {isMe && !isDeleted && (
                      <button
                        type="button"
                        onClick={() => deleteChat(safeToNumber(c.ID))}
                        style={{ ...styles.btn, padding: "4px 8px" }}
                      >
                        Unsend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form style={styles.footer} onSubmit={sendChat}>
        <input
          style={styles.input}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!idsOk || !hasTopic}
          placeholder={!idsOk ? "Missing IDs" : !hasTopic ? "Choose a topic..." : "Type message..."}
        />
        <button
          type="submit"
          style={{ ...styles.btn, background: "#8A011D", color: "#fff", opacity: !message || !idsOk || !hasTopic ? 0.6 : 1 }}
          disabled={!message || !idsOk || !hasTopic}
        >
          Send
        </button>
      </form>
    </div>
  );
}
