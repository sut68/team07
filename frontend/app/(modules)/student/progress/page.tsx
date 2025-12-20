"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  GetProgress,
  AddProgress,
  UpProgress,
  EraseProgress,
  GetGroupProjectIDByUser,
} from "../../../services/progress";

import { DropWholechat } from "@/app/services/chat";

type Mode = "view" | "submit" | "edit";

export default function ProgressPage() {
  const [mode, setMode] = useState<Mode>("view");

  const [gpji, setgpji] = useState<number>(0);
  const [userid, setuserid] = useState<number>(0);

  const [processlist, setprocesslist] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [progressTitle, setProgressTitle] = useState("");

  const [status, setStatus] = useState("Ready");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getId = (p: any) => Number(p?.id ?? p?.ID ?? 0) || 0;
  const getProgressTitle = (p: any) => String(p?.Name ?? "").trim();
  const getFilePath = (p: any) => String(p?.file ?? p?.File ?? "").trim();
  const getCommentText = (p: any) => String(p?.comment ?? "").trim();
  const getUpdatedAt = (p: any) => String(p?.update_at ?? "").trim();

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
        console.error("load id fail", err);
        setgpji(0);
      }
    })();
  }, []);

  const locked = gpji <= 0 || userid <= 0;

  useEffect(() => {
    if (locked) setMode("view");
  }, [locked]);

  const refresh = async () => {
    if (gpji == 0) {
      setprocesslist([]);
      return;
    }
    const data = await GetProgress({ group_project_id: gpji });
    setprocesslist(Array.isArray(data) ? data : []);
  };

  const handleView = async () => {
    if (locked) return;
    setIsLoading(true);
    setIsError(false);
    setStatus("กำลังโหลดความคืบหน้า...");
    try {
      await refresh();
      setStatus("โหลดสำเร็จ!!!");
    } catch (err: any) {
      console.error(err);
      setIsError(true);
      setStatus(`${err?.response?.data?.message || err?.message || "โหลดไม่สำเร็จ"}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!locked && gpji > 0) void handleView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpji, locked]);

  const handleSubmit = async () => {
    if (locked) return;
    setIsLoading(true);
    setIsError(false);

    try {
      if (!gpji) throw new Error("ขาด group_project_id");
      if (!progressTitle.trim()) throw new Error("ได้โปรดตั้งชื่อหัวข้อ");
      if (!file) throw new Error("ได้โปรดเลือกไฟล์");
      if (!comment.trim()) throw new Error("โปรดใส่ความคิดเห็น");

      await AddProgress({
        group_project_id: gpji,
        Name: progressTitle.trim(),
        file: file!,
        comment: comment.trim(),
      });

      setFile(null);
      setComment("");
      setProgressTitle("");

      await refresh();
      setStatus("ส่งสำเร็จ !!!");
    } catch (err: any) {
      setIsError(true);
      setStatus(err?.response?.data?.error || err?.message || "ส่งไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (locked) return;
    setIsLoading(true);
    setIsError(false);

    try {
      if (!selectedId) throw new Error("ได้โปรดเลือกความคืบหน้าที่ต้องการจัดการ");

      await UpProgress({
        id: selectedId,
        Name: progressTitle.trim(),
        file: file ?? undefined,
        comment: comment.trim(),
      } as any);

      setFile(null);
      setComment("");
      setProgressTitle("");

      await refresh();
      setStatus("แก้ไขสำเร็จ !!!");
    } catch (err: any) {
      setIsError(true);
      setStatus(err?.response?.data?.error || err?.message || "แก้ไขไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (locked) return;
    setIsLoading(true);
    setIsError(false);

    try {
      const id = selectedId;

      if (!id) throw new Error("ได้โปรดเลือกความคืบหน้าที่ต้องการลบ");

      if (!confirm(`ลบความคืบหน้า #${id}?`)) {
        setIsLoading(false);
        return;
      }

      setStatus(`ลบ #${id}...`);
      await EraseProgress({ id });

      setStatus(`ลบแชทที่เกี่ยวข้อง...`);
      await DropWholechat({
        process_id: id,
        group_project_id: gpji,
      });

      await refresh();
      setStatus(`ลบความคืบหน้า #${id} สำเร็จ`);
    } catch (err: any) {
      console.error(err);
      setIsError(true);
      setStatus(`❌ ${err?.response?.data?.message || err?.message || "เกิดข้อผิดพลาด"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const availableIds = useMemo(() => {
    return Array.isArray(processlist)
      ? processlist.map(getId).filter((id) => Number.isFinite(id) && id > 0)
      : [];
  }, [processlist]);

  useEffect(() => {
    setSelectedId(availableIds.length > 0 ? availableIds[0] : null);
  }, [availableIds]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.appTitle}>ติดตามความคืบหน้า</div>
        </div>

        <div style={styles.modeTabs}>
          <button
            onClick={() => !locked && setMode("view")}
            style={mode === "view" ? styles.tabActive : styles.tab}
            disabled={locked}
            title={locked ? "ใช้งานไม่ได้เนื่องจากยังไม่มีกลุ่ม" : ""}
          >
            ดูความคืบหน้า
          </button>
          <button
            onClick={() => !locked && setMode("submit")}
            style={mode === "submit" ? styles.tabActive : styles.tab}
            disabled={locked}
            title={locked ? "ใช้งานไม่ได้เนื่องจากยังไม่มีกลุ่ม" : ""}
          >
            ส่งความคืบหน้า
          </button>
          <button
            onClick={() => !locked && setMode("edit")}
            style={mode === "edit" ? styles.tabActive : styles.tab}
            disabled={locked}
            title={locked ? "ใช้งานไม่ได้เนื่องจากยังไม่มีกลุ่ม" : ""}
          >
            จัดการความคืบหน้า
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.left}>
          <div
            style={{
              ...styles.status,
              background: locked ? "#fef3c7" : isError ? "#fee2e2" : "#dcfce7",
              color: locked ? "#92400e" : isError ? "#991b1b" : "#166534",
              border: locked ? "1px solid #fde68a" : "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <b>Status:</b> {locked ? "ระบบจะล็อกจนกว่าคุณจะมีกลุ่ม." : status}
          </div>

          {locked ? (
            <div style={styles.lockCard}>
              <div style={styles.lockTitle}>คุณยังไม่มีกลุ่มโปรเจกต์</div>
              <div style={styles.lockDesc}>กรุณาเข้าร่วมกลุ่มก่อนเพื่อปลดล็อกหน้านี้</div>

              <div style={styles.lockSteps}>
                <div style={styles.lockStep}>
                  <b>1)</b> ไปยังหน้า <b> กลุ่มของฉัน</b>
                </div>
                <div style={styles.lockStep}>
                  <b>2)</b> กดเข้าร่วมกลุ่ม
                </div>
                <div style={styles.lockStep}>
                  <b>3)</b> กลับมาหน้านี้
                </div>
              </div>

              <div style={styles.lockHint}>(หากคิดว่านี่เป็นข้อผิดพลาด โปรดรายงานปัญหา.)</div>
            </div>
          ) : (
            <>
              {mode === "view" && (
                <div style={styles.card}>
                  <div style={styles.cardTitle}>รีเฟรชระบบ</div>
                  <div style={styles.cardDesc}>หากระบบยังไม่อัปเดตสามารถกดปุ่มนี้ได้.</div>

                  <button onClick={handleView} disabled={isLoading} style={styles.primaryBtn}>
                    {isLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>
              )}

              {mode === "submit" && (
                <div style={styles.card}>
                  <div style={styles.cardTitle}>ส่งความคืบหน้า</div>

                  <div style={styles.field}>
                    <label style={styles.label}>ชื่อโครงงาน (Progress title)</label>
                    <input
                      value={progressTitle}
                      onChange={(e) => setProgressTitle(e.target.value)}
                      placeholder='e.g. "Work 1", "Fix small bug"'
                      style={styles.input}
                      disabled={isLoading}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>ไฟล์</label>
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      style={styles.input}
                      disabled={isLoading}
                    />
                    {file?.name ? <div style={styles.smallText}>Selected: {file.name}</div> : null}
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>ความคิดเห็น</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="อยากมีอะไรจะบอกคนอื่นๆไหม"
                      style={styles.textarea}
                      disabled={isLoading}
                    />
                  </div>

                  <button onClick={handleSubmit} disabled={isLoading} style={styles.primaryBtn}>
                    {isLoading ? "Submitting..." : "ส่งความคืบหน้า"}
                  </button>
                </div>
              )}

              {mode === "edit" && (
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Manage your updates</div>

                  <div style={styles.field}>
                    <label style={styles.label}>Select update</label>
                    <select
                      value={selectedId ?? ""}
                      onChange={(e) => setSelectedId(Number(e.target.value) || null)}
                      style={styles.select}
                      disabled={isLoading || processlist.length === 0}
                    >
                      {processlist.length === 0 ? <option value="">No updates</option> : null}
                      {processlist.map((p: any) => {
                        const id = getId(p);
                        const title = getProgressTitle(p);
                        return (
                          <option key={id} value={id}>
                            {title || `Update #${id}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>New Name (Progress title) (optional)</label>
                    <input
                      value={progressTitle}
                      onChange={(e) => setProgressTitle(e.target.value)}
                      placeholder="field ที่ว่างจะยังคง value เดิมไว้"
                      style={styles.input}
                      disabled={isLoading}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>New file (optional)</label>
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      style={styles.input}
                      disabled={isLoading}
                    />
                    {file?.name ? <div style={styles.smallText}>Selected: {file.name}</div> : null}
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>New comment (optional)</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="field ที่ว่างจะยังคง value เดิมไว้"
                      style={styles.textarea}
                      disabled={isLoading}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleEdit} disabled={isLoading} style={styles.primaryBtn}>
                      {isLoading ? "Saving..." : "บันทึก"}
                    </button>
                    <button onClick={handleDelete} disabled={isLoading} style={styles.dangerBtn}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={styles.right}>
          {locked ? (
            <div style={styles.lockRight}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>🔒 Locked</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                Progress list will appear after you join a group project.
              </div>
            </div>
          ) : (
            <>
              <div style={styles.listHeader}>
                <div style={{ fontWeight: 800 }}>Updates</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{processlist.length} items</div>
              </div>

              {processlist.length === 0 ? (
                <div style={styles.empty}>No progress updates yet.</div>
              ) : (
                <div style={styles.list}>
                  {processlist.map((p: any) => {
                    const id = getId(p);
                    const title = getProgressTitle(p);
                    const filePath = getFilePath(p);
                    const cmt = getCommentText(p);
                    const updatedAt = getUpdatedAt(p);

                    return (
                      <div key={id} style={styles.item}>
                        <div style={styles.itemTop}>
                          <div style={styles.badge}>#{id}</div>
                          <div style={styles.itemFile}>{title || `Update #${id}`}</div>
                        </div>

                        {filePath ? (
                          <div style={{ fontSize: 12, opacity: 0.75 }}>File: {filePath}</div>
                        ) : null}

                        <div style={styles.itemComment}>{cmt}</div>
                        <div style={styles.itemMeta}>{updatedAt ? `Updated: ${updatedAt}` : ""}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#111827",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "linear-gradient(100deg, #8A011D 0%, #7F666B 100%)",
    padding: "18px 18px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  appTitle: { fontSize: 20, fontWeight: 900, letterSpacing: 0.2 },
  subTitle: { fontSize: 13, opacity: 0.9 },
  modeTabs: {
    display: "flex",
    gap: 8,
    background: "rgba(255,255,255,0.14)",
    padding: 6,
    borderRadius: 999,
  },
  tab: {
    border: "none",
    cursor: "pointer",
    padding: "10px 14px",
    borderRadius: 999,
    background: "transparent",
    color: "rgba(255,255,255,0.9)",
    fontWeight: 700,
    opacity: 0.95,
  },
  tabActive: {
    border: "none",
    cursor: "pointer",
    padding: "10px 14px",
    borderRadius: 999,
    background: "white",
    color: "#8A011D",
    fontWeight: 900,
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 18,
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    gap: 16,
  },
  left: { display: "flex", flexDirection: "column", gap: 12 },
  right: {
    background: "white",
    borderRadius: 14,
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    overflow: "hidden",
    minHeight: 520,
    display: "flex",
    flexDirection: "column",
  },
  status: { borderRadius: 12, padding: "12px 14px", fontSize: 14 },
  card: {
    background: "white",
    borderRadius: 14,
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: 900, marginBottom: 6 },
  cardDesc: { fontSize: 13, opacity: 0.8, marginBottom: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 800, textTransform: "uppercase", opacity: 0.7 },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
    minHeight: 90,
    resize: "vertical",
  },
  select: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
    background: "white",
  },
  primaryBtn: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: "#8A011D",
    color: "white",
    fontWeight: 900,
    boxShadow: "0 8px 16px rgba(138, 1, 29, 0.25)",
  },
  dangerBtn: {
    padding: "12px 12px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: "#ef4444",
    color: "white",
    fontWeight: 900,
    flex: 1,
  },
  listHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid #eef2f7",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  list: { padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  item: { border: "1px solid #eef2f7", borderRadius: 14, padding: 14, background: "#ffffff" },
  itemTop: { display: "flex", gap: 10, alignItems: "center", marginBottom: 6 },
  badge: {
    background: "#f3f4f6",
    borderRadius: 999,
    padding: "4px 10px",
    fontWeight: 900,
    fontSize: 12,
    flexShrink: 0,
  },
  itemFile: { fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  itemComment: { fontSize: 14, opacity: 0.9, marginTop: 6, whiteSpace: "pre-wrap" },
  itemMeta: { fontSize: 12, opacity: 0.6, marginTop: 8 },
  empty: { padding: 28, textAlign: "center", color: "#6b7280" },
  smallText: { fontSize: 12, opacity: 0.8 },

  lockCard: {
    background: "white",
    borderRadius: 14,
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    padding: 18,
    border: "1px solid #fde68a",
  },
  lockTitle: { fontSize: 18, fontWeight: 900, marginBottom: 6 },
  lockDesc: { fontSize: 13, opacity: 0.85, marginBottom: 12 },
  lockSteps: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 10,
  },
  lockStep: { fontSize: 13, color: "#92400e" },
  lockHint: { fontSize: 12, opacity: 0.75 },
  lockRight: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 520,
    textAlign: "center",
    background: "linear-gradient(180deg, #ffffff 0%, #fff7ed 100%)",
  },
};
