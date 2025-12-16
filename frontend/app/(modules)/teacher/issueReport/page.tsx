"use client";
import ReportIssueContent from "../../../components/issue/issueReport"; // Import เข้ามา

export default function TeacherReportPage() {
    return (
        <div style={{ width: '100%' }}>
            {/* เรียกใช้ Component ตัวเดียวกัน */}
            <ReportIssueContent />
        </div>
    );
}