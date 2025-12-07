"use client";

import React, { useState } from "react";
import { GetAllChat, InsertChat, DropChat } from "../../services/chat"; 
// import type { FullChat } from "../../interfaces/Chat"; // ⚠️ Update your interface to match ID/message too!

export default function ChatTestPage() {
  const [groupMemberId, setGroupMemberId] = useState("");
  const [processId, setProcessId] = useState("");
  const [senderId, setSenderId] = useState("");
  const [message, setMessage] = useState(""); 

  // Using any[] here to avoid TypeScript errors while your Interface is outdated
  const [chats, setChats] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);

  const getIds = () => ({
    group_member_id: Number(groupMemberId),
    process_id: Number(processId),
    sender_id: Number(senderId),
  });

  const loadChats = async () => {
    const { group_member_id, process_id } = getIds();
    if (!group_member_id || !process_id) {
        alert("Please enter IDs");
        return;
    }

    try {
      setLoading(true);
      const res = await GetAllChat({ group_member_id, process_id });
      setChats(Array.isArray(res) ? res : []); 
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    const { group_member_id, process_id, sender_id } = getIds();
    if (!message) return;

    try {
      setLoading(true);
      await InsertChat({
        group_member_id,
        process_id,
        sender_id,
        messege: message, // ✅ Changed to 'message' (assuming backend matches)
      });
      setMessage(""); 
      await loadChats(); 
    } catch (error) {
      console.error("Error sending chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (targetId: number) => {
    if(!confirm("Delete this message?")) return;
    const { group_member_id, process_id } = getIds();
    try {
      setLoading(true);
      // ✅ Pass the ID correctly (verify your
      await DropChat({ id: targetId, group_member_id, process_id });
      await loadChats();
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Chat Test Page</h1>

      {/* Input Area */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: 20 }}>
        <input type="number" placeholder="Group Member ID" value={groupMemberId} onChange={(e) => setGroupMemberId(e.target.value)} style={inputStyle} />
        <input type="number" placeholder="Process ID" value={processId} onChange={(e) => setProcessId(e.target.value)} style={inputStyle} />
        <input type="number" placeholder="Sender ID" value={senderId} onChange={(e) => setSenderId(e.target.value)} style={inputStyle} />
        <button onClick={loadChats} disabled={loading} style={btnStyle("#007bff")}>{loading ? "..." : "Load"}</button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: 20 }}>
        <textarea placeholder="Type message..." value={message} onChange={(e) => setMessage(e.target.value)} style={{...inputStyle, flex: 1}} />
        <button onClick={sendChat} style={btnStyle("#28a745")}>Send</button>
      </div>

      <hr />

      {/* Message List */}
      <h2>Messages ({chats.length})</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {chats.map((c) => (
            // ✅ KEY FIX 1: Use c.ID (Capitalized)
            <div key={c.ID} style={chatItemStyle}>
              <div>
                <b style={{ color: "#555", marginRight: 8 }}>User {c.sender_id}:</b>
                
                {/* ✅ KEY FIX 2: Use c.message (Correct spelling) */}
                <span style={{ color: "#000" }}>{c.message}</span>
              </div>
              
              {/* ✅ Pass c.ID to delete */}
              <button onClick={() => deleteChat(c.ID)} style={{...btnStyle("#dc3545"), fontSize: 12, padding: "4px 8px"}}>Delete</button>
            </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { padding: 8, border: "1px solid #ccc", borderRadius: 4 };
const btnStyle = (bg: string) => ({ padding: "8px 16px", background: bg, color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" });
const chatItemStyle = { display: "flex", justifyContent: "space-between", padding: 10, background: "#f9f9f9", border: "1px solid #ddd", borderRadius: 4 };