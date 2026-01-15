"use client";
import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Modal, Form, Input, Tag, Space, Empty, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, TeamOutlined, PaperClipOutlined, DeleteOutlined } from '@ant-design/icons';
import { Topic, statusMap } from '@/app/interfaces/Topic';
import { getTopics, approveTopic, deleteTopic } from '@/app/services/topic';
import { GetMe } from '@/app/services/login';
import CustomEmptyState from '@/app/components/topic/CustomEmptyState';
import Swal from 'sweetalert2';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function TeacherTopicApprovalPage() {
    const [teacherID, setTeacherID] = useState<number | null>(null);
    const [selectedProposal, setSelectedProposal] = useState<Topic | null>(null);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [proposals, setProposals] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            let currentTeacherID = teacherID;
            if (!currentTeacherID) {
                const user = await GetMe();
                currentTeacherID = user.id;
                setTeacherID(user.id);
            }

            if (currentTeacherID) {
                const proposalsRes = await getTopics({ teacher_id: currentTeacherID, filter: 'advisor', proposer_role: 'Student' });
                setProposals(proposalsRes.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
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

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = (proposal?: Topic) => {
        const target = proposal || selectedProposal;
        if (target) {
            Swal.fire({
                title: 'ยืนยันการลบ',
                text: `คุณต้องการลบหัวข้อ "${target.title}" หรือไม่?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'ลบ',
                cancelButtonText: 'ยกเลิก'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await deleteTopic(target.ID);
                        Swal.fire({
                            title: 'สำเร็จ',
                            text: 'ลบหัวข้อเรียบร้อยแล้ว',
                            icon: 'success',
                            confirmButtonText: 'ตกลง',
                            confirmButtonColor: '#8A011D'
                        });
                        setIsProposalModalOpen(false);
                        fetchData();
                    } catch (error) {
                        Swal.fire({
                            title: 'เกิดข้อผิดพลาด',
                            text: 'ลบหัวข้อไม่สำเร็จ',
                            icon: 'error',
                            confirmButtonText: 'ตกลง',
                            confirmButtonColor: '#8A011D'
                        });
                    }
                }
            });
        }
    };

    const handleViewProposal = (proposal: Topic) => {
        setSelectedProposal(proposal);
        setIsProposalModalOpen(true);
    };

    const handleApprove = () => {
        if (selectedProposal && teacherID) {
            Swal.fire({
                title: 'ยืนยันการอนุมัติ',
                text: `คุณต้องการอนุมัติหัวข้อ "${selectedProposal.title}" หรือไม่?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#52c41a',
                cancelButtonColor: '#d33',
                confirmButtonText: 'อนุมัติ',
                cancelButtonText: 'ยกเลิก'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await approveTopic(selectedProposal.ID, {
                            status: "Approved",
                            comment: "Approved by Advisor",
                            teacher_id: teacherID
                        });
                        Swal.fire({
                            title: 'สำเร็จ',
                            text: 'อนุมัติหัวข้อเรียบร้อยแล้ว',
                            icon: 'success',
                            confirmButtonText: 'ตกลง',
                            confirmButtonColor: '#8A011D'
                        });
                        setIsProposalModalOpen(false);
                        fetchData();
                    } catch (error) {
                        Swal.fire({
                            title: 'เกิดข้อผิดพลาด',
                            text: 'อนุมัติหัวข้อไม่สำเร็จ',
                            icon: 'error',
                            confirmButtonText: 'ตกลง',
                            confirmButtonColor: '#8A011D'
                        });
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
            Swal.fire({
                title: 'แจ้งเตือน',
                text: 'กรุณาระบุเหตุผลที่ไม่ผ่านการอนุมัติ',
                icon: 'warning',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#8A011D'
            });
            return;
        }
        if (selectedProposal && teacherID) {
            try {
                await approveTopic(selectedProposal.ID, {
                    status: "Rejected",
                    comment: rejectReason,
                    teacher_id: teacherID
                });
                Swal.fire({
                    title: 'สำเร็จ',
                    text: 'บันทึกผลการไม่อนุมัติเรียบร้อยแล้ว',
                    icon: 'success',
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#8A011D'
                });
                setIsRejectModalOpen(false);
                setIsProposalModalOpen(false);
                setRejectReason('');
                fetchData();
            } catch (error) {
                Swal.fire({
                    title: 'เกิดข้อผิดพลาด',
                    text: 'บันทึกผลไม่สำเร็จ',
                    icon: 'error',
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#8A011D'
                });
            }
        }
    };

    return (
        <div>
            <div>
                {proposals.length === 0 && !loading ? (
                    <CustomEmptyState
                        title="ยังไม่มีคำขออนุมัติ"
                        description="เมื่อนักศึกษาเสนอหัวข้อโครงงาน รายการคำขอจะปรากฏที่นี่เพื่อให้คุณพิจารณา"
                        icon={<TeamOutlined />}
                    />
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
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={(e) => { e.stopPropagation(); handleDelete(proposal); }}
                                        />
                                        <Button type="primary" ghost size="small">ดูรายละเอียด</Button>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

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
                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/uploads/topics/${selectedProposal.file_attachment}`}
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
    );
}
