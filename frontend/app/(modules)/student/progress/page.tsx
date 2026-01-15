"use client";

import React, { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import {
  GetProgress,
  AddProgress,
  UpProgress,
  EraseProgress,
  GetGroupProjectIDByUser,
} from "../../../services/progress";

import { DropWholechat } from "@/app/services/chat";

const web = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ProgressPage() {
  const [gpji, setgpji] = useState<number>(0);
  const [userid, setuserid] = useState<number>(0);
  const [processlist, setprocesslist] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [progressTitle, setProgressTitle] = useState("");

  const getId = (p: any) => Number(p?.id ?? p?.ID ?? 0) || 0;
  const getProgressTitle = (p: any) => String(p?.Name ?? "").trim();
  const getFilePath = (p: any) => String(p?.file ?? p?.File ?? "").trim();
  const getCommentText = (p: any) => String(p?.comment ?? "").trim();
  const getUpdatedAt = (p: any) => {
    const d = new Date(p?.update_at || new Date());
    return isNaN(d.getTime())
      ? "Just now"
      : d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
  };

  const fileHref = (path: string) => {
    const p = String(path || "").trim();
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}${p.startsWith("/") ? "" : "/"}${p}`;
  };

  const fileLabel = (path: string) => {
    const p = String(path || "").trim();
    if (!p) return "";
    const noQuery = p.split("?")[0];
    const parts = noQuery.split("/");
    return parts[parts.length - 1] || noQuery;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const uid = Number(window.localStorage.getItem("user_id") ?? 0);
    const cleanUid = Number.isFinite(uid) && uid > 0 ? uid : 0;
    setuserid(cleanUid);

    if (!cleanUid) {
      setgpji(0);
      return;
    }

    (async () => {
      try {
        const res = await GetGroupProjectIDByUser({ student_id: cleanUid });
        const gp = Number(res?.group_project_id ?? 0);
        setgpji(Number.isFinite(gp) && gp > 0 ? gp : 0);
      } catch (err) {
        setgpji(0);
      }
    })();
  }, []);

  const locked = gpji <= 0 || userid <= 0;

  const refresh = async () => {
    if (gpji == 0) {
      setprocesslist([]);
      return;
    }
    const data = await GetProgress({ group_project_id: gpji });
    const sorted = Array.isArray(data) ? data.sort((a, b) => getId(b) - getId(a)) : [];
    setprocesslist(sorted);
  };

  useEffect(() => {
    if (!locked && gpji > 0) {
      setIsLoading(true);
      refresh().finally(() => setIsLoading(false));
    }
  }, [gpji, locked]);

  const openAddModal = () => {
    setModalMode("add");
    setFile(null);
    setComment("");
    setProgressTitle("");
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setModalMode("edit");
    setSelectedId(getId(item));
    setProgressTitle(getProgressTitle(item));
    setComment(getCommentText(item));
    setFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (locked) return;
    setIsLoading(true);

    try {
      if (modalMode === "add") {
        if (!gpji) throw new Error("Missing Group ID");
        if (!progressTitle.trim()) throw new Error("Title required");
        if (!file) throw new Error("File required");
        if (!comment.trim()) throw new Error("Comment required");

        await AddProgress({
          group_project_id: gpji,
          Name: progressTitle.trim(),
          file: file!,
          comment: comment.trim(),
        });
      } else {
        if (!selectedId) throw new Error("No ID selected");
        await UpProgress({
          id: selectedId,
          Name: progressTitle.trim(),
          file: file ?? undefined,
          comment: comment.trim(),
        } as any);
      }

      await refresh();
      setIsModalOpen(false);
      setFile(null);
      setComment("");
      setProgressTitle("");
    } catch (err: any) {
      alert(err?.message || "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (locked || !id) return;
    if (!confirm("Confirm deleting this block?")) return;

    setIsLoading(true);
    try {
      await EraseProgress({ id });
      await DropWholechat({
        process_id: id,
        group_project_id: gpji,
        name: "",
      });
      await refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sut-page">
      <style jsx global>{`
        body {
          margin: 0;
          background-color: #f9f9f9;
          font-family: "Sarabun", sans-serif;
        }

        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .progress-block {
          animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #951b2e;
        }
      `}</style>

      <div style={styles.mainContainer}>
        <div style={styles.headerSection}>
          <div style={styles.titleWrapper}>
            <div style={styles.redLine}></div>
            <div>
              <h1 style={styles.pageTitle}>ติดตามความคืบหน้า</h1>
              <p style={styles.pageSubtitle}>บันทึกความคืบหน้าโครงงาน </p>
            </div>
          </div>

          {!locked && (
            <button
              onClick={openAddModal}
              style={styles.addButton}
              onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              + สร้างความคืบหน้า (New Block)
            </button>
          )}
        </div>

        <div style={styles.gridContainer}>
          {locked ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔒</div>
              <h3>ไม่พบข้อมูลกลุ่ม</h3>
              <p>กรุณาเข้าร่วมกลุ่มโครงงานก่อน</p>
            </div>
          ) : processlist.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>📄</div>
              <h3>Start Building</h3>
              <p>กดปุ่มด้านบนเพื่อวางบล็อกแรกของคุณ</p>
            </div>
          ) : (
            processlist.map((item, index) => {
              const id = getId(item);

              const animDelay = { animationDelay: `${index * 0.05}s` };

              return (
                <div key={id} style={{ ...styles.blockCard, ...animDelay }} className="progress-block">
                  <div style={styles.watermarkNumber}>{processlist.length - index}</div>

                  <div style={styles.cardHeader}>
                    <span style={styles.dateBadge}>{getUpdatedAt(item)}</span>
                    <div style={styles.actions}>
                      <button onClick={() => openEditModal(item)} style={styles.actionBtn}>
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(id)} style={styles.actionBtn}>
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div style={styles.cardBody}>
                    <h3 style={styles.cardTitle}>{getProgressTitle(item)}</h3>
                    <p style={styles.cardDesc}>{getCommentText(item)}</p>

                    {getFilePath(item) && (
                      <a
                        href={`${web}${getFilePath(item).startsWith("/") ? "" : "/"}${getFilePath(item)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.fileChip}
                      >
                        📄 {getFilePath(item).split("/").pop()}
                      </a>
                    )}
                  </div>

                  <div style={styles.cardBottomStrip}></div>
                </div>
              );
            })
          )}
        </div>
      </div>

     {isModalOpen && (
      <div style={styles.modalOverlay}>
        <div style={styles.modal}>
          <div style={styles.modalHeader}>
            <h3>{modalMode === "add" ? "เพิ่มบล็อกความคืบหน้า" : "แก้ไขข้อมูล"}</h3>
            <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>
              ×
            </button>
          </div>

          <div style={styles.modalBody}>
            <div style={styles.formGroup}>
              <label style={styles.label}>หัวข้อ (Title)</label>
              <input
                style={styles.input}
                value={progressTitle}
                onChange={(e) => setProgressTitle(e.target.value)}
                placeholder="เช่น บทที่ 1 เสร็จสมบูรณ์"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>รายละเอียด (Details)</label>
              <textarea
                style={styles.textarea}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="รายละเอียดสิ่งที่ทำ..."
              />
            </div>

            {/* ✅ SHOW CURRENT FILE WHEN EDITING */}
            {modalMode === "edit" && selectedId != null && (
              (() => {
                const item = processlist.find(p => getId(p) === selectedId);
                const path = item ? getFilePath(item) : "";
                if (!path) return null;

                const web = process.env.NEXT_PUBLIC_BACKEND_URL;
                const href = path.startsWith("http")
                  ? path
                  : `${web}${path.startsWith("/") ? "" : "/"}${path}`;

                const filename = path.split("?")[0].split("/").pop();

                return (
                  <div style={{ marginBottom: "12px" }}>
                    <a href={href} target="_blank" rel="noreferrer" style={styles.fileChip}>
                      📎 Current file: {filename}
                    </a>
                  </div>
                );
              })()
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>
                แนบไฟล์ (Attachment)
                {modalMode === "edit" && " – เลือกใหม่เฉพาะกรณีต้องการเปลี่ยน"}
              </label>
              <input
                type="file"
                style={styles.fileInput}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div style={styles.modalFooter}>
            <button onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>
              ยกเลิก
            </button>
            <button onClick={handleSubmit} disabled={isLoading} style={styles.saveBtn}>
              {isLoading ? "กำลังบันทึก..." : "บันทึก (Save Block)"}
            </button>
          </div>
        </div>
      </div>
      )}

    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  topBar: {
    backgroundColor: "#951B2E",
    height: "60px",
    width: "100%",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  topBarContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    color: "white",
  },
  logo: { fontSize: "24px", fontWeight: "900", letterSpacing: "1px" },
  navLinks: { display: "flex", gap: "25px", fontSize: "14px", fontWeight: "500" },
  navItem: { cursor: "pointer", opacity: 0.9 },
  activeLink: { borderBottom: "2px solid white", fontWeight: "700", opacity: 1 },
  userIcon: {
    width: "32px",
    height: "32px",
    backgroundColor: "white",
    color: "#951B2E",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  mainContainer: { maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", minHeight: "calc(100vh - 60px)" },

  headerSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
  },
  titleWrapper: { display: "flex", gap: "15px", alignItems: "center" },
  redLine: { width: "5px", height: "50px", backgroundColor: "#951B2E", borderRadius: "4px" },
  pageTitle: { fontSize: "28px", fontWeight: "800", color: "#333", margin: 0 },
  pageSubtitle: { fontSize: "14px", color: "#666", marginTop: "5px" },

  addButton: {
    backgroundColor: "#951B2E",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "50px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(149, 27, 46, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "transform 0.2s ease",
  },

  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "25px",
  },

  blockCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    border: "1px solid #eee",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "200px",
    transition: "transform 0.2s",
  },
  watermarkNumber: {
    position: "absolute",
    bottom: "-10px",
    right: "10px",
    top: "auto",
    fontSize: "100px",
    fontWeight: "900",
    color: "#f3f3f3",
    zIndex: 0,
    pointerEvents: "none",
    fontFamily: "Arial, sans-serif",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    zIndex: 1,
    position: "relative",
  },
  dateBadge: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#951B2E",
    backgroundColor: "rgba(149, 27, 46, 0.08)",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  actions: { display: "flex", gap: "5px" },
  actionBtn: { border: "none", background: "none", cursor: "pointer", fontSize: "14px", opacity: 0.5, transition: "opacity 0.2s" },

  cardBody: { zIndex: 1, position: "relative", flex: 1 },
  cardTitle: { fontSize: "18px", fontWeight: "700", color: "#222", marginBottom: "8px" },
  cardDesc: { fontSize: "14px", color: "#555", lineHeight: "1.6", whiteSpace: "pre-wrap", marginBottom: "15px" },

  fileChip: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "12px",
    color: "#555",
    backgroundColor: "#f5f5f5",
    border: "1px solid #e0e0e0",
    padding: "6px 12px",
    borderRadius: "20px",
    textDecoration: "none",
    fontWeight: "500",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardBottomStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "4px",
    backgroundColor: "#951B2E",
  },

  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "60px",
    backgroundColor: "white",
    borderRadius: "16px",
    border: "2px dashed #ddd",
    color: "#888",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backdropFilter: "blur(3px)",
  },
  modal: {
    backgroundColor: "white",
    width: "500px",
    maxWidth: "90%",
    borderRadius: "12px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: { border: "none", background: "none", fontSize: "24px", cursor: "pointer", color: "#999" },
  modalBody: { padding: "24px" },
  formGroup: { marginBottom: "20px" },
  label: { display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "#333" },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "14px",
    minHeight: "100px",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  fileInput: { 
    fontSize: "14px",
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    boxSizing: "border-box",
  },
  modalFooter: {
    padding: "20px",
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    backgroundColor: "#f9f9f9",
  },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
  },
  saveBtn: {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "none",
    background: "#951B2E",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
  },
};