import React from 'react';
import Link from 'next/link';
import { Tag, Tooltip } from 'antd';
import { 
  EditOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  BarChartOutlined,
  TeamOutlined
} from '@ant-design/icons';

interface Props {
    project: any;
    onEvaluate: (project: any) => void;
}

export default function AdvisorProjectCard({ project, onEvaluate }: Props) {
    return (
        <div className="project-card">
            <div className={`status-bar ${project.is_graded ? "graded" : "pending"}`} />
            
            <div className="card-body">
                <div className="card-top-row">
                    <span className="group-tag">Group {project.group_number}</span>
                    {project.is_graded ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>ตรวจแล้ว</Tag>
                    ) : (
                        <Tag color="warning" icon={<ClockCircleOutlined />}>รอตรวจ</Tag>
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
                <button
                    className={`btn-card ${project.is_graded ? 'edit' : 'eval'}`}
                    style={{ flex: 1 }}
                    onClick={() => onEvaluate(project)}
                >
                    <EditOutlined /> {project.is_graded ? 'แก้ไขคะแนน' : 'ประเมินผล'}
                </button>

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
