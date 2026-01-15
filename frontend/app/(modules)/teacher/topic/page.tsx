"use client";
import { ConfigProvider, Tabs } from 'antd';
import TeacherMyTopicPage from './mytopic/page';
import TeacherTopicApprovalPage from './approval/page';
import '../../../style/evaluation.css';

export default function TeacherTopicPage() {

    const items = [
        {
            key: '1',
            label: <span style={{ fontWeight: 500, fontSize: '16px' }}>หัวข้อของฉัน</span>,
            children: <TeacherMyTopicPage />,
        },
        {
            key: '2',
            label: <span style={{ fontWeight: 500, fontSize: '16px' }}>คำขออนุมัติหัวข้อ</span>,
            children: <TeacherTopicApprovalPage />,
        }
    ];

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#8A011D',
                    fontFamily: "'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                },
            }}
        >
            <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
                <div className="page-title-box">
                    <h1>จัดการหัวข้อโครงงาน</h1>
                    <p>เสนอหัวข้อโครงงานของคุณ และพิจารณาหัวข้อที่นักศึกษาเสนอ</p>
                </div>

                <Tabs defaultActiveKey="1" items={items} />
            </div>
        </ConfigProvider>
    );
}