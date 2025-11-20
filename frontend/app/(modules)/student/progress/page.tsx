"use client";

import { useState } from "react";
import { GetProgress, AddProgress } from "../../../services/progress";
import type { FullProgress } from "../../../interfaces/Progress";

type Mode = "get" | "add";

export default function TestApiPage() {
  const [mode, setMode] = useState<Mode>("get");
  const [groupProjectId, setGroupProjectId] = useState<number>(0);

  const [file, setFile] = useState("");
  const [comment, setComment] = useState("");

  const [result, setResult] = useState<FullProgress[] | string>(
    "ยังไม่ได้ทดสอบ"
  );

  const handleRun = async () => {
    try {
      if (mode === "get") {
        const res = await GetProgress({ group_project_id: groupProjectId });
        console.log("GET RESULT:", res);
        setResult(res);
      } else {
        await AddProgress({
          group_project_id: groupProjectId,
          file,
          comment,
        });
        console.log("ADD SUCCESS");
        setResult("เพิ่ม Progress สำเร็จ (ลอง GET ดูอีกครั้ง)");
      }
    } catch (err: any) {
      console.error("Axios ERROR:", err);
      // Try to show backend message if exists
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "เกิดข้อผิดพลาด ดูใน Console";
      setResult(msg);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🚀 Test Axios Page</h1>

      {/* Mode selector */}
      <div style={{ marginBottom: 16 }}>
        <label>เลือกโหมดทดสอบ: </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          style={{ padding: 6, marginLeft: 8 }}
        >
          <option value="get">GET - GetProgress</option>
          <option value="add">POST - AddProgress</option>
        </select>
      </div>

      {/* group_project_id input (used by both) */}
      <div style={{ marginBottom: 12 }}>
        <label>กรอก group_project_id:</label>
        <input
          type="number"
          value={groupProjectId}
          onChange={(e) => setGroupProjectId(Number(e.target.value))}
          placeholder="เช่น 1"
          style={{
            padding: "8px",
            marginLeft: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
      </div>

      {/* Extra inputs for AddProgress */}
      {mode === "add" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label>File:</label>
            <input
              value={file}
              onChange={(e) => setFile(e.target.value)}
              placeholder="เช่น report.pdf"
              style={{
                padding: "8px",
                marginLeft: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Comment:</label>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="เช่น first submission"
              style={{
                padding: "8px",
                marginLeft: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>
        </>
      )}

      {/* Run button */}
      <button
        onClick={handleRun}
        style={{
          padding: "10px 20px",
          backgroundColor: "#0070f3",
          color: "white",
          borderRadius: "5px",
          border: "none",
          cursor: "pointer",
        }}
      >
        {mode === "get" ? "ทดสอบ GetProgress()" : "ทดสอบ AddProgress()"}
      </button>

      {/* Result Output */}
      <pre style={{ marginTop: 20, background: "#f4f4f4", padding: 10 }}>
        {typeof result === "string"
          ? result
          : JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
