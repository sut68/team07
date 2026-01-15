import React from 'react';
import { Card, Button, Typography, Tag, Col } from 'antd';
import { CalendarOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { ProjectStorage } from '@/app/interfaces/storage';

const { Title, Paragraph, Text } = Typography;

interface ProjectCardProps {
    project: ProjectStorage;
    onClick: (project: ProjectStorage) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
    return (
        <Col xs={24} md={12} lg={8}>
            <Card
                hoverable
                onClick={() => onClick(project)}
                style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid #f0f0f0',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                }}
                styles={{ body: { padding: 24, flex: 1 } }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                <div style={{ marginBottom: 12 }}>
                    <Tag color="blue" icon={<CalendarOutlined />}>{project.year}</Tag>
                </div>

                <Title level={4} style={{ margin: '0 0 12px 0' }} ellipsis={{ rows: 2 }}>
                    {project.title}
                </Title>

                <Paragraph
                    ellipsis={{ rows: 3 }}
                    type="secondary"
                    style={{ marginBottom: 12, minHeight: 60 }}
                >
                    {project.abstract}
                </Paragraph>

                <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <UserOutlined /> อาจารย์ที่ปรึกษา: {project.teacher?.firstname} {project.teacher?.lastname}
                    </Text>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {project.keywords.split(',').slice(0, 3).map((keyword, idx) => (
                        <Tag
                            key={`${project.ID}-keyword-${idx}`}
                            color="geekblue"
                            style={{ fontSize: 11 }}
                        >
                            {keyword.trim()}
                        </Tag>
                    ))}
                    {project.keywords.split(',').length > 3 && (
                        <Tag
                            key={`${project.ID}-more`}
                            style={{ fontSize: 11 }}
                        >
                            +{project.keywords.split(',').length - 3}
                        </Tag>
                    )}
                </div>

                <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Button type="link" size="small" icon={<FileTextOutlined />}>
                        ดูรายละเอียด
                    </Button>
                </div>
            </Card>
        </Col>
    );
};

export default ProjectCard;
