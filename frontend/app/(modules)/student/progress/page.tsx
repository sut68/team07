"use client";

import { useState } from "react";
import { GetProgress, AddProgress, UpProgress } from "../../../services/progress";
import type { FullProgress } from "../../../interfaces/Progress";

type Mode = "get" | "add" | "update";

export default function TestApiPage() {
  const [mode, setMode] = useState<Mode>("get");
  const [groupProjectId, setGroupProjectId] = useState<number>(0);

  const [file, setFile] = useState("");
  const [comment, setComment] = useState("");

  const [updateId, setUpdateId] = useState<number | null>(null);

  const [result, setResult] = useState<FullProgress[] | string>(
    "ยังไม่ได้ทดสอบ"
  );

  // ดึง id จาก result ให้รองรับทั้ง id / ID / progress_id
  const availableIds =
    Array.isArray(result) && result.length > 0
      ? result
          .map((p: any) => p.id ?? p.ID ?? p.progress_id)
          .filter((id: any) => id !== null && id !== undefined)
      : [];

  const handleRun = async () => {
    try {
      if (mode === "get") {
        const res = await GetProgress({ group_project_id: groupProjectId });
        console.log("GET RESULT:", res);
        setResult(res);
        if (res.length > 0) {
          const firstId =
            (res[0] as any).id ??
            (res[0] as any).ID ??
            (res[0] as any).progress_id ??
            null;
          setUpdateId(firstId ?? null);
        } else {
          setUpdateId(null);
        }
      } else if (mode === "add") {
        await AddProgress({
          group_project_id: groupProjectId,
          file,
          comment,
        });
        console.log("ADD SUCCESS");

        // ดึงข้อมูลใหม่หลังเพิ่ม
        const res = await GetProgress({ group_project_id: groupProjectId });
        setResult(res);
        if (res.length > 0) {
          const firstId =
            (res[0] as any).id ??
            (res[0] as any).ID ??
            (res[0] as any).progress_id ??
            null;
          setUpdateId(firstId ?? null);
        }
      } else {
        if (!updateId) {
          setResult("กรุณาเลือก ID ที่ต้องการแก้ไข");
          return;
        }

        await UpProgress({
          id: updateId,
          file,
          comment,
        });
        console.log("UPDATE SUCCESS");

        // ดึงข้อมูลใหม่หลังอัปเดต
        const res = await GetProgress({ group_project_id: groupProjectId });
        setResult(res);
      }
    } catch (err: any) {
      console.error("Axios ERROR:", err);
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
          <option value="update">POST - UpdateProgress</option>
        </select>
      </div>

      {/* group_project_id input (used by all) */}
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

      {/* Inputs for UpdateProgress */}
      {mode === "update" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label>เลือก ID ที่ต้องการแก้ไข:</label>
            <select
              value={updateId ?? ""}
              onChange={(e) =>
                setUpdateId(e.target.value ? Number(e.target.value) : null)
              }
              style={{
                padding: "8px",
                marginLeft: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              <option value="">-- เลือกจากข้อมูลที่ได้มา --</option>
              {availableIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>File (ค่าใหม่):</label>
            <input
              value={file}
              onChange={(e) => setFile(e.target.value)}
              placeholder="เช่น report_updated.pdf"
              style={{
                padding: "8px",
                marginLeft: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Comment (ค่าใหม่):</label>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="เช่น updated submission"
              style={{
                padding: "8px",
                marginLeft: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>
          <div style={{ marginBottom: 8, fontSize: 12, color: "#666" }}>
            * ID ที่แสดงมาจากผลลัพธ์ล่าสุดของ GetProgress() / หลัง Add / หลัง Update
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
        {mode === "get"
          ? "ทดสอบ GetProgress()"
          : mode === "add"
          ? "ทดสอบ AddProgress()"
          : "ทดสอบ UpdateProgress()"}
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
