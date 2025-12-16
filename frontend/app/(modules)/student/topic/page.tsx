"use client";
import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Modal, Form, Input, Tag, Space, Empty, message, ConfigProvider, Tabs, Steps, Upload, Tooltip } from 'antd';
import { ProjectOutlined, SendOutlined, TeamOutlined, FileTextOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, UploadOutlined, EyeOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Topic, TopicApproval } from '@/app/interfaces/Topic';
import { getTopics, createTopic, updateTopic } from '@/app/services/topic';
import { GetMyGroup } from '@/app/services/group';
import { GetMe } from '@/app/services/login';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function StudentTopicPage() {
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('1');
    const [loading, setLoading] = useState(false);
    const [studentID, setStudentID] = useState<number | null>(null);
    const [groupID, setGroupID] = useState<number | null>(null);
    const [advisorID, setAdvisorID] = useState<number | null>(null);

    // Data States
    const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
    const [myTopic, setMyTopic] = useState<Topic | null>(null);

    // View Details State
    const [viewTopic, setViewTopic] = useState<Topic | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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
                }
            } catch (err) {
                console.log("No group found or error fetching group", err);
            }

            const topicParams: any = { proposer_role: 'Teacher' };
            if (currentAdvisorID) {
                topicParams.teacher_id = currentAdvisorID;
                topicParams.filter = 'my_topics'; // Use 'my_topics' to filter strictly by teacher_id on topic table
            }

            const teacherTopicsRes = await getTopics(topicParams);
            setAvailableTopics(teacherTopicsRes.data || []);

            // 3. Fetch My Proposed Topic
            const myTopicParams: any = { proposer_role: 'Student' };
            if (currentGroupID) {
                myTopicParams.group_id = currentGroupID;
            }
            const myTopicsRes = await getTopics(myTopicParams);

            if (myTopicsRes.data && myTopicsRes.data.length > 0) {
                const sortedTopics = myTopicsRes.data.sort((a, b) => b.ID - a.ID);
                const activeTopic = sortedTopics.find(t => t.status !== 'Closed');

                if (activeTopic) {
                    setMyTopic(activeTopic);
                } else {
                    setMyTopic(null);
                }
            } else {
                setMyTopic(null);
            }

        } catch (error) {
            console.error("Failed to fetch data", error);
            // message.error("ไม่สามารถโหลดข้อมูลได้");
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
        setIsViewModalOpen(false); // Close view modal if open
        Modal.confirm({
            title: 'ยืนยันการเลือกหัวข้อ',
            content: `คุณต้องการเลือกหัวข้อ "${topic.title}" ใช่หรือไม่? เมื่อเลือกแล้วจะต้องรอการอนุมัติจากอาจารย์ที่ปรึกษา`,
            okText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                setLoading(true);
                try {
                    const formData = new FormData();
                    formData.append('title', topic.title);
                    formData.append('objective', topic.objective);
                    formData.append('scope', topic.scope);
                    formData.append('description', topic.description || '');
                    formData.append('proposer_role', 'Student');
                    if (groupID) {
                        formData.append('group_project_id', groupID.toString());
                    }
                    if (topic.teacher_id) {
                        formData.append('teacher_id', topic.teacher_id.toString());
                    } else if (advisorID) {
                        formData.append('teacher_id', advisorID.toString());
                    }

                    await createTopic(formData);
                    message.success('ส่งคำขอเลือกหัวข้อเรียบร้อยแล้ว');
                    fetchData();
                    setActiveTab('2');
                } catch (error) {
                    console.error(error);
                    message.error('เกิดข้อผิดพลาดในการเลือกหัวข้อ');
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

                    // Handle File
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
                        const formData = new FormData();
                        formData.append('status', 'Closed');
                        formData.append('title', myTopic.title);
                        formData.append('objective', myTopic.objective);
                        formData.append('scope', myTopic.scope);
                        formData.append('description', myTopic.description);

                        await updateTopic(myTopic.ID, formData);
                        message.success('ยกเลิกหัวข้อเรียบร้อยแล้ว');
                        setMyTopic(null);
                        fetchData();
                    } catch (error) {
                        // console.error(error);
                        message.error('ไม่สามารถยกเลิกหัวข้อได้');
                    }
                }
                form.resetFields();
            }
        });
    };

    const StatusBadge = ({ status, approval }: { status: string, approval?: TopicApproval }) => {
        let color = 'default';
        let text = 'N/A';
        let icon = <ClockCircleOutlined />;

        switch (status) {
            case 'Pending':
                color = 'warning';
                text = 'รอตรวจสอบ/อนุมัติ';
                icon = <ClockCircleOutlined />;
                break;
            case 'Approved':
                color = 'success';
                text = 'อนุมัติแล้ว';
                icon = <CheckCircleOutlined />;
                break;
            case 'Rejected':
                color = 'error';
                text = 'ไม่อนุมัติ/แก้ไข';
                icon = <CloseCircleOutlined />;
                break;
            case 'Open':
                color = 'processing';
                text = 'เปิดรับสมัคร';
                break;
        }

        return (
            <Card style={{ marginBottom: 24, borderLeft: `5px solid ${status === 'Approved' ? '#52c41a' : status === 'Rejected' ? '#ff4d4f' : '#faad14'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 24, color: status === 'Approved' ? '#52c41a' : status === 'Rejected' ? '#ff4d4f' : '#faad14' }}>
                            {icon}
                        </div>
                        <div>
                            <Text type="secondary">สถานะปัจจุบัน</Text>
                            <Title level={4} style={{ margin: 0 }}>{text}</Title>
                        </div>
                    </div>
                </div>
                {/* Approval Logic typically nested in Topic object from backend */}
                {/* Assuming topic.topic_approvals is array */}
                {status === 'Rejected' && myTopic?.topic_approvals && myTopic.topic_approvals.length > 0 && (
                    <div style={{ marginTop: 16, padding: 16, background: '#fff1f0', borderRadius: 8, border: '1px solid #ffccc7' }}>
                        <Text strong type="danger"><ExclamationCircleOutlined /> เหตุผล/สิ่งที่ต้องแก้ไข:</Text>
                        <Paragraph style={{ margin: '8px 0 0 0' }}>{myTopic.topic_approvals[myTopic.topic_approvals.length - 1]?.comment}</Paragraph>
                    </div>
                )}
            </Card>
        );
    };

    const items = [
        {
            key: '1',
            label: 'เลือกหัวข้อจากอาจารย์',
            children: (
                <div>
                    <div style={{ marginBottom: 24, textAlign: 'center' }}>
                        <Title level={3}>หัวข้อที่อาจารย์เปิดรับสมัคร</Title>
                        <Text type="secondary">เลือกหัวข้อที่สนใจเพื่อยื่นขอทำโครงงานกับอาจารย์ที่ปรึกษา</Text>
                    </div>

                    {availableTopics.length === 0 ? (
                        <Empty description="ไม่มีหัวข้อที่เปิดรับสมัครในขณะนี้" />
                    ) : (
                        <Row gutter={[24, 24]}>
                            {availableTopics.map(topic => (
                                <Col xs={24} md={12} lg={12} key={topic.ID}>
                                    <Card
                                        hoverable
                                        style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid #f0f0f0' }}
                                        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                                        onClick={() => handleViewDetails(topic)}
                                    >
                                        <div style={{ marginBottom: 16 }}>
                                            <Tag color="blue" style={{ marginBottom: 8 }}>อาจารย์เสนอ</Tag>
                                            <Title level={4} ellipsis={{ rows: 2 }} style={{ margin: 0 }}>{topic.title}</Title>
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <Text strong>วัตถุประสงค์:</Text>
                                            <Paragraph ellipsis={{ rows: 2 }} type="secondary">{topic.objective}</Paragraph>
                                            <Text strong>ขอบเขต:</Text>
                                            <Paragraph ellipsis={{ rows: 2 }} type="secondary">{topic.scope}</Paragraph>
                                        </div>

                                        <Tooltip title={!!myTopic ? "คุณไม่ได้มีสิทธ์เลือกหัวข้อนี้เนื่องจากได้เสนอหัวข้อไปแล้ว" : ""}>
                                            <Button
                                                type="primary"
                                                block
                                                size="large"
                                                icon={<ProjectOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectTopic(topic);
                                                }}
                                                disabled={!!myTopic} // Disable if student already has a topic
                                                style={{ background: '#8A011D', borderColor: '#852d3fff' }}
                                            >
                                                เลือกหัวข้อนี้
                                            </Button>
                                        </Tooltip>
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
            label: 'เสนอหัวข้อเอง / สถานะของฉัน',
            children: (
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    {myTopic ? (
                        <div>
                            <StatusBadge status={myTopic.status} approval={undefined} />

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
                            </Card>
                        </div>
                    ) : (
                        <Card>
                            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                                <Title level={3}>เสนอหัวข้อโครงงานใหม่</Title>
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
                                    <Button type="primary" htmlType="submit" block icon={<SendOutlined />} size="large"
                                        style={{ background: '#8A011D', borderColor: '#8A011D' }}>
                                        ส่งข้อเสนอโครงงาน
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    )}
                </div>
            ),
        }
    ];

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#F06522',
                    fontFamily: "'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                },
            }}
        >
            <div style={{ padding: '0 0px', maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ marginBottom: 32 }}>
                    <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
                        <ProjectOutlined style={{ marginRight: 10, color: '#8A011D' }} />
                        ระบบเลือกและเสนอหัวข้อโครงงาน
                    </Title>
                    <Text type="secondary">เลือกหัวข้อจากอาจารย์ หรือเสนอหัวข้อที่คุณสนใจด้วยตนเอง</Text>
                </div>

                <Tabs defaultActiveKey="1" items={items} activeKey={activeTab} onChange={setActiveTab} />

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
                            disabled={!!myTopic}
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

                            <Card size="small" style={{ background: '#fafafa' }}>
                                <Space>
                                    <TeamOutlined />
                                    <Text strong>เสนอโดย:</Text>
                                    {/* Display Teacher Name if available, or role */}
                                    <Text>อาจารย์ที่ปรึกษา {viewTopic.teacher_id ? `(ID: ${viewTopic.teacher_id})` : ''}</Text>
                                </Space>
                            </Card>

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
                                    <Text strong><PaperClipOutlined /> เอกสารแนบ:</Text>
                                    <a href="#" style={{ marginLeft: 8 }} onClick={(e) => { e.preventDefault(); message.info('ดาวน์โหลดไฟล์: ' + viewTopic.file_attachment); }}>
                                        {viewTopic.file_attachment}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </ConfigProvider>
    );
}