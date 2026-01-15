"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  GetAllChat,
  InsertChat,
  DropChat,
  Getteachergroup,
  UploadFile,
} from "../../../services/chat";
import { GetProgress } from "../../../services/progress";
import type { FullChat } from "../../../interfaces/Chat";
import type { FullProgress } from "../../../interfaces/Progress";
import { GetMe } from "@/app/services/login";
import { CheckSpam } from "../../../services/spam";

import {
  SendOutlined,
  DeleteOutlined,
  MessageOutlined,
  UserOutlined,
  TeamOutlined,
  ExclamationCircleOutlined, 
  SafetyOutlined,
  RocketOutlined,
  CommentOutlined,
  DisconnectOutlined,
  CheckCircleOutlined,
  PaperClipOutlined,
  CloseCircleOutlined,
  FileOutlined,
  LoadingOutlined,
  PictureOutlined,
} from "@ant-design/icons";

import { Avatar, Tooltip, Badge, Input, Button, Empty, Select } from "antd";

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

const STORAGE_DOMAIN = process.env.NEXT_PUBLIC_BACKEND_URL;

const getFileUrl = (path: string) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${STORAGE_DOMAIN}${clean}`;
};

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roomFilter, setRoomFilter] = useState("");
  const [chatFilter, setChatFilter] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const [spamCheckEnabled, setSpamCheckEnabled] = useState(false);
  const [spamWarning, setSpamWarning] = useState<string | null>(null);
  const [checkingSpam, setCheckingSpam] = useState(false);

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
    if (!userId) setUserId(localStorage.getItem("user_id"));
  }, [mounted, userId]);

  useEffect(() => {
    if (!mounted) return;
    if (socketRef.current) return;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL;

    const s = io(url, {
      transports: ["websocket"],
      autoConnect: true,
      withCredentials: true,
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
      type: Number(data.type ?? data.ChatType ?? data.chattype ?? 1),
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
        setActiveRoomId(normalized.length > 0 ? normalized[0].id : null);
      } catch (e) {
        console.error("GetProgress failed:", e);
        setProcesses([]);
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
    socket.emit("join_room", roomIdStr);

    const handleReceive = (data: any) => {
      const cleanMsg = normalizeChat(data);

      setChats((prev) => {
        const otherMessages = prev.filter(
          (msg) => Number(msg.id) !== Number(cleanMsg.id)
        );
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

  const filteredProcesses = useMemo(() => {
    const q = roomFilter.trim().toLowerCase();
    if (!q) return processes;

    return processes.filter((p: any) => {
      const title = String(p?.Name ?? p?.file ?? p?.id ?? "").toLowerCase();
      return title.includes(q);
    });
  }, [roomFilter, processes]);

  const filteredChats = useMemo(() => {
    const q = chatFilter.trim().toLowerCase();
    if (!q) return chats;

    return chats.filter((c: any) => {
      const text = String(c?.message ?? "").toLowerCase();
      const sender = String(c?.name ?? "").toLowerCase();
      return text.includes(q) || sender.includes(q);
    });
  }, [chatFilter, chats]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSpamCheckEnabled(false);
    setSpamWarning(null);

    if (file.size > 20 * 1024 * 1024) {
      alert("ไฟล์นี้ใหญ่เกินไป (เกิน 20MB) ระบบจะไม่ทำการอัปโหลด");
      e.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (!file) continue;

        setSpamCheckEnabled(false);
        setSpamWarning(null);

        if (file.size > 20 * 1024 * 1024) {
          alert("ไฟล์นี้ใหญ่เกินไป (เกิน 20MB) ระบบจะไม่ทำการอัปโหลด");
          return;
        }

        setSelectedFile(file);
        e.preventDefault();
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isImage = (filename: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

  const sendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomJoined || !idsOk) return;

    const text = message.trim();
    if (!text && !selectedFile) return;

    if (spamCheckEnabled && !selectedFile) {
      try {
        setCheckingSpam(true);
        setSpamWarning(null);

        const res = await CheckSpam({ text });
        if (res.is_spam) {
          setSpamWarning("ข้อความนี้ไม่เหมาะสมและจะไม่ถูกส่ง");
          return;
        }
      } catch (err) {
        console.error("Spam check failed:", err);
      } finally {
        setCheckingSpam(false);
      }
    }

    setUploading(true);

    try {
      let finalMessage = text;
      let finalType = 1;

      if (selectedFile) {
        const url = await UploadFile(selectedFile);
        finalMessage = url;
        finalType = 2;
      }

      const payload = {
        group_project_id: groupProjectId,
        process_id: Number(activeRoomId),
        sender_id: Number(userId),
        type: finalType,
        name: myUsername,
        message: finalMessage,
      };

      await InsertChat(payload);

      setMessage("");
      setSpamWarning(null);
      clearFile();
    } catch (err: any) {
      const serverErrorMessage = err?.response?.data?.error;
      const statusCode = err?.response?.status;

      console.error(`Backend Error (${statusCode}):`, serverErrorMessage);

      if (statusCode === 413) {
        alert(`ไฟล์ใหญ่เกินไป: ${serverErrorMessage || "จำกัดที่ 20MB"}`);
      } else if (serverErrorMessage) {
        alert(`ข้อผิดพลาดจากระบบ: ${serverErrorMessage}`);
      } else {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    } finally {
      setUploading(false);
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
        fontFamily:
          "'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
          zIndex: 10,
        }}
      >
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${BORDER_COLOR}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 4, height: 24, background: THEME_RED, borderRadius: 2 }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1f1f1f", margin: 0 }}>
              ห้องสนทนา (อาจารย์)
            </h1>
          </div>

          <div style={{ marginTop: 10 }}>
            <div
              style={{
                fontSize: 12,
                color: "#6b7280",
                marginBottom: 6,
                display: "flex",
                gap: 6,
                alignItems: "center",
              }}
            >
              <TeamOutlined style={{ color: THEME_RED }} />
              เลือกกลุ่มโครงงาน
            </div>

            <Select
              value={groupProjectId || undefined}
              onChange={(val) => {
                setGroupProjectId(Number(val));
                setRoomFilter("");
                setChatFilter("");
                setSpamWarning(null);
                setSpamCheckEnabled(false);
              }}
              style={{ width: "100%" }}
              placeholder="เลือกกลุ่ม..."
              disabled={teacherGroups.length === 0}
              options={teacherGroups.map((g) => ({
                value: g.id,
                label: `Group ${g.group_number} ปีการศึกษา ${g.year}`,
              }))}
            />
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 10,
            }}
          >
            <TeamOutlined style={{ color: THEME_RED }} />
            <span>
              กลุ่มโครงงาน: <b>{groupProjectId || "-"}</b>
            </span>
          </div>
        </div>

        <div style={{ padding: "12px 12px 0 12px" }}>
          <Input
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            placeholder="ค้นหาหัวข้อ..."
            allowClear
            style={{ borderRadius: 10 }}
            disabled={locked}
          />
        </div>

        <div style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {locked ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: "#999",
                background: "#f9f9f9",
                borderRadius: 8,
              }}
            >
              <DisconnectOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>
                กรุณาเลือกกลุ่มโครงงาน
                <br />
                เพื่อเริ่มการสนทนา
              </div>
            </div>
          ) : filteredProcesses.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#999" }}>
              <RocketOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <div>
                {processes.length === 0 ? "ยังไม่มีหัวข้อที่อนุมัติ" : "ไม่พบหัวข้อที่ค้นหา"}
              </div>
            </div>
          ) : (
            filteredProcesses.map((p) => {
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
                    background: isActive
                      ? `linear-gradient(135deg, ${THEME_RED}, ${THEME_RED_LIGHT})`
                      : "#fff",
                    color: isActive ? "#fff" : "#1f1f1f",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: isActive
                      ? "0 4px 12px rgba(138, 1, 29, 0.2)"
                      : "0 2px 4px rgba(0,0,0,0.02)",
                    border: isActive ? "none" : `1px solid ${BORDER_COLOR}`,
                    opacity: locked ? 0.6 : 1,
                  }}
                >
                  <Avatar
                    size="small"
                    icon={<CommentOutlined />}
                    style={{
                      backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "#f0f0f0",
                      color: isActive ? "#fff" : "#666",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: isActive ? 600 : 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {(p as any).Name ?? (p as any).file ?? `Process ${p.id}`}
                    </div>
                  </div>
                  {isActive && <CheckCircleOutlined style={{ color: "rgba(255,255,255,0.8)" }} />}
                </div>
              );
            })
          )}
        </div>

        <div style={{ padding: 16, borderTop: `1px solid ${BORDER_COLOR}`, background: "#f8f9fa" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar style={{ backgroundColor: THEME_RED }} icon={<UserOutlined />} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 12, color: "#666" }}>เข้าสู่ระบบในชื่อ</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {myUsername || `User ${userId}`}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
        <div
          style={{
            padding: "16px 24px",
            background: "#fff",
            borderBottom: `1px solid ${BORDER_COLOR}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            zIndex: 9,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#1f1f1f",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {locked
                ? "ยังไม่พร้อมใช้งาน"
                : currentRoom
                ? (currentRoom as any).Name
                : "เลือกหัวข้อ"}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              {locked
                ? "โปรดเลือกกลุ่มก่อน"
                : roomJoined
                ? `ประวัติการสนทนา ${filteredChats.length} ข้อความ`
                : "คลิกหัวข้อทางซ้ายเพื่อเริ่มสนทนา"}
            </div>
          </div>

          <Badge
            status={locked ? "default" : roomJoined ? "success" : "warning"}
            text={
              <span
                style={{
                  color: locked ? "#999" : roomJoined ? "#52c41a" : "#faad14",
                  fontWeight: 500,
                }}
              >
                {locked ? "Offline" : roomJoined ? "Connected" : "Waiting"}
              </span>
            }
          />
        </div>

        <div style={{ padding: "12px 24px 0 24px" }}>
          <Input
            value={chatFilter}
            onChange={(e) => setChatFilter(e.target.value)}
            placeholder="ค้นหาข้อความ / ชื่อผู้ส่ง..."
            allowClear
            style={{ borderRadius: 10, maxWidth: 360 }}
            disabled={locked || !roomJoined}
          />
        </div>

        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {locked ? (
            <div style={{ margin: "auto", textAlign: "center", color: "#9ca3af" }}>
              <Empty description="คุณยังไม่มีกลุ่มโครงงาน" />
            </div>
          ) : !roomJoined ? (
            <div style={{ margin: "auto", textAlign: "center", color: "#9ca3af" }}>
              <Empty description="เลือกหัวข้อทางซ้ายเพื่อเริ่มแชท" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : filteredChats.length === 0 ? (
            // ✅ FIX: use filteredChats here (not chats)
            <div style={{ margin: "auto", textAlign: "center", color: "#9ca3af" }}>
              {chats.length === 0 ? (
                <>
                  <MessageOutlined style={{ fontSize: 48, marginBottom: 16, color: "#e5e7eb" }} />
                  <div style={{ fontWeight: 600, color: "#374151" }}>ยังไม่มีข้อความ</div>
                  <div style={{ fontSize: 13 }}>พิมพ์ข้อความแรกเพื่อเริ่มคุยกับนักศึกษา</div>
                </>
              ) : (
                <Empty description="ไม่พบข้อความที่ค้นหา" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          ) : (
            filteredChats.map((c, index) => {
              const isMe = Number(c.sender_id) === Number(userId);

              return (
                <div
                  key={`${c.id}-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: isMe ? "flex-end" : "flex-start",
                    marginBottom: 16,
                    alignItems: "flex-end",
                    gap: 8,
                  }}
                >
                  {!isMe && (
                    <Avatar size={32} style={{ backgroundColor: "#1890ff", marginBottom: 4 }} icon={<UserOutlined />}>
                      {(c.name || "").charAt(0).toUpperCase()}
                    </Avatar>
                  )}

                  <div style={{ maxWidth: "65%" }}>
                    {!isMe && (
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, marginLeft: 4 }}>
                        {(c.name || `ผู้ใช้ ${c.sender_id}`).split("@")[0]}
                      </div>
                    )}

                    <div
                      style={{
                        position: "relative",
                        padding: "12px 16px",
                        borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isMe ? THEME_RED : "#fff",
                        color: isMe ? "#fff" : "#1f1f1f",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                        wordBreak: "break-word",
                        lineHeight: 1.5,
                        fontSize: 14,
                      }}
                    >
                      {c.type === 2 || (c as any).chattype === 2 ? (
                        <div>
                          {isImage(c.message) ? (
                            <img
                              src={getFileUrl(c.message)}
                              alt="sent file"
                              style={{ maxWidth: "200px", borderRadius: "8px", display: "block", cursor: "pointer" }}
                              onClick={() => window.open(getFileUrl(c.message), "_blank")}
                            />
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <FileOutlined style={{ fontSize: 24 }} />
                              <a
                                href={getFileUrl(c.message)}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: isMe ? "white" : "blue", textDecoration: "underline" }}
                              >
                                {c.message.split("/").pop() || "Download File"}
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        c.message
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                        gap: 8,
                        marginTop: 4,
                        padding: "0 4px",
                      }}
                    >
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
            flexDirection: "column",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.02)",
          }}
        >
          {spamWarning && (
            <div
              style={{
                marginBottom: 10,
                padding: "8px 12px",
                background: "#fff1f0",
                border: "1px solid #ffa39e",
                borderRadius: 8,
                color: "#a8071a",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ExclamationCircleOutlined />
              {spamWarning}
            </div>
          )}

          {selectedFile && (
            <div
              style={{
                marginBottom: 10,
                padding: "8px 12px",
                background: "#f0f2f5",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isImage(selectedFile.name) ? <PictureOutlined /> : <FileOutlined />}
                <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedFile.name}
                </span>
                <span style={{ color: "#999", fontSize: 11 }}>
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <CloseCircleOutlined onClick={clearFile} style={{ cursor: "pointer", color: "#666", fontSize: 16 }} />
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
            <input type="file" hidden ref={fileInputRef} onChange={handleFileSelect} />

            <Button
              shape="circle"
              icon={<PaperClipOutlined />}
              onClick={() => fileInputRef.current?.click()}
              disabled={locked || !roomJoined || uploading || checkingSpam}
              style={{ border: "none", boxShadow: "none" }}
            />

            <Tooltip title={selectedFile ? "ไม่สามารถใช้ตรวจสแปมขณะส่งไฟล์" : "เปิด/ปิด ตรวจสแปม"}>
              <Button
                shape="circle"
                icon={<SafetyOutlined />}
                onClick={() => {
                  if (selectedFile) return;
                  setSpamWarning(null);
                  setSpamCheckEnabled((v) => !v);
                }}
                disabled={!!selectedFile || locked || !roomJoined || uploading || checkingSpam}
                style={{
                  border: "none",
                  boxShadow: "none",
                  background: spamCheckEnabled ? THEME_RED : undefined,
                  color: spamCheckEnabled ? "#fff" : undefined,
                }}
              />
            </Tooltip>

            <Input
              size="large"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (spamWarning) setSpamWarning(null);
              }}
              onPaste={handlePaste}
              disabled={locked || !roomJoined || !!selectedFile || uploading || checkingSpam}
              placeholder={
                selectedFile
                  ? "กดส่งเพื่ออัปโหลดไฟล์..."
                  : locked
                  ? "ยังไม่สามารถส่งข้อความได้"
                  : "พิมพ์ข้อความ... (หรือวางรูปภาพ)"
              }
              style={{ borderRadius: 24, paddingLeft: 20 }}
              onPressEnter={(e) => {
                // @ts-ignore
                if (!e.shiftKey) sendChat(e);
              }}
            />

            <Button
              type="primary"
              shape="circle"
              size="large"
              onClick={sendChat}
              disabled={locked || !roomJoined || (!message.trim() && !selectedFile) || uploading || checkingSpam}
              icon={uploading || checkingSpam ? <LoadingOutlined /> : <SendOutlined style={{ marginLeft: 2 }} />}
              style={{
                background: locked || !roomJoined || (!message.trim() && !selectedFile) ? undefined : THEME_RED,
                borderColor: locked || !roomJoined || (!message.trim() && !selectedFile) ? undefined : THEME_RED,
                minWidth: 40,
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
