"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import api from "../../../services/api";
import { GetGroupProjectIDByUser } from "../../../services/progress"; // ✅ your new API

type Mode = "view" | "submit" | "edit";

export default function ProgressPage() {
  const [mode, setMode] = useState<Mode>("view");

  const [groupProjectId, setGroupProjectId] = useState<number>(0);
  const [userId, setUserId] = useState<number>(0);

  const [progressList, setProgressList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [progressTitle, setProgressTitle] = useState(""); // progress title stored in Name/name

  const [status, setStatus] = useState("Ready");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getId = (p: any) => Number(p?.id ?? p?.ID ?? p?.progress_id ?? 0) || 0;
  const getProgressTitle = (p: any) => String(p?.Name ?? p?.name ?? "").trim();
  const getFilePath = (p: any) => String(p?.file ?? p?.File ?? "").trim();
  const getComment = (p: any) => String(p?.comment ?? p?.Comment ?? "").trim();
  const getUpdatedAt = (p: any) =>
    String(p?.updatedAt ?? p?.UpdatedAt ?? p?.updated_at ?? p?.update_at ?? "").trim();

  // ---------- init ids ----------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const uid = Number(window.localStorage.getItem("user_id") ?? 0);
    const cleanUid = Number.isFinite(uid) && uid > 0 ? uid : 0;
    setUserId(cleanUid);

    if (!cleanUid) {
      setGroupProjectId(0);
      return;
    }

    // 🔑 CALL BACKEND TO GET GROUP PROJECT ID
    (async () => {
      try {
        const res = await GetGroupProjectIDByUser({ student_id: cleanUid });

        const gp =
          Number.isFinite(res?.group_project_id) && res.group_project_id > 0
            ? res.group_project_id
            : 0;

        setGroupProjectId(gp);
      } catch (err) {
        console.error("Failed to load group project id", err);
        setGroupProjectId(0);
      }
    })();
  }, []);

  const locked = groupProjectId <= 0 || userId <= 0;

  // force view mode if locked
  useEffect(() => {
    if (locked) setMode("view");
  }, [locked]);

  // ---------- refresh ----------
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
    if (locked) return;
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
    if (locked) return;
    setIsLoading(true);
    setIsError(false);

    try {
      if (!groupProjectId) throw new Error("Missing group_project_id");
      if (!progressTitle.trim()) throw new Error("Please enter progress title");
      if (!file) throw new Error("Please select a file");
      if (!comment.trim()) throw new Error("Please write a comment");

      const fd = new FormData();
      fd.append("group_project_id", String(groupProjectId));

      // ✅ your backend may expect Name or name, so send both
      fd.append("Name", progressTitle.trim());
      fd.append("name", progressTitle.trim());

      fd.append("comment", comment.trim());
      fd.append("file", file);

      await api.post("/student/assignProgress", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFile(null);
      setComment("");
      setProgressTitle("");
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
    if (locked) return;
    setIsLoading(true);
    setIsError(false);

    try {
      if (!selectedId) throw new Error("Select update");

      const fd = new FormData();
      fd.append("id", String(selectedId));

      if (progressTitle.trim()) {
        fd.append("Name", progressTitle.trim());
        fd.append("name", progressTitle.trim());
      }
      if (comment.trim()) fd.append("comment", comment.trim());
      if (file) fd.append("file", file);

      await api.post("/student/modifyProgress", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFile(null);
      setComment("");
      setProgressTitle("");
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
    if (locked) return;
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
      await api.delete("/student/deleteProgress", { params: { id } });

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
    if (!locked && groupProjectId > 0) void handleView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupProjectId, locked]);

  const availableIds = useMemo(() => {
    return Array.isArray(progressList)
      ? progressList.map(getId).filter((id) => Number.isFinite(id) && id > 0)
      : [];
  }, [progressList]);

  useEffect(() => {
    setSelectedId(availableIds.length > 0 ? availableIds[0] : null);
  }, [availableIds]);

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
          <button
            onClick={() => !locked && setMode("view")}
            style={mode === "view" ? styles.tabActive : styles.tab}
            disabled={locked}
            title={locked ? "Locked until you join a group" : ""}
          >
            View
          </button>
          <button
            onClick={() => !locked && setMode("submit")}
            style={mode === "submit" ? styles.tabActive : styles.tab}
            disabled={locked}
            title={locked ? "Locked until you join a group" : ""}
          >
            Submit
          </button>
          <button
            onClick={() => !locked && setMode("edit")}
            style={mode === "edit" ? styles.tabActive : styles.tab}
            disabled={locked}
            title={locked ? "Locked until you join a group" : ""}
          >
            Manage
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* LEFT */}
        <div style={styles.left}>
          <div
            style={{
              ...styles.status,
              background: locked ? "#fef3c7" : isError ? "#fee2e2" : "#dcfce7",
              color: locked ? "#92400e" : isError ? "#991b1b" : "#166534",
              border: locked ? "1px solid #fde68a" : "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <b>Status:</b> {locked ? "🔒 Locked — you still don’t have a group yet." : status}
          </div>

          {locked ? (
            <div style={styles.lockCard}>
              <div style={styles.lockTitle}>You don’t have a group yet</div>
              <div style={styles.lockDesc}>
                Join a group project first, then you can submit and manage progress updates here.
              </div>

              <div style={styles.lockSteps}>
                <div style={styles.lockStep}>
                  <b>1)</b> Go to <b>Groups / Projects</b>
                </div>
                <div style={styles.lockStep}>
                  <b>2)</b> Join or create a group
                </div>
                <div style={styles.lockStep}>
                  <b>3)</b> Come back to this page
                </div>
              </div>

              <div style={styles.lockHint}>
                (This page is locked because <code>group_project_id</code> is not set / invalid.)
              </div>
            </div>
          ) : (
            <>
              {mode === "view" && (
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Latest updates</div>
                  <div style={styles.cardDesc}>See what your group has submitted so far.</div>

                  <button onClick={handleView} disabled={isLoading} style={styles.primaryBtn}>
                    {isLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>
              )}

              {mode === "submit" && (
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Submit a new update</div>
                  <div style={styles.cardDesc}>Use Name as progress title (Work 1 / Fix bug / etc.).</div>

                  <div style={styles.field}>
                    <label style={styles.label}>Name (Progress title)</label>
                    <input
                      value={progressTitle}
                      onChange={(e) => setProgressTitle(e.target.value)}
                      placeholder='e.g. "Work 1", "Fix small bug"'
                      style={styles.input}
                      disabled={isLoading}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>File</label>
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      style={styles.input}
                      disabled={isLoading}
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
                      disabled={isLoading}
                    />
                  </div>

                  <button onClick={handleSubmit} disabled={isLoading} style={styles.primaryBtn}>
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
                      disabled={isLoading || progressList.length === 0}
                    >
                      {progressList.length === 0 ? <option value="">No updates</option> : null}
                      {progressList.map((p: any) => {
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
                      placeholder="Leave blank to keep same"
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
                      placeholder="Leave blank to keep same"
                      style={styles.textarea}
                      disabled={isLoading}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleEdit} disabled={isLoading} style={styles.primaryBtn}>
                      {isLoading ? "Saving..." : "Save changes"}
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

        {/* RIGHT */}
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
                <div style={{ fontSize: 12, opacity: 0.7 }}>{progressList.length} items</div>
              </div>

              {progressList.length === 0 ? (
                <div style={styles.empty}>No progress updates yet.</div>
              ) : (
                <div style={styles.list}>
                  {progressList.map((p: any) => {
                    const id = getId(p);
                    const title = getProgressTitle(p);
                    const filePath = getFilePath(p);
                    const cmt = getComment(p);
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
  status: {
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
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
