"use client";
import React, { useState, useEffect } from 'react';
import { Modal, Button, Collapse, List, Form, Input, InputNumber, Popconfirm, message, Tag, Space, Flex } from 'antd';
import {
    PlusOutlined, DeleteOutlined, EditOutlined, SettingOutlined
} from '@ant-design/icons';
import {
    ListCriteria, GetCriteriaById,
    CreateCriteria, UpdateCriteria, DeleteCriteria,
    CreateCriteriaLevel, UpdateCriteriaLevel, DeleteCriteriaLevel
} from '../../services/evaluation';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function CriteriaManager({ visible, onClose }: Props) {
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
    const [editingCriteria, setEditingCriteria] = useState<any>(null);
    const [selectedEvalId, setSelectedEvalId] = useState<number | null>(null);

    const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState<any>(null);
    const [selectedCriteriaId, setSelectedCriteriaId] = useState<number | null>(null);

    const [form] = Form.useForm();
    const [levelForm] = Form.useForm();

    // โหลดข้อมูล
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await ListCriteria();
            if (res.status === 200) {
                const fullData = await Promise.all(
                    res.data.map(async (eva: any) => {
                        const detailRes = await GetCriteriaById(eva.id);
                        return detailRes.data;
                    })
                );
                setEvaluations(fullData);
            }
        } catch (error) {
            message.error("โหลดข้อมูลเกณฑ์ไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) fetchData();
    }, [visible]);

    // บันทึก Criteria
    const handleSaveCriteria = async (values: any) => {
        try {
            if (editingCriteria) {
                await UpdateCriteria(editingCriteria.id, values);
                message.success("แก้ไขเกณฑ์สำเร็จ");
            } else {
                await CreateCriteria({ ...values, evaluation_id: selectedEvalId });
                message.success("เพิ่มเกณฑ์สำเร็จ");
            }
            setIsCriteriaModalOpen(false);
            fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.error || "บันทึกไม่สำเร็จ");
        }
    };

    const handleDeleteCriteria = async (id: number) => {
        try {
            await DeleteCriteria(id);
            message.success("ลบเกณฑ์สำเร็จ");
            fetchData();
        } catch (error) {
            message.error("ลบไม่สำเร็จ");
        }
    };

    // บันทึก Level
    const handleSaveLevel = async (values: any) => {
        try {
            if (editingLevel) {
                await UpdateCriteriaLevel(editingLevel.id, values);
                message.success("แก้ไขตัวเลือกสำเร็จ");
            } else {
                await CreateCriteriaLevel({ ...values, criteria_id: selectedCriteriaId });
                message.success("เพิ่มตัวเลือกสำเร็จ");
            }
            setIsLevelModalOpen(false);
            fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.error || "บันทึกไม่สำเร็จ");
        }
    };

    const handleDeleteLevel = async (id: number) => {
        try {
            await DeleteCriteriaLevel(id);
            message.success("ลบตัวเลือกสำเร็จ");
            fetchData();
        } catch (error) {
            message.error("ลบไม่สำเร็จ");
        }
    };

    // ----------  สร้าง Collapse Items ใหม่ ----------
    const collapseItems = evaluations.map((eva) => ({
        key: eva.id,
        label: (
            <div className="flex justify-between items-center w-full pr-4">
                <span className="font-bold text-lg">
                    {eva.name}
                    <span className="text-gray-400 text-sm font-normal"> (เต็ม {eva.total_score} คะแนน)</span>
                </span>

                <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    className="bg-blue-600"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvalId(eva.id);
                        setEditingCriteria(null);
                        form.resetFields();
                        setIsCriteriaModalOpen(true);
                    }}
                >
                    เพิ่มเกณฑ์
                </Button>
            </div>
        ),

        children: (
            <Flex vertical gap={12}>
                {eva.criteria?.map((cri: any) => (
                    <div
                        key={cri.id}
                        className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start mb-3 border-b pb-2">
                            <div>
                                <h4 className="font-bold text-gray-800">{cri.name}</h4>
                                <Tag color="geekblue">เต็ม {cri.max_score} คะแนน</Tag>
                            </div>
                            <Space>
                                <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => {
                                        setEditingCriteria(cri);
                                        form.setFieldsValue({
                                            name: cri.name,
                                            max_score: cri.max_score,
                                            order: cri.order,
                                        });
                                        setIsCriteriaModalOpen(true);
                                    }}
                                >
                                    แก้ไข
                                </Button>

                                <Popconfirm
                                    title="ลบเกณฑ์นี้?"
                                    onConfirm={() => handleDeleteCriteria(cri.id)}
                                >
                                    <Button size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                            </Space>
                        </div>

                        {/* LEVELS */}
                        <div className="pl-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">ตัวเลือกคะแนน (Rubric)</span>

                                <Button
                                    type="dashed"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                        setSelectedCriteriaId(cri.id);
                                        setEditingLevel(null);
                                        levelForm.resetFields();
                                        setIsLevelModalOpen(true);
                                    }}
                                >
                                    เพิ่มตัวเลือก
                                </Button>
                            </div>

                            {cri.levels?.length > 0 ? (
                                <div className="grid gap-2">
                                    {cri.levels.map((lvl: any) => (
                                        <div key={lvl.id} className="flex justify-between items-center bg-white p-2 rounded border">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[#9a0120] w-8 text-center">{lvl.score}</span>
                                                <span className="text-gray-700">{lvl.description}</span>
                                            </div>

                                            <Space size="small">
                                                <EditOutlined
                                                    className="text-blue-500 cursor-pointer"
                                                    onClick={() => {
                                                        setEditingLevel(lvl);
                                                        levelForm.setFieldsValue(lvl);
                                                        setIsLevelModalOpen(true);
                                                    }}
                                                />
                                                <Popconfirm title="ลบตัวเลือก?" onConfirm={() => handleDeleteLevel(lvl.id)}>
                                                    <DeleteOutlined className="text-red-500 cursor-pointer" />
                                                </Popconfirm>
                                            </Space>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400 italic">ยังไม่มีตัวเลือก</div>
                            )}
                        </div>
                    </div>
                ))}
            </Flex>
                )
    }));

                return (
                <Modal
                    title={<div className="text-xl font-bold text-[#9a0120] flex items-center gap-2"><SettingOutlined /> จัดการเกณฑ์การประเมิน</div>}
                    open={visible}
                    onCancel={onClose}
                    footer={null}
                    width={900}
                    centered
                    className="top-10"
                >
                    <div className="max-h-[70vh] overflow-y-auto p-2">
                        <Collapse accordion items={collapseItems} />
                    </div>

                    {/* Modal สำหรับ Criteria */}
                    <Modal
                        title={editingCriteria ? "แก้ไขเกณฑ์" : "เพิ่มเกณฑ์ใหม่"}
                        open={isCriteriaModalOpen}
                        onCancel={() => setIsCriteriaModalOpen(false)}
                        onOk={() => form.submit()}
                        destroyOnHidden
                    >
                        <Form form={form} layout="vertical" onFinish={handleSaveCriteria}>
                            <Form.Item name="name" label="ชื่อเกณฑ์" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>

                            <div className="grid grid-cols-2 gap-4">
                                <Form.Item name="max_score" label="คะแนนเต็ม" rules={[{ required: true }]}>
                                    <InputNumber min={0} className="w-full" />
                                </Form.Item>
                                <Form.Item name="order" label="ลำดับข้อ" rules={[{ required: true }]}>
                                    <InputNumber min={1} className="w-full" />
                                </Form.Item>
                            </div>
                        </Form>
                    </Modal>


                    {/* Modal สำหรับ Level */}
                    <Modal
                        title={editingLevel ? "แก้ไขตัวเลือกคะแนน" : "เพิ่มตัวเลือกคะแนน"}
                        open={isLevelModalOpen}
                        onCancel={() => setIsLevelModalOpen(false)}
                        onOk={() => levelForm.submit()}
                        destroyOnClose
                    >
                        <Form form={levelForm} layout="vertical" onFinish={handleSaveLevel}>
                            <Form.Item name="description" label="คำอธิบาย" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="score" label="คะแนน" rules={[{ required: true }]}>
                                <InputNumber min={0} className="w-full" />
                            </Form.Item>
                        </Form>
                    </Modal>
                </Modal>
                );
}
