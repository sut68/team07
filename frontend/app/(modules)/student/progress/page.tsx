"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import api from "../../../services/api";

type Mode = "view" | "submit" | "edit";

export default function ProgressPage() {
  const [mode, setMode] = useState<Mode>("view");

  const [groupProjectId, setGroupProjectId] = useState<number>(0);
  const [userId, setUserId] = useState<number>(0);

  const [progressList, setProgressList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");

  const [status, setStatus] = useState("Ready");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const gp = 1; // Number(window.localStorage.getItem("group_project_id") ?? 0);
    const uid = Number(window.localStorage.getItem("user_id") ?? 0);

    setGroupProjectId(Number.isFinite(gp) ? gp : 0);
    setUserId(Number.isFinite(uid) ? uid : 0);
  }, []);

  const availableIds = useMemo(() => {
    return Array.isArray(progressList)
      ? progressList
          .map((p) => Number(p?.id ?? p?.ID ?? p?.progress_id ?? 0))
          .filter((id) => Number.isFinite(id) && id > 0)
      : [];
  }, [progressList]);

  useEffect(() => {
    setSelectedId(availableIds.length > 0 ? availableIds[0] : null);
  }, [availableIds]);

  const safeText = (s: unknown) => String(s ?? "").trim();

  const refresh = async () => {
    if (!groupProjectId || groupProjectId <= 0) {
      setProgressList([]);
      return;
    }
    const res = await api.get("/student/getProcess", {
      params: { group_project_id: groupProjectId },
    });
    setProgressList(Array.isArray(res.data) ? res.data : []);
  };

  const handleView = async () => {
    setIsLoading(true);
    setIsError(false);
    setStatus("Loading updates...");
    try {
      await refresh();
      setStatus("✅ Loaded progress updates");
    } catch (err: any) {
      console.error(err);
      setIsError(true);
      setStatus(`❌ ${err?.response?.data?.message || err?.message || "Failed to load"}`);
    } finally {
      setIsLoading(false);
    }
  };

 const handleSubmit = async () => {
  setIsLoading(true);
  setIsError(false);

  try {
    if (!groupProjectId) throw new Error("Missing group_project_id");
    if (!file) throw new Error("Please select a file");
    if (!comment.trim()) throw new Error("Please write a comment");

    const fd = new FormData();
    fd.append("group_project_id", String(groupProjectId));
    fd.append("comment", comment.trim());
    fd.append("file", file);

    await api.post("/student/assignProgress", fd, {
      headers: {
        "Content-Type": "multipart/form-data", // ✅ ONLY HERE
      },
    });

    setFile(null);
    setComment("");
    await refresh();
    setStatus("✅ Submitted!");
  } catch (err: any) {
    setIsError(true);
    setStatus(err?.response?.data?.error || err?.message || "Submit failed");
  } finally {
    setIsLoading(false);
  }
};




 const handleEdit = async () => {
  setIsLoading(true);
  setIsError(false);

  try {
    if (!selectedId) throw new Error("Select update");

    const fd = new FormData();
    fd.append("id", String(selectedId));
    if (comment.trim()) fd.append("comment", comment.trim());
    if (file) fd.append("file", file);

    await api.post("/student/modifyProgress", fd, {
      headers: {
        "Content-Type": "multipart/form-data", // ✅ ONLY HERE
      },
    });

    setFile(null);
    setComment("");
    await refresh();
    setStatus("✅ Updated!");
  } catch (err: any) {
    setIsError(true);
    setStatus(err?.response?.data?.error || err?.message || "Update failed");
  } finally {
    setIsLoading(false);
  }
};




  const handleDelete = async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const id = selectedId;
      if (!id) throw new Error("Please select an update to delete");

      if (!confirm(`Delete progress update #${id}?`)) {
        setIsLoading(false);
        return;
      }

      setStatus(`Deleting #${id}...`);

      await api.delete("/student/deleteProgress", {
        params: { id },
      });

      await refresh();
      setStatus(`✅ Deleted progress #${id}`);
    } catch (err: any) {
      console.error(err);
      setIsError(true);
      setStatus(`❌ ${err?.response?.data?.message || err?.message || "Delete failed"}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (groupProjectId > 0) handleView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupProjectId]);

  const locked = groupProjectId <= 0 || userId <= 0;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.appTitle}>Progress Updates</div>
          <div style={styles.subTitle}>
            Group: <b>{groupProjectId || "-"}</b> • Student: <b>{userId || "-"}</b>
          </div>
        </div>

        <div style={styles.modeTabs}>
          <button onClick={() => setMode("view")} style={mode === "view" ? styles.tabActive : styles.tab}>
            View
          </button>
          <button onClick={() => setMode("submit")} style={mode === "submit" ? styles.tabActive : styles.tab}>
            Submit
          </button>
          <button onClick={() => setMode("edit")} style={mode === "edit" ? styles.tabActive : styles.tab}>
            Manage
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.left}>
          <div
            style={{
              ...styles.status,
              background: isError ? "#fee2e2" : "#dcfce7",
              color: isError ? "#991b1b" : "#166534",
            }}
          >
            <b>Status:</b> {status}
          </div>

          {locked && (
            <div style={styles.notice}>
              Missing IDs. Please set <code>group_project_id</code> and <code>user_id</code> in localStorage.
            </div>
          )}

          {mode === "view" && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Latest updates</div>
              <div style={styles.cardDesc}>See what your group has submitted so far.</div>

              <button onClick={handleView} disabled={isLoading || locked} style={styles.primaryBtn}>
                {isLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
          )}

          {mode === "submit" && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Submit a new update</div>
              <div style={styles.cardDesc}>Upload a file and write a short description.</div>

              <div style={styles.field}>
                <label style={styles.label}>File</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  style={styles.input}
                  disabled={isLoading || locked}
                />
                {file?.name ? <div style={styles.smallText}>Selected: {file.name}</div> : null}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you work on? Any issues?"
                  style={styles.textarea}
                  disabled={isLoading || locked}
                />
              </div>

              <button onClick={handleSubmit} disabled={isLoading || locked} style={styles.primaryBtn}>
                {isLoading ? "Submitting..." : "Submit update"}
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
                  disabled={isLoading || locked || availableIds.length === 0}
                >
                  {availableIds.length === 0 ? <option value="">No updates</option> : null}
                  {availableIds.map((id) => (
                    <option key={id} value={id}>
                      Update #{id}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>New file (optional)</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  style={styles.input}
                  disabled={isLoading || locked}
                />
                {file?.name ? <div style={styles.smallText}>Selected: {file.name}</div> : null}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>New comment (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Leave blank to keep same"
                  style={styles.textarea}
                  disabled={isLoading || locked}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleEdit} disabled={isLoading || locked} style={styles.primaryBtn}>
                  {isLoading ? "Saving..." : "Save changes"}
                </button>
                <button onClick={handleDelete} disabled={isLoading || locked} style={styles.dangerBtn}>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={styles.right}>
          <div style={styles.listHeader}>
            <div style={{ fontWeight: 800 }}>Updates</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{progressList.length} items</div>
          </div>

          {progressList.length === 0 ? (
            <div style={styles.empty}>No progress updates yet.</div>
          ) : (
            <div style={styles.list}>
              {progressList.map((p: any) => {
                const id = p.id ?? p.ID ?? p.progress_id;
                const fileVal = p.file ?? p.File ?? "";
                const commentVal = p.comment ?? p.Comment ?? "";
                const updatedAt = p.updatedAt ?? p.UpdatedAt ?? p.updated_at ?? "";

                return (
                  <div key={id} style={styles.item}>
                    <div style={styles.itemTop}>
                      <div style={styles.badge}>#{id}</div>
                      <div style={styles.itemFile}>{String(fileVal)}</div>
                    </div>
                    <div style={styles.itemComment}>{String(commentVal)}</div>
                    <div style={styles.itemMeta}>{updatedAt ? `Updated: ${String(updatedAt)}` : ""}</div>
                  </div>
                );
              })}
            </div>
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
  status: {
    borderRadius: 12,
    padding: "12px 14px",
    border: "1px solid rgba(0,0,0,0.05)",
    fontSize: 14,
  },
  notice: {
    borderRadius: 12,
    padding: "12px 14px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    fontSize: 13,
  },
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
    boxShadow: "0 8px 16px rgba(138,1,29,0.25)",
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
  item: {
    border: "1px solid #eef2f7",
    borderRadius: 14,
    padding: 14,
    background: "#ffffff",
  },
  itemTop: { display: "flex", gap: 10, alignItems: "center", marginBottom: 6 },
  badge: {
    background: "#f3f4f6",
    borderRadius: 999,
    padding: "4px 10px",
    fontWeight: 900,
    fontSize: 12,
  },
  itemFile: { fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  itemComment: { fontSize: 14, opacity: 0.9, marginTop: 2, whiteSpace: "pre-wrap" },
  itemMeta: { fontSize: 12, opacity: 0.6, marginTop: 8 },
  empty: { padding: 28, textAlign: "center", color: "#6b7280" },
  smallText: { fontSize: 12, opacity: 0.8 },
};
