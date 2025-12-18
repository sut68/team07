import React from 'react';
import Link from 'next/link';
import { Tag, Tooltip, message } from 'antd';
import { 
  EditOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  BarChartOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface Props {
    project: any;
}

export default function CommitteeProjectCard({ project }: Props) {
    const router = useRouter();

    const handleEvaluate = () => {
        const appt = project.appointments?.find(
            (a: any) => a.evaluation_name === "Committee Evaluation"
        );

        if (!appt) {
             const anyAppt = project.appointments?.[0];
             if (anyAppt) {
                 router.push(`/teacher/evaluation/form/${anyAppt.id}?evalType=Committee Evaluation&mode=committee`);
                 return;
             }
            message.warning("ไม่พบนัดหมายสำหรับการสอบกรรมการ");
            return;
        }

        router.push(`/teacher/evaluation/form/${appt.id}?evalType=Committee Evaluation&mode=committee`);
    };

    return (
        <div className="project-card" style={{ borderColor: '#9a0120' }}>
            <div className={`status-bar ${project.is_graded ? "graded" : "pending"}`} />
            
            <div className="card-body">
                <div className="card-top-row">
                    <span className="group-tag">Group {project.group_number}</span>
                    {project.is_graded ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                            {project.group_status === "Completed" 
                                ? "จบการศึกษา" 
                                : `ตรวจแล้ว (${project.graded_count}/${project.total_count})`}
                        </Tag>
                    ) : (
                        <Tag color="warning" icon={<ClockCircleOutlined />}>
                            รอตรวจ ({project.graded_count}/{project.total_count})
                        </Tag>
                    )}
                </div>

                <h3 className="project-name">
                    {project.project_name || "โครงงานคอมพิวเตอร์"}
                </h3>

                <div className="member-count">
                    <TeamOutlined /> {project.students?.length || 0} สมาชิก
                </div>
            </div>

            <div className="card-actions">
                {project.appointments && project.appointments.length > 0 ? (
                    <button
                        className={`btn-card ${project.is_graded ? 'edit' : 'eval'}`}
                        style={{ flex: 1 }}
                        onClick={handleEvaluate}
                    >
                        <EditOutlined /> {project.is_graded ? 'แก้ไขคะแนน' : 'ประเมินผล'}
                    </button>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '0.9rem', background: '#f5f5f5', borderRadius: '6px' }}>
                        {project.group_status === "Completed" ? "จบการศึกษาแล้ว" : "ไม่มีนัดหมาย"}
                    </div>
                )}

                {project.is_graded && (
                    <Link href={`/teacher/evaluation/summary/${project.id}`}>
                        <Tooltip title="ดูสรุปผลคะแนน">
                            <button className="btn-icon-only">
                                <BarChartOutlined />
                            </button>
                        </Tooltip>
                    </Link>
                )}
            </div>
        </div>
    );
}
