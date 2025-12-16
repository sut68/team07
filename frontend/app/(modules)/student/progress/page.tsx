"use client";

import { useState } from "react";
import {
  GetProgress,
  AddProgress,
  UpProgress,
  EraseProgress,
} from "../../../services/progress";
import type { FullProgress } from "../../../interfaces/Progress";

type Mode = "get" | "add" | "update" | "delete";

export default function TestApiPage() {
  const [mode, setMode] = useState<Mode>("get");
  const [groupProjectId, setGroupProjectId] = useState<number>(0);

  const [file, setFile] = useState("");
  const [comment, setComment] = useState("");

  const [updateId, setUpdateId] = useState<number | null>(null);
  const [delId, setDelId] = useState<number | null>(null);

  const [progressList, setProgressList] = useState<FullProgress[]>([]);
  const [status, setStatus] = useState<string>("Waiting for action...");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to extract IDs
  const availableIds = Array.isArray(progressList)
    ? (progressList as any[])
        .map((p) => p.id ?? p.ID ?? p.progress_id)
        .filter((id) => id !== null && id !== undefined)
    : [];

  const handleRun = async () => {
    setIsLoading(true);
    setIsError(false);
    setStatus("Processing...");

    try {
      let list: FullProgress[] = [];

      if (mode === "get") {
        list = await GetProgress({ group_project_id: groupProjectId });
        setStatus(`✅ Fetch Success: Retrieved ${list.length} records`);
      } 
      else if (mode === "add") {
        await AddProgress({
          group_project_id: groupProjectId,
          file,
          comment,
        });
        list = await GetProgress({ group_project_id: groupProjectId });
        setStatus("✅ Create Success: New progress added.");
      } 
      else if (mode === "delete") {
        if (!delId) throw new Error("Please select an ID to delete.");
        await EraseProgress({ id: delId });
        list = await GetProgress({ group_project_id: groupProjectId });
        setStatus(`✅ Delete Success: Removed ID ${delId}`);
      } 
      else {
        if (!updateId) throw new Error("Please select an ID to update.");
        await UpProgress({ id: updateId, file, comment });
        list = await GetProgress({ group_project_id: groupProjectId });
        setStatus(`✅ Update Success: Modified ID ${updateId}`);
      }

      setProgressList(list);

    } catch (err: any) {
      console.error("Axios ERROR:", err);
      setIsError(true);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unknown Error occurred";
      setStatus(`❌ Error: ${msg}`);
      // Don't clear list on error so user can still see previous data
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.pageTitle}>🚀 Progress API Inspector</h1>
      
      <div style={styles.mainGrid}>
        
        {/* LEFT PANEL: Controls */}
        <div style={styles.controlPanel}>
          
          {/* 1. Mode Tabs */}
          <div style={styles.tabContainer}>
            <button onClick={() => setMode("get")} style={mode === "get" ? styles.tabActive : styles.tab}>GET</button>
            <button onClick={() => setMode("add")} style={mode === "add" ? styles.tabActive : styles.tab}>POST</button>
            <button onClick={() => setMode("update")} style={mode === "update" ? styles.tabActive : styles.tab}>PATCH</button>
            <button onClick={() => setMode("delete")} style={mode === "delete" ? styles.tabActive : styles.tab}>DELETE</button>
          </div>

          <div style={styles.formContent}>
            <h3 style={styles.sectionTitle}>
              {mode === "get" && "🔍 Fetch Data"}
              {mode === "add" && "✨ Add New Progress"}
              {mode === "update" && "✏️ Edit Progress"}
              {mode === "delete" && "🗑️ Remove Progress"}
            </h3>

            {/* Global Input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Group Project ID</label>
              <input
                type="number"
                value={groupProjectId}
                onChange={(e) => setGroupProjectId(Number(e.target.value))}
                placeholder="e.g. 1"
                style={styles.input}
              />
            </div>

            {/* Dynamic Inputs */}
            {mode === "add" && (
              <>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>File Path / URL</label>
                  <input value={file} onChange={(e) => setFile(e.target.value)} placeholder="e.g. report.pdf" style={styles.input} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Comment</label>
                  <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. First Draft" style={styles.input} />
                </div>
              </>
            )}

            {mode === "update" && (
              <>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Target ID</label>
                  <select value={updateId ?? ""} onChange={(e) => setUpdateId(Number(e.target.value))} style={styles.select}>
                    <option value="">-- Select ID --</option>
                    {availableIds.map((id) => <option key={id} value={id}>{id}</option>)}
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>New File</label>
                  <input value={file} onChange={(e) => setFile(e.target.value)} placeholder="Updated file..." style={styles.input} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>New Comment</label>
                  <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Updated comment..." style={styles.input} />
                </div>
              </>
            )}

            {mode === "delete" && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Target ID to Delete</label>
                <select value={delId ?? ""} onChange={(e) => setDelId(Number(e.target.value))} style={styles.select}>
                  <option value="">-- Select ID --</option>
                  {availableIds.map((id) => <option key={id} value={id}>{id}</option>)}
                </select>
              </div>
            )}

            <button onClick={handleRun} disabled={isLoading} style={styles.runButton}>
              {isLoading ? "Running..." : "EXECUTE REQUEST"}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Console / Results */}
        <div style={styles.resultPanel}>
          {/* Status Banner */}
          <div style={{...styles.statusBanner, backgroundColor: isError ? "#fee2e2" : "#dcfce7", color: isError ? "#991b1b" : "#166534" }}>
            <span style={{ fontWeight: "bold" }}>STATUS:</span> {status}
          </div>

          {/* JSON Viewer */}
          <div style={styles.jsonContainer}>
            <div style={styles.jsonHeader}>
              <span>📦 Response Payload</span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>{progressList.length} Items</span>
            </div>
            <pre style={styles.jsonCode}>
              {progressList.length > 0
                ? JSON.stringify(progressList, null, 2)
                : "// No data loaded yet.\n// Run a GET request to see data here."}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Styles (CSS-in-JS) ---
