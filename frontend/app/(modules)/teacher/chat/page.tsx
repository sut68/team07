"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { GetAllChat, InsertChat, DropChat, Getteachergroup } from "../../../services/chat";
import { GetProgress } from "../../../services/progress";
import type { FullChat } from "../../../interfaces/Chat";
import type { FullProgress } from "../../../interfaces/Progress";
import { GetMe } from "@/app/services/login";
import { 
  SendOutlined, 
  DeleteOutlined, 
  MessageOutlined, 
  UserOutlined, 
  TeamOutlined, 
  RocketOutlined, 
  CommentOutlined,
  DisconnectOutlined,
  CheckCircleOutlined,
  ProjectOutlined,
  CaretDownOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { Avatar, Tooltip, Badge, Input, Button, Empty, Select, Tag } from 'antd';

export interface GroupProject {
  id: number;
  group_number: number;
  group_status: string;
  year: number;
  membership: number;
  teacher_id: number;
}

const THEME_RED = "#8A011D";
const THEME_RED_LIGHT = "#a81835";
const BG_COLOR = "#f0f2f5";
const BORDER_COLOR = "#e5e7eb";

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string>("");
  const [teacherGroups, setTeacherGroups] = useState<GroupProject[]>([]);
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
    setUserId(localStorage.getItem("user_id"));
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (socketRef.current) return;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

    const s = io(url, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socketRef.current = s;

    s.on("connect", () => console.log("socket connected:", s.id));
    s.on("connect_error", (e) => console.error("socket connect_error:", e));

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
      sender_id: Number(data.sender_id ?? data.SenderID ?? 0),
      message: data.message ?? data.Message ?? "",
      updated_at: timeString,
      created_at: data.created_at ?? data.CreatedAt ?? timeString,
      name: data.name ?? data.Name ?? `ผู้ใช้ ${data.sender_id}`,
    } as any;
  };

  useEffect(() => {
    if (!mounted) return;
    if (!userId) return;

    const uid = Number(userId);
    if (!Number.isFinite(uid) || uid <= 0) {
      setTeacherGroups([]);
      setGroupProjectId(0);
      return;
    }

    (async () => {
      try {
        const groups = await Getteachergroup({ teacher_id: uid });

        const clean = (Array.isArray(groups) ? groups : [])
          .map((g: any) => ({
            ...g,
            id: Number(g?.id ?? g?.ID ?? 0),
            group_number: Number(g?.group_number ?? g?.GroupNumber ?? 0),
            group_status: String(g?.group_status ?? g?.GroupStatus ?? ""),
            year: Number(g?.year ?? g?.Year ?? 0),
            membership: Number(g?.membership ?? g?.Membership ?? 0),
            teacher_id: Number(g?.teacher_id ?? g?.TeacherID ?? uid),
          }))
          .filter((g: GroupProject) => Number.isFinite(g.id) && g.id > 0);

        setTeacherGroups(clean);

        const preferred =
          clean.find((g) => g.group_status === "In Process") ??
          clean.find((g) => g.group_status === "Pending") ??
          clean[0] ??
          null;

        setGroupProjectId(preferred?.id ?? 0);
      } catch (e) {
        console.error("Getteachergroup failed:", e);
        setTeacherGroups([]);
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
    if (!idsOk) {
      setProcesses([]);
      setActiveRoomId(null);
      return;
    }

    (async () => {
      try {
        const res = await GetProgress({ group_project_id: groupProjectId });

        const normalized = (Array.isArray(res) ? res : [])
          .map((p: any) => ({ ...p, id: Number(p?.id ?? p?.ID ?? 0) }))
          .filter((p: any) => Number.isFinite(p.id) && p.id > 0);

        setProcesses(normalized);
        setActiveRoomId(normalized[0]?.id ?? null);
      } catch (e) {
        console.error("GetProgress failed:", e);
        setProcesses([]);
        setActiveRoomId(null);
      }
    })();
  }, [mounted, groupProjectId, idsOk]);

  useEffect(() => {
    if (!mounted) return;
    if (!idsOk) return;
    if (!roomJoined) return;

    const socket = socketRef.current;
    if (!socket) return;

    setChats([]);
    void loadChats(activeRoomId as number);

    const roomIdStr = `${groupProjectId}:${activeRoomId}`;
    socket.emit("join_room", roomIdStr);

    const handleReceive = (data: any) => {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
        id,
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
        fontFamily: "'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: BG_COLOR,
      }}
    >
      <aside
        style={{
          width: 320,
          background: "#fff",
          borderRight: `1px solid ${BORDER_COLOR}`,
          display: "flex",
          flexDirection: "column",
          boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
          zIndex: 10
        }}
      >
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${BORDER_COLOR}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 4, height: 24, background: THEME_RED, borderRadius: 2 }}></div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1f1f1f", margin: 0 }}>
              ห้องสนทนา
            </h1>
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", display: 'flex', alignItems: 'center', gap: 6 }}>
             <TeamOutlined style={{ color: THEME_RED }} />
             <span>จัดการและให้คำปรึกษา</span>
          </div>
        </div>

        <div style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {locked ? (
            <div style={{ padding: 20, textAlign: 'center', color: "#999", background: '#f9f9f9', borderRadius: 8, marginTop: 20 }}>
              <ProjectOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>กรุณาเลือกกลุ่มโครงงาน<br/>จากมุมขวาบน</div>
            </div>
          ) : processes.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: "#999", marginTop: 20 }}>
              <RocketOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <div>ยังไม่มีหัวข้อที่อนุมัติ</div>
            </div>
          ) : (
            processes.map((p) => {
              const isActive = Number(p.id) === Number(activeRoomId);
              return (
                <div
                  key={p.id}
                  onClick={() => onClickRoom(Number(p.id))}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    marginBottom: 8,
                    borderRadius: 12,
                    background: isActive ? `linear-gradient(135deg, ${THEME_RED}, ${THEME_RED_LIGHT})` : "#fff",
                    color: isActive ? "#fff" : "#1f1f1f",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: isActive ? "0 4px 12px rgba(138, 1, 29, 0.2)" : "0 2px 4px rgba(0,0,0,0.02)",
                    border: isActive ? "none" : `1px solid ${BORDER_COLOR}`,
                    opacity: locked ? 0.6 : 1,
                  }}
                >
                  <Avatar 
                    size="small" 
                    icon={<CommentOutlined />} 
                    style={{ 
                        backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
                        color: isActive ? '#fff' : '#666'
                    }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: isActive ? 600 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {(p as any).Name ?? (p as any).file ?? `Process ${p.id}`}
                    </div>
                  </div>
                  {isActive && <CheckCircleOutlined style={{ color: 'rgba(255,255,255,0.8)' }} />}
                </div>
              );
            })
          )}
        </div>
        
        <div style={{ padding: 16, borderTop: `1px solid ${BORDER_COLOR}`, background: '#f8f9fa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar style={{ backgroundColor: THEME_RED }} icon={<UserOutlined />} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 12, color: '#666' }}>เข้าสู่ระบบในชื่อ</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{myUsername || `อาจารย์ (${userId})`}</span>
                </div>
            </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
        <div
          style={{
            padding: "12px 24px",
            background: "#fff",
            borderBottom: `1px solid ${BORDER_COLOR}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            zIndex: 9,
            height: 72
          }}
        >
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1f1f1f", display: 'flex', alignItems: 'center', gap: 8 }}>
              {locked ? "เลือกกลุ่มเพื่อเริ่ม" : currentRoom ? (currentRoom as any).file : "เลือกหัวข้อ"}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {locked ? "กรุณาเลือกกลุ่มจากด้านขวา" : roomJoined ? `ประวัติการสนทนา ${chats.length} ข้อความ` : "คลิกหัวข้อทางซ้ายเพื่อเริ่มสนทนา"}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <Select
                value={groupProjectId}
                onChange={(val) => setGroupProjectId(Number(val))}
                style={{ width: 220 }}
                placeholder="เลือกกลุ่มโครงงาน"
                suffixIcon={<CaretDownOutlined style={{ color: THEME_RED }} />}
                options={teacherGroups.map(g => ({
                    value: g.id,
                    label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>กลุ่ม {g.group_number}</span>
                        <Tag color={g.group_status === 'Approved' ? 'green' : 'orange'} style={{ marginRight: 0, fontSize: 10 }}>
                        {g.group_status}
                        </Tag>
                    </div>
                    )
                }))}
                dropdownRender={(menu) => (
                    <>
                    {menu}
                    {teacherGroups.length === 0 && (
                        <div style={{ padding: '8px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
                        ไม่พบกลุ่มในที่ปรึกษา
                        </div>
                    )}
                    </>
                )}
             />

             <Badge status={locked ? "default" : roomJoined ? "success" : "warning"} text={
                <span style={{ color: locked ? "#999" : roomJoined ? "#52c41a" : "#faad14", fontWeight: 500 }}>
                    {locked ? "No Group" : roomJoined ? "Live" : "Waiting"}
                </span>
             } />
          </div>
        </div>

        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: 'flex', flexDirection: 'column' }}>
          {locked ? (
            <div style={{ margin: 'auto', textAlign: "center", color: "#9ca3af" }}>
               <AppstoreOutlined style={{ fontSize: 48, marginBottom: 16, color: '#e5e7eb' }} />
               <div style={{ fontWeight: 600, color: "#374151" }}>กรุณาเลือกกลุ่มโครงงาน</div>
               <div style={{ fontSize: 13 }}>เลือกกลุ่มที่ต้องการให้คำปรึกษาจากมุมขวาบน</div>
            </div>
          ) : !roomJoined ? (
            <div style={{ margin: 'auto', textAlign: "center", color: "#9ca3af" }}>
               <Empty description="เลือกหัวข้อทางซ้ายเพื่อเริ่มแชท" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : chats.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: "center", color: "#9ca3af" }}>
               <MessageOutlined style={{ fontSize: 48, marginBottom: 16, color: '#e5e7eb' }} />
               <div style={{ fontWeight: 600, color: "#374151" }}>ยังไม่มีข้อความ</div>
               <div style={{ fontSize: 13 }}>เริ่มการให้คำปรึกษาได้เลย</div>
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
                    marginBottom: 16,
                    alignItems: 'flex-end',
                    gap: 8
                  }}
                >
                  {!isMe && (
                      <Avatar 
                        size={32} 
                        style={{ backgroundColor: '#1890ff', marginBottom: 4 }}
                        icon={<UserOutlined />}
                      >
                          {(c.name || '').charAt(0).toUpperCase()}
                      </Avatar>
                  )}
                  
                  <div style={{ maxWidth: "65%" }}>
                    {!isMe && (
                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, marginLeft: 4 }}>
                            {(c.name || `ผู้ใช้ ${c.sender_id}`).split('@')[0]}
                        </div>
                    )}

                    <div
                      style={{
                        position: 'relative',
                        padding: "12px 16px",
                        borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isMe ? THEME_RED : "#fff",
                        color: isMe ? "#fff" : "#1f1f1f",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                        wordBreak: "break-word",
                        lineHeight: 1.5,
                        fontSize: 14
                      }}
                    >
                      {c.message}
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                        gap: 8,
                        marginTop: 4,
                        padding: '0 4px'
                    }}>
                        <span style={{ fontSize: 10, color: "#9ca3af" }}>{formatTime(c.updated_at)}</span>
                        {isMe && (
                            <Tooltip title="ลบข้อความ">
                                <DeleteOutlined 
                                    onClick={() => deleteMessage(Number(c.id))}
                                    style={{ fontSize: 10, color: "#9ca3af", cursor: "pointer" }} 
                                />
                            </Tooltip>
                        )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div
          style={{
            padding: "16px 24px",
            background: "#fff",
            borderTop: `1px solid ${BORDER_COLOR}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.02)"
          }}
        >
          <form 
            onSubmit={sendChat} 
            style={{ width: '100%', display: 'flex', gap: 12 }}
          >
            <Input
              size="large"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={locked || !roomJoined}
              placeholder={locked ? "ยังไม่สามารถส่งข้อความได้" : !roomJoined ? "กรุณาเลือกหัวข้อก่อน" : "พิมพ์ข้อความ..."}
              style={{ borderRadius: 24, paddingLeft: 20 }}
            />

            <Button
              type="primary"
              shape="circle"
              size="large"
              htmlType="submit"
              disabled={locked || !roomJoined || !message.trim()}
              icon={<SendOutlined style={{ marginLeft: 2 }} />}
              style={{ 
                  background: locked || !roomJoined || !message.trim() ? undefined : THEME_RED,
                  borderColor: locked || !roomJoined || !message.trim() ? undefined : THEME_RED,
                  minWidth: 40
              }}
            />
          </form>
        </div>
      </main>
    </div>
  );
}