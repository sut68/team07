"use client";

import React, { useState } from "react";
import { GetAllChat, InsertChat, DropChat } from "../../services/chat"; // <-- adjust import path
import type { FullChat } from "../../interfaces/Chat";

export default function ChatTestPage() {
  const [group_member_id, setGroup] = useState("");
  const [process_id, setProcess] = useState("");
  const [sender_id, setSender] = useState("");
  const [messege, setMessage] = useState("");

  const [chats, setChats] = useState<FullChat[]>([]);

  const loadChats = async () => {
    const res = await GetAllChat({
      group_member_id: Number(group_member_id),
      process_id: Number(process_id),
    });
    setChats(res);
  };

  const sendChat = async () => {
    await InsertChat({
      group_member_id: Number(group_member_id),
      process_id: Number(process_id),
      sender_id: Number(sender_id),
      messege,
    });
    setMessage("");
    await loadChats();
  };

  const deleteChat = async (id: number) => {
    await DropChat({
      id,
      group_member_id: Number(group_member_id),
      process_id: Number(process_id),
    });
    await loadChats();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Chat Test Page</h1>

      <div>
        <input
          placeholder="group_member_id"
          value={group_member_id}
          onChange={(e) => setGroup(e.target.value)}
        />
        <input
          placeholder="process_id"
          value={process_id}
          onChange={(e) => setProcess(e.target.value)}
        />
        <input
          placeholder="sender_id"
          value={sender_id}
          onChange={(e) => setSender(e.target.value)}
        />
      </div>

      <button onClick={loadChats}>Load Chat</button>

      <div>
        <textarea
          placeholder="messege"
          value={messege}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendChat}>Send</button>
      </div>

      <hr />

      <h2>Messages</h2>
      {chats.map((c) => (
        <div key={c.id} style={{ marginBottom: 10 }}>
          <b>{c.sender_id}:</b> {c.messege}{" "}
          <button onClick={() => deleteChat(c.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
