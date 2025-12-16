"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { GetAllChat, InsertChat, DropChat, GetProcessIDbyGroupID } from "../../services/chat";
import { ProcessInterface } from "../../interfaces/Chat";

/* =========================
   FIXED IDs (edit these)
   ========================= */
const GROUP_PROJECT_ID = 1;
const USER_ID = 2;
/* ========================= */

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: "flex", flexDirection: "column", height: "100vh" },
  header: { padding: "12px", background: "#8A011D", color: "#fff" },
  row: { display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" },
  label: { fontSize: "14px", fontWeight: 600 },
  select: { padding: "6px 8px", borderRadius: "6px" },
  button: { padding: "6px 12px", borderRadius: "6px", cursor: "pointer" },
  messages: { flex: 1, padding: "12px", overflowY: "auto", background: "#f5f5f5" },
  empty: { textAlign: "center", marginTop: "30%", color: "#666" },
  footer: { padding: "10px", borderTop: "1px solid #ddd", display: "flex", gap: "8px" },
  input: { flex: 1, padding: "8px", borderRadius: "6px" },
};

export default function ChatPage() {
  const [processes, setProcesses] = useState<ProcessInterface[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [processId, setProcessId] = useState<number | null>(null);

  const [chats, setChats] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  const idsOk = GROUP_PROJECT_ID > 0 && USER_ID > 0;
  const topicSet = processId !== null;

  const currentProcess = useMemo(
    () => processes.find((p) => Number(p.id) === Number(processId)),
    [processes, processId]
  );

  const getIds = () => ({
    group_project_id: GROUP_PROJECT_ID,
    process_id: Number(processId),
    sender_id: USER_ID,
  });

  const loadChats = async () => {
    if (!idsOk || !topicSet) return;
    const res = await GetAllChat(getIds());
    if (Array.isArray(res)) setChats(res);
  };

  useEffect(() => {
    if (!idsOk) return;

    GetProcessIDbyGroupID(GROUP_PROJECT_ID).then((res) => {
      const normalized = res.map((p: any) => ({
        ...p,
        id: Number(p.id),
      }));
      setProcesses(normalized);
      if (normalized.length > 0) setSelectedProcessId(normalized[0].id);
    });
  }, []);

  useEffect(() => {
    if (!topicSet) return;
    loadChats();
  }, [processId]);

  const setTopic = () => {
    if (!selectedProcessId) return;
    setProcessId(selectedProcessId);
    setChats([]);
    console.log("now set to",setChats([]))
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !topicSet) return;

    await InsertChat({ ...getIds(), message });
    setMessage("");
    loadChats();
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>Group: {GROUP_PROJECT_ID} | User: {USER_ID}</div>

        {/* ✅ LABEL + BUTTON */}
        <div style={styles.row}>
          <label style={styles.label}>Select topic:</label>

          <select
            style={styles.select}
            value={selectedProcessId ?? ""}
            onChange={(e) => setSelectedProcessId(Number(e.target.value))}
          >
            {processes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.file}
              </option>
            ))}
          </select>

          <button
            style={styles.button}
            onClick={setTopic}
            disabled={!selectedProcessId}
          >
            Set
          </button>
        </div>

        {currentProcess && (
          <div style={{ marginTop: "6px", fontSize: "13px" }}>
            Current topic: <b>{currentProcess.file}</b>
          </div>
        )}
      </div>

      <div style={styles.messages}>
        {!topicSet ? (
          <div style={styles.empty}>Please select and set a topic</div>
        ) : chats.length === 0 ? (
          <div style={styles.empty}>No messages</div>
        ) : (
          chats.map((c) => (
            <div key={c.ID}>
              <b>{c.sender_id === USER_ID ? "Me" : c.sender_id}:</b> {c.message}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form style={styles.footer} onSubmit={sendChat}>
        <input
          style={styles.input}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!topicSet}
          placeholder={!topicSet ? "Set topic first..." : "Type message"}
        />
        <button disabled={!message || !topicSet}>Send</button>
      </form>
    </div>
  );
}
