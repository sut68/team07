"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { GetAllChat, InsertChat, GetProcessIDbyGroupID } from "../../services/chat";
import type { ProcessInterface, FullChat } from "../../interfaces/Chat";


const GROUP_PROJECT_ID = 1;


const RED = "#9a0120";
const RED_DARK = "#7d0019";
const BORDER = "#e5e7eb";
const BG = "#fafafa";

export default function ChatPage() {

  const [userId, setUserId] = useState<string | null>(null);

  const [processes, setProcesses] = useState<ProcessInterface[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);

  const [chats, setChats] = useState<FullChat[]>([]);
  const [message, setMessage] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(localStorage.getItem("user_id"));
    }
  }, []);


  const idsOk = GROUP_PROJECT_ID > 0 && userId !== null && Number(userId) > 0;
  const roomJoined = activeRoomId !== null;

  const currentRoom = useMemo(
    () => processes.find((p) => Number(p.id) === Number(activeRoomId)),
    [processes, activeRoomId]
  );

  const loadChats = async (roomId?: number) => {
    const rid = roomId ?? activeRoomId;
    if (!idsOk || rid == null) return;

    const res = await GetAllChat({
      group_project_id: GROUP_PROJECT_ID,
      process_id: Number(rid),
    });

    setChats(Array.isArray(res) ? res : []);
  };


  useEffect(() => {
    if (!idsOk) return;

    (async () => {
      const res = await GetProcessIDbyGroupID(GROUP_PROJECT_ID);

 
      const normalized = (Array.isArray(res) ? res : [])
        .map((p: any) => {
          const rawId = p?.id ?? p?.ID ?? p?.process_id ?? p?.progress_id;
          return { ...p, id: Number(rawId) };
        })
        .filter((p: any) => Number.isFinite(p.id) && p.id > 0);

      setProcesses(normalized);

      if (normalized.length > 0) {
        setActiveRoomId(normalized[0].id);
      }
    })();
  }, [idsOk]);

  // Room changed → load chats
  useEffect(() => {
    if (!roomJoined) return;
    setChats([]);
    loadChats(activeRoomId as number);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId]);

  // Optional polling
  useEffect(() => {
    if (!roomJoined) return;
    const t = setInterval(() => loadChats(), 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId]);

  const onClickRoom = (roomId: number) => {
    if (roomId === activeRoomId) return;
    setActiveRoomId(roomId);
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomJoined) return;

    const text = message.trim();
    if (!text) return;

    await InsertChat({
      group_project_id: GROUP_PROJECT_ID,
      process_id: Number(activeRoomId),
      sender_id: Number(userId), // Updated to use state
      message: text,
    });

    setMessage("");
    await loadChats();
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  if (!userId && typeof window === 'undefined') {
     return null; 
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        background: BG,
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 280,
          background: "#fff",
          borderRight: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 14, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Topics</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            Group <b>{GROUP_PROJECT_ID}</b> • User <b>{userId || "..."}</b>
          </div>
        </div>

        <div style={{ padding: 10, overflowY: "auto" }}>
          {processes.length === 0 ? (
            <div style={{ padding: 10, color: "#6b7280", fontSize: 13 }}>
              No topics
            </div>
          ) : (
            processes.map((p) => {
              const isActive = Number(p.id) === Number(activeRoomId);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onClickRoom(Number(p.id))}
                  title={p.file}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 10px",
                    marginBottom: 6,
                    borderRadius: 10,
                    border: isActive ? `1px solid ${RED}` : `1px solid transparent`,
                    background: isActive ? RED : "transparent",
                    color: isActive ? "#fff" : "#111827",
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: isActive ? 800 : 600,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: isActive ? "#fff" : RED,
                      opacity: isActive ? 1 : 0.7,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    {p.file}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            padding: 14,
            background: "#fff",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: "#111827",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentRoom ? currentRoom.file : "Select a topic"}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {roomJoined ? `${chats.length} messages` : "Click a topic on the left"}
            </div>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 999,
              border: `1px solid ${BORDER}`,
              background: "#fff",
              fontSize: 12,
              color: "#374151",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: roomJoined ? "#22c55e" : "#9ca3af",
              }}
            />
            {roomJoined ? "Connected" : "Not joined"}
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            padding: 16,
            overflowY: "auto",
            background: BG,
          }}
        >
          {!roomJoined ? (
            <div style={{ textAlign: "center", marginTop: 90, color: "#6b7280" }}>
              Select a topic on the left
            </div>
          ) : chats.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 90, color: "#6b7280" }}>
              <div style={{ fontWeight: 800, color: "#111827" }}>No messages</div>
              <div style={{ marginTop: 6 }}>Be the first one to say hi 👋</div>
            </div>
          ) : (
            chats.map((c) => {
              const isMe = Number(c.sender_id) === Number(userId);

              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    justifyContent: isMe ? "flex-end" : "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ maxWidth: "72%" }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#6b7280",
                        marginBottom: 4,
                        textAlign: isMe ? "right" : "left",
                      }}
                    >
                      {isMe ? "Me" : `User ${c.sender_id}`}
                    </div>

                    <div
                      style={{
                        display: "inline-block",
                        padding: "10px 12px",
                        borderRadius: 14,
                        background: isMe ? RED : "#fff",
                        color: isMe ? "#fff" : "#111827",
                        border: isMe ? `1px solid ${RED}` : `1px solid ${BORDER}`,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                      }}
                    >
                      {c.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={sendChat}
          style={{
            padding: 12,
            borderTop: `1px solid ${BORDER}`,
            background: "#fff",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!roomJoined}
            placeholder={!roomJoined ? "Select topic first..." : "Type a message..."}
            style={{
              flex: 1,
              height: 42,
              padding: "0 12px",
              borderRadius: 10,
              border: `1px solid ${BORDER}`,
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = RED)}
            onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
          />

          <button
            type="submit"
            disabled={!roomJoined || !message.trim()}
            style={{
              height: 42,
              padding: "0 18px",
              borderRadius: 10,
              border: "none",
              background: !roomJoined || !message.trim() ? "#e5e7eb" : RED,
              color: !roomJoined || !message.trim() ? "#6b7280" : "#fff",
              cursor: !roomJoined || !message.trim() ? "not-allowed" : "pointer",
              fontWeight: 900,
            }}
            onMouseEnter={(e) => {
              if (!(!roomJoined || !message.trim())) e.currentTarget.style.background = RED_DARK;
            }}
            onMouseLeave={(e) => {
              if (!(!roomJoined || !message.trim())) e.currentTarget.style.background = RED;
            }}
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}