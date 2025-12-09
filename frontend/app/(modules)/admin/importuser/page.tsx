'use client';
import React, { useState } from "react";
import { ImportUsersCSV } from "../../../services/user";

function UserImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // เมื่อเลือกไฟล์
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // เมื่อกดปุ่ม Upload
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setUploading(true);
    try {
      const res = await ImportUsersCSV(file);
      if (res.status === 200) {
        alert("Upload Success! Imported users.");
        setFile(null); // เคลียร์ไฟล์หลังเสร็จ
        // อาจจะ refresh ตาราง user ตรงนี้
      } else {
        alert("Upload Failed: " + res.data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", border: "1px dashed #ccc" }}>
      <h3>Import Users (CSV)</h3>
      
      {/* Input เลือกไฟล์ */}
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileChange} 
      />

      {/* ปุ่ม Upload */}
      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
        style={{ marginLeft: "10px" }}
      >
        {uploading ? "Uploading..." : "Upload CSV"}
      </button>

      <p style={{ fontSize: "12px", color: "#666" }}>
        *Please use the template CSV file.
      </p>
    </div>
  );
}

export default UserImportPage;