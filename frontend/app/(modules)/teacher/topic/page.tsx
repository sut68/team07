"use client";
import React, { useState } from 'react';
import { Card, Button, Typography, Row, Col, Modal, Form, Input, Tag, Space, Empty, message, ConfigProvider, Tabs, Upload } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ProjectOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined, FileTextOutlined, TeamOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { Topic, TopicApproval } from '@/app/interfaces/Topic';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function TeacherTopicPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [form] = Form.useForm();

    // Student Proposal States
    const [selectedProposal, setSelectedProposal] = useState<Topic | null>(null);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Mock Data - Teacher Topics
    const [topics, setTopics] = useState<Topic[]>([
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

    // Mock Data - Student Proposals
    const [proposals, setProposals] = useState<Topic[]>([
        {
            id: 101,
            title: "ระบบติดตามพัสดุด้วย QR Code",
            objective: "เพื่อเพิ่มความสะดวกในการติดตามสถานะพัสดุ",
            scope: "Mobile App สำหรับผู้ใช้ทั่วไป และ Web Admin",
            description: "ผู้ใช้สามารถสแกน QR Code เพื่อดูสถานะพัสดุได้ทันที",
            status: 'Pending',
            proposerId: 1001,
            proposerRole: 'Student',
            group: {
                ID: 1,
                group_number: 1,
                year: 2024,
                group_status: 'Active',
                membership: 3,
                group_members: []
            }
        },
        {
            id: 102,
            title: "Smart Home Control System",
            objective: "ควบคุมอุปกรณ์ไฟฟ้าในบ้านผ่านมือถือ",
            scope: "IoT Device + Mobile App",
            description: "ใช้ ESP32 ควบคุมไฟและแอร์ ผ่านแอพพลิเคชั่น",
            status: 'Pending',
            proposerId: 1002,
            proposerRole: 'Student',
            group: {
                ID: 2,
                group_number: 2,
                year: 2024,
                group_status: 'Active',
                membership: 3,
                group_members: []
            }
        }
    ]);

    // Teacher Topic Handlers
    const handleOpenModal = (topic?: Topic) => {
        if (topic) {
            setEditingTopic(topic);
            // Transform string attachment to fileList for Upload component
            const formValues = {
                ...topic,
                attachment: topic.attachment ? [
                    {
                        uid: '-1',
                        name: topic.attachment,
                        status: 'done',
                        url: '', // In real app, this would be a real URL
                    }
                ] : []
            };
            form.setFieldsValue(formValues);
        } else {
            setEditingTopic(null);
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTopic(null);
        form.resetFields();
    };

    const handleSubmit = (values: any) => {
        // Extract attachment name (mock)
        const attachmentName = values.attachment && values.attachment.length > 0 ? values.attachment[0].name : undefined;
        // Or if it comes from raw event (sometimes wrapped in fileList)
        const finalAttachment = values.attachment && values.attachment.fileList && values.attachment.fileList.length > 0
            ? values.attachment.fileList[0].name
            : (Array.isArray(values.attachment) && values.attachment.length > 0 ? values.attachment[0].name : undefined);

        const cleanValues = { ...values, attachment: finalAttachment };

        if (editingTopic) {
            setTopics(topics.map(t => t.id === editingTopic.id ? { ...t, ...cleanValues } : t));
            message.success('แก้ไขหัวข้อโครงงานเรียบร้อยแล้ว');
        } else {
            const newTopic: Topic = {
                id: Date.now(),
                title: values.title,
                objective: values.objective,
                scope: values.scope,
                description: values.description,
                status: 'Open',
                proposerId: 999,
                proposerRole: 'Teacher',
                attachment: finalAttachment
            };
            setTopics([...topics, newTopic]);
            message.success('เพิ่มหัวข้อโครงงานเรียบร้อยแล้ว');
        }
        handleCloseModal();
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'ยืนยันการลบ',
            content: 'คุณแน่ใจหรือไม่ที่จะลบหัวข้อนี้?',
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            onOk() {
                setTopics(topics.filter(t => t.id !== id));
                message.success('ลบหัวข้อเรียบร้อยแล้ว');
            }
        });
    };

    // Student Proposal Handlers
    const handleViewProposal = (proposal: Topic) => {
        setSelectedProposal(proposal);
        setIsProposalModalOpen(true);
    };

    const handleApprove = () => {
        if (selectedProposal) {
            Modal.confirm({
                title: 'ยืนยันการอนุมัติ',
                content: `คุณต้องการอนุมัติหัวข้อ "${selectedProposal.title}" หรือไม่?`,
                okText: 'อนุมัติ',
                cancelText: 'ยกเลิก',
                onOk() {
                    setProposals(proposals.map(p =>
                        p.id === selectedProposal.id ? { ...p, status: 'Approved' } : p
                    ));
                    message.success('อนุมัติหัวข้อเรียบร้อยแล้ว');
                    setIsProposalModalOpen(false);
                }
            });
        }
    };

    const handleRejectClick = () => {
        setIsRejectModalOpen(true);
    };

    const handleConfirmReject = () => {
        if (!rejectReason.trim()) {
            message.error('กรุณาระบุเหตุผลที่ไม่ผ่านการอนุมัติ');
            return;
        }
        if (selectedProposal) {
            const approval: TopicApproval = {
                id: Date.now(),
                topicId: selectedProposal.id,
                status: 'Rejected',
                comment: rejectReason,
                TeacherId: 999
            };

            setProposals(proposals.map(p =>
                p.id === selectedProposal.id ? {
                    ...p,
                    status: 'Rejected',
                    approval: approval // Save rejection reason in approval object
                } : p
            ));
            message.success('บันทึกผลการไม่อนุมัติเรียบร้อยแล้ว');
            setIsRejectModalOpen(false);
            setIsProposalModalOpen(false);
            setRejectReason('');
        }
    };

    const items = [
        {
            key: '1',
            label: 'หัวข้อของฉัน',
            children: (
                <div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={() => handleOpenModal()}
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
                        เพิ่มหัวข้อใหม่
                    </Button>

                    {topics.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="ยังไม่มีหัวข้อโครงงาน"
                        >
                            <Button type="primary" onClick={() => handleOpenModal()}>เสนอหัวข้อแรกของคุณ</Button>
                        </Empty>
                    ) : (
                        <Row gutter={[24, 24]}>
                            {topics.map(topic => (
                                <Col xs={24} md={12} lg={12} key={topic.id}>
                                    <Card
                                        hoverable
                                        actions={[
                                            <EditOutlined key="edit" style={{ color: '#faad14' }} onClick={() => handleOpenModal(topic)} />,
                                            <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} onClick={() => handleDelete(topic.id)} />,
                                        ]}
                                        style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}
                                        bodyStyle={{ padding: 24 }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <Title level={4} style={{ margin: 0, width: '70%' }} ellipsis={{ rows: 2 }}>{topic.title}</Title>
                                            <Tag color={topic.status === 'Open' ? 'green' : 'red'}>
                                                {topic.status === 'Open' ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                                            </Tag>
                                        </div>

                                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                            <div>
                                                <Text strong>วัตถุประสงค์:</Text>
                                                <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'อ่านต่อ' }} type="secondary" style={{ margin: 0 }}>
                                                    {topic.objective}
                                                </Paragraph>
                                            </div>
                                            <div>
                                                <Text strong>ขอบเขต:</Text>
                                                <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ margin: 0 }}>
                                                    {topic.scope}
                                                </Paragraph>
                                            </div>
                                        </Space>
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
            label: 'คำขออนุมัติหัวข้อ',
            children: (
                <div>
                    {proposals.length === 0 ? (
                        <Empty description="ไม่มีคำขออนุมัติหัวข้อขณะนี้" />
                    ) : (
                        <Row gutter={[24, 24]}>
                            {proposals.map(proposal => (
                                <Col xs={24} md={12} lg={12} key={proposal.id}>
                                    <Card
                                        hoverable
                                        onClick={() => handleViewProposal(proposal)}
                                        style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}
                                        bodyStyle={{ padding: 24 }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <Title level={4} style={{ margin: 0, width: '70%' }} ellipsis={{ rows: 2 }}>{proposal.title}</Title>
                                            <Tag color={
                                                proposal.status === 'Approved' ? 'success' :
                                                    proposal.status === 'Rejected' ? 'error' : 'warning'
                                            }>
                                                {proposal.status === 'Approved' ? 'อนุมัติแล้ว' :
                                                    proposal.status === 'Rejected' ? 'ไม่อนุมัติ' : 'รอพิจารณา'}
                                            </Tag>
                                        </div>
                                        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <TeamOutlined style={{ color: '#1890ff' }} />
                                            <Text>กลุ่มที่ {proposal.group?.group_number}</Text>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                            <Button type="primary" ghost size="small">ดูรายละเอียด</Button>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
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
            <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
                        <ProjectOutlined style={{ marginRight: 10, color: '#8A011D' }} />
                        จัดการหัวข้อโครงงาน
                    </Title>
                    <Text type="secondary">เสนอหัวข้อโครงงานของคุณ และพิจารณาหัวข้อที่นักศึกษาเสนอ</Text>
                </div>

                <Tabs defaultActiveKey="1" items={items} />

                {/* Add/Edit Topic Modal */}
                <Modal
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ background: '#e6f7ff', padding: 8, borderRadius: '50%', display: 'flex' }}>
                                <ProjectOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                            </div>
                            <span>{editingTopic ? 'แก้ไขหัวข้อโครงงาน' : 'เสนอหัวข้อโครงงานใหม่'}</span>
                        </div>
                    }
                    open={isModalOpen}
                    onCancel={handleCloseModal}
                    footer={null}
                    centered
                    width={600}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        style={{ marginTop: 24 }}
                    >
                        <Form.Item
                            name="title"
                            label="ชื่อหัวข้อโครงงาน"
                            rules={[{ required: true, message: 'กรุณากรอกชื่อหัวข้อ' }]}
                        >
                            <Input placeholder="เช่น ระบบจัดการ..." size="large" />
                        </Form.Item>

                        <Form.Item
                            name="objective"
                            label="วัตถุประสงค์"
                            rules={[{ required: true, message: 'กรุณากรอกวัตถุประสงค์' }]}
                        >
                            <TextArea rows={3} placeholder="ระบุสิ่งที่ต้องการให้สําเร็จ..." />
                        </Form.Item>

                        <Form.Item
                            name="scope"
                            label="ขอบเขตของงาน"
                            rules={[{ required: true, message: 'กรุณากรอกขอบเขตของงาน' }]}
                        >
                            <TextArea rows={3} placeholder="ระบุขอบเขต เทคโนโลยี หรือสิ่งที่ส่งมอบ..." />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="รายละเอียดเพิ่มเติม"
                        >
                            <TextArea rows={3} placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)..." />
                        </Form.Item>

                        <Form.Item
                            name="attachment"
                            label="แนบไฟล์เอกสารเพิ่มเติม (ถ้ามี)"
                            valuePropName="fileList"
                            getValueFromEvent={(e) => {
                                if (Array.isArray(e)) {
                                    return e;
                                }
                                return e?.fileList;
                            }}
                        >
                            <Upload maxCount={1} beforeUpload={() => false}>
                                <Button icon={<UploadOutlined />}>คลิกเพื่อแนบไฟล์</Button>
                            </Upload>
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                            <Space>
                                <Button onClick={handleCloseModal} size="large">ยกเลิก</Button>
                                <Button type="primary" htmlType="submit" size="large" style={{ background: '#1890ff', borderColor: '#1890ff' }}>
                                    {editingTopic ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Proposal View Modal */}
                <Modal
                    title="รายละเอียดโครงงานที่เสนอ"
                    open={isProposalModalOpen}
                    onCancel={() => setIsProposalModalOpen(false)}
                    footer={[
                        <Button key="close" onClick={() => setIsProposalModalOpen(false)}>
                            ปิด
                        </Button>,
                        selectedProposal?.status === 'Pending' && (
                            <Button key="reject" danger onClick={handleRejectClick} icon={<CloseCircleOutlined />}>
                                ไม่อนุมัติ
                            </Button>
                        ),
                        selectedProposal?.status === 'Pending' && (
                            <Button key="approve" type="primary" onClick={handleApprove} icon={<CheckCircleOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                                อนุมัติ
                            </Button>
                        ),
                    ]}
                    centered
                    width={700}
                >
                    {selectedProposal && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>ชื่อโครงงาน</Text>
                                <Title level={4} style={{ marginTop: 0 }}>{selectedProposal.title}</Title>
                            </div>

                            <Card size="small" style={{ background: '#fafafa' }}>
                                <Space>
                                    <TeamOutlined />
                                    <Text strong>เสนอโดย:</Text>
                                    <Text>กลุ่มที่ {selectedProposal.group?.group_number}</Text>
                                </Space>
                            </Card>



                            <Row gutter={16}>
                                <Col span={12}>
                                    <Text strong>วัตถุประสงค์:</Text>
                                    <Paragraph style={{ marginTop: 4 }}>{selectedProposal.objective}</Paragraph>
                                </Col>
                                <Col span={12}>
                                    <Text strong>ขอบเขต:</Text>
                                    <Paragraph style={{ marginTop: 4 }}>{selectedProposal.scope}</Paragraph>
                                </Col>
                            </Row>

                            <div>
                                <Text strong>รายละเอียดเพิ่มเติม:</Text>
                                <Paragraph style={{ marginTop: 4 }}>{selectedProposal.description}</Paragraph>
                            </div>

                            {selectedProposal.attachment && (
                                <div style={{ marginTop: 8 }}>
                                    <Text strong><PaperClipOutlined /> ไฟล์แนบ:</Text>
                                    <a href="#" style={{ marginLeft: 8 }} onClick={(e) => { e.preventDefault(); message.info('ดาวน์โหลดไฟล์จำลอง: ' + selectedProposal.attachment); }}>
                                        {selectedProposal.attachment}
                                    </a>
                                </div>
                            )}

                            {selectedProposal.status === 'Rejected' && (
                                <div style={{ marginTop: 16, padding: 12, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8 }}>
                                    <Text type="danger" strong>ไม่อนุมัติเนื่องจาก:</Text>
                                    <Paragraph type="danger" style={{ margin: 0 }}>
                                        {selectedProposal.approval?.comment}
                                    </Paragraph>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>

                {/* Reject Reason Modal */}
                <Modal
                    title="ระบุเหตุผลที่ไม่อนุมัติ"
                    open={isRejectModalOpen}
                    onCancel={() => setIsRejectModalOpen(false)}
                    onOk={handleConfirmReject}
                    okText="ยืนยันการไม่อนุมัติ"
                    okButtonProps={{ danger: true }}
                    cancelText="ยกเลิก"
                    centered
                >
                    <div style={{ padding: '20px 0' }}>
                        <Text>กรุณาระบุเหตุผลเพื่อให้คำแนะนำแก่นักศึกษา:</Text>
                        <TextArea
                            rows={4}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="เช่น ขอบเขตงานน้อยเกินไป, ซ้ำซ้อนกับหัวข้ออื่น..."
                            style={{ marginTop: 12 }}
                        />
                    </div>
                </Modal>
            </div>
        </ConfigProvider>
    );
}