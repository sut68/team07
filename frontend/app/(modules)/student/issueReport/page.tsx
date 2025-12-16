"use client";
import ReportIssueContent from "../../../components/issue/issueReport"; // Import เข้ามา

export default function StudentReportPage() {
    return (
        <div style={{ width: '100%' }}>
            {/* เรียกใช้ Component กลาง */}
            <ReportIssueContent />
        </div>
    );
}