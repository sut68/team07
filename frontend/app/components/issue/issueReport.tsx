// frontend/components/issue/ReportIssueContent.tsx
"use client";
import { useState, useEffect } from "react";
import { CreateIssue, GetIssues } from "../../services/issue"; // เช็ค path ให้ถูก
import { IssueReportInterface, CreateIssueInterface } from "../../interfaces/Issue"; // เช็ค path ให้ถูก
import { BugOutlined, FileTextOutlined } from "@ant-design/icons";
import "../../style/report-issue.css"; 

// รับ Props เข้ามาเผื่ออนาคตต้องใช้ UserID จาก Parent
export default function ReportIssueContent() {
  const [issues, setIssues] = useState<IssueReportInterface[]>([]);
  // ... (ใส่ Logic state และ functions ทั้งหมดที่ผมเขียนให้ก่อนหน้านี้ ตรงนี้) ...
  // ... fetchData, handleSubmit ...

  // สมมติ: ดึง UserID จาก LocalStorage หรือ Context ที่นี่เพื่อให้แน่ใจว่าเป็นคน Login จริง
  // const currentUserID = ...; 

  return (
    <div className="report-container">
       {/* ... (ใส่ JSX UI ทั้งหมดที่ผมเขียนให้ก่อนหน้านี้ ตรงนี้) ... */}
    </div>
  );
}