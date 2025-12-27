"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { GetAllChat, InsertChat, DropChat } from "../../../services/chat";
import { GetProgress, GetGroupProjectIDByUser } from "../../../services/progress";
import type { FullChat } from "../../../interfaces/Chat";
import { FullProgress } from "../../../interfaces/Progress";
import { GetMe } from "@/app/services/login";

const RED = "#9a0120";
const RED_DARK = "#7d0019";
const BORDER = "#e5e7eb";
const BG = "#fafafa";

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  // ✅ 1. ADDED: State to hold your name for the chat socket
  const [myUsername, setMyUsername] = useState<string>(""); 

  const [groupProjectId, setGroupProjectId] = useState<number>(0);
  const [processes, setProcesses] = useState<FullProgress[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [chats, setChats] = useState<FullChat[]>([]);
  const [message, setMessage] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await GetMe();
        if (me?.id) {
          setUserId(String(me.id));
          // ✅ 2. FIX: Save the username so we can send it later
          setMyUsername(me.username || ""); 
        }
      } catch (e) {
        console.error(e);
      }
    })();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!userId) {
        setUserId(localStorage.getItem("user_id"));
    }
  }, [mounted, userId]);

  useEffect(() => {
    if (!mounted) return;
    if (socketRef.current) return;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

    const s = io(url, {
      transports: ["websocket"],
      autoConnect: true,
      withCredentials: true,
    });

    socketRef.current = s;

    s.on("connect", () => {
      console.log("✅ socket connected:", s.id);
    });

    s.on("connect_error", (e) => {
      console.error("❌ socket connect_error:", e);
    });

    return () => {
      try {
        s.removeAllListeners();
        s.disconnect();
      } catch {}
      socketRef.current = null;
    };
  }, [mounted]);

  const normalizeChat = (data: any): FullChat => {
    const timeString =
      data.updated_at ||
      data.UpdatedAt ||
      data.created_at ||
      data.CreatedAt ||
      new Date().toISOString();

    return {
      ...data,
      id: Number(data.id ?? data.ID ?? 0),
      sender_id: Number(data.sender_id ?? 0),
      message: data.message ?? data.Message ?? "",
      updated_at: timeString,
      created_at: data.created_at ?? timeString,
      name: data.name ?? data.Name ?? `ผู้ใช้ ${data.sender_id}`, 
    };
  };

  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted, userId]);

  const idsOk = groupProjectId > 0 && Number(userId) > 0;
  const roomJoined = activeRoomId !== null;

  const currentRoom = useMemo(
    () => processes.find((p) => Number(p.id) === Number(activeRoomId)),
    [processes, activeRoomId]
  );

  const loadChats = async (roomId?: number) => {
    const rid = roomId ?? activeRoomId;
    if (!idsOk || rid == null) return;

    try {
      const res = await GetAllChat({
        group_project_id: groupProjectId,
        process_id: Number(rid),
        name: "", 
      });

      const rawData = Array.isArray(res) ? res : [];
      setChats(rawData.map(normalizeChat));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 50);
    } catch (error) {
      console.error("Error loading chats:", error);
      setChats([]);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    if (!idsOk) return;

    (async () => {
      const res = await GetProgress({ group_project_id: groupProjectId });
      const normalized = (Array.isArray(res) ? res : [])
        .map((p: any) => ({ ...p, id: Number(p?.id ?? p?.ID) }))
        .filter((p: any) => Number.isFinite(p.id) && p.id > 0);

      setProcesses(normalized);

      if (normalized.length > 0) {
        setActiveRoomId(normalized[0].id);
      } else {
        setActiveRoomId(null);
      }
    })();
  }, [mounted, idsOk, groupProjectId]);

  useEffect(() => {
    if (!mounted) return;
    if (!idsOk) return;
    if (!roomJoined) return;

    const socket = socketRef.current;
    if (!socket) return;

    setChats([]);
    void loadChats(activeRoomId as number);

    const roomIdStr = `${groupProjectId}:${activeRoomId}`;
    console.log("JOIN ROOM:", roomIdStr);
    socket.emit("join_room", roomIdStr);

    const handleReceive = (data: any) => {
      console.log("RECEIVE:", data);
      const cleanMsg = normalizeChat(data);

      setChats((prev) => {
        const otherMessages = prev.filter((msg) => Number(msg.id) !== Number(cleanMsg.id));
        return [...otherMessages, cleanMsg];
      });

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };

    const handleDelete = (payload: any) => {
      const id = Number(payload?.id ?? payload);
      if (!id) return;
      setChats((prev) => prev.filter((c) => Number(c.id) !== id));
    };

    socket.on("receive_message", handleReceive);
    socket.on("delete_message", handleDelete);

    return () => {
      console.log("LEAVE ROOM:", roomIdStr);
      socket.emit("leave_room", roomIdStr);
      socket.off("receive_message", handleReceive);
      socket.off("delete_message", handleDelete);
    };
  }, [mounted, idsOk, groupProjectId, activeRoomId, roomJoined]);

  const onClickRoom = (roomId: number) => {
    if (roomId === activeRoomId) return;
    setActiveRoomId(roomId);
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomJoined || !idsOk) return;

    const text = message.trim();
    if (!text) return;

    const socket = socketRef.current;
    if (!socket) {
      alert("Socket not connected");
      return;
    }

    const roomIdStr = `${groupProjectId}:${activeRoomId}`;

    // 4. FIX: Use 'myUsername' here so we send the name immediately!
    const payload = {
      group_project_id: groupProjectId,
      process_id: Number(activeRoomId),
      sender_id: Number(userId),
      name: myUsername, 
      message: text,
    };

    setMessage("");

    try {
      const savedMessage = (await InsertChat(payload)) as any;

      const dbId = Number(savedMessage?.id || savedMessage?.ID || 0);
      const uniqueId = dbId > 0 ? dbId : Date.now() + Math.random();

      const socketPayload = {
        ...payload,
        ...(typeof savedMessage === 'object' ? savedMessage : {}),
        id: uniqueId, 
        room_id: roomIdStr,

        name: savedMessage?.name || savedMessage?.Name || myUsername, 
      };

      socket.emit("send_message", socketPayload);

    } catch (err) {
      console.error("InsertChat failed:", err);
      alert("ส่งข้อความไม่สำเร็จ");
    }
  };

  const deleteMessage = async (id: number) => {
    if (!id || isNaN(id)) {
      alert("Error: Invalid Chat ID. Please refresh.");
      return;
    }

    const isConfirmed = confirm("Are you sure you want to delete this message?");
    if (!isConfirmed) return;

    try {
      const payload = {
        id: Number(userId),
        group_project_id: groupProjectId,
        process_id: Number(activeRoomId),
      };

      await DropChat(payload);
      setChats((prev) => prev.filter((c) => Number(c.id) !== id));

      const roomIdStr = `${groupProjectId}:${activeRoomId}`;
      const socket = socketRef.current;
      if (socket) socket.emit("delete_message", { id, room_id: roomIdStr });
    } catch (error) {
      console.error(error);
      alert("Failed to delete.");
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!mounted || !dateStr) return "";
    try {
      const date = new Date(dateStr);
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0"); 
      const ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12; 
      return `${hours}.${minutes} ${ampm}`;
    } catch {
      return "";
    }
  };

  if (!mounted) return null;

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
                  title={(p as any).file}
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
                    {(p as any).Name ?? (p as any).file ?? `Room ${p.id}`}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
              {locked ? "ยังไม่พร้อมใช้งาน" : currentRoom ? (currentRoom as any).file : "เลือกหัวข้อ"}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {locked ? "โปรดเข้าร่วมกลุ่มก่อน" : roomJoined ? `${chats.length} ข้อความ` : "คลิกหัวข้อทางซ้าย"}
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

        <div style={{ flex: 1, padding: 16, overflowY: "auto", background: BG }}>
          {locked ? (
            <div style={{ textAlign: "center", marginTop: 90, color: "#6b7280" }}>
              คุณยังไม่มีกลุ่ม โปรดเข้าร่วมกลุ่มก่อนจึงจะใช้งานแชทได้
            </div>
          ) : !roomJoined ? (
            <div style={{ textAlign: "center", marginTop: 90, color: "#6b7280" }}>เลือกหัวข้อทางซ้าย</div>
          ) : chats.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 90, color: "#6b7280" }}>
              <div style={{ fontWeight: 800, color: "#111827" }}>ยังไม่มีข้อความ</div>
              <div style={{ marginTop: 6 }}>พิมพ์ข้อความแรกได้เลย</div>
            </div>
          ) : (
            chats.map((c, index) => {
              const isMe = Number(c.sender_id) === Number(userId);

              return (
                <div
                  key={`${c.id}-${index}`}
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
                      {/* ✅ 5. FIX: Display name from the snapshot column */}
                      {isMe ? "ฉัน" : (c.name || `ผู้ใช้ ${c.sender_id}`).split('@')[0]}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "10px 12px",
                        borderRadius: 14,
                        background: isMe ? RED : "#fff",
                        color: isMe ? "#fff" : "#111827",
                        border: isMe ? `1px solid ${RED}` : `1px solid ${BORDER}`,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.message}</div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 8,
                          paddingTop: 6,
                          borderTop: isMe ? "1px solid rgba(255,255,255,0.3)" : `1px solid ${BORDER}`,
                          gap: 15,
                          fontSize: 10,
                          opacity: 0.9,
                        }}
                      >
                        <span>{formatTime(c.updated_at)}</span>

                        {isMe && (
                          <button
                            onClick={() => deleteMessage(Number(c.id))}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "inherit",
                              cursor: "pointer",
                              textDecoration: "underline",
                              padding: 0,
                              fontSize: 10,
                            }}
                          >
                            ลบ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>

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
            placeholder={locked ? "ยังไม่สามารถส่งข้อความได้" : !roomJoined ? "กรุณาเลือกหัวข้อก่อน" : "พิมพ์ข้อความ..."}
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