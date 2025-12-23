"use client";
import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, Modal, Form, Input, Tag, Space, message, ConfigProvider, Select, Descriptions } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, BookOutlined, FileTextOutlined, UserOutlined, CalendarOutlined, DownloadOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { ProjectStorage } from '@/app/interfaces/Repository';
import { getProjects, createProject, updateProject, deleteProject } from '@/app/services/repository';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Search } = Input;

export default function TeacherStoragePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectStorage | null>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectStorage | null>(null);
    const [form] = Form.useForm();

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

    const handleOpenModal = (project?: ProjectStorage) => {
        if (project) {
            setEditingProject(project);
            form.setFieldsValue({
                title: project.title,
                abstract: project.abstract,
                keywords: project.keywords,
                year: project.year,
            });
        } else {
            setEditingProject(null);
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProject(null);
        form.resetFields();
    };

    const handleSubmit = async (values: any) => {
        try {
            const formData = new FormData();
            formData.append('title', values.title);
            formData.append('abstract', values.abstract);
            formData.append('keywords', values.keywords);
            formData.append('year', values.year.toString());
            formData.append('teacher_id', '1'); // Mock teacher ID

            if (editingProject) {
                await updateProject(editingProject.ID, formData);
                message.success('แก้ไขโครงงานเรียบร้อยแล้ว');
            } else {
                await createProject(formData);
                message.success('เพิ่มโครงงานเรียบร้อยแล้ว');
            }
            handleCloseModal();
            fetchProjects();
        } catch (error) {
            console.error(error);
            message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'ยืนยันการลบ',
            content: 'คุณแน่ใจหรือไม่ที่จะลบโครงงานนี้?',
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    await deleteProject(id);
                    message.success('ลบโครงงานเรียบร้อยแล้ว');
                    fetchProjects();
                } catch (error) {
                    message.error('ลบโครงงานไม่สำเร็จ');
                }
            }
        });
    };

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

    // Generate year options (2000-2025)
    const yearOptions = Array.from({ length: 26 }, (_, i) => ({
        label: (2000 + i).toString(),
        value: 2000 + i
    })).reverse();

    // Table columns
    const columns: ColumnsType<ProjectStorage> = [
        {
            title: 'ปีการศึกษา',
            dataIndex: 'year',
            key: 'year',
            width: 120,
            align: 'center',
            render: (year: number) => <Tag color="blue" icon={<CalendarOutlined />}>{year}</Tag>,
            sorter: (a, b) => a.year - b.year,
        },
        {
            title: 'ชื่อโครงงาน',
            dataIndex: 'title',
            key: 'title',
            width: 300,
            ellipsis: true,
            render: (title: string) => <Text strong>{title}</Text>,
        },
        {
            title: 'บทคัดย่อ',
            dataIndex: 'abstract',
            key: 'abstract',
            width: 250,
            ellipsis: true,
            render: (abstract: string) => (
                <Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>
                    {abstract}
                </Paragraph>
            ),
        },
        {
            title: 'อาจารย์ที่ปรึกษา',
            dataIndex: 'teacher',
            key: 'teacher',
            width: 180,
            render: (teacher: any) => (
                <Space>
                    <UserOutlined />
                    <Text>{teacher?.first_name} {teacher?.last_name}</Text>
                </Space>
            ),
        },
        {
            title: 'คำสำคัญ',
            dataIndex: 'keywords',
            key: 'keywords',
            width: 200,
            ellipsis: true,
            render: (keywords: string) => {
                const keywordList = keywords.split(',').slice(0, 2);
                const remaining = keywords.split(',').length - 2;
                return (
                    <Space wrap>
                        {keywordList.map((keyword, idx) => (
                            <Tag key={idx} style={{ fontSize: 11 }}>
                                {keyword.trim()}
                            </Tag>
                        ))}
                        {remaining > 0 && <Tag style={{ fontSize: 11 }}>+{remaining}</Tag>}
                    </Space>
                );
            },
        },
        {
            title: 'การจัดการ',
            key: 'action',
            width: 150,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(record)}
                        size="small"
                    >
                        ดู
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenModal(record)}
                        size="small"
                        style={{ color: '#faad14' }}
                    >
                        แก้ไข
                    </Button>
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.ID)}
                        size="small"
                    >
                        ลบ
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#afaeaeff  ',
                    fontFamily: "'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                },
            }}
        >
            <div style={{ padding: '0 24px', maxWidth: 1600, margin: '0 auto' }}>
                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
                        <BookOutlined style={{ marginRight: 10, color: '#8A011D' }} />
                        คลังโครงงาน
                    </Title>
                    <Text type="secondary">จัดการและเผยแพร่โครงงานที่ทำเสร็จแล้วของนักศึกษา</Text>
                </div>

                {/* Search and Filter Bar */}
                <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 16, flex: 1, minWidth: 300 }}>
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
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={() => handleOpenModal()}
                        style={{
                            background: '#8A011D',
                            borderColor: '#852d3fff',
                        }}
                    >
                        เพิ่มโครงงาน
                    </Button>
                </div>

                {/* Projects Table */}
                <Table
                    columns={columns}
                    dataSource={filteredProjects}
                    rowKey="ID"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `ทั้งหมด ${total} โครงงาน`,
                        pageSizeOptions: ['10', '20', '50'],
                    }}
                    scroll={{ x: 1200 }}
                    style={{
                        background: 'white',
                        borderRadius: 12,
                        overflow: 'hidden',
                    }}
                    locale={{
                        emptyText: 'ยังไม่มีโครงงานในคลัง',
                    }}
                />

                {/* Add/Edit Modal */}
                <Modal
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ background: '#e6f7ff', padding: 8, borderRadius: '50%', display: 'flex' }}>
                                <BookOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                            </div>
                            <span>{editingProject ? 'แก้ไขโครงงาน' : 'เพิ่มโครงงานใหม่'}</span>
                        </div>
                    }
                    open={isModalOpen}
                    onCancel={handleCloseModal}
                    footer={null}
                    centered
                    width={700}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        style={{ marginTop: 24 }}
                    >
                        <Form.Item
                            name="title"
                            label="ชื่อโครงงาน"
                            rules={[{ required: true, message: 'กรุณากรอกชื่อโครงงาน' }]}
                        >
                            <Input placeholder="เช่น ระบบจัดการโครงงานนักศึกษา" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="abstract"
                            label="บทคัดย่อ"
                            rules={[{ required: true, message: 'กรุณากรอกบทคัดย่อ' }]}
                        >
                            <TextArea rows={4} placeholder="สรุปเนื้อหาและวัตถุประสงค์ของโครงงาน..." />
                        </Form.Item>

                        <Form.Item
                            name="keywords"
                            label="คำสำคัญ"
                            rules={[{ required: true, message: 'กรุณากรอกคำสำคัญ' }]}
                            extra="แยกคำสำคัญด้วยเครื่องหมายจุลภาค (,)"
                        >
                            <Input placeholder="เช่น web application, project management, student" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="year"
                            label="ปีการศึกษา"
                            rules={[{ required: true, message: 'กรุณาเลือกปีการศึกษา' }]}
                        >
                            <Select
                                placeholder="เลือกปีการศึกษา"
                                size="large"
                                options={yearOptions}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                            <Space>
                                <Button onClick={handleCloseModal} size="large">ยกเลิก</Button>
                                <Button type="primary" htmlType="submit" size="large">
                                    {editingProject ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Detail Modal */}
                <Modal
                    title="รายละเอียดโครงงาน"
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
                            onClick={() => message.info('กำลังดาวน์โหลดไฟล์...')}
                        >
                            ดาวน์โหลดรายงาน
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
                                        <FileTextOutlined />
                                        <Text>{selectedProject.file_path}</Text>
                                    </Space>
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    )}
                </Modal>
            </div>
        </ConfigProvider>
    );
}