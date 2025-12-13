"use client";
import React, { useState, useEffect } from 'react';
import { Modal, Button, Collapse, Form, Input, InputNumber, Popconfirm, message, Empty } from 'antd';
import { 
    PlusOutlined, DeleteOutlined, EditOutlined, SettingOutlined, BarsOutlined 
} from '@ant-design/icons';
import { 
    ListCriteria, GetCriteriaById, 
    CreateCriteria, UpdateCriteria, DeleteCriteria, 
    CreateCriteriaLevel, UpdateCriteriaLevel, DeleteCriteriaLevel 
} from '../../services/evaluation';

// ใช้ CSS ไฟล์เดียวกัน
import '../../style/evaluation.css';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function CriteriaManager({ visible, onClose }: Props) {
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal States for Criteria (เกณฑ์ย่อย)
    const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
    const [editingCriteria, setEditingCriteria] = useState<any>(null);
    const [selectedEvalId, setSelectedEvalId] = useState<number | null>(null);

    // Modal States for Level (Rubric)
    const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState<any>(null);
    const [selectedCriteriaId, setSelectedCriteriaId] = useState<number | null>(null);

    const [form] = Form.useForm();
    const [levelForm] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await ListCriteria();
            if (res.status === 200) {
                // Fetch detail ของแต่ละ Evaluation Type (เช่น Advisor, Committee)
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

    // --- Save Handlers ---
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
            message.error("บันทึกไม่สำเร็จ");
        }
    };

    const handleDeleteCriteria = async (id: number) => {
        try {
            await DeleteCriteria(id);
            message.success("ลบเกณฑ์สำเร็จ");
            fetchData();
        } catch { message.error("ลบไม่สำเร็จ"); }
    };

    const handleSaveLevel = async (values: any) => {
        try {
            if (editingLevel) {
                await UpdateCriteriaLevel(editingLevel.id, values);
                message.success("แก้ไข Rubric สำเร็จ");
            } else {
                await CreateCriteriaLevel({ ...values, criteria_id: selectedCriteriaId });
                message.success("เพิ่ม Rubric สำเร็จ");
            }
            setIsLevelModalOpen(false);
            fetchData();
        } catch { message.error("บันทึกไม่สำเร็จ"); }
    };

    const handleDeleteLevel = async (id: number) => {
        try {
            await DeleteCriteriaLevel(id);
            message.success("ลบ Rubric สำเร็จ");
            fetchData();
        } catch { message.error("ลบไม่สำเร็จ"); }
    };

    // --- Render Items ---
    const collapseItems = evaluations.map((eva) => ({
        key: eva.id,
        label: (
            <div className="custom-collapse-header">
                <span style={{fontWeight: 700, fontSize: '1.1rem'}}>{eva.name} <span style={{fontWeight:400, color:'#666', fontSize:'0.9rem'}}>(เต็ม {eva.total_score})</span></span>
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
            <div>
                {eva.criteria?.length > 0 ? eva.criteria.map((cri: any) => (
                    <div key={cri.id} style={{marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8, background: '#fafafa'}}>
                        {/* Header ของแต่ละเกณฑ์ */}
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 12}}>
                            <div>
                                <h4 style={{margin:0, color: '#333', fontWeight: 600}}>{cri.name}</h4>
                                <span className="tag-badge">เต็ม {cri.max_score} คะแนน</span>
                            </div>
                            <div className="manager-actions">
                                <Button size="small" icon={<EditOutlined />} onClick={() => {
                                    setEditingCriteria(cri);
                                    form.setFieldsValue(cri);
                                    setIsCriteriaModalOpen(true);
                                }}/>
                                <Popconfirm title="ลบเกณฑ์นี้?" onConfirm={() => handleDeleteCriteria(cri.id)}>
                                    <Button size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                            </div>
                        </div>

                        {/* List ของ Level (Rubric) */}
                        <div style={{paddingLeft: 16, borderLeft: '3px solid #e2e8f0'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                                <span style={{fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase'}}>Rubric Levels</span>
                                <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => {
                                    setSelectedCriteriaId(cri.id);
                                    setEditingLevel(null);
                                    levelForm.resetFields();
                                    setIsLevelModalOpen(true);
                                }}>เพิ่มตัวเลือก</Button>
                            </div>

                            {cri.levels?.length > 0 ? cri.levels.map((lvl: any) => (
                                <div key={lvl.id} className="manager-list-item">
                                    <div style={{display:'flex', alignItems:'center', gap: 12}}>
                                        <span className="level-badge">{lvl.score} คะแนน</span>
                                        <span style={{color: '#475569'}}>{lvl.description}</span>
                                    </div>
                                    <div className="manager-actions">
                                        <Button type="text" size="small" icon={<EditOutlined />} className="text-blue-500" onClick={() => {
                                            setEditingLevel(lvl);
                                            levelForm.setFieldsValue(lvl);
                                            setIsLevelModalOpen(true);
                                        }}/>
                                        <Popconfirm title="ลบ?" onConfirm={() => handleDeleteLevel(lvl.id)}>
                                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </div>
                                </div>
                            )) : <Empty description="ยังไม่มีตัวเลือกคะแนน" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                        </div>
                    </div>
                )) : <Empty description="ยังไม่มีเกณฑ์การให้คะแนน" />}
            </div>
        )
    }));

    return (
        <Modal
            title={<div style={{display:'flex', alignItems:'center', gap: 8, color: '#9a0120'}}><SettingOutlined /> ตั้งค่าเกณฑ์การประเมิน (Rubric)</div>}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
            centered
        >
            <div style={{marginTop: 16}}>
                <Collapse accordion items={collapseItems} />
            </div>

            {/* Modal: Add/Edit Criteria */}
            <Modal
                title={editingCriteria ? "แก้ไขหัวข้อเกณฑ์" : "เพิ่มหัวข้อเกณฑ์"}
                open={isCriteriaModalOpen}
                onCancel={() => setIsCriteriaModalOpen(false)}
                onOk={() => form.submit()}
                destroyOnClose
                centered
            >
                <Form form={form} layout="vertical" onFinish={handleSaveCriteria}>
                    <Form.Item name="name" label="ชื่อหัวข้อเกณฑ์ (เช่น ความถูกต้องของเนื้อหา)" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
                        <Form.Item name="max_score" label="คะแนนเต็ม" rules={[{ required: true }]}>
                            <InputNumber min={0} style={{width:'100%'}} />
                        </Form.Item>
                        <Form.Item name="order" label="ลำดับการแสดงผล" rules={[{ required: true }]}>
                            <InputNumber min={1} style={{width:'100%'}} />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>

            {/* Modal: Add/Edit Level */}
            <Modal
                title={editingLevel ? "แก้ไขตัวเลือกคะแนน (Rubric)" : "เพิ่มตัวเลือกคะแนน (Rubric)"}
                open={isLevelModalOpen}
                onCancel={() => setIsLevelModalOpen(false)}
                onOk={() => levelForm.submit()}
                destroyOnClose
                centered
            >
                <Form form={levelForm} layout="vertical" onFinish={handleSaveLevel}>
                    <Form.Item name="description" label="คำอธิบาย (เช่น ดีมาก, พอใช้)" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="score" label="คะแนนที่ได้" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{width:'100%'}} />
                    </Form.Item>
                </Form>
            </Modal>
        </Modal>
    );
}