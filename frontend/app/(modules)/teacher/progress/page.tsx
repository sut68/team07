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
  const [status, setStatus] = useState<string>("ยังไม่ได้ทดสอบ");

  // ดึง ID ให้รองรับหลายแบบ: id / ID / progress_id
  const availableIds = Array.isArray(progressList)
    ? (progressList as any[])
        .map((p) => p.id ?? p.ID ?? p.progress_id)
        .filter((id) => id !== null && id !== undefined)
    : [];

  // รองรับ res เป็น [] หรือ { data: [] }
  const extractList = (res: any): FullProgress[] => {
    if (Array.isArray(res)) return res as FullProgress[];
    if (Array.isArray(res?.data)) return res.data as FullProgress[];
    console.warn("GetProgress returned unexpected shape:", res);
    return [];
  };

  const refreshAfterChange = (res: any) => {
    const list = extractList(res);
    setProgressList(list);

    if (list.length > 0) {
      const firstId = list[0].id;
      setUpdateId(firstId);
      setDelId(firstId);
    } else {
      setUpdateId(null);
      setDelId(null);
    }
  };

  const handleRun = async () => {
  try {
    if (mode === "get") {
      const list = await GetProgress({ group_project_id: groupProjectId });
      setProgressList(list);          // ✅ this is FullProgress[]
      setStatus(`ดึงข้อมูลสำเร็จ: ${list.length} รายการ`);
    } else if (mode === "add") {
      await AddProgress({
        group_project_id: groupProjectId,
        file,
        comment,
      });

      const list = await GetProgress({ group_project_id: groupProjectId });
      setProgressList(list);
      setStatus("เพิ่มข้อมูลสำเร็จ");
    } else if (mode === "delete") {
      if (!delId) {
        setStatus("กรุณาเลือก ID ที่ต้องการลบ");
        return;
      }

      await EraseProgress({ id: delId });

      const list = await GetProgress({ group_project_id: groupProjectId });
      setProgressList(list);
      setStatus(`ลบ Progress id=${delId} สำเร็จ`);
    } else {
      if (!updateId) {
        setStatus("กรุณาเลือก ID ที่ต้องการแก้ไข");
        return;
      }

      await UpProgress({ id: updateId, file, comment });

      const list = await GetProgress({ group_project_id: groupProjectId });
      setProgressList(list);
      setStatus(`อัปเดต Progress id=${updateId} สำเร็จ`);
    }
  } catch (err: any) {
    console.error("Axios ERROR:", err);
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      "เกิดข้อผิดพลาด ดูใน Console";
    setStatus(msg);
    setProgressList([]);
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
          <option value="delete">DELETE - EraseProgress</option>
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
            * ID ที่แสดงมาจากผลลัพธ์ล่าสุดของ GetProgress() / หลัง Add / หลัง
            Update / หลัง Delete
          </div>
        </>
      )}

      {/* Inputs for DeleteProgress */}
      {mode === "delete" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label>เลือก ID ที่ต้องการลบ:</label>
            <select
              value={delId ?? ""}
              onChange={(e) =>
                setDelId(e.target.value ? Number(e.target.value) : null)
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
          <div style={{ marginBottom: 8, fontSize: 12, color: "#666" }}>
            * ID ที่แสดงมาจากผลลัพธ์ล่าสุดของ GetProgress() / หลัง Add / หลัง
            Update / หลัง Delete
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
          : mode === "update"
          ? "ทดสอบ UpdateProgress()"
          : "ทดสอบ EraseProgress()"}
      </button>

      {/* Result Output / Debug */}
      <pre style={{ marginTop: 20, background: "#f4f4f4", padding: 10 }}>
        {status}
        {"\n\n"}
        {"availableIds = " + JSON.stringify(availableIds) + "\n\n"}
        {progressList.length > 0
          ? JSON.stringify(progressList, null, 2)
          : "// ยังไม่มีข้อมูลแสดงผล"}
      </pre>
    </div>
  );
}
