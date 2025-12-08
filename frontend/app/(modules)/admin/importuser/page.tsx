"use client";

import { useState } from "react";

export default function ImportUsers() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:8080/admin/import-users", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Import Users</h1>

      <input
        type="file"
        accept=".csv, .xlsx"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={handleUpload} style={{ marginLeft: 10 }}>
        Upload
      </button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>ผลลัพธ์</h3>
          <p>นำเข้าสำเร็จ: {result.imported}</p>

          {result.errors?.length > 0 && (
            <>
              <p>ข้อผิดพลาด:</p>
              <ul>
                {result.errors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
