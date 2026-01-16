"use client";
import { useState, useEffect } from 'react';
import { Table, Button, Typography, Modal, Form, Input, Tag, Space, ConfigProvider, Select, Descriptions, Upload, Radio, Row, Col, Badge, Tooltip } from 'antd';
import type { UploadFile } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, BookOutlined, FileTextOutlined, UserOutlined, CalendarOutlined, DownloadOutlined, EyeOutlined, SearchOutlined, UploadOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { ProjectStorage, TAG_CATEGORIES } from '@/app/interfaces/storage';
import { getProjects, createProject, updateProject, deleteProject, getPendingProjects, approveProject } from '@/app/services/storage';
import type { ColumnsType } from 'antd/es/table';
import '../../../style/evaluation.css';
import '../../../style/storage.css';
import Swal from 'sweetalert2';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Search } = Input;

export default function TeacherStoragePage() {
    const [activeTab, setActiveTab] = useState<'repository' | 'requests'>('repository');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectStorage | null>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectStorage | null>(null);
    const [form] = Form.useForm();

    const [projects, setProjects] = useState<ProjectStorage[]>([]);
    const [pendingProjects, setPendingProjects] = useState<any[]>([]);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<ProjectStorage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

    // Transform TAG_CATEGORIES for Select options
    const tagOptions = TAG_CATEGORIES.map(category => ({
        label: category.title,
        options: category.options.map(opt => ({ label: opt.label, value: opt.value }))
    }));

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await getProjects({ year: selectedYear, keyword: searchKeyword, role: 'Teacher' });
            setProjects(res.data);
            setFilteredProjects(res.data);
        } catch (error) {
            console.error("Failed to fetch projects", error);
            Swal.fire({
                title: 'ผิดพลาด',
                text: 'ไม่สามารถโหลดข้อมูลได้',
                icon: 'error',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#8A011D'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await getPendingProjects();
            setPendingProjects(res.data);
        } catch (error) {
            console.error("Failed to fetch pending projects", error);
            Swal.fire({
                title: 'ผิดพลาด',
                text: 'ไม่สามารถโหลดข้อมูลคำขออนุมัติได้',
                icon: 'error',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#8A011D'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'repository') {
            fetchProjects();
            fetchPending();
        } else {
            fetchPending();
        }
    }, [selectedYear, searchKeyword, activeTab]);

    const handleOpenModal = (project?: ProjectStorage) => {
        if (project) {
            setEditingProject(project);
            form.setFieldsValue({
                title: project.title,
                abstract: project.abstract,
                keywords: project.keywords ? project.keywords.split(',').map(k => k.trim()) : [],
                status: project.status || 'Public',
                year: project.year,
            });
            if (project.file_path) {
                const filePath = project.file_path.replace(/^\.\//, '');
                const fullPath = filePath.startsWith('uploads') ? filePath : `uploads/projects/${filePath}`;
                setFileList([{
                    uid: '-1',
                    name: project.file_path.split('/').pop() || 'file.pdf',
                    status: 'done',
                    url: `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/team07api"}/${fullPath}`,
                }]);
            } else {
                setFileList([]);
            }
        } else {
            setEditingProject(null);
            form.resetFields();
            setFileList([]);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProject(null);
        form.resetFields();
        setFileList([]);
    };

    const handleSubmit = async (values: any) => {
        try {
            // Validate file upload
            if (!editingProject && fileList.length === 0) {
                Swal.fire({
                    title: 'แจ้งเตือน',
                    text: 'กรุณาอัปโหลดไฟล์รายงาน',
                    icon: 'warning',
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#8A011D'
                });
                return;
            }

            const formData = new FormData();
            formData.append('title', values.title);
            formData.append('abstract', values.abstract);

            // Join keywords array into string
            let keywordsString = '';
            if (Array.isArray(values.keywords)) {
                keywordsString = values.keywords.join(',');
            } else if (typeof values.keywords === 'string') {
                keywordsString = values.keywords;
            }
            formData.append('keywords', keywordsString);

            formData.append('status', values.status);

            formData.append('year', values.year.toString());

            // Append file if exists
            if (fileList.length > 0 && fileList[0].originFileObj) {
                formData.append('file', fileList[0].originFileObj);
            }

            if (editingProject) {
                const projectId = editingProject.ID || editingProject.id;
                if (projectId) {
                    await updateProject(projectId, formData, 'Teacher');
                    Swal.fire({
                        title: 'สำเร็จ',
                        text: 'แก้ไขโครงงานเรียบร้อยแล้ว',
                        icon: 'success',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#8A011D'
                    });
                }
            } else {
                await createProject(formData, 'Teacher');
                Swal.fire({
                    title: 'สำเร็จ',
                    text: 'เพิ่มโครงงานเรียบร้อยแล้ว',
                    icon: 'success',
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#8A011D'
                });
            }
            handleCloseModal();
            fetchProjects();
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
                icon: 'error',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#8A011D'
            });
        }
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: 'ยืนยันการลบ',
            text: 'คุณแน่ใจหรือไม่ที่จะลบโครงงานนี้?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteProject(id, 'Teacher');
                    Swal.fire({
                        title: 'สำเร็จ',
                        text: 'ลบโครงงานเรียบร้อยแล้ว',
                        icon: 'success',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#8A011D'
                    });
                    fetchProjects();
                } catch (error) {
                    Swal.fire({
                        title: 'เกิดข้อผิดพลาด',
                        text: 'ลบโครงงานไม่สำเร็จ',
                        icon: 'error',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#8A011D'
                    });
                }
            }
        });
    };

    const handleApprove = (id: number) => {
        Swal.fire({
            title: 'อนุมัติเผยแพร่โครงงาน',
            text: 'คุณต้องการอนุมัติโครงงานนี้เข้าสู่คลังโครงงานสาขาหรือไม่? (ข้อมูลจะถูกคัดลอกไปยังคลัง)',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#52c41a',
            cancelButtonColor: '#d33',
            confirmButtonText: 'อนุมัติ',
            cancelButtonText: 'ยกเลิก'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await approveProject(id);
                    Swal.fire({
                        title: 'สำเร็จ',
                        text: 'อนุมัติโครงงานเรียบร้อยแล้ว',
                        icon: 'success',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#8A011D'
                    });
                    fetchPending(); // Refresh pending list
                    fetchProjects(); // Refresh repository list
                } catch (error) {
                    Swal.fire({
                        title: 'เกิดข้อผิดพลาด',
                        text: 'เกิดข้อผิดพลาดในการอนุมัติ',
                        icon: 'error',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#8A011D'
                    });
                }
            }
        });
    }

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

    // Generate year options (Current Year + 1 down to 2543)
    const currentYear = new Date().getFullYear() + 543;
    const yearOptions = [];
    for (let i = currentYear + 1; i >= 2543; i--) {
        yearOptions.push({
            label: i.toString(),
            value: i
        });
    }

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
                    <Text>{teacher?.firstname} {teacher?.lastname}</Text>
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
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            align: 'center',
            render: (status: string) => (
                <Tag color={status === 'Public' ? 'success' : 'default'}>
                    {status === 'Public' ? 'เผยแพร่' : 'ซ่อน'}
                </Tag>
            ),
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
                    />
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenModal(record)}
                        size="small"
                        style={{ color: '#faad14' }}
                    />
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.ID || record.id!)}
                        size="small"
                    />
                </Space>
            ),
        },
    ];

    const pendingColumns: ColumnsType<any> = [
        {
            title: 'วันที่ส่ง',
            dataIndex: 'CreatedAt',
            key: 'CreatedAt',
            width: 150,
            render: (date: string) => <Text>{new Date(date).toLocaleDateString('th-TH')}</Text>,
        },
        {
            title: 'ปีการศึกษา',
            dataIndex: 'year',
            key: 'year',
            width: 100,
            align: 'center',
            render: (year: number) => <Tag color="blue">{year}</Tag>,
        },
        {
            title: 'ชื่อโครงงาน',
            dataIndex: 'title',
            key: 'title',
            width: 250,
            ellipsis: true,
            render: (title: string) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{title}</Text>
                    {/* Add Group ID or info here if available */}
                </Space>
            ),
        },
        {
            title: 'บทคัดย่อ',
            dataIndex: 'abstract',
            key: 'abstract',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'สถานะ',
            key: 'status',
            width: 150,
            align: 'center',
            render: () => <Tag color="orange" icon={<ClockCircleOutlined />}>รออนุมัติ</Tag>,
        },
        {
            title: 'การดำเนินการ',
            key: 'action',
            width: 150,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="default"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(record)}
                    />
                    <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleApprove(record.ID)}
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                    >
                        อนุมัติ
                    </Button>
                </Space>
            ),
        }
    ];

    return (
        <div style={{ padding: '0 24px', maxWidth: 1600, margin: '0 auto' }}>
            <div className="page-title-box">
                <h1>คลังโครงงาน</h1>
                <p>จัดการและเผยแพร่โครงงานที่ทำเสร็จแล้วของนักศึกษา</p>
            </div>

            <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 16, flex: 1, minWidth: 300, alignItems: 'center' }}>
                    {activeTab === 'repository' ? (
                        <>
                            <ConfigProvider theme={{ token: { colorPrimary: '#8A011D' } }}>
                                <Search
                                    placeholder="ค้นหาโครงงาน (ชื่อ, บทคัดย่อ, คำสำคัญ)"
                                    allowClear
                                    enterButton={<SearchOutlined />}
                                    size="large"
                                    onSearch={handleSearch}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    style={{ flex: 4, minWidth: 300, maxWidth: 500 }}
                                />
                            </ConfigProvider>
                            <Select
                                placeholder="ปีการศึกษา"
                                allowClear
                                size="large"
                                style={{ width: 200 }}
                                options={[{ label: 'ทั้งหมด', value: undefined }, ...yearOptions]}
                                onChange={handleYearChange}
                                value={selectedYear}
                            />
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text strong style={{ fontSize: 16 }}>รายการคำขออนุมัติ ({pendingProjects.length})</Text>
                        </div>
                    )}
                </div>

                <Space size="middle">
                    <Badge count={pendingProjects.length}>
                        <Button
                            size="large"
                            icon={<ClockCircleOutlined />}
                            onClick={() => setActiveTab(activeTab === 'repository' ? 'requests' : 'repository')}
                            className={activeTab === 'requests' ? 'ant-btn-primary' : ''}
                            style={activeTab === 'requests' ? { background: '#f59e0b', borderColor: '#f59e0b' } : {}}
                        >
                            คำขออนุมัติ
                        </Button>
                    </Badge>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={() => handleOpenModal()}
                        style={{
                            background: '#8A011D',
                            borderColor: '#852d3fff',
                            display: activeTab === 'requests' ? 'none' : 'inline-flex' // Hide when in requests? Or Keep? Let's hide to focus.
                        }}
                    >
                        <b>เพิ่มโครงงาน</b>
                    </Button>
                </Space>
            </div>

            {/* Tables */}
            {activeTab === 'repository' && (
                <Table
                    className="full-height-table"
                    columns={columns}
                    dataSource={filteredProjects}
                    rowKey={(record) => record.ID || record.id || 'key'}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `ทั้งหมด ${total} โครงงาน`,
                        pageSizeOptions: ['10', '20', '50'],
                    }}
                    scroll={{ x: 1200, y: 'calc(100vh - 450px)' }}
                    style={{
                        background: 'white',
                        borderRadius: 12,
                    }}
                    locale={{
                        emptyText: 'ยังไม่มีโครงงานในคลัง',
                    }}
                />
            )}

            {activeTab === 'requests' && (
                <Table
                    className="full-height-table"
                    columns={pendingColumns}
                    dataSource={pendingProjects}
                    rowKey="ID"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    style={{
                        background: 'white',
                        borderRadius: 12,
                    }}
                    locale={{
                        emptyText: 'ไม่มีรายการคำขออนุมัติ',
                    }}
                />
            )}

            {/* Add/Edit Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ background: '#fff7e6', padding: 8, borderRadius: '50%', display: 'flex' }}>
                            <BookOutlined style={{ color: '#f76212', fontSize: 18 }} />
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
                        <Input placeholder="เช่น ระบบจัดการโครงงานนักศึกษา" />
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
                        label="คำสำคัญ / เทคโนโลยี"
                        rules={[{ required: true, message: 'กรุณาเลือกคำสำคัญ' }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="เลือกเทคโนโลยีหรือคำค้นหา"
                            style={{ width: '100%' }}
                            options={tagOptions}
                            optionFilterProp="label"
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="year"
                                label="ปีการศึกษา"
                                rules={[{ required: true, message: 'กรุณาเลือกปีการศึกษา' }]}
                            >
                                <Select
                                    placeholder="เลือกปีการศึกษา"
                                    options={yearOptions}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="status"
                                label="สถานะการแสดงผล"
                                initialValue="Public"
                            >
                                <Radio.Group buttonStyle="solid">
                                    <Radio.Button value="Public">เผยแพร่</Radio.Button>
                                    <Radio.Button value="Hidden">ซ่อน</Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="ไฟล์รายงานโครงงาน"
                        required={!editingProject}
                        extra="รองรับไฟล์ PDF เท่านั้น (ขนาดไม่เกิน 10MB)"
                    >
                        <Upload
                            fileList={fileList}
                            onChange={({ fileList }) => setFileList(fileList)}
                            beforeUpload={(file) => {
                                const isPDF = file.type === 'application/pdf';
                                if (!isPDF) {
                                    Swal.fire({
                                        title: 'แจ้งเตือน',
                                        text: 'กรุณาอัปโหลดไฟล์ PDF เท่านั้น',
                                        icon: 'warning',
                                        confirmButtonText: 'ตกลง',
                                        confirmButtonColor: '#8A011D'
                                    });
                                    return Upload.LIST_IGNORE;
                                }
                                const isLt10M = file.size / 1024 / 1024 < 10;
                                if (!isLt10M) {
                                    Swal.fire({
                                        title: 'แจ้งเตือน',
                                        text: 'ไฟล์ต้องมีขนาดไม่เกิน 10MB',
                                        icon: 'warning',
                                        confirmButtonText: 'ตกลง',
                                        confirmButtonColor: '#8A011D'
                                    });
                                    return Upload.LIST_IGNORE;
                                }
                                return false; // Prevent auto upload
                            }}
                            maxCount={1}
                            accept=".pdf"
                        >
                            <Button icon={<UploadOutlined />}>
                                เลือกไฟล์ PDF
                            </Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={handleCloseModal} size="large">ยกเลิก</Button>
                            <Button type="primary" htmlType="submit" size="large" style={{ background: '#8A011D', borderColor: '#8A011D' }}>
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
                                    <Text>{selectedProject.teacher?.firstname} {selectedProject.teacher?.lastname}</Text>
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
                                {selectedProject.file_path ? (
                                    <Space>
                                        <FileTextOutlined />
                                        <a
                                            href={(selectedProject.file_path.startsWith("http") || selectedProject.file_path.startsWith("https"))
                                                ? selectedProject.file_path
                                                : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/team07api"}/${selectedProject.file_path.replace(/^\.\//, '').startsWith('uploads') ? selectedProject.file_path.replace(/^\.\//, '') : `uploads/projects/${selectedProject.file_path.replace(/^\.\//, '')}`}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#1890ff' }}
                                        >
                                            {selectedProject.file_path.split('/').pop()}
                                        </a>
                                        <Button
                                            type="primary"
                                            size="small"
                                            icon={<DownloadOutlined />}
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                const filePath = selectedProject.file_path.replace(/^\.\//, '');
                                                const fullPath = filePath.startsWith('uploads') ? filePath : `uploads/projects/${filePath}`;
                                                link.href = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/team07api"}/${fullPath}`;
                                                link.download = selectedProject.file_path.split('/').pop() || 'document';
                                                link.target = '_blank';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                            style={{ marginLeft: 8 }}
                                        >
                                            ดาวน์โหลด
                                        </Button>
                                    </Space>
                                ) : (
                                    <Text type="secondary">-</Text>
                                )}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>
        </div>
    );
}