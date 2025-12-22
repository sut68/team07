"use client";
import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Modal, Tag, Space, Empty, message, ConfigProvider, Select, Descriptions } from 'antd';
import { BookOutlined, FileTextOutlined, UserOutlined, CalendarOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { ProjectStorage } from '@/app/interfaces/Repository';
import { getProjects } from '@/app/services/repository';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
import { Input } from 'antd';

export default function StudentStoragePage() {
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectStorage | null>(null);

    const [projects, setProjects] = useState<ProjectStorage[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<ProjectStorage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await getProjects({ year: selectedYear, keyword: searchKeyword });
            setProjects(res.data);
            setFilteredProjects(res.data);
        } catch (error) {
            console.error("Failed to fetch projects", error);
            message.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [selectedYear, searchKeyword]);

    const handleViewDetail = (project: ProjectStorage) => {
        setSelectedProject(project);
        setIsDetailModalOpen(true);
    };

    const handleSearch = (value: string) => {
        setSearchKeyword(value);
    };

    const handleYearChange = (value: number | undefined) => {
        setSelectedYear(value);
    };

    const handleDownload = () => {
        message.success('กำลังดาวน์โหลดไฟล์รายงาน...');
        // In real implementation, this would trigger actual file download
    };

    // Generate year options (2000-2025)
    const yearOptions = Array.from({ length: 26 }, (_, i) => ({
        label: (2000 + i).toString(),
        value: 2000 + i
    })).reverse();

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#F06522',
                    fontFamily: "'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                },
            }}
        >
            <div style={{ padding: '0 24px', maxWidth: 1400, margin: '0 auto' }}>
                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
                        <BookOutlined style={{ marginRight: 10, color: '#F06522' }} />
                        คลังโครงงาน
                    </Title>
                    <Text type="secondary">ค้นหาและศึกษาโครงงานที่ผ่านมาเพื่อใช้เป็นแนวทางในการทำโครงงาน</Text>
                </div>

                {/* Search and Filter Bar */}
                <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <Search
                        placeholder="ค้นหาโครงงาน (ชื่อ, บทคัดย่อ, คำสำคัญ)"
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={handleSearch}
                        onChange={(e) => !e.target.value && setSearchKeyword('')}
                        style={{ flex: 1, minWidth: 300, maxWidth: 500 }}
                    />
                    <Select
                        placeholder="ปีการศึกษา"
                        allowClear
                        size="large"
                        style={{ width: 200 }}
                        options={[{ label: 'ทั้งหมด', value: undefined }, ...yearOptions]}
                        onChange={handleYearChange}
                        value={selectedYear}
                    />
                </div>


                {/* Projects Grid */}
                {filteredProjects.length === 0 && !loading ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="ไม่พบโครงงานที่ตรงกับเงื่อนไขการค้นหา"
                    />
                ) : (
                    <Row gutter={[24, 24]}>
                        {filteredProjects.map(project => (
                            <Col xs={24} md={12} lg={8} key={project.ID}>
                                <Card
                                    hoverable
                                    onClick={() => handleViewDetail(project)}
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
                                    bodyStyle={{ padding: 24, flex: 1 }}
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
                                            <UserOutlined /> อาจารย์ที่ปรึกษา: {project.teacher?.first_name} {project.teacher?.last_name}
                                        </Text>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {project.keywords.split(',').slice(0, 3).map((keyword, idx) => (
                                            <Tag key={idx} color="geekblue" style={{ fontSize: 11 }}>
                                                {keyword.trim()}
                                            </Tag>
                                        ))}
                                        {project.keywords.split(',').length > 3 && (
                                            <Tag style={{ fontSize: 11 }}>+{project.keywords.split(',').length - 3}</Tag>
                                        )}
                                    </div>

                                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                                        <Button type="link" size="small" icon={<FileTextOutlined />}>
                                            ดูรายละเอียด
                                        </Button>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}

                {/* Detail Modal */}
                <Modal
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ background: '#e6f7ff', padding: 8, borderRadius: '50%', display: 'flex' }}>
                                <BookOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                            </div>
                            <span>รายละเอียดโครงงาน</span>
                        </div>
                    }
                    open={isDetailModalOpen}
                    onCancel={() => setIsDetailModalOpen(false)}
                    footer={[
                        <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
                            ปิด
                        </Button>,
                        <Button
                            key="download"
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={handleDownload}
                            style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        >
                            ดาวน์โหลดรายงานฉบับสมบูรณ์
                        </Button>
                    ]}
                    centered
                    width={800}
                >
                    {selectedProject && (
                        <div style={{ marginTop: 20 }}>
                            <Title level={3} style={{ marginBottom: 24 }}>
                                {selectedProject.title}
                            </Title>

                            <Descriptions bordered column={1} size="middle">
                                <Descriptions.Item label="ปีการศึกษา">
                                    <Tag color="blue" icon={<CalendarOutlined />}>{selectedProject.year}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="อาจารย์ที่ปรึกษา">
                                    <Space>
                                        <UserOutlined />
                                        <Text>{selectedProject.teacher?.first_name} {selectedProject.teacher?.last_name}</Text>
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="บทคัดย่อ">
                                    <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                        {selectedProject.abstract}
                                    </Paragraph>
                                </Descriptions.Item>
                                <Descriptions.Item label="คำสำคัญ">
                                    <Space wrap>
                                        {selectedProject.keywords.split(',').map((keyword, idx) => (
                                            <Tag key={idx} color="geekblue">{keyword.trim()}</Tag>
                                        ))}
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="ไฟล์รายงาน">
                                    <Space>
                                        <FileTextOutlined style={{ color: '#52c41a' }} />
                                        <Text>{selectedProject.file_path}</Text>
                                        <Button
                                            type="link"
                                            size="small"
                                            icon={<DownloadOutlined />}
                                            onClick={handleDownload}
                                        >
                                            ดาวน์โหลด
                                        </Button>
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
            </div>
        </ConfigProvider>
    );
}