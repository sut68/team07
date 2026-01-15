"use client";
import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Modal, Form, Input, Tag, Space, message, Upload, Tooltip, Row, Col } from 'antd';
import { ProjectOutlined, SendOutlined, FileTextOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, UploadOutlined, PlusOutlined, BookOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Topic, TopicApproval } from '@/app/interfaces/Topic';
import { getTopics, createTopic, updateTopic, selectTopic, cancelSelection, getStudentTopic } from '@/app/services/topic';
import { GetMyGroup } from '@/app/services/group';
import { GetMe } from '@/app/services/login';
import { CreateProject, GetMyProject, UpdateProject } from '@/app/services/project';
import CategoryModal from '@/app/components/storage/CategoryModal';
import '../../../style/topic.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function StudentTopicPage() {
    const [form] = Form.useForm();
    const [projectForm] = Form.useForm();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [studentID, setStudentID] = useState<number | null>(null);
    const [groupID, setGroupID] = useState<number | null>(null);
    const [advisorID, setAdvisorID] = useState<number | null>(null);
    const [groupYear, setGroupYear] = useState<number | null>(null);

    // Data States
    const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
    const [myTopic, setMyTopic] = useState<Topic | null>(null);
    const [myProject, setMyProject] = useState<any>(null);
    const [groupStatus, setGroupStatus] = useState<string>('');
    const [isLeader, setIsLeader] = useState(false);

    // Modal States
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
    const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
    const [isProjectInfoModalOpen, setIsProjectInfoModalOpen] = useState(false);
    const [isTopicDetailModalOpen, setIsTopicDetailModalOpen] = useState(false);
    const [isProjectDetailModalOpen, setIsProjectDetailModalOpen] = useState(false);

    // Category Selection State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);


    const fetchData = async () => {
        setLoading(true);
        try {
            // Get Current User (Student)
            let currentStudentID = studentID;
            if (!currentStudentID) {
                const user = await GetMe();
                currentStudentID = user.id;
                setStudentID(user.id);
            }

            // 1. Fetch My Group First to get Advisor ID
            let currentAdvisorID = advisorID;
            let currentGroupID = groupID;
            try {
                const groupRes = await GetMyGroup();
                const groupData = groupRes.data.data;

                if (groupData) {
                    setGroupID(groupData.ID);
                    currentGroupID = groupData.ID;
                    if (groupData.teacher_id) {
                        setAdvisorID(groupData.teacher_id);
                        currentAdvisorID = groupData.teacher_id;
                    }
                    if (groupData.year) {
                        setGroupYear(groupData.year);
                    }
                    if (groupData.group_status) {
                        setGroupStatus(groupData.group_status);
                    }

                    // Check if current user is leader
                    if (groupData.group_members) {
                        const me = groupData.group_members.find((m: any) => m.student_id === currentStudentID);
                        setIsLeader(me?.leader || false);
                    }
                }
            } catch (err) {
                console.log("No group found or error fetching group", err);
            }

            const topicParams: any = { proposer_role: 'Teacher' };
            if (currentAdvisorID) {
                topicParams.teacher_id = currentAdvisorID;
                topicParams.filter = 'my_topics';
            }

            const teacherTopicsRes = await getTopics(topicParams);
            setAvailableTopics(teacherTopicsRes.data || []);

            // 3. Fetch My Proposed Topic / Selection
            if (currentGroupID) {
                const myTopicRes = await getStudentTopic({ group_id: currentGroupID });
                if (myTopicRes.data) {
                    setMyTopic(myTopicRes.data);
                } else {
                    setMyTopic(null);
                }
            } else {
                setMyTopic(null);
            }

            // 4. Fetch My Project Data
            try {
                console.log('Fetching project data...');
                const projectRes = await GetMyProject();
                console.log('Project response:', projectRes);

                if (projectRes?.data?.data) {
                    console.log('Project data found:', projectRes.data.data);
                    setMyProject(projectRes.data.data);
                } else {
                    console.log('No project data in response');
                    setMyProject(null);
                }
            } catch (err: any) {
                console.log("Project fetch error:", err);
                console.log("Error response:", err?.response?.data);
                // 404 หมายความว่ายังไม่มี project - ไม่ใช่ error จริงๆ
                if (err?.response?.status === 404) {
                    console.log('No project found (404) - this is normal if project not created yet');
                    setMyProject(null);
                } else {
                    console.error("Unexpected error fetching project:", err);
                    setMyProject(null);
                }
            }

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSelectTopic = (topic: Topic) => {
        Modal.confirm({
            title: 'ยืนยันการเลือกหัวข้อ',
            content: `คุณต้องการเลือกหัวข้อ "${topic.title}" ใช่หรือไม่?`,
            okText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                setLoading(true);
                try {
                    if (groupID) {
                        await selectTopic(topic.ID, { group_project_id: groupID });
                        message.success('ส่งคำขอเลือกหัวข้อเรียบร้อยแล้ว');
                        fetchData();
                        setIsSelectModalOpen(false);
                    } else {
                        message.error('ไม่พบข้อมูลกลุ่มโครงงาน');
                    }
                } catch (error: any) {
                    console.error(error);
                    const errMsg = error?.response?.data?.error || 'เกิดข้อผิดพลาดในการเลือกหัวข้อ';
                    message.error(errMsg);
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleProposeSubmit = async (values: any) => {
        Modal.confirm({
            title: 'ยืนยันการเสนอหัวข้อ',
            content: 'คุณตรวจสอบรายละเอียดครบถ้วนแล้วใช่หรือไม่?',
            okText: 'ยืนยัน',
            cancelText: 'ตรวจสอบอีกครั้ง',
            onOk: async () => {
                setLoading(true);
                try {
                    const formData = new FormData();
                    formData.append('title', values.title);
                    formData.append('objective', values.objective);
                    formData.append('scope', values.scope);
                    formData.append('description', values.description || '');
                    formData.append('proposer_role', 'Student');

                    if (groupID) {
                        formData.append('group_project_id', groupID.toString());
                    }
                    if (advisorID) {
                        formData.append('teacher_id', advisorID.toString());
                    }

                    if (values.attachment && values.attachment.fileList && values.attachment.fileList.length > 0) {
                        formData.append('file_attachment', values.attachment.fileList[0].originFileObj);
                    }

                    await createTopic(formData);
                    message.success('เสนอหัวข้อโครงงานเรียบร้อยแล้ว');
                    fetchData();
                    setIsProposeModalOpen(false);
                    form.resetFields();
                } catch (error) {
                    console.error(error);
                    message.error('เกิดข้อผิดพลาดในการเสนอหัวข้อ');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleCancelProposal = () => {
        Modal.confirm({
            title: 'ยกเลิกคำขอ/หัวข้อ',
            content: 'คุณแน่ใจหรือไม่ที่จะยกเลิกหัวข้อนี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
            okText: 'ยกเลิกหัวข้อ',
            okType: 'danger',
            cancelText: 'ปิด',
            onOk: async () => {
                if (myTopic) {
                    try {
                        if (myTopic.proposer_role === 'Teacher' && groupID) {
                            await cancelSelection({ group_project_id: groupID });
                        } else {
                            const formData = new FormData();
                            formData.append('status', 'Closed');
                            formData.append('title', myTopic.title);
                            formData.append('objective', myTopic.objective);
                            formData.append('scope', myTopic.scope);
                            formData.append('description', myTopic.description);

                            await updateTopic(myTopic.ID, formData);
                        }

                        message.success('ยกเลิกหัวข้อเรียบร้อยแล้ว');
                        setMyTopic(null);
                        fetchData();
                    } catch (error) {
                        message.error('ไม่สามารถยกเลิกหัวข้อได้');
                    }
                }
                form.resetFields();
            }
        });
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'Pending':
                return { color: '#faad14', text: 'รอตรวจสอบ/อนุมัติ', icon: <ClockCircleOutlined /> };
            case 'Approved':
                return { color: '#52c41a', text: 'อนุมัติแล้ว', icon: <CheckCircleOutlined /> };
            case 'Rejected':
                return { color: '#ff4d4f', text: 'ไม่อนุมัติ/แก้ไข', icon: <CloseCircleOutlined /> };
            default:
                return { color: '#d9d9d9', text: 'N/A', icon: <ExclamationCircleOutlined /> };
        }
    };

    const handleTagToggle = (tag: string) => {
        const newTags = selectedKeywords.includes(tag)
            ? selectedKeywords.filter(t => t !== tag)
            : [...selectedKeywords, tag];
        setSelectedKeywords(newTags);
        projectForm.setFieldValue('keywords', newTags.join(','));
    };

    return (
        <div className="student-page">
            <div className="student-container animate-fade-in">

                <div className="page-title-box">
                    <h1>โครงงานของฉัน</h1>
                    <p>การจัดการหัวข้อและข้อมูลโครงงาน</p>
                </div>

                <div className="hub-grid">

                    {/* Card 1: หัวข้อโครงงาน */}
                    <div className="menu-card" onClick={() => {
                        if (myTopic) {
                            router.push('/student/topic/select?tab=status');
                        } else {
                            router.push('/student/topic/select');
                        }
                    }}>
                        <div className="menu-icon" style={{ background: myTopic ? '#f0f9ff' : '#fff1f2', color: myTopic ? '#0284c7' : '#9a0120' }}>
                            <BookOutlined />
                        </div>
                        <h2 className="menu-title">
                            {myTopic ? 'หัวข้อโครงงาน' : 'เลือก/เสนอหัวข้อโครงงาน'}
                        </h2>
                        <p className="menu-desc">
                            {myTopic ? (
                                <>
                                    {myTopic.title}
                                    <br />
                                    <Tag color={getStatusInfo(myTopic.status).color} style={{ marginTop: 8 }}>
                                        {getStatusInfo(myTopic.status).icon} {getStatusInfo(myTopic.status).text}
                                    </Tag>
                                </>
                            ) : (
                                'เลือกหัวข้อจากอาจารย์ หรือเสนอหัวข้อที่คุณสนใจ'
                            )}
                        </p>
                    </div>

                    {/* Card 2: กรอกข้อมูลโครงงาน */}
                    <Tooltip title={
                        myTopic?.status !== 'Approved'
                            ? 'กรุณารอหัวข้อได้รับการอนุมัติก่อน'
                            : (groupStatus !== 'Completed'
                                ? 'กรอกข้อมูลโครงงานที่สมบูรณ์หลังจากผ่านการประเมิน'
                                : (!isLeader && !myProject ? 'เฉพาะหัวหน้ากลุ่มเท่านั้นที่สามารถส่งข้อมูลโครงงานได้' : '')
                            )
                    }>
                        <div
                            className={`menu-card ${!(myTopic?.status === 'Approved' && groupStatus === 'Completed' && (isLeader || myProject)) ? 'disabled' : ''}`}
                            onClick={() => {
                                if (myTopic?.status === 'Approved' && groupStatus === 'Completed') {
                                    if (myProject) {
                                        setIsProjectDetailModalOpen(true);
                                    } else if (isLeader) {
                                        setIsProjectInfoModalOpen(true);
                                        setSelectedKeywords([]);
                                    }
                                }
                            }}
                            style={{
                                opacity: !(myTopic?.status === 'Approved' && groupStatus === 'Completed' && (isLeader || myProject)) ? 0.6 : 1,
                                cursor: !(myTopic?.status === 'Approved' && groupStatus === 'Completed' && (isLeader || myProject)) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <div className="menu-icon" style={{ background: myProject ? '#f0fdf4' : '#fff7ed', color: myProject ? '#16a34a' : '#ea580c' }}>
                                <FileTextOutlined />
                            </div>
                            <h2 className="menu-title">
                                {myProject ? 'ข้อมูลโครงงาน' : 'กรอกข้อมูลโครงงาน'}
                            </h2>
                            <p className="menu-desc">
                                {myProject ? (
                                    <>
                                        คลิกเพื่อดูรายละเอียด
                                        <br />
                                        <Tag color="success" style={{ marginTop: 8 }}>บันทึกแล้ว</Tag>
                                    </>
                                ) : (
                                    'บันทึกข้อมูลโครงงานที่เสร็จสมบูรณ์หลังจากผ่านการประเมิน'
                                )}
                            </p>
                        </div>
                    </Tooltip>

                </div>

                {/* Modal: Select Topic from Teacher */}
                <Modal
                    title="เลือกหัวข้อจากอาจารย์"
                    open={isSelectModalOpen}
                    onCancel={() => setIsSelectModalOpen(false)}
                    footer={null}
                    width={900}
                    centered
                >
                    <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">หัวข้อที่อาจารย์ที่ปรึกษาเปิดรับสมัคร</Text>
                    </div>

                    {availableTopics.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                            ไม่มีหัวข้อที่เปิดรับสมัครในขณะนี้
                        </div>
                    ) : (
                        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                {availableTopics.map(topic => (
                                    <Card
                                        key={topic.ID}
                                        hoverable
                                        style={{ borderRadius: 8 }}
                                    >
                                        <Title level={5}>{topic.title}</Title>
                                        <Paragraph ellipsis={{ rows: 2 }} type="secondary">
                                            <strong>วัตถุประสงค์:</strong> {topic.objective}
                                        </Paragraph>
                                        <Paragraph ellipsis={{ rows: 2 }} type="secondary">
                                            <strong>ขอบเขต:</strong> {topic.scope}
                                        </Paragraph>
                                        <Button
                                            type="primary"
                                            icon={<ProjectOutlined />}
                                            onClick={() => handleSelectTopic(topic)}
                                            style={{ background: '#8A011D', borderColor: '#8A011D', marginTop: 8 }}
                                        >
                                            เลือกหัวข้อนี้
                                        </Button>
                                    </Card>
                                ))}
                            </Space>
                        </div>
                    )}

                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
                        <Text type="secondary">หรือ</Text>
                        <br />
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setIsSelectModalOpen(false);
                                setIsProposeModalOpen(true);
                            }}
                            style={{ marginTop: 8 }}
                        >
                            เสนอหัวข้อโครงงานใหม่
                        </Button>
                    </div>
                </Modal>

                {/* Modal: Topic Detail */}
                <Modal
                    title="รายละเอียดหัวข้อโครงงาน"
                    open={isTopicDetailModalOpen}
                    onCancel={() => setIsTopicDetailModalOpen(false)}
                    footer={[
                        <Button key="cancel" danger onClick={handleCancelProposal}>
                            ยกเลิก/สละสิทธิ์
                        </Button>,
                        <Button key="close" type="primary" onClick={() => setIsTopicDetailModalOpen(false)}>
                            ปิด
                        </Button>
                    ]}
                    width={700}
                    centered
                >
                    {myTopic && (
                        <div>
                            <div style={{ marginBottom: 24, padding: 16, background: '#f0f5ff', borderRadius: 8, borderLeft: `5px solid ${getStatusInfo(myTopic.status).color}` }}>
                                <Space>
                                    <span style={{ fontSize: 24, color: getStatusInfo(myTopic.status).color }}>
                                        {getStatusInfo(myTopic.status).icon}
                                    </span>
                                    <div>
                                        <Text type="secondary">สถานะปัจจุบัน</Text>
                                        <Title level={4} style={{ margin: 0 }}>{getStatusInfo(myTopic.status).text}</Title>
                                    </div>
                                </Space>

                                {myTopic.status === 'Rejected' && myTopic.topic_approvals && myTopic.topic_approvals.length > 0 && (
                                    <div style={{ marginTop: 16, padding: 12, background: '#fff1f0', borderRadius: 6 }}>
                                        <Text strong type="danger"><ExclamationCircleOutlined /> เหตุผล/สิ่งที่ต้องแก้ไข:</Text>
                                        <Paragraph style={{ margin: '8px 0 0 0' }}>
                                            {myTopic.topic_approvals[myTopic.topic_approvals.length - 1]?.comment}
                                        </Paragraph>
                                    </div>
                                )}
                            </div>

                            <Title level={4}>{myTopic.title}</Title>

                            <div style={{ marginTop: 16 }}>
                                <Text strong>วัตถุประสงค์</Text>
                                <Paragraph>{myTopic.objective}</Paragraph>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <Text strong>ขอบเขตของงาน</Text>
                                <Paragraph>{myTopic.scope}</Paragraph>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <Text strong>รายละเอียดเพิ่มเติม</Text>
                                <Paragraph>{myTopic.description || '-'}</Paragraph>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Modal: Propose New Topic */}
                <Modal
                    title="เสนอหัวข้อโครงงานใหม่"
                    open={isProposeModalOpen}
                    onCancel={() => setIsProposeModalOpen(false)}
                    footer={null}
                    centered
                    width={800}
                >
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <Text type="secondary">กรอกรายละเอียดหัวข้อโครงงานที่คุณต้องการเสนอให้อาจารย์ที่ปรึกษาพิจารณา</Text>
                    </div>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleProposeSubmit}
                        size="large"
                    >
                        <Form.Item
                            name="title"
                            label="ชื่อหัวข้อโครงงาน"
                            rules={[{ required: true, message: 'กรุณากรอกชื่อหัวข้อ' }]}
                        >
                            <Input placeholder="เช่น ระบบบริหารจัดการ..." />
                        </Form.Item>

                        <Form.Item
                            name="objective"
                            label="วัตถุประสงค์"
                            rules={[{ required: true, message: 'กรุณากรอกวัตถุประสงค์' }]}
                        >
                            <TextArea rows={4} placeholder="ระบุสิ่งที่ต้องการทำให้สำเร็จ" />
                        </Form.Item>

                        <Form.Item
                            name="scope"
                            label="ขอบเขตของงาน"
                            rules={[{ required: true, message: 'กรุณากรอกขอบเขตของงาน' }]}
                        >
                            <TextArea rows={4} placeholder="ระบุขอบเขต ฟีเจอร์ หรือเทคโนโลยีที่จะใช้" />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="รายละเอียดเพิ่มเติม / เหตุผลที่สนใจ"
                            help="ระบุเหตุผลประกอบการเลือกหัวข้อ หรือรายละเอียดอื่นๆ ที่เป็นประโยชน์"
                        >
                            <TextArea rows={4} placeholder="อธิบายเพิ่มเติม..." />
                        </Form.Item>

                        <Form.Item
                            name="attachment"
                            label="แนบไฟล์เอกสารเพิ่มเติม (ถ้ามี)"
                        >
                            <Upload maxCount={1} beforeUpload={() => false}>
                                <Button icon={<UploadOutlined />}>คลิกเพื่อแนบไฟล์</Button>
                            </Upload>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block icon={<SendOutlined />}
                                style={{ background: '#8A011D', borderColor: '#8A011D' }}>
                                ส่งข้อเสนอโครงงาน
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Modal: Project Information */}
                <Modal
                    title={<span><FileTextOutlined style={{ marginRight: 8, color: '#667eea' }} />กรอกข้อมูลโครงงาน</span>}
                    open={isProjectInfoModalOpen}
                    onCancel={() => {
                        setIsProjectInfoModalOpen(false);
                        projectForm.resetFields();
                    }}
                    footer={null}
                    centered
                    width={900}
                >
                    <Form
                        form={projectForm}
                        layout="vertical"
                        onFinish={(values) => {
                            Modal.confirm({
                                title: myProject ? 'ยืนยันการแก้ไขข้อมูล' : 'ยืนยันการบันทึกข้อมูล',
                                content: myProject ? 'คุณต้องการแก้ไขข้อมูลโครงงานนี้ใช่หรือไม่?' : 'คุณต้องการบันทึกข้อมูลโครงงานนี้ใช่หรือไม่?',
                                okText: 'ยืนยัน',
                                cancelText: 'ยกเลิก',
                                onOk: async () => {
                                    try {
                                        const projectData: any = {
                                            abstract: values.abstract_th,
                                            keywords: values.keywords,
                                        };

                                        if (values.project_document && values.project_document.length > 0) {
                                            const file = values.project_document[0].originFileObj;
                                            if (file) {
                                                projectData.project_document = file;
                                            }
                                        }

                                        // ถ้ามี project อยู่แล้ว ให้ update แทน create
                                        if (myProject) {
                                            await UpdateProject(myProject.ID, projectData);
                                            message.success('แก้ไขข้อมูลโครงงานเรียบร้อยแล้ว');
                                        } else {
                                            await CreateProject(projectData);
                                            message.success('บันทึกข้อมูลโครงงานเรียบร้อยแล้ว');
                                        }
                                        setIsProjectInfoModalOpen(false);
                                        projectForm.resetFields();
                                        fetchData(); // Refresh to get the new project data
                                    } catch (error: any) {
                                        console.error('Error creating project:', error);
                                        const errMsg = error?.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
                                        message.error(errMsg);
                                    }
                                }
                            });
                        }}

                    >
                        <div style={{ marginBottom: 24, padding: 16, background: '#f0f5ff', borderRadius: 8, border: '1px solid #d6e4ff' }}>
                            <Row gutter={16}>
                                <Col span={16}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>ชื่อโครงงาน (จากหัวข้อที่อนุมัติ)</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Text strong style={{ fontSize: 16, color: '#1890ff' }}>{myTopic?.title || 'ไม่พบข้อมูล'}</Text>
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>ปีการศึกษา</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Text strong style={{ fontSize: 16, color: '#1890ff' }}>{groupYear || 'ไม่พบข้อมูล'}</Text>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        <Form.Item
                            name="abstract_th"
                            label="บทคัดย่อ (ภาษาไทย)"
                            rules={[{ required: true, message: 'กรุณากรอกบทคัดย่อภาษาไทย' }]}
                        >
                            <TextArea rows={4} placeholder="สรุปโครงงานโดยย่อ..." />
                        </Form.Item>

                        <Form.Item
                            name="keywords"
                            label="คำสำคัญของโครงงาน"
                            rules={[{ required: true, message: 'กรุณากรอกคำสำคัญของโครงงาน' }]}
                        >
                            <div style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, minHeight: 80, background: '#fff' }}>
                                <Space wrap style={{ marginBottom: 8 }}>
                                    {selectedKeywords.map(tag => (
                                        <Tag key={tag} closable onClose={() => handleTagToggle(tag)} color="geekblue">{tag}</Tag>
                                    ))}
                                </Space>
                                <div style={{ marginTop: 8 }}>
                                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => setIsCategoryModalOpen(true)}>
                                        เลือกจากหมวดหมู่
                                    </Button>
                                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                        (เลือกได้อย่างน้อย 1 รายการ)
                                    </Text>
                                </div>
                            </div>
                        </Form.Item>

                        <Form.Item
                            name="project_document"
                            label="เอกสารโครงงาน ( ไฟล์นำเสนอและไฟล์รายงาน )"
                            valuePropName="fileList"
                            getValueFromEvent={(e) => {
                                if (Array.isArray(e)) {
                                    return e;
                                }
                                return e?.fileList;
                            }}
                            rules={[{ required: true, message: 'กรุณาอัพโหลดเอกสารโครงงาน' }]}
                        >
                            <Upload maxCount={1} beforeUpload={() => false}>
                                <Button icon={<UploadOutlined />}>คลิกเพื่ออัพโหลดเอกสาร</Button>
                            </Upload>
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                                <Button
                                    onClick={() => {
                                        setIsProjectInfoModalOpen(false);
                                        projectForm.resetFields();
                                    }}
                                >
                                    ยกเลิก
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SendOutlined />}
                                    style={{ background: '#667eea', borderColor: '#667eea' }}
                                >
                                    บันทึกข้อมูลโครงงาน
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Modal: View Project Detail */}
                <Modal
                    title={<span><FileTextOutlined style={{ marginRight: 8, color: '#16a34a' }} />ข้อมูลโครงงาน</span>}
                    open={isProjectDetailModalOpen}
                    onCancel={() => setIsProjectDetailModalOpen(false)}
                    footer={[
                        <Button key="close" onClick={() => setIsProjectDetailModalOpen(false)}>
                            ปิด
                        </Button>
                    ]}
                    width={800}
                    centered
                >
                    {myProject && (
                        <div>
                            <div style={{ marginBottom: 24, padding: 16, background: '#f0f5ff', borderRadius: 8, border: '1px solid #d6e4ff' }}>
                                <Row gutter={16}>
                                    <Col span={16}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>ชื่อโครงงาน</Text>
                                        <div style={{ marginTop: 4 }}>
                                            <Text strong style={{ fontSize: 16, color: '#1890ff' }}>{myTopic?.title || 'ไม่พบข้อมูล'}</Text>
                                        </div>
                                    </Col>
                                    <Col span={8}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>ปีการศึกษา</Text>
                                        <div style={{ marginTop: 4 }}>
                                            <Text strong style={{ fontSize: 16, color: '#1890ff' }}>{groupYear || 'ไม่พบข้อมูล'}</Text>
                                        </div>
                                    </Col>
                                </Row>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <Text strong style={{ fontSize: 14 }}>บทคัดย่อ (ภาษาไทย)</Text>
                                <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                                    <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                        {myProject.abstract || '-'}
                                    </Paragraph>
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <Text strong style={{ fontSize: 14 }}>เครื่องมือและเทคโนโลยีที่ใช้</Text>
                                <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                                    <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                        {myProject.keywords || '-'}
                                    </Paragraph>
                                </div>
                            </div>

                            {myProject.file_path && (
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong style={{ fontSize: 14 }}>เอกสารโครงงาน</Text>
                                    <div style={{ marginTop: 8, padding: 12, background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <Space>
                                                <FileTextOutlined style={{ color: '#16a34a', fontSize: 18 }} />
                                                <Text strong>{myProject.file_path.split('/').pop() || 'เอกสารโครงงาน'}</Text>
                                            </Space>
                                            <Button
                                                type="primary"
                                                icon={<UploadOutlined />}
                                                size="small"
                                                onClick={() => {
                                                    // Download file
                                                    const link = document.createElement('a');
                                                    const filePath = myProject.file_path.replace(/^\.\//, '');
                                                    const fullPath = filePath.startsWith('uploads') ? filePath : `uploads/projects/${filePath}`;
                                                    link.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/${fullPath}`;
                                                    link.download = myProject.file_path.split('/').pop() || 'document';
                                                    link.target = '_blank';
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                    message.success('กำลังดาวน์โหลดไฟล์...');
                                                }}
                                                style={{ background: '#16a34a', borderColor: '#16a34a' }}
                                            >
                                                ดาวน์โหลดเอกสาร
                                            </Button>
                                        </Space>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>

                <CategoryModal
                    open={isCategoryModalOpen}
                    onCancel={() => setIsCategoryModalOpen(false)}
                    selectedTags={selectedKeywords}
                    onTagToggle={handleTagToggle}
                    mode="select"
                />

            </div>
        </div>
    );
}