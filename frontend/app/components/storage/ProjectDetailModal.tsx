import React from 'react';
import { Modal, Button, Typography, Descriptions, Tag, Space } from 'antd';
import { BookOutlined, DownloadOutlined, FileTextOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { ProjectStorage } from '@/app/interfaces/storage';

const { Title, Paragraph, Text } = Typography;

const getDisplayName = (path: string) => {
    if (!path) return "Download File";
    const filename = path.split("/").pop() || "Download File";
    
    // Pattern: UUID (36 chars) + "_" + name
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_/;
    if (uuidPattern.test(filename)) {
       return filename.replace(uuidPattern, "");
    }
    return filename;
};

interface ProjectDetailModalProps {
    open: boolean;
    onCancel: () => void;
    project: ProjectStorage | null;
    onDownload: () => void;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ open, onCancel, project, onDownload }) => {
    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: '#e6f7ff', padding: 8, borderRadius: '50%', display: 'flex' }}>
                        <BookOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                    </div>
                    <span>รายละเอียดโครงงาน</span>
                </div>
            }
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="close" onClick={onCancel}>
                    ปิด
                </Button>,
            ]}
            centered
            width={800}
        >
            {project && (
                <div style={{ marginTop: 20 }}>
                    <Title level={3} style={{ marginBottom: 24 }}>
                        {project.title}
                    </Title>

                    <Descriptions bordered column={1} size="middle">
                        <Descriptions.Item label="ปีการศึกษา">
                            <Tag color="blue" icon={<CalendarOutlined />}>{project.year}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="อาจารย์ที่ปรึกษา">
                            <Space>
                                <UserOutlined />
                                <Text>{project.teacher?.firstname} {project.teacher?.lastname}</Text>
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="บทคัดย่อ">
                            <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {project.abstract}
                            </Paragraph>
                        </Descriptions.Item>
                        <Descriptions.Item label="คำสำคัญ">
                            <Space wrap>
                                {project.keywords.split(',').map((keyword) => (
                                    <Tag
                                        key={`${project.ID}-${keyword.trim()}`}
                                        color="geekblue"
                                    >
                                        {keyword.trim()}
                                    </Tag>
                                ))}

                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="ไฟล์รายงาน">
                            <Space>
                                <FileTextOutlined style={{ color: '#52c41a' }} />
                                <Text>{getDisplayName(project.file_path)}</Text>
                                <a
                                    href={(project.file_path.startsWith("http://") || project.file_path.startsWith("https://")) 
                                        ? project.file_path 
                                        : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/team07api"}/${project.file_path.replace(/^\.\//, '').startsWith('uploads') ? project.file_path.replace(/^\.\//, '') : `uploads/projects/${project.file_path.replace(/^\.\//, '')}`}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#1890ff', marginLeft: 8 }}
                                >
                                    <Space>
                                        <DownloadOutlined />
                                        <span>ดาวน์โหลด</span>
                                    </Space>
                                </a>
                            </Space>
                        </Descriptions.Item>
                    </Descriptions>

                    <div style={{
                        marginTop: 24,
                        padding: 16,
                        background: '#f0f5ff',
                        borderRadius: 8,
                        border: '1px solid #adc6ff'
                    }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            💡 <strong>หมายเหตุ:</strong> โครงงานในคลังนี้เป็นผลงานที่ผ่านการอนุมัติและทำเสร็จสมบูรณ์แล้ว
                            สามารถใช้เป็นแนวทางในการศึกษาและพัฒนาโครงงานของคุณได้
                        </Text>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ProjectDetailModal;
