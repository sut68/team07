"use client";

import React, { useState, useEffect, useRef } from "react";
// Import the new function and interface
import { GetAllChat, InsertChat, DropChat } from "../../services/chat";
import { GetProcessIDbyGroupID } from "../../services/chat"; // <-- CHANGE PATH AS NEEDED
import { ProcessInterface } from "../../interfaces/Chat"; // <-- CHANGE PATH AS NEEDED


// --- Mock Data (MOCK_GROUP_OPTIONS is no longer used for selection, but kept for reference) ---
const DEFAULT_SENDER_ID = 5; 


export default function ChatTestPage() {
    // --- State ---
    // groupMemberId is now a string from the text input
    const [groupMemberIdInput, setGroupMemberIdInput] = useState<string>(""); 
    const [groupMemberId, setGroupMemberId] = useState<number | string>(""); // Actual ID used for API calls
    
    const [processId, setProcessId] = useState<number | string>(""); 
    const [senderId, setSenderId] = useState<number>(DEFAULT_SENDER_ID); 

    const [availableProcesses, setAvailableProcesses] = useState<ProcessInterface[]>([]);
    const [message, setMessage] = useState(""); 
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // --- Refs and Helpers (Unchanged) ---
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const prevChatLengthRef = useRef(0);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const isImageUrl = (url: string) => {
        if (!url) return false;
        return (
            /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(url) || 
            url.startsWith("data:image/")
        );
    };

    useEffect(() => {
        if (chats.length > prevChatLengthRef.current) {
            scrollToBottom();
        }
        prevChatLengthRef.current = chats.length;
    }, [chats]);

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
    
    // --- NEW EFFECT: Update Group ID and Fetch Processes when Input changes ---
    useEffect(() => {
        // 1. Validate Input
        const parsedGroupId = parseInt(groupMemberIdInput);
        
        if (isNaN(parsedGroupId) || parsedGroupId <= 0) {
            setGroupMemberId("");
            setAvailableProcesses([]);
            setProcessId("");
            return;
        }

        // 2. Set the validated ID
        setGroupMemberId(parsedGroupId);
        
        // 3. Start Loading Processes
        setLoading(true);
        setProcessId(""); // Reset process ID when group changes
        
        GetProcessIDbyGroupID(parsedGroupId)
            .then(processes => {
                setAvailableProcesses(processes);
                if (processes.length > 0) {
                    // Automatically select the first process in the list
                    setProcessId(processes[0].id);
                } else {
                    setProcessId("");
                }
            })
            .catch(error => {
                console.error("Error fetching processes:", error);
                setAvailableProcesses([]);
            })
            .finally(() => setLoading(false));
            
    // Dependency array watches the raw input string
    }, [groupMemberIdInput]); 

    // --- API Functions & Polling (Modified to use state/effect) ---
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
            if (!silent && groupMemberId && processId) setLoading(false);
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
        } else {
            setChats([]); // Clear chats if selection is invalid
        }
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [groupMemberId, processId]);


    // --- HANDLER: Paste Image (Unchanged) ---
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        
        for (const item of items) {
            if (item.type.startsWith("image/")) {
                e.preventDefault(); 
                const blob = item.getAsFile();
                if (!blob) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target?.result as string;
                    setMessage(base64); 
                };
                reader.readAsDataURL(blob);
                return; 
            }
        }
    };

    const sendChat = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const { group_member_id, process_id, sender_id } = getIds();
        if (!message || !group_member_id || !process_id) return; 
        
        try {
            await InsertChat({
                group_member_id,
                process_id,
                sender_id,
                messege: message, 
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

    const isPendingImage = message.startsWith("data:image/");
    const currentProcess = availableProcesses.find(p => p.id === Number(processId));

    // --- Render ---
    return (
        <div style={styles.container}>

            {/* 1. New Combined Header/Config Area */}
            <div style={styles.header}>
                <div style={styles.headerContentWrapper}>
                    <div style={styles.headerIconContainer}>
                        <div style={styles.headerIconCircle}>💬</div>
                    </div>
                    <div>
                        {/* Display the selected file name as the main title */}
                        <h3 style={styles.headerTitle}>
                            {currentProcess ? currentProcess.file : "Select a Project Topic"}
                        </h3>
                        {/* Display status and ID */}
                        <span style={styles.headerSubtitle}>
                            {currentProcess 
                                ? `Group ID: ${groupMemberId} | Process ID: ${currentProcess.id}` 
                                : `Enter Group ID to load topics.`
                            }
                        </span>
                    </div>
                </div>

                {/* Selection Controls */}
                <div style={styles.selectionBar}>
                    {/* NEW: Input Text for Group ID (Real-time update) */}
                    <input 
                        type="number" 
                        placeholder="Enter Group ID" 
                        value={groupMemberIdInput} 
                        onChange={(e) => setGroupMemberIdInput(e.target.value)} 
                        style={styles.inputControl}
                        disabled={loading}
                    />

                    {/* Select Process/Topic (Filtered by Group) */}
                    <select 
                        value={processId} 
                        onChange={(e) => setProcessId(e.target.value)} 
                        style={styles.selectControl}
                        disabled={loading || availableProcesses.length === 0 || !groupMemberId}
                    >
                        <option value="">
                            {loading ? "Loading Topics..." : "-- Choose Topic --"}
                        </option>
                        {availableProcesses.map(process => (
                            <option key={process.id} value={process.id}>
                                {/* Displaying the 'file' field for selection */}
                                {process.file} (ID: {process.id}) 
                            </option>
                        ))}
                    </select>
                    
                    <span style={styles.liveStatus}>
                        {loading ? "Syncing..." : (groupMemberId && processId ? "● Live" : "● Offline")}
                    </span>
                    {/* Debug Input for Sender ID (Kept small for flexibility) */}
                    <input 
                        type="number" 
                        placeholder="My ID" 
                        value={senderId} 
                        onChange={(e) => setSenderId(Number(e.target.value))} 
                        style={styles.inputSmallDebug} 
                    />
                </div>
            </div>

            {/* 2. Messages Area */}
            <div style={styles.messageArea}>
                {!groupMemberId || !processId ? (
                    <div style={styles.emptyState}>
                        {loading ? "Loading available topics..." : "Please enter a valid Group ID and select a Topic above to start chatting."}
                    </div>
                ) : chats.length === 0 && !loading ? (
                    <div style={styles.emptyState}>No messages yet. Paste an image or say hello! 👋</div>
                ) : (
                    chats.map((c) => {
                        const isMe = c.sender_id === Number(senderId);
                        const isDeleted = c.DeletedAt !== null && c.DeletedAt !== undefined;
                        const isImg = !isDeleted && isImageUrl(c.message);

                        return (
                            <div key={c.ID} style={{ ...styles.messageRow, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                {/* Avatar shows sender_id, but should ideally show the user's initial/image */}
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

            {/* 3. Footer Input (Disabled when not selected) */}
            <form onSubmit={sendChat} style={styles.footer}>
                <div style={styles.inputWrapper}>
                    
                    {isPendingImage ? (
                        <div style={styles.imagePreviewContainer}>
                            <div style={styles.previewLabel}>Image Ready to Send</div>
                            <img src={message} alt="preview" style={styles.previewImage} />
                            <button 
                                type="button" 
                                onClick={() => setMessage("")} 
                                style={styles.clearImageBtn}
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <input
                            placeholder={!groupMemberId || !processId ? "Please select Group and Topic to type..." : "Type a message or Ctrl+V to paste image..."}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onPaste={handlePaste}
                            style={styles.chatInput}
                            disabled={!groupMemberId || !processId} // Disable input if not configured
                        />
                    )}

                    <button type="submit" disabled={!message || !groupMemberId || !processId} style={styles.sendBtn}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill={(message && groupMemberId && processId) ? "#8A011D" : "#bcc0c4"}>
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
}

// --- Styles (Combined and Simplified) ---
const styles: { [key: string]: React.CSSProperties } = {
    // Container Styles
    container: {
        display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#f5f5f5",
        fontFamily: "'Noto Sans Thai', 'Inter', system-ui, sans-serif",
    },
    // Header/Selection Styles (Fixed Layout)
    header: {
        padding: "10px 16px",
        background: 'linear-gradient(100deg, #8A011D 0%, #7F666B 100%)',
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex", 
        flexDirection: 'column', 
        gap: '8px',
        zIndex: 10, 
        color: "#fff",
    },
    headerContentWrapper: {
        display: "flex", 
        alignItems: "center",
    },
    headerIconContainer: { marginRight: "12px" },
    headerIconCircle: {
        width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
    },
    headerTitle: { margin: 0, fontSize: "18px", fontWeight: "700", color: "#fff" },
    headerSubtitle: { fontSize: "13px", color: "rgba(255,255,255,0.8)" },

    selectionBar: {
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        paddingTop: '4px',
    },
    // NEW Style for the Group ID input field
    inputControl: { 
        padding: "6px 10px", 
        borderRadius: "8px", 
        border: "1px solid rgba(255,255,255,0.3)", 
        backgroundColor: "rgba(255,255,255,0.1)", 
        color: "white", 
        fontSize: "14px",
        width: "120px"
    },
    selectControl: {
        padding: "6px 10px", 
        borderRadius: "8px", 
        border: "1px solid rgba(255,255,255,0.3)", 
        backgroundColor: "rgba(255,255,255,0.1)", 
        color: "white", 
        fontSize: "14px",
        appearance: 'none', 
        backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'white\'%3e%3cpath d=\'M7 10l5 5 5-5H7z\'/%3e%3c/svg%3e")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        backgroundSize: '16px',
        cursor: 'pointer',
    },
    liveStatus: {
        fontSize: "12px", 
        color: "rgba(255,255,255,0.8)", 
        fontWeight: 'bold',
        marginLeft: 'auto'
    },
    inputSmallDebug: { 
        padding: "4px 8px", 
        borderRadius: "4px", 
        border: "1px solid #ddd", 
        backgroundColor: "#fff", 
        color: "#050505", 
        width: "60px", 
        fontSize: "12px", 
        marginLeft: '8px',
    },

    // Message Area Styles
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

    // Footer Styles
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
    // Image Preview Styles
    imagePreviewContainer: {
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px',
    },
    previewLabel: { fontSize: '12px', color: '#888', fontStyle: 'italic', marginRight: '10px' },
    previewImage: { height: '50px', borderRadius: '6px', border: '1px solid #ddd' },
    clearImageBtn: {
        background: '#ddd', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', marginLeft: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#555'
    }
};