"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useAuth } from "../../roleCheck/authContext";
import { GetProgress, AddProgress, UpProgress, EraseProgress } from "../../../services/progress";
import { DropWholechat, Getteachergroup } from "@/app/services/chat";
import { Toast_fail, Toast_success } from "../../../components/Webmessage";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const web = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/team07api";

  export default function ProgressPage() {
    const { user } = useAuth();
    const [gpji, setgpji] = useState<number>(0);
  const [teacherGroups, setTeacherGroups] = useState<any[]>([]);
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
  const getGroupOptionLabel = (g: any) => {
    const num = g?.group_number ?? g?.GroupNumber ?? "-";
    return `กลุ่ม ${num} ปีการศึกษา ${g.year}`;
  };

  const fileHref = (path: string) => {
    const p = String(path || "").trim();
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return `${web}${p.startsWith("/") ? "" : "/"}${p}`;
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

    const uid = user?.id || 0;
    const cleanUid = Number.isFinite(uid) && uid > 0 ? uid : 0;
    if (!cleanUid) return;

    (async () => {
      try {
        const groups = await Getteachergroup({ teacher_id: cleanUid });
        const arr = Array.isArray(groups) ? groups : Array.isArray((groups as any)?.data) ? (groups as any).data : [];
        setTeacherGroups(arr);

        const preferred = arr[0] ?? null;
        const gp = Number((preferred as any)?.id ?? (preferred as any)?.ID ?? 0);
        setgpji(Number.isFinite(gp) && gp > 0 ? gp : 0);
      } catch (err) {
        Toast_fail("Load groups failed: " + String(err));
        setTeacherGroups([]);
      }
    })();
  }, []);

  const refresh = async () => {
    if (gpji === 0) {
      setprocesslist([]);
      return;
    }
    const data = await GetProgress({ group_project_id: gpji });
    const sorted = Array.isArray(data) ? data.sort((a, b) => getId(b) - getId(a)) : [];
    setprocesslist(sorted);
  };

  useEffect(() => {
    if (gpji > 0) {
      setIsLoading(true);
      refresh().finally(() => setIsLoading(false));
    }
  }, [gpji]);

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
    if (!gpji) return;
    setIsLoading(true);
    try {
      if (modalMode === "add") {
        await AddProgress({
          group_project_id: gpji,
          Name: progressTitle.trim(),
          file: file!,
          comment: comment.trim(),
        });
      } else {
        if (!selectedId) return;
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
      Toast_success("บันทึกข้อมูลสำเร็จ");
    } catch (err: any) {
      Toast_fail(err?.message || "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!id) return;

    Modal.confirm({
      title: 'Deleting Block',
      icon: <ExclamationCircleOutlined />,
      content: 'Confirm deleting this block?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        setIsLoading(true);
        try {
          await EraseProgress({ id });
          await DropWholechat({ process_id: id, group_project_id: gpji, name: "" });
          await refresh();
          Toast_success("ลบข้อมูลสำเร็จ");
        } catch (err) {
          Toast_fail(String(err));
        } finally {
          setIsLoading(false);
        }
      },
    });
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
              <p style={styles.pageSubtitle}>บันทึกความคืบหน้าโครงงาน (Teacher View)</p>
            </div>
          </div>

          <div style={styles.headerRightActions}>
            {teacherGroups.length > 0 && (
              <select
                value={gpji || ""}
                onChange={(e) => setgpji(Number(e.target.value) || 0)}
                style={styles.groupSelect}
                disabled={isLoading}
              >
                {teacherGroups.map((g: any, idx: number) => (
                  <option key={idx} value={Number(g?.id ?? g?.ID ?? 0) || 0}>
                    {getGroupOptionLabel(g)}
                  </option>
                ))}
              </select>
            )}

            {gpji > 0 && (
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
        </div>

        <div style={styles.gridContainer}>
          {gpji <= 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔒</div>
              <h3>Please select a group</h3>
              <p>กรุณาเลือกทีม/กลุ่มที่ต้องการดูความคืบหน้า</p>
            </div>
          ) : processlist.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>📦</div>
              <h3>No Data</h3>
              <p>This group hasn't submitted any progress yet.</p>
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
                      <a href={fileHref(getFilePath(item))} target="_blank" rel="noreferrer" style={styles.fileChip}>
                        📄 {fileLabel(getFilePath(item))}
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

              {modalMode === "edit" && selectedId != null && (
                (() => {
                  const item = processlist.find((p) => getId(p) === selectedId);
                  const path = item ? getFilePath(item) : "";
                  if (!path) return null;
                  return (
                    <div style={{ marginBottom: "12px" }}>
                      <a href={fileHref(path)} target="_blank" rel="noreferrer" style={styles.fileChip}>
                        📎 Current file: {fileLabel(path)}
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
                <input type="file" style={styles.fileInput} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
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
  mainContainer: { maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", minHeight: "calc(100vh - 60px)" },

  headerSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "40px",
    flexWrap: "wrap",
  },
  titleWrapper: { display: "flex", gap: "15px", alignItems: "center" },
  redLine: { width: "5px", height: "50px", backgroundColor: "#951B2E", borderRadius: "4px" },
  pageTitle: { fontSize: "28px", fontWeight: "800", color: "#333", margin: 0 },
  pageSubtitle: { fontSize: "14px", color: "#666", marginTop: "5px" },

  headerRightActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    marginLeft: "auto",
  },
  groupSelect: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #e7e7e7",
    outline: "none",
    fontSize: "13px",
    fontWeight: 700,
    color: "#951B2E",
    backgroundColor: "white",
    cursor: "pointer",
    maxWidth: "260px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  },

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
    whiteSpace: "nowrap",
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
  },
  cardBottomStrip: { position: "absolute", bottom: 0, left: 0, width: "100%", height: "4px", backgroundColor: "#951B2E" },

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
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", outline: "none" },
  textarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "14px",
    minHeight: "100px",
    outline: "none",
    fontFamily: "inherit",
  },
  fileInput: { fontSize: "14px" },
  modalFooter: {
    padding: "20px",
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    backgroundColor: "#f9f9f9",
  },
  cancelBtn: { padding: "10px 20px", borderRadius: "6px", border: "1px solid #ddd", background: "white", cursor: "pointer" },
  saveBtn: { padding: "10px 20px", borderRadius: "6px", border: "none", background: "#951B2E", color: "white", cursor: "pointer", fontWeight: "600" },
};