const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    padding: "40px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "'Inter', system-ui, sans-serif",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: "24px",
    borderLeft: "6px solid #8A011D", // SUT Brand Color
    paddingLeft: "12px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr", // Left 40%, Right 60%
    gap: "24px",
    alignItems: "start",
  },
  // Left Panel
  controlPanel: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    overflow: "hidden",
  },
  tabContainer: {
    display: "flex",
    backgroundColor: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
  },
  tab: {
    flex: 1,
    padding: "12px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontWeight: "600",
    color: "#6b7280",
    transition: "all 0.2s",
    borderBottom: "3px solid transparent",
  },
  tabActive: {
    flex: 1,
    padding: "12px",
    border: "none",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#8A011D",
    borderBottom: "3px solid #8A011D",
  },
  formContent: {
    padding: "24px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "20px",
    color: "#374151",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
  },
  inputGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: "6px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "#fff",
  },
  runButton: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    backgroundColor: "#8A011D",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(138, 1, 29, 0.3)",
    transition: "opacity 0.2s",
  },
  // Right Panel
  resultPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  statusBanner: {
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    border: "1px solid rgba(0,0,0,0.05)",
  },
  jsonContainer: {
    backgroundColor: "#1e1e1e", // Dark Terminal Background
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    minHeight: "400px",
    display: "flex",
    flexDirection: "column",
  },
  jsonHeader: {
    backgroundColor: "#2d2d2d",
    color: "#e5e7eb",
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: "bold",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jsonCode: {
    margin: 0,
    padding: "16px",
    color: "#4ade80", // Matrix Green
    fontSize: "13px",
    fontFamily: "'Fira Code', 'Consolas', monospace",
    overflow: "auto",
    maxHeight: "600px",
    lineHeight: "1.5",
  },
};