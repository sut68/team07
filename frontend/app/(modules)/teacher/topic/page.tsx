"use client";
import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Modal, Form, Input, Tag, Space, Empty, message, ConfigProvider, Tabs, Upload } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ProjectOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined, FileTextOutlined, TeamOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { Topic, TopicApproval, statusMap } from '@/app/interfaces/Topic';
import { getTopics, createTopic, updateTopic, deleteTopic, approveTopic } from '@/app/services/topic';
import { GetMe } from '@/app/services/login';
import '../../../style/evaluation.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function TeacherTopicPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [form] = Form.useForm();
    const [teacherID, setTeacherID] = useState<number | null>(null);

    // Student Proposal States
    const [selectedProposal, setSelectedProposal] = useState<Topic | null>(null);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Data States
    const [topics, setTopics] = useState<Topic[]>([]);
    const [proposals, setProposals] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Get Current User (Teacher)
            let currentTeacherID = teacherID;
            if (!currentTeacherID) {
                const user = await GetMe();
                currentTeacherID = user.id;
                setTeacherID(user.id);
            }

            if (currentTeacherID) {
                // Fetch My Topics
                const myTopicsRes = await getTopics({ teacher_id: currentTeacherID, filter: 'my_topics', proposer_role: 'Teacher' });
                setTopics(myTopicsRes.data || []);

                // Fetch Advisor Proposals
                const proposalsRes = await getTopics({ teacher_id: currentTeacherID, filter: 'advisor', proposer_role: 'Student' });
                setProposals(proposalsRes.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
            message.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Teacher Topic Handlers
    const handleOpenModal = (topic?: Topic) => {
        if (topic) {
            setEditingTopic(topic);
            const formValues = {
                title: topic.title,
                objective: topic.objective,
                scope: topic.scope,
                description: topic.description,
                attachment: topic.file_attachment ? [
                    {
                        uid: '-1',
                        name: topic.file_attachment,
                        status: 'done',
                        url: '',
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

    const handleSubmit = async (values: any) => {
        try {
            const formData = new FormData();
            formData.append('title', values.title);
            formData.append('objective', values.objective);
            formData.append('scope', values.scope);
            formData.append('description', values.description || '');
            formData.append('proposer_role', 'Teacher');

            // Handle File
            if (values.attachment && values.attachment.fileList && values.attachment.fileList.length > 0) {
                // New file upload
                formData.append('file_attachment', values.attachment.fileList[0].originFileObj);
            } else if (values.attachment && values.attachment.length > 0 && values.attachment[0].originFileObj) {
                //Sometimes direct array depending on binding
                formData.append('file_attachment', values.attachment[0].originFileObj);
            }

            if (teacherID) {
                formData.append('teacher_id', teacherID.toString());
            }

            if (editingTopic) {
                await updateTopic(editingTopic.ID, formData);
                message.success('แก้ไขหัวข้อโครงงานเรียบร้อยแล้ว');
            } else {
                await createTopic(formData);
                message.success('เพิ่มหัวข้อโครงงานเรียบร้อยแล้ว');
            }
            handleCloseModal();
            fetchData();
        } catch (error) {
            console.error(error);
            message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'ยืนยันการลบ',
            content: 'คุณแน่ใจหรือไม่ที่จะลบหัวข้อนี้?',
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    await deleteTopic(id);
                    message.success('ลบหัวข้อเรียบร้อยแล้ว');
                    fetchData();
                } catch (error) {
                    message.error('ลบหัวข้อไม่สำเร็จ');
                }
            }
        });
    };

    // Student Proposal Handlers
    const handleViewProposal = (proposal: Topic) => {
        setSelectedProposal(proposal);
        setIsProposalModalOpen(true);
    };

    const handleApprove = () => {
        if (selectedProposal && teacherID) {
            Modal.confirm({
                title: 'ยืนยันการอนุมัติ',
                content: `คุณต้องการอนุมัติหัวข้อ "${selectedProposal.title}" หรือไม่?`,
                okText: 'อนุมัติ',
                cancelText: 'ยกเลิก',
                onOk: async () => {
                    try {
                        await approveTopic(selectedProposal.ID, {
                            status: "Approved",
                            comment: "Approved by Advisor",
                            teacher_id: teacherID
                        });
                        message.success('อนุมัติหัวข้อเรียบร้อยแล้ว');
                        setIsProposalModalOpen(false);
                        fetchData();
                    } catch (error) {
                        message.error('อนุมัติหัวข้อไม่สำเร็จ');
                    }
                }
            });
        }
    };

    const handleRejectClick = () => {
        setIsRejectModalOpen(true);
    };

    const handleConfirmReject = async () => {
        if (!rejectReason.trim()) {
            message.error('กรุณาระบุเหตุผลที่ไม่ผ่านการอนุมัติ');
            return;
        }
        if (selectedProposal && teacherID) {
            try {
                await approveTopic(selectedProposal.ID, {
                    status: "Rejected",
                    comment: rejectReason,
                    teacher_id: teacherID
                });
                message.success('บันทึกผลการไม่อนุมัติเรียบร้อยแล้ว');
                setIsRejectModalOpen(false);
                setIsProposalModalOpen(false);
                setRejectReason('');
                fetchData();
            } catch (error) {
                message.error('บันทึกผลไม่สำเร็จ');
            }
        }
    };

    const items = [
        {
            key: '1',
            label: 'หัวข้อของฉัน',
            children: (
                <div>
                    <Button
                        id="add-topic-btn"
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

                    {topics.length === 0 && !loading ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="ยังไม่มีหัวข้อโครงงาน"
                        >
                            <Button type="primary" onClick={() => handleOpenModal()}>เสนอหัวข้อแรกของคุณ</Button>
                        </Empty>
                    ) : (
                        <Row gutter={[24, 24]}>
                            {topics.map(topic => (
                                <Col xs={24} md={12} lg={12} key={topic.ID}>
                                    <Card
                                        hoverable
                                        onClick={() => handleViewProposal(topic)}
                                        actions={[
                                            <EditOutlined key="edit" style={{ color: '#faad14' }} onClick={(e) => { e.stopPropagation(); handleOpenModal(topic); }} />,
                                            <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} onClick={(e) => { e.stopPropagation(); handleDelete(topic.ID); }} />,
                                        ]}
                                        style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}
                                        bodyStyle={{ padding: 24 }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <Title level={4} style={{ margin: 0, width: '70%' }} ellipsis={{ rows: 2 }}>{topic.title}</Title>
                                            <Tag color={topic.status === 'Approved' ? 'green' : 'red'}>
                                                {topic.status === 'Approved' ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
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
                    {proposals.length === 0 && !loading ? (
                        <Empty description="ไม่มีคำขออนุมัติหัวข้อขณะนี้" />
                    ) : (
                        <Row gutter={[24, 24]}>
                            {proposals.map(proposal => (
                                <Col xs={24} md={12} lg={12} key={proposal.ID}>
                                    <Card
                                        hoverable
                                        onClick={() => handleViewProposal(proposal)}
                                        style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}
                                        bodyStyle={{ padding: 24 }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <Title level={4} style={{ margin: 0, width: '70%' }} ellipsis={{ rows: 2 }}>{proposal.title}</Title>

                                            <Tag color={statusMap[proposal.status]?.color || 'default'}>
                                                {statusMap[proposal.status]?.text || proposal.status}
                                            </Tag>

                                        </div>
                                        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <TeamOutlined style={{ color: '#1890ff' }} />
                                            <Text>กลุ่มที่ {proposal.group_project?.group_number || '-'}</Text>
                                            {/* อาจจะใส่ชื่อหัวหน้ากลุ่มด้วย เผื่อมันว่างไป */}
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
                <div className="page-title-box">
                    <h1>จัดการหัวข้อโครงงาน</h1>
                    <p>เสนอหัวข้อโครงงานของคุณ และพิจารณาหัวข้อที่นักศึกษาเสนอ</p>
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

                            {selectedProposal.proposer_role === 'Student' && (
                                <Card size="small" style={{ background: '#fafafa' }}>
                                    <Space>
                                        <TeamOutlined />
                                        <Text strong>เสนอโดย:</Text>
                                        <Text>กลุ่มที่ {selectedProposal.group_project?.group_number || '-'}</Text>
                                    </Space>
                                </Card>
                            )}

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

                            {selectedProposal.file_attachment && (
                                <div style={{ marginTop: 8 }}>
                                    <Text strong><PaperClipOutlined /> ไฟล์แนบ:</Text>
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/topics/${selectedProposal.file_attachment}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ marginLeft: 8 }}
                                    >
                                        {selectedProposal.file_attachment}
                                    </a>
                                </div>
                            )}

                            {selectedProposal.status === 'Rejected' && (
                                <div style={{ marginTop: 16, padding: 12, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8 }}>
                                    <Text type="danger" strong>ไม่อนุมัติเนื่องจาก:</Text>
                                    <Paragraph type="danger" style={{ margin: 0 }}>
                                        {selectedProposal.topic_approvals && selectedProposal.topic_approvals.length > 0
                                            ? selectedProposal.topic_approvals[selectedProposal.topic_approvals.length - 1].comment
                                            : ''}
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