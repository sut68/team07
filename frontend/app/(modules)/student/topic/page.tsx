"use client";
import React, { useState } from 'react';
import { Card, Button, Typography, Row, Col, Modal, Form, Input, Tag, Space, Empty, message, ConfigProvider, Tabs, Steps, Upload } from 'antd';
import { ProjectOutlined, SendOutlined, TeamOutlined, FileTextOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, UploadOutlined, EyeOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Topic, TopicApproval } from '@/app/interfaces/Topic';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function StudentTopicPage() {
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('1');

    // Mock Data - Available Teacher Topics
    const [availableTopics, setAvailableTopics] = useState<Topic[]>([
        {
            id: 1,
            title: "ระบบจัดการตารางเรียนอัตโนมัติ",
            objective: "เพื่อลดความซับซ้อนในการจัดตารางเรียน",
            scope: "Web Application สำหรับอาจารย์และเจ้าหน้าที่",
            description: "ระบบที่ใช้อัลกอริทึมในการจัดตารางเรียนให้อัตโนมัติ โดยคำนึงถึงห้องเรียนและเวลาว่างของอาจารย์",
            status: 'Open',
            proposerId: 999,
            proposerRole: 'Teacher'
        },
        {
            id: 2,
            title: "แอปพลิเคชันเพื่อการท่องเที่ยวชุมชน",
            objective: "ส่งเสริมการท่องเที่ยวในท้องถิ่น",
            scope: "Mobile Application (iOS/Android)",
            description: "รวบรวมข้อมูลสถานที่ท่องเที่ยว ร้านอาหาร และที่พักในชุมชน",
            status: 'Open',
            proposerId: 999,
            proposerRole: 'Teacher'
        }
    ]);

    // Mock Data - Student's Current Proposal/Topic (Null if none selected/proposed)
    const [myTopic, setMyTopic] = useState<Topic | null>(null);

    // View Details State
    const [viewTopic, setViewTopic] = useState<Topic | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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
            onOk() {
                // Simulate selecting a topic
                const selected: Topic = {
                    ...topic,
                    id: Date.now(), // New ID for the proposal instance
                    status: 'Pending',
                    proposerRole: 'Student', // Now it's a student proposal based on teacher's topic
                    approval: undefined // Reset approval
                };
                setMyTopic(selected);
                setActiveTab('2'); // Switch to My Topic tab
                message.success('ส่งคำขอเลือกหัวข้อเรียบร้อยแล้ว');
            }
        });
    };

    const handleProposeSubmit = (values: any) => {
        Modal.confirm({
            title: 'ยืนยันการเสนอหัวข้อ',
            content: 'คุณตรวจสอบรายละเอียดครบถ้วนแล้วใช่หรือไม่?',
            okText: 'ยืนยัน',
            cancelText: 'ตรวจสอบอีกครั้ง',
            onOk() {
                const newProposal: Topic = {
                    id: Date.now(),
                    title: values.title,
                    objective: values.objective,
                    scope: values.scope,
                    description: values.description,
                    status: 'Pending',
                    proposerId: 1001, // Mock Student ID
                    proposerRole: 'Student',
                    // Handle attachment mock
                    attachment: values.attachment && values.attachment.fileList.length > 0 ? values.attachment.fileList[0].name : undefined
                };
                setMyTopic(newProposal);
                message.success('เสนอหัวข้อโครงงานเรียบร้อยแล้ว');
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
            onOk() {
                setMyTopic(null);
                form.resetFields();
                message.info('ยกเลิกหัวข้อเรียบร้อยแล้ว');
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
                {status === 'Rejected' && approval?.comment && (
                    <div style={{ marginTop: 16, padding: 16, background: '#fff1f0', borderRadius: 8, border: '1px solid #ffccc7' }}>
                        <Text strong type="danger"><ExclamationCircleOutlined /> เหตุผล/สิ่งที่ต้องแก้ไข:</Text>
                        <Paragraph style={{ margin: '8px 0 0 0' }}>{approval.comment}</Paragraph>
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
                                <Col xs={24} md={12} lg={12} key={topic.id}>
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
                            <StatusBadge status={myTopic.status} approval={myTopic.approval} />

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

                <Tabs defaultActiveKey="1" items={items} />

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
                                    <Text>อาจารย์ที่ปรึกษา (ID: {viewTopic.proposerId})</Text>
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

                            {viewTopic.attachment && (
                                <div style={{ marginTop: 8 }}>
                                    <Text strong><PaperClipOutlined /> เอกสารแนบ:</Text>
                                    <a href="#" style={{ marginLeft: 8 }} onClick={(e) => { e.preventDefault(); message.info('ดาวน์โหลดไฟล์จำลอง: ' + viewTopic.attachment); }}>
                                        {viewTopic.attachment}
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