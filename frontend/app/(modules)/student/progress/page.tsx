"use client";

import { useState } from "react";
import { GetProgress } from "../../../services/progress"; 
import type { FullProgress } from "../../../interfaces/Progress";

export default function TestApiPage() {
    const [groupProjectId, setGroupProjectId] = useState<number>(0);
    const [result, setResult] = useState<FullProgress[] | string>("ยังไม่ได้ทดสอบ");

    const handleTest = async () => {
        try {
            const res = await GetProgress({ group_project_id: groupProjectId });
            console.log("Axios RESULT:", res);
            setResult(res);
        } catch (err) {
            console.error("Axios ERROR:", err);
            setResult("เกิดข้อผิดพลาด ดูใน Console");
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>🚀 Test Axios Page</h1>

            {/* ===== Input for PickProgress ===== */}
            <label>กรอก group_project_id:</label>
            <input
                type="number"
                value={groupProjectId}
                onChange={(e) => setGroupProjectId(Number(e.target.value))}
                placeholder="เช่น 1"
                style={{
                    padding: "8px",
                    marginLeft: "10px",
                    marginRight: "20px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                }}
            />

            {/* ===== Button to Test ===== */}
            <button
                onClick={handleTest}
                style={{
                    padding: "10px 20px",
                    backgroundColor: "#0070f3",
                    color: "white",
                    borderRadius: "5px",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                ทดสอบเรียก GetProgress()
            </button>

            {/* ===== Result Output ===== */}
            <pre style={{ marginTop: 20, background: "#f4f4f4", padding: 10 }}>
                {typeof result === "string"
                    ? result
                    : JSON.stringify(result, null, 2)}
            </pre>
        </div>
    );
}
