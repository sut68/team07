"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { GetAllChat, InsertChat, GetProcessIDbyGroupID } from "../../services/chat";
import type { ProcessInterface, FullChat } from "../../interfaces/Chat";
import { GetGroupProjectIDByUser } from "../../services/progress";

const RED = "#9a0120";
const RED_DARK = "#7d0019";
const BORDER = "#e5e7eb";
const BG = "#fafafa";

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [groupProjectId, setGroupProjectId] = useState<number>(0);

  const [processes, setProcesses] = useState<ProcessInterface[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);

  const [chats, setChats] = useState<FullChat[]>([]);
  const [message, setMessage] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("user_id"));
  }, []);

  useEffect(() => {
    if (!userId) return;

    const uid = Number(userId);
    if (!Number.isFinite(uid) || uid <= 0) {
      setGroupProjectId(0);
      return;
    }

    (async () => {
      try {
        const res = await GetGroupProjectIDByUser({ student_id: uid });
        const gp = Number(res?.group_project_id ?? 0);
        setGroupProjectId(Number.isFinite(gp) && gp > 0 ? gp : 0);
      } catch {
        setGroupProjectId(0);
      }
    })();
  }, [userId]);

  const idsOk = groupProjectId > 0 && Number(userId) > 0;
  const roomJoined = activeRoomId !== null;

  const currentRoom = useMemo(
    () => processes.find((p) => Number(p.id) === Number(activeRoomId)),
    [processes, activeRoomId]
  );

  const loadChats = async (roomId?: number) => {
    const rid = roomId ?? activeRoomId;
    if (!idsOk || rid == null) return;

    const res = await GetAllChat({
      group_project_id: groupProjectId,
      process_id: Number(rid),
    });

    setChats(Array.isArray(res) ? res : []);
  };

  useEffect(() => {
    if (!idsOk) return;

    (async () => {
      const res = await GetProcessIDbyGroupID(groupProjectId);

      const normalized = (Array.isArray(res) ? res : [])
        .map((p: any) => {
          const rawId = p?.id ?? p?.ID ?? p?.process_id ?? p?.progress_id;
          return { ...p, id: Number(rawId) };
        })
        .filter((p: any) => Number.isFinite(p.id) && p.id > 0);

      setProcesses(normalized);

      if (normalized.length > 0) {
        setActiveRoomId(normalized[0].id);
      } else {
        setActiveRoomId(null);
      }
    })();
  }, [idsOk, groupProjectId]);

  useEffect(() => {
    if (!roomJoined) return;
    setChats([]);
    void loadChats(activeRoomId as number);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId]);

  useEffect(() => {
    if (!roomJoined) return;
    const t = setInterval(() => void loadChats(), 2000);
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
      group_project_id: groupProjectId,
      process_id: Number(activeRoomId),
      sender_id: Number(userId),
      message: text,
    });

    setMessage("");
    await loadChats();
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (typeof window === "undefined") return null;

  const locked = !idsOk;

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
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>หัวข้อ</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            กลุ่ม <b>{groupProjectId || "-"}</b> • ผู้ใช้ <b>{userId || "-"}</b>
          </div>
        </div>

        <div style={{ padding: 10, overflowY: "auto" }}>
          {locked ? (
            <div style={{ padding: 10, color: "#6b7280", fontSize: 13 }}>
              คุณยังไม่มีกลุ่ม โปรดเข้าร่วมกลุ่มก่อนจึงจะใช้งานแชทได้
            </div>
          ) : processes.length === 0 ? (
            <div style={{ padding: 10, color: "#6b7280", fontSize: 13 }}>ยังไม่มีหัวข้อ</div>
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
                    opacity: locked ? 0.6 : 1,
                  }}
                  disabled={locked}
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
              {locked ? "ยังไม่พร้อมใช้งาน" : currentRoom ? currentRoom.file : "เลือกหัวข้อ"}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {locked
                ? "โปรดเข้าร่วมกลุ่มก่อน"
                : roomJoined
                ? `${chats.length} ข้อความ`
                : "คลิกหัวข้อทางซ้าย"}
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
                background: locked ? "#9ca3af" : roomJoined ? "#22c55e" : "#9ca3af",
              }}
            />
            {locked ? "ยังไม่พร้อม" : roomJoined ? "เชื่อมต่อแล้ว" : "ยังไม่ได้เข้าห้อง"}
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
          {locked ? (
            <div style={{ textAlign: "center", marginTop: 90, color: "#6b7280" }}>
              คุณยังไม่มีกลุ่ม โปรดเข้าร่วมกลุ่มก่อนจึงจะใช้งานแชทได้
            </div>
          ) : !roomJoined ? (
            <div style={{ textAlign: "center", marginTop: 90, color: "#6b7280" }}>
              เลือกหัวข้อทางซ้าย
            </div>
          ) : chats.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 90, color: "#6b7280" }}>
              <div style={{ fontWeight: 800, color: "#111827" }}>ยังไม่มีข้อความ</div>
              <div style={{ marginTop: 6 }}>พิมพ์ข้อความแรกได้เลย</div>
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
                      {isMe ? "ฉัน" : `ผู้ใช้ ${c.sender_id}`}
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
            disabled={locked || !roomJoined}
            placeholder={
              locked
                ? "ยังไม่สามารถส่งข้อความได้"
                : !roomJoined
                ? "กรุณาเลือกหัวข้อก่อน"
                : "พิมพ์ข้อความ..."
            }
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
            disabled={locked || !roomJoined || !message.trim()}
            style={{
              height: 42,
              padding: "0 18px",
              borderRadius: 10,
              border: "none",
              background: locked || !roomJoined || !message.trim() ? "#e5e7eb" : RED,
              color: locked || !roomJoined || !message.trim() ? "#6b7280" : "#fff",
              cursor: locked || !roomJoined || !message.trim() ? "not-allowed" : "pointer",
              fontWeight: 900,
            }}
            onMouseEnter={(e) => {
              if (!(locked || !roomJoined || !message.trim())) e.currentTarget.style.background = RED_DARK;
            }}
            onMouseLeave={(e) => {
              if (!(locked || !roomJoined || !message.trim())) e.currentTarget.style.background = RED;
            }}
          >
            ส่ง
          </button>
        </form>
      </main>
    </div>
  );
}
