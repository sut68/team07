"use client";

import React, { useState, useEffect, useRef } from "react";
import { GetAllChat, InsertChat, DropChat } from "../../services/chat";

export default function ChatTestPage() {
  // --- State ---
  const [groupMemberId, setGroupMemberId] = useState("");
  const [processId, setProcessId] = useState("");
  const [senderId, setSenderId] = useState("");
  
  // message can now hold text OR a huge Base64 image string
  const [message, setMessage] = useState(""); 
  
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const prevChatLengthRef = useRef(0);

  // --- Helper: Scroll to bottom ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Helper: Check if string is an image (URL or Base64) ---
  const isImageUrl = (url: string) => {
    if (!url) return false;
    return (
      /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(url) || 
      url.startsWith("data:image/") // Checks for Base64
    );
  };

  // --- Effect: Handle Scrolling ---
  useEffect(() => {
    if (chats.length > prevChatLengthRef.current) {
      scrollToBottom();
    }
    prevChatLengthRef.current = chats.length;
  }, [chats]);

  // --- Helper: Format Time ---
  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getIds = () => ({
    group_member_id: Number(groupMemberId),
    process_id: Number(processId),
    sender_id: Number(senderId),
  });

  // --- API Functions ---
  const loadChats = async (silent = false) => {
    const { group_member_id, process_id } = getIds();
    if (!group_member_id || !process_id) return;

    try {
      if (!silent) setLoading(true);
      const res = await GetAllChat({ group_member_id, process_id });
      if (Array.isArray(res)) {
        setChats(res);
      }
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // --- Real-Time Polling ---
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (groupMemberId && processId) {
      loadChats();
      pollingRef.current = setInterval(() => {
        loadChats(true);
      }, 2000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [groupMemberId, processId]);

  // --- HANDLER: Paste Image ---
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    // Loop through clipboard items to find an image
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault(); // Stop pasting the binary text name
        
        const blob = item.getAsFile();
        if (!blob) return;

        // Convert image to Base64 String
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setMessage(base64); // Store the image data as the message
        };
        reader.readAsDataURL(blob);
        return; // Stop after finding the first image
      }
    }
  };

  const sendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const { group_member_id, process_id, sender_id } = getIds();
    if (!message) return;
    console.warn(message);
    try {
      await InsertChat({
        group_member_id,
        process_id,
        sender_id,
        messege: message, // Sends text OR Base64 string
      });
      
      setMessage("");
      await loadChats(true);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending chat:", error);
      alert("Failed to send. Image might be too large for the database.");
    }
  };

  const deleteChat = async (targetId: number) => {
    if (!confirm("Are you sure you want to remove this message?")) return;
    const { group_member_id, process_id } = getIds();
    try {
      await DropChat({ id: targetId, group_member_id, process_id });
      await loadChats(true);
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  // Check if current input message is an image (for preview)
  const isPendingImage = message.startsWith("data:image/");

  // --- Render ---
  return (
    <div style={styles.container}>

      {/* 1. Developer Config Bar */}
      <div style={styles.configBar}>
        <span style={{ fontWeight: 'bold', marginRight: 10 }}>🔧 Debug:</span>
        <input type="number" placeholder="Group ID" value={groupMemberId} onChange={(e) => setGroupMemberId(e.target.value)} style={styles.inputSmall} />
        <input type="number" placeholder="Process ID" value={processId} onChange={(e) => setProcessId(e.target.value)} style={styles.inputSmall} />
        <input type="number" placeholder="My ID" value={senderId} onChange={(e) => setSenderId(e.target.value)} style={styles.inputSmall} />
        <div style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>
          {loading ? "Syncing..." : "● Live"}
        </div>
      </div>

      {/* 2. Header */}
      <div style={styles.header}>
        <div style={styles.headerIconContainer}>
          <div style={styles.headerIconCircle}>💬</div>
        </div>
        <div>
          <h3 style={styles.headerTitle}>Capstone Project Hub</h3>
          <span style={styles.headerSubtitle}>Active Now</span>
        </div>
      </div>

      {/* 3. Messages Area */}
      <div style={styles.messageArea}>
        {!groupMemberId || !processId ? (
          <div style={styles.emptyState}>Please enter IDs in the top bar to connect.</div>
        ) : chats.length === 0 ? (
          <div style={styles.emptyState}>No messages yet. Paste an image or say hello! 👋</div>
        ) : (
          chats.map((c) => {
            const isMe = c.sender_id === Number(senderId);
            const isDeleted = c.DeletedAt !== null && c.DeletedAt !== undefined;
            const isImg = !isDeleted && isImageUrl(c.message);

            return (
              <div key={c.ID} style={{ ...styles.messageRow, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                {!isMe && <div style={styles.avatar}>{c.sender_id}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  <div style={{
                    ...styles.bubble,
                    background: isDeleted
                      ? '#e4e6eb'
                      : (isMe ? 'linear-gradient(100deg, #8A011D 0%, #7F666B 100%)' : '#ffffff'),
                    color: isDeleted ? '#888' : (isMe ? '#ffffff' : '#050505'),
                    fontStyle: isDeleted ? 'italic' : 'normal',
                    border: (!isMe && !isDeleted) ? '1px solid #e4e6eb' : 'none',
                    borderBottomRightRadius: isMe ? '4px' : '18px',
                    borderBottomLeftRadius: isMe ? '18px' : '4px',
                    padding: isImg ? '4px' : '8px 12px',
                  }}>
                    {isDeleted ? (
                      "This message was removed"
                    ) : isImg ? (
                      <img 
                        src={c.message} 
                        alt="content" 
                        style={{ maxWidth: '100%', borderRadius: '12px', display: 'block', maxHeight: '300px' }} 
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      c.message
                    )}
                  </div>

                  <div style={styles.metaContainer}>
                    <span style={styles.timestamp}>{formatTime(c.UpdatedAt)}</span>
                    {isMe && !isDeleted && (
                      <button onClick={() => deleteChat(c.ID)} style={styles.deleteBtn}>Unsend</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Footer Input */}
      <form onSubmit={sendChat} style={styles.footer}>
        <div style={styles.inputWrapper}>
          
          {/* Image Preview Box (Shown only when an image is pasted) */}
          {isPendingImage ? (
             <div style={styles.imagePreviewContainer}>
                <div style={styles.previewLabel}>Image Ready to Send</div>
                <img src={message} alt="preview" style={styles.previewImage} />
                <button 
                  type="button" 
                  onClick={() => setMessage("")} // Clear image
                  style={styles.clearImageBtn}
                >
                  ✕
                </button>
             </div>
          ) : (
            <input
              placeholder="Type a message or Ctrl+V to paste image..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onPaste={handlePaste} // <--- MAGIC HAPPENS HERE
              style={styles.chatInput}
            />
          )}

          <button type="submit" disabled={!message} style={styles.sendBtn}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill={message ? "#8A011D" : "#bcc0c4"}>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Styles ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#f5f5f5",
    fontFamily: "'Noto Sans Thai', 'Inter', system-ui, sans-serif",
  },
  configBar: {
    padding: "6px 12px", backgroundColor: "#242526", color: "#b0b3b8", display: "flex", alignItems: "center", fontSize: "12px", borderBottom: "1px solid #3e4042", zIndex: 20,
  },
  inputSmall: {
    padding: "4px 8px", borderRadius: "4px", border: "1px solid #3e4042", backgroundColor: "#3a3b3c", color: "white", width: "60px", fontSize: "12px", marginRight: "6px",
  },
  header: {
    padding: "10px 16px", background: 'linear-gradient(100deg, #8A011D 0%, #7F666B 100%)', boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", zIndex: 10, height: "72px", color: "#fff",
  },
  headerIconContainer: { marginRight: "12px" },
  headerIconCircle: {
    width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
  },
  headerTitle: { margin: 0, fontSize: "18px", fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: "13px", color: "rgba(255,255,255,0.8)" },
  messageArea: {
    flex: 1, overflowY: "auto", padding: "20px 15px", display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "#f9f9f9",
  },
  emptyState: { textAlign: "center", color: "#65676b", marginTop: "40%", fontSize: "15px" },
  messageRow: { display: "flex", alignItems: "flex-end", marginBottom: "2px" },
  avatar: {
    width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#8A011D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", color: "#fff", marginRight: "8px", marginBottom: "22px",
  },
  bubble: {
    padding: "8px 12px", borderRadius: "18px", fontSize: "15px", lineHeight: "1.4", maxWidth: "100%", wordWrap: "break-word", boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  metaContainer: { display: "flex", alignItems: "center", marginTop: "2px", padding: "0 4px", gap: "8px" },
  timestamp: { fontSize: "11px", color: "#65676b" },
  deleteBtn: {
    background: "none", border: "none", color: "#8A011D", fontSize: "11px", cursor: "pointer", padding: 0, textDecoration: "underline", opacity: 0.8,
  },
  footer: { padding: "10px 12px", backgroundColor: "#ffffff", borderTop: "1px solid #e4e6eb" },
  inputWrapper: {
    display: "flex", alignItems: "center", backgroundColor: "#f0f2f5", borderRadius: "20px", padding: "4px 10px", minHeight: "44px"
  },
  chatInput: {
    flex: 1, padding: "10px 8px", backgroundColor: "transparent", border: "none", outline: "none", fontSize: "15px", color: "#050505",
  },
  sendBtn: {
    background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px",
  },
  // New Styles for Image Preview
  imagePreviewContainer: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px',
  },
  previewLabel: { fontSize: '12px', color: '#888', fontStyle: 'italic', marginRight: '10px' },
  previewImage: { height: '50px', borderRadius: '6px', border: '1px solid #ddd' },
  clearImageBtn: {
    background: '#ddd', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', marginLeft: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#555'
  }
};