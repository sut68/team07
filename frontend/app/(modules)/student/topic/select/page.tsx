"use client";
import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Modal, Form, Input, Tag, Space, Empty, message, ConfigProvider, Tabs, Upload, Spin } from 'antd';
import { ProjectOutlined, SendOutlined, TeamOutlined, FileTextOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, UploadOutlined, PlusOutlined, ArrowLeftOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { Topic, TopicApproval } from '@/app/interfaces/Topic';
import { getTopics, createTopic, updateTopic, selectTopic, cancelSelection, getStudentTopic } from '@/app/services/topic';
import { GetMyGroup } from '@/app/services/group';
import { GetMe } from '@/app/services/login';
import CustomEmptyState from '@/app/components/topic/CustomEmptyState';
import '../../../../style/evaluation.css';
// check
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function TopicSelectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState(() => {
        const tab = searchParams?.get('tab');
        return tab === 'status' ? '2' : '1';
    });
    const [loading, setLoading] = useState(true);
    const [studentID, setStudentID] = useState<number | null>(null);
    const [groupID, setGroupID] = useState<number | null>(null);
    const [advisorID, setAdvisorID] = useState<number | null>(null);
    const [isLeader, setIsLeader] = useState(false);

    // Data States
    const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
    const [myTopic, setMyTopic] = useState<Topic | null>(null);

    // Modal States
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
    const [viewTopic, setViewTopic] = useState<Topic | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            let currentStudentID = studentID;
            if (!currentStudentID) {
                const user = await GetMe();
                currentStudentID = user.id;
                setStudentID(user.id);
            }

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

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleViewDetails = (topic: Topic) => {
        setViewTopic(topic);
        setIsViewModalOpen(true);
    };

    const handleSelectTopic = (topic: Topic) => {
        setIsViewModalOpen(false);
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
                        router.push('/student/topic');
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
                    router.push('/student/topic');
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
                        router.push('/student/topic');
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



    const items = [
        {
            key: '1',
            label: <span style={{ fontWeight: 500, fontSize: '16px' }}>หัวข้อจากอาจารย์</span>,
            children: (
                <div>
                    {availableTopics.length === 0 ? (
                        <CustomEmptyState
                            title="ยังไม่มีหัวข้อที่เปิดรับสมัคร"
                            description={<span>อาจารย์ที่ปรึกษายังไม่ได้ประกาศหัวข้อโครงงานในขณะนี้หรือหัวข้อทั้งหมดถูกเลือกเต็มแล้ว <br />กรุณาติดตามประกาศอีกครั้ง</span>}
                            icon={<ProjectOutlined />}
                        />
                    ) : (
                        <Row gutter={[24, 24]}>
                            {availableTopics.map(topic => (
                                <Col xs={24} md={12} lg={8} key={topic.ID}>
                                    <Card
                                        hoverable
                                        onClick={() => handleViewDetails(topic)}
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
                                            {(topic as any).selected_by_group ? (
                                                <Tag color="red">ถูกเลือกแล้ว</Tag>
                                            ) : (
                                                <Tag color="green">เปิดรับสมัคร</Tag>
                                            )}
                                        </div>

                                        <Title level={4} style={{ margin: '0 0 12px 0' }} ellipsis={{ rows: 2 }}>
                                            {topic.title}
                                        </Title>

                                        <div style={{ marginBottom: 12 }}>
                                            <Text strong>วัตถุประสงค์:</Text>
                                            <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ marginTop: 4 }}>
                                                {topic.objective}
                                            </Paragraph>
                                        </div>

                                        <div style={{ marginBottom: 12 }}>
                                            <Text strong>ขอบเขต:</Text>
                                            <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ marginTop: 4 }}>
                                                {topic.scope}
                                            </Paragraph>
                                        </div>

                                        <div style={{ marginTop: 'auto', textAlign: 'center' }}>
                                            <Button type="link" size="small" icon={<FileTextOutlined />}>
                                                ดูรายละเอียด
                                            </Button>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </div>
            ),
        },
        {
            key: '2',
            label: <span style={{ fontWeight: 500, fontSize: '16px' }}>สถานะของฉัน</span>,
            children: (
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    {myTopic ? (
                        <div>
                            <Card style={{ marginBottom: 24, borderLeft: `5px solid ${getStatusInfo(myTopic.status).color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ fontSize: 24, color: getStatusInfo(myTopic.status).color }}>
                                            {getStatusInfo(myTopic.status).icon}
                                        </div>
                                        <div>
                                            <Text type="secondary">สถานะปัจจุบัน</Text>
                                            <Title level={4} style={{ margin: 0 }}>{getStatusInfo(myTopic.status).text}</Title>
                                        </div>
                                    </div>
                                </div>

                                {myTopic.status === 'Rejected' && myTopic.topic_approvals && myTopic.topic_approvals.length > 0 && (
                                    <div style={{ marginTop: 16, padding: 16, background: '#fff1f0', borderRadius: 8, border: '1px solid #ffccc7' }}>
                                        <Text strong type="danger"><ExclamationCircleOutlined /> เหตุผล/สิ่งที่ต้องแก้ไข:</Text>
                                        <Paragraph style={{ margin: '8px 0 0 0' }}>
                                            {myTopic.topic_approvals[myTopic.topic_approvals.length - 1]?.comment}
                                        </Paragraph>
                                    </div>
                                )}
                            </Card>

                            <Card title="รายละเอียดหัวข้อโครงงาน" extra={<Button danger onClick={handleCancelProposal}>ยกเลิก/สละสิทธิ์</Button>}>
                                <Title level={4}>{myTopic.title}</Title>

                                <div style={{ marginTop: 24 }}>
                                    <Title level={5}>วัตถุประสงค์</Title>
                                    <Paragraph>{myTopic.objective}</Paragraph>
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <Title level={5}>ขอบเขตของงาน</Title>
                                    <Paragraph>{myTopic.scope}</Paragraph>
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <Title level={5}>รายละเอียดเพิ่มเติม</Title>
                                    <Paragraph>{myTopic.description || '-'}</Paragraph>
                                </div>

                                {myTopic.file_attachment && (
                                    <div style={{ marginTop: 16 }}>
                                        <Title level={5}><PaperClipOutlined /> ไฟล์แนบ</Title>
                                        <a
                                            href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/topics/${myTopic.file_attachment}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {myTopic.file_attachment}
                                        </a>
                                    </div>
                                )}
                            </Card>
                        </div>
                    ) : (
                        <CustomEmptyState
                            title="ยังไม่มีหัวข้อโครงงาน"
                            description={
                                <span>
                                    คุณยังไม่ได้เลือกหรือเสนอหัวข้อโครงงาน <br />
                                    เริ่มต้นโดยการเลือกหัวข้อจากอาจารย์ในแถบแรก หรือกดปุ่มเสนอหัวข้อโครงงานที่มุมขวาล่าง
                                </span>
                            }
                            icon={<FileTextOutlined />}
                        />
                    )}
                </div>
            ),
        }
    ];

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#9b0321ff',
                    fontFamily: "'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                },
            }}
        >
            <div style={{ padding: '0 24px', maxWidth: 1400, margin: '0 auto' }}>
                {/* Header */}
                <div className="peer-header">
                    <button onClick={() => router.push('/student/topic')} className="btn-back" style={{ marginBottom: 16, paddingLeft: 0 }}>
                        <ArrowLeftOutlined /> ย้อนกลับ
                    </button>
                    <div className="page-title-box" style={{ marginBottom: 0 }}>
                        <h1>เลือกและเสนอหัวข้อโครงงาน</h1>
                        <p>เลือกหัวข้อจากอาจารย์ หรือเสนอหัวข้อที่คุณสนใจด้วยตนเอง</p>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px 0' }}>
                        <Spin size="large" tip="กำลังโหลดข้อมูล..." />
                    </div>
                ) : (
                    <Tabs defaultActiveKey="1" items={items} activeKey={activeTab} onChange={setActiveTab} />
                )}

                {/* View Details Modal */}
                <Modal
                    title="รายละเอียดหัวข้อโครงงาน"
                    open={isViewModalOpen}
                    onCancel={() => setIsViewModalOpen(false)}
                    footer={[
                        <Button key="close" onClick={() => setIsViewModalOpen(false)}>
                            ปิด
                        </Button>,
                        <Button
                            key="select"
                            type="primary"
                            icon={<ProjectOutlined />}
                            onClick={() => viewTopic && handleSelectTopic(viewTopic)}
                            disabled={!!myTopic || !isLeader || !!(viewTopic as any)?.selected_by_group}
                            style={{ background: '#8A011D', borderColor: '#8A011D', opacity: (!!myTopic || !isLeader || !!(viewTopic as any)?.selected_by_group) ? 0.5 : 1 }}
                            title={(viewTopic as any)?.selected_by_group ? "หัวข้อนี้ถูกเลือกแล้ว" : (!isLeader ? "เฉพาะหัวหน้ากลุ่มเท่านั้นที่สามารถเลือกหัวข้อได้" : "")}
                        >
                            เลือกหัวข้อนี้
                        </Button>
                    ]}
                    centered
                    width={700}
                >
                    {viewTopic && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>ชื่อหัวข้อ</Text>
                                <Title level={4} style={{ marginTop: 0 }}>{viewTopic.title}</Title>
                            </div>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Text strong>วัตถุประสงค์:</Text>
                                    <Paragraph style={{ marginTop: 4 }}>{viewTopic.objective}</Paragraph>
                                </Col>
                                <Col span={12}>
                                    <Text strong>ขอบเขต:</Text>
                                    <Paragraph style={{ marginTop: 4 }}>{viewTopic.scope}</Paragraph>
                                </Col>
                            </Row>

                            <div>
                                <Text strong>รายละเอียดเพิ่มเติม:</Text>
                                <Paragraph style={{ marginTop: 4 }}>{viewTopic.description || '-'}</Paragraph>
                            </div>

                            {viewTopic.file_attachment && (
                                <div style={{ marginTop: 8 }}>
                                    <Text strong><PaperClipOutlined /> ไฟล์แนบ:</Text>
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/topics/${viewTopic.file_attachment}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ marginLeft: 8 }}
                                    >
                                        {viewTopic.file_attachment}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>

                {/* Propose Modal */}
                <Modal
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ background: '#fff0e6ff', padding: 8, borderRadius: '50%', display: 'flex' }}>
                                <ProjectOutlined style={{ color: '#f76212ff', fontSize: 18 }} />
                            </div>
                            <span>เสนอหัวข้อโครงงานใหม่</span>
                        </div>
                    }
                    open={isProposeModalOpen}
                    onCancel={() => setIsProposeModalOpen(false)}
                    footer={null}
                    centered
                    width={600}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleProposeSubmit}
                        style={{ marginTop: 24 }}
                    >
                        <Form.Item
                            name="title"
                            label="ชื่อหัวข้อโครงงาน"
                            rules={[{ required: true, message: 'กรุณากรอกชื่อหัวข้อ' }]}
                        >
                            <Input placeholder="เช่น ระบบบริหารจัดการ..." size="large" />
                        </Form.Item>

                        <Form.Item
                            name="objective"
                            label="วัตถุประสงค์"
                            rules={[{ required: true, message: 'กรุณากรอกวัตถุประสงค์' }]}
                        >
                            <TextArea rows={3} placeholder="ระบุสิ่งที่ต้องการทำให้สำเร็จ" />
                        </Form.Item>

                        <Form.Item
                            name="scope"
                            label="ขอบเขตของงาน"
                            rules={[{ required: true, message: 'กรุณากรอกขอบเขตของงาน' }]}
                        >
                            <TextArea rows={3} placeholder="ระบุขอบเขต ฟีเจอร์ หรือเทคโนโลยีที่จะใช้" />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="รายละเอียดเพิ่มเติม / เหตุผลที่สนใจ"
                            help="ระบุเหตุผลประกอบการเลือกหัวข้อ หรือรายละเอียดอื่นๆ ที่เป็นประโยชน์"
                        >
                            <TextArea rows={3} placeholder="อธิบายเพิ่มเติม..." />
                        </Form.Item>

                        <Form.Item
                            name="attachment"
                            label="แนบไฟล์เอกสารเพิ่มเติม (ถ้ามี)"
                        >
                            <Upload maxCount={1} beforeUpload={() => false}>
                                <Button icon={<UploadOutlined />}>คลิกเพื่อแนบไฟล์</Button>
                            </Upload>
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                            <Space>
                                <Button onClick={() => setIsProposeModalOpen(false)} size="large">ยกเลิก</Button>
                                <Button type="primary" htmlType="submit" size="large"
                                    style={{ background: '#8A011D', borderColor: '#8A011D' }}>
                                    ส่งข้อเสนอโครงงาน
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Floating Propose Button */}
                {!myTopic && isLeader && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={() => setIsProposeModalOpen(true)}
                        style={{
                            position: 'fixed',
                            bottom: 40,
                            right: 40,
                            zIndex: 1000,
                            background: '#8A011D',
                            borderColor: '#852d3fff',
                            boxShadow: '0 4px 12px rgba(138, 1, 29, 0.4)',
                            height: 50,
                            borderRadius: 25,
                            paddingLeft: 24,
                            paddingRight: 24
                        }}
                    >
                        เสนอหัวข้อโครงงาน
                    </Button>
                )}
            </div>
        </ConfigProvider>
    );
}
