"use client";

import React, { useState, useEffect, useRef } from "react";
import { GetAllChat, InsertChat, DropChat, GetProcessIDbyGroupID } from "../../services/chat";
import { ProcessInterface } from "../../interfaces/Chat";



const DEFAULT_SENDER_ID = 5; 


interface TopicSelectorProps {
    processes: ProcessInterface[];
    groupMemberId: number | string;
    onSelect: (id: number) => void;
    currentProcess: ProcessInterface | undefined;
    isDisabled: boolean;
    loading: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ 
    processes, 
    groupMemberId,
    onSelect, 
    isDisabled,
    loading,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);

   
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleSelect = (id: number) => {
        onSelect(id);
        setIsOpen(false);
    };

    const displayLabel = loading 
        ? "Loading..."
        : !groupMemberId
            ? "No Group ID"
            : processes.length === 0 
                ? "No Topics Found"
                : "Topic";
    
    const buttonDisabled = isDisabled || processes.length === 0 || !groupMemberId;

    return (
        <div style={dropdownStyles.container} ref={selectorRef}>
            <button
                type="button"
                onClick={() => !buttonDisabled && setIsOpen(!isOpen)}
                style={{
                    ...dropdownStyles.button,
                    opacity: buttonDisabled ? 0.6 : 1,
                    cursor: buttonDisabled ? 'not-allowed' : 'pointer',
                }}
                disabled={buttonDisabled}
            >
                <span style={dropdownStyles.icon}>@</span>
                <span style={dropdownStyles.label}>{displayLabel}</span>
            </button>

            {isOpen && processes.length > 0 && (
                <div style={dropdownStyles.list}>
                    {processes.map(process => (
                        <div 
                            key={process.id}
                            onClick={() => handleSelect(process.id)}
                            style={dropdownStyles.item}
                        >
                            <div style={dropdownStyles.itemFile}>{process.file}</div>
                            <div style={dropdownStyles.itemId}>ID: {process.id}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


export default function ChatTestPage() {
   
    const [groupMemberIdInput, setGroupMemberIdInput] = useState<string>(""); 
    const [groupMemberId, setGroupMemberId] = useState<number | string>(""); 
    
    const [processId, setProcessId] = useState<number | string>(""); 
    const [senderId, setSenderId] = useState<number>(DEFAULT_SENDER_ID); 

    const [availableProcesses, setAvailableProcesses] = useState<ProcessInterface[]>([]);
    const [message, setMessage] = useState(""); 
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const prevChatLengthRef = useRef(0);
    const isPendingImage = message.startsWith("data:image/");
    const currentProcess = availableProcesses.find(p => p.id === Number(processId));


   
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
        group_project_id: Number(groupMemberId), 
        process_id: Number(processId),
        sender_id: Number(senderId),
    });
    
   
    useEffect(() => {
        const parsedGroupId = parseInt(groupMemberIdInput);
        
        if (isNaN(parsedGroupId) || parsedGroupId <= 0) {
            setGroupMemberId("");
            setAvailableProcesses([]);
            setProcessId("");
            return;
        }

        setGroupMemberId(parsedGroupId);
        setLoading(true);
        setProcessId(""); 
        
 
        GetProcessIDbyGroupID(parsedGroupId) 
            .then(processes => {
                setAvailableProcesses(processes);
                if (processes.length > 0) {
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
            
    }, [groupMemberIdInput]); 

  
    const loadChats = async (silent = false) => {
        const { group_project_id, process_id } = getIds();
        if (!group_project_id || !process_id) return;
        
        try {
            if (!silent) setLoading(true);
        
            const res = await GetAllChat({ group_project_id, process_id }); 
            if (Array.isArray(res)) {
                setChats(res);
            }
        } catch (error) {
            console.error("Error loading chats:", error);
        } finally {
            if (!silent && groupMemberId && processId) setLoading(false);
        }
    };

  
    useEffect(() => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (groupMemberId && processId) {
            loadChats();
            pollingRef.current = setInterval(() => {
                loadChats(true);
            }, 2000);
        } else {
            setChats([]); 
        }
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [groupMemberId, processId]);



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
        const { group_project_id, process_id, sender_id } = getIds();
        if (!message || !group_project_id || !process_id) return; 
        
        try {
            await InsertChat({
                group_project_id,
                process_id,
                sender_id,
                message: message,
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
        const { group_project_id, process_id } = getIds();
        try {
            await DropChat({ id: targetId, group_project_id, process_id }); 
            await loadChats(true);
        } catch (error) {
            console.error("Error deleting chat:", error);
        }
    };

    // --- Render ---
    return (
        <div style={styles.container}>

            {/* 1. Header Area */}
            <div style={styles.header}>
                <div style={styles.headerContentWrapper}>
                    <div style={styles.headerIconContainer}>
                        <div style={styles.headerIconCircle}>💬</div>
                    </div>
                    <div>
                        <h3 style={styles.headerTitle}>
                            {currentProcess ? currentProcess.file : "Chat Room"}
                        </h3>
                        <span style={styles.headerSubtitle}>
                            {currentProcess 
                                ? `Group ID: ${groupMemberId} | Process ID: ${currentProcess.id} (Topic)` 
                                : `Enter Group ID to load topics.`
                            }
                        </span>
                    </div>
                </div>

    
                <div style={styles.selectionBar}>
                    <input 
                        type="number" 
                        placeholder="Group ID" 
                        value={groupMemberIdInput} 
                        onChange={(e) => setGroupMemberIdInput(e.target.value)} 
                        style={styles.inputControl}
                        disabled={loading}
                    />
                    
               
                    {currentProcess && (
                         <span style={styles.topicDisplay}>
                            Topic: {currentProcess.file}
                        </span>
                    )}

                    <span style={styles.liveStatus}>
                        {loading ? "Syncing..." : (groupMemberId && processId ? "● Live" : "● Offline")}
                    </span>
             
                    <input 
                        type="number" 
                        placeholder="My ID" 
                        value={senderId} 
                        onChange={(e) => setSenderId(Number(e.target.value))} 
                        style={styles.inputSmallDebug} 
                    />
                </div>
            </div>

       
            <div style={styles.messageArea}>
                {!groupMemberId || !processId ? (
                    <div style={styles.emptyState}>
                        {loading ? "Loading available topics..." : "Please enter a valid Group ID and select a Topic to start chatting."}
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

   
            <form onSubmit={sendChat} style={styles.footer}>
                <div style={styles.inputWrapper}>
       
                    <TopicSelector
                        processes={availableProcesses}
                        groupMemberId={groupMemberId}
                        onSelect={(id) => setProcessId(id)}
                        currentProcess={currentProcess}
                        isDisabled={loading || !groupMemberId}
                        loading={loading}
                    />

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
                            placeholder={!groupMemberId || !processId ? "Please select a Topic to type..." : "Type a message or Ctrl+V to paste image..."}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onPaste={handlePaste}
                            style={styles.chatInput}
                            disabled={!groupMemberId || !processId} 
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


const styles: { [key: string]: React.CSSProperties } = {
  
    container: {
        display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#f5f5f5",
        fontFamily: "'Noto Sans Thai', 'Inter', system-ui, sans-serif",
    },
  
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
        position: 'relative', 
    },
    inputControl: { 
        padding: "6px 10px", 
        borderRadius: "8px", 
        border: "1px solid rgba(255,255,255,0.3)", 
        backgroundColor: "rgba(255,255,255,0.1)", 
        color: "white", 
        fontSize: "14px",
        width: "120px"
    },
    topicDisplay: {
        padding: "6px 10px",
        borderRadius: "8px",
        backgroundColor: "rgba(255,255,255,0.15)",
        fontSize: "14px",
        color: "white",
        fontWeight: "500",
        maxWidth: "200px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
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
        display: "flex", alignItems: "center", backgroundColor: "#f0f2f5", borderRadius: "20px", padding: "4px 10px", minHeight: "44px", position: 'relative', 
    },
    chatInput: {
        flex: 1, padding: "10px 8px", backgroundColor: "transparent", border: "none", outline: "none", fontSize: "15px", color: "#050505",
    },
    sendBtn: {
        background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px",
    },
  
    imagePreviewContainer: {
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px',
    },
    previewLabel: { fontSize: '12px', color: '#888', fontStyle: 'italic', marginRight: '10px' },
    previewImage: { height: '50px', borderRadius: '6px', border: '1px solid #ddd' },
    clearImageBtn: {
        background: '#ddd', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', marginLeft: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#555'
    }
};


const dropdownStyles: { [key: string]: React.CSSProperties } = {
    container: {
        position: 'relative',
        display: 'inline-block',
        zIndex: 100, 
        height: '100%',
        alignItems: 'center',
    },
    button: {
        padding: "6px 10px", 
        borderRadius: "20px", 
        border: "none", 
        backgroundColor: '#4e5052', 
        color: "white", 
        fontSize: "14px",
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        height: '36px',
        marginRight: '8px',
        transition: 'background-color 0.1s',
    },
    icon: {
        fontSize: '16px',
        marginRight: '4px',
        color: '#8A011D', 
    },
    label: {
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        maxWidth: '120px',
    },
    list: {
        position: 'absolute',
        bottom: 'calc(100% + 10px)', 
        left: 0,
        backgroundColor: '#242526', 
        border: '1px solid #3e4042',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        width: '300px', 
        maxHeight: '200px',
        overflowY: 'auto',
    },
    item: {
        padding: '10px 12px',
        color: '#fff',
        cursor: 'pointer',
        transition: 'background-color 0.1s',
        display: 'flex',
        flexDirection: 'column',
    },
    itemFile: {
        fontWeight: 'bold',
        fontSize: '14px',
    },
    itemId: {
        fontSize: '11px',
        color: '#b0b3b8',
    },
};