"use client";
import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Modal, Form, Input, Tag, Space, Empty, message, Upload } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ProjectOutlined, UploadOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Topic } from '@/app/interfaces/Topic';
import { getTopics, createTopic, updateTopic, deleteTopic } from '@/app/services/topic';
import { GetMe } from '@/app/services/login';
import CustomEmptyState from '@/app/components/topic/CustomEmptyState';
import Swal from 'sweetalert2';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function TeacherMyTopicPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [form] = Form.useForm();
    const [teacherID, setTeacherID] = useState<number | null>(null);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);

    // View Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewTopic, setViewTopic] = useState<Topic | null>(null);

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
                const myTopicsRes = await getTopics({ teacher_id: currentTeacherID, filter: 'my_topics', proposer_role: 'Teacher' });
                setTopics(myTopicsRes.data || []);
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

    const handleViewTopic = (topic: Topic) => {
        setViewTopic(topic);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (values: any) => {
        try {
            const formData = new FormData();
            formData.append('title', values.title);
            formData.append('objective', values.objective);
            formData.append('scope', values.scope);
            formData.append('description', values.description || '');
            formData.append('proposer_role', 'Teacher');

            if (values.attachment && values.attachment.fileList && values.attachment.fileList.length > 0) {
                formData.append('file_attachment', values.attachment.fileList[0].originFileObj);
            } else if (values.attachment && values.attachment.length > 0 && values.attachment[0].originFileObj) {
                formData.append('file_attachment', values.attachment[0].originFileObj);
            }

            if (teacherID) {
                formData.append('teacher_id', teacherID.toString());
            }

            if (editingTopic) {
                await updateTopic(editingTopic.ID, formData);
                Swal.fire({
                    title: 'สำเร็จ',
                    text: 'แก้ไขหัวข้อโครงงานเรียบร้อยแล้ว',
                    icon: 'success',
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#8A011D'
                });
            } else {
                await createTopic(formData);
                Swal.fire({
                    title: 'สำเร็จ',
                    text: 'เพิ่มหัวข้อโครงงานเรียบร้อยแล้ว',
                    icon: 'success',
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#8A011D'
                });
            }
            handleCloseModal();
            fetchData();
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
            text: 'คุณแน่ใจหรือไม่ที่จะลบหัวข้อนี้?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteTopic(id);
                    Swal.fire({
                        title: 'สำเร็จ',
                        text: 'ลบหัวข้อเรียบร้อยแล้ว',
                        icon: 'success',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#8A011D'
                    });
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
    };

    return (
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
                <CustomEmptyState
                    title="ยังไม่มีหัวข้อโครงงาน"
                    description={
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                            <span>เริ่มต้นโดยการเสนอหัวข้อโครงงานใหม่ เพื่อให้นักศึกษาเลือก</span>
                        </div>
                    }
                    icon={<ProjectOutlined />}
                />
            ) : (
                <Row gutter={[24, 24]}>
                    {topics.map(topic => (
                        <Col xs={24} md={12} lg={12} key={topic.ID}>
                            <Card
                                hoverable
                                onClick={() => handleViewTopic(topic)}
                                actions={[
                                    <EditOutlined key="edit" style={{ color: '#faad14' }} onClick={(e) => { e.stopPropagation(); handleOpenModal(topic); }} />,
                                    <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} onClick={(e) => { e.stopPropagation(); handleDelete(topic.ID); }} />,
                                ]}
                                style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}
                                bodyStyle={{ padding: 24 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <Title level={4} style={{ margin: 0, width: '70%' }} ellipsis={{ rows: 2 }}>{topic.title}</Title>
                                    <Space orientation="vertical" align="end" size={0}>
                                        {(topic as any).selected_by_group ? (
                                            <Tag color="red">
                                                ถูกเลือกโดยกลุ่ม {(topic as any).selected_by_group.group_number}
                                            </Tag>
                                        ) : (
                                            <Tag color={topic.status === 'Approved' ? 'green' : 'red'}>
                                                {topic.status === 'Approved' ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                                            </Tag>
                                        )}
                                    </Space>
                                </div>

                                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
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

            {/* View Details Modal */}
            <Modal
                title="รายละเอียดหัวข้อโครงงาน"
                open={isViewModalOpen}
                onCancel={() => setIsViewModalOpen(false)}
                footer={[
                    <Button key="edit" type="primary" ghost icon={<EditOutlined />} onClick={() => { setIsViewModalOpen(false); handleOpenModal(viewTopic!); }}>
                        แก้ไข
                    </Button>,
                    <Button key="close" onClick={() => setIsViewModalOpen(false)}>
                        ปิด
                    </Button>
                ]}
                centered
                width={700}
            >
                {viewTopic && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>ชื่อหัวข้อ</Text>
                                <Title level={4} style={{ marginTop: 0 }}>{viewTopic.title}</Title>
                            </div>
                            {(viewTopic as any).selected_by_group ? (
                                <Tag color="red">
                                    ถูกเลือกโดยกลุ่ม {(viewTopic as any).selected_by_group.group_number}
                                </Tag>
                            ) : (
                                <Tag color={viewTopic.status === 'Approved' ? 'green' : 'red'}>
                                    {viewTopic.status === 'Approved' ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                                </Tag>
                            )}
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
                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/uploads/topics/${viewTopic.file_attachment}`}
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

            {/* Add/Edit Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ background: '#fff0e6ff', padding: 8, borderRadius: '50%', display: 'flex' }}>
                            <ProjectOutlined style={{ color: '#f76212ff', fontSize: 18 }} />
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
                            <Button type="primary" htmlType="submit" size="large" style={{ background: '#8A011D', borderColor: '#8A011D' }}>
                                {editingTopic ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
