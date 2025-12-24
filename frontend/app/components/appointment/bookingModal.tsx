"use client";
import { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, Button, message, TimePicker, Tabs, Divider, Spin } from 'antd';
import { UserOutlined, RobotOutlined, DeploymentUnitOutlined, DeleteOutlined, SaveOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Toast_success, Toast_fail } from '../Webmessage';
import {
    SearchGroup, GetRandomGroup, CreateAppointment, AutoCreateAppointments, UpdateAppointment, DeleteAppointment
} from '../../services/appointment';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

const { Option } = Select;

interface ModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    rooms: any[];
    types: any[];
    initialData?: any;
}

export default function BookingModal({ visible, onClose, onSuccess, rooms, types, initialData }: ModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'manual' | 'auto'>('manual');
    const [groups, setGroups] = useState<any[]>([]);
    const [evaluations, setEvaluations] = useState<any[]>([]);

    // Mock evaluations data (In real app, fetch from API based on type)
    const mockEvaluations = [
        { id: 1, name: "Ethics Test", type_id: 3 },
        { id: 2, name: "Peer Assessment", type_id: 3 },
        { id: 3, name: "Advisor Evaluation", type_id: 3 },
        { id: 4, name: "Committee Evaluation", type_id: 3 },
    ];

    const handleSearch = async (value: string) => {
        try {
            const typeId = form.getFieldValue('type_id');
            const res = await SearchGroup(value, typeId, mode);
            setGroups(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleTypeChange = (value: any) => {
        const typeId = Number(value);
        handleSearch("");
        form.setFieldValue('group_id', undefined);
        form.setFieldValue('evaluation_id', undefined);

        if (typeId === 3 && mode === 'manual') {
             const available = mockEvaluations.filter(e => e.type_id === 3 && (e.name === "Ethics Test" || e.name === "Peer Assessment" || e.name === "Advisor Evaluation"));
             setEvaluations(available);
        } else {
            setEvaluations([]);
        }
    };

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setMode('manual');
                const start = dayjs(initialData.start_date_time);

                const typeId = (initialData.type_id || initialData.appointment_type_id);

                if (typeId === 3) {
                    if (initialData.evaluation_id === 4) {
                        // If currently Committee Evaluation (Auto), show all so it displays correctly
                        setEvaluations(mockEvaluations.filter(e => e.type_id === 3));
                    } else {
                        // If Manual, exclude Committee Evaluation so it cannot be selected
                        setEvaluations(mockEvaluations.filter(e => e.type_id === 3 && e.id !== 4));
                    }
                } else {
                    setEvaluations([]);
                }

                form.setFieldsValue({
                    date: start.clone(),
                    time_range: [
                        start.clone(),
                        start.clone().add(initialData.duration_min, 'minute')
                    ],
                    room_id: initialData.room_id ?? undefined,
                    type_id: typeId ?? undefined,
                    group_id: initialData.group_project_id ?? undefined,
                    evaluation_id: initialData.evaluation_id ?? undefined
                });


                setGroups([{
                    id: initialData.group_project_id,
                    project_name: initialData.group_name || `Group ${initialData.group_number}`
                }]);
            } else {
                form.resetFields();
                setMode('manual');
                form.setFieldsValue({
                    date: dayjs().add(1, 'day'),
                    duration_auto: 30,
                    time_range: [dayjs().hour(9).minute(0), dayjs().hour(10).minute(0)]
                });
                handleSearch("");
            }
        }
    }, [visible, initialData, form]);

    const handleRandom = async () => {
        setLoading(true);
        try {
            const res = await GetRandomGroup();
            if (res.data && res.data.id != null) {
                setGroups([res.data]);
                form.setFieldValue('group_id', res.data.id);
                message.success(`สุ่มได้กลุ่มที่: ${res.data.group_number}`);
            } else {
                message.warning("ข้อมูลกลุ่มไม่ถูกต้อง (id เป็น null)");
            }

        } catch (e) {
            message.warning("ไม่พบกลุ่มที่รอสอบ");
        } finally {
            setLoading(false);
        }
    };

    // บันทึก
    const handleSubmit = async (values: any) => {
        Modal.confirm({
            title: initialData ? 'ยืนยันการแก้ไขนัดหมาย' : 'ยืนยันการสร้างนัดหมาย',
            icon: <ExclamationCircleOutlined />,
            content: initialData ? 'คุณต้องการบันทึกการแก้ไขใช่หรือไม่?' : 'คุณต้องการสร้างนัดหมายนี้ใช่หรือไม่?',
            okText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                setLoading(true);
                try {
                    if (mode === 'manual') {
                        // --- Manual ---
                        const date = values.date.format('YYYY-MM-DD');
                        const startTime = values.time_range[0].format('HH:mm:00');
                        const endTime = values.time_range[1];
                        const duration = endTime.diff(values.time_range[0], 'minute');

                        const payload = {
                            start_date_time: `${date}T${startTime}+07:00`,
                            duration_min: duration,
                            appointment_status: "scheduled",
                            appointment_type_id: values.type_id,
                            room_id: values.room_id,
                            group_project_id: values.group_id,
                            evaluation_id: values.evaluation_id
                        };

                        if (initialData) {
                            await UpdateAppointment(initialData.id, payload);
                            Toast_success("แก้ไขเรียบร้อย");
                        } else {
                            await CreateAppointment(payload);
                            Toast_success("สร้างนัดหมายเรียบร้อย");
                        }
                    } else {
                        // --- Auto ---
                        const start = values.date_range[0].toISOString();
                        const end = values.date_range[1].toISOString();

                        await AutoCreateAppointments({
                            start_date_time: start,
                            end_date_time: end,
                            duration_min: values.duration_auto,
                            room_id: values.room_id,
                            appointment_type_id: values.type_id
                        });
                        Toast_success("จัดตารางอัตโนมัติสำเร็จ!");
                    }
                    onSuccess();
                    onClose();
                } catch (error: any) {
                    Toast_fail(error.response?.data?.error || "เกิดข้อผิดพลาด");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // ลบ
    const handleDelete = () => {
        Modal.confirm({
            title: 'ยืนยันการยกเลิก',
            content: 'การลบนี้จะทำให้สถานะกลุ่มกลับเป็น Pending คุณแน่ใจหรือไม่?',
            okText: 'ลบเลย',
            okType: 'danger',
            cancelText: 'ไม่ลบ',
            onOk: async () => {
                try {
                    await DeleteAppointment(initialData.id);
                    Toast_success("ลบเรียบร้อย");
                    onSuccess();
                    onClose();
                } catch (e) {
                    Toast_fail("ลบไม่สำเร็จ");
                }
            }
        });
    };

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            width={600}
            className="rounded-lg overflow-hidden"
            title={
                <div className="flex items-center gap-2 text-[#9a0120]">
                    {initialData ? <SaveOutlined /> : <UserOutlined />}
                    <span className="font-bold">{initialData ? 'แก้ไขนัดหมาย' : 'สร้างนัดหมายใหม่'}</span>
                </div>
            }
        >
            {/* Mode Switcher */}
            {!initialData && (
                <div className="flex bg-gray-100 p-3 rounded-xl mb-6 gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setMode('manual');
                            form.setFieldValue('type_id', undefined);
                            form.setFieldValue('group_id', undefined);
                            form.setFieldValue('evaluation_id', undefined);
                            setEvaluations([]);
                        }}
                        className={`flex-1 h-10 text-lg font-semibold rounded-xl transition-all 
                        flex items-center justify-center gap-3
                        ${mode === 'manual'
                                ? 'bg-white text-[#9a0120] shadow-md'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <UserOutlined style={{ fontSize: 20 }} />
                        นัดหมายเฉพาะที่ปรึกษา
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setMode('auto');
                            const finalType = types.find(t => t.id === 3 || t.name === "Final Defense");
                            if (finalType) form.setFieldValue('type_id', finalType.id);
                            form.setFieldValue('group_id', undefined);
                            form.setFieldValue('evaluation_id', undefined);
                            setEvaluations([]);
                        }}
                        className={`flex-1 h-10 text-lg font-semibold rounded-xl transition-all 
                            flex items-center justify-center gap-3
                            ${mode === 'auto'
                                ? 'bg-white text-purple-600 shadow-md'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <RobotOutlined style={{ fontSize: 20 }} />
                        นัดหมายสอบจบ
                    </button>
                </div>

            )}

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="room_id" label="ห้องสอบ" rules={[{ required: true }]}>
                        <Select placeholder="เลือกห้อง">
                            {rooms
                                ?.filter(r => r?.id != null)
                                .map(r => (
                                    <Option key={r.id} value={r.id}>
                                        {r.name}
                                    </Option>
                                ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="type_id" label="ประเภทการนัดหมาย" rules={[{ required: true }]}>
                        <Select placeholder="เลือกประเภท" onChange={handleTypeChange}>
                            {types
                                ?.filter(t => t?.id != null)
                                .filter(t => {
                                    if (mode === 'auto') return t.id === 3 || t.name === "Final Defense";
                                    return true;
                                })
                                .map(t => (
                                    <Option key={t.id} value={t.id}>
                                        {t.name}
                                    </Option>
                                ))}
                        </Select>
                    </Form.Item>

                    {evaluations.length > 0 && (
                        <Form.Item name="evaluation_id" label="แบบประเมิน" rules={[{ required: true }]}>
                            <Select placeholder="เลือกแบบประเมิน" disabled={initialData?.evaluation_id === 4}>
                                {evaluations.map(e => (
                                    <Option key={e.id} value={e.id}>
                                        {e.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                </div>

                <Divider style={{ margin: '12px 0' }} />

                {mode === 'manual' ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item name="date" label="วันที่" rules={[{ required: true }]}>
                                <DatePicker className="w-full" format="DD/MM/YYYY" />
                            </Form.Item>
                            <Form.Item name="time_range" label="ช่วงเวลา" rules={[{ required: true }]}>
                                <TimePicker.RangePicker
                                    className="w-full"
                                    format="HH:mm"
                                    minuteStep={30}
                                    hideDisabledOptions
                                    disabledTime={() => ({
                                        disabledHours: () => Array.from({ length: 24 }, (_, i) => i).filter(h => h < 9 || h > 20),
                                    })}
                                />
                            </Form.Item>
                        </div>
                        <div className="flex gap-2 items-end">
                            <Form.Item
                                name="group_id"
                                label="กลุ่มโครงงาน"
                                className="flex-1 mb-0"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{ required: true }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="พิมพ์ชื่อ/รหัสกลุ่ม..."
                                    filterOption={false}
                                    onSearch={handleSearch}
                                    notFoundContent={null}
                                >
                                    {groups
                                        ?.filter(g => g?.id != null)
                                        .map(g => (
                                            <Option key={g.id} value={g.id}>
                                                {g.project_name || `Group ${g.group_number}`}
                                            </Option>
                                        ))}
                                </Select>
                            </Form.Item>

                            <Form.Item className="mb-0">
                                <Button
                                    onClick={handleRandom}
                                    icon={<DeploymentUnitOutlined />}
                                >
                                    สุ่ม
                                </Button>
                            </Form.Item>
                        </div>

                    </>
                ) : (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <Form.Item name="date_range" label="ช่วงเวลาที่ต้องการ (เริ่ม - จบ)" rules={[{ required: true }]}>
                            <DatePicker.RangePicker
                                showTime={{
                                    format: 'HH:mm',
                                    minuteStep: 30,
                                    hideDisabledOptions: true,
                                    disabledTime: () => ({
                                        disabledHours: () => Array.from({ length: 24 }, (_, i) => i).filter(h => h < 9 || h > 20),
                                    }),
                                }}
                                format="DD/MM/YYYY HH:mm"
                                className="w-full"
                            />
                        </Form.Item>
                        <Form.Item name="duration_auto" label="เวลาต่อกลุ่ม (นาที)" rules={[{ required: true }]}>
                            <Select>
                                <Option value={15}>15 นาที</Option>
                                <Option value={30}>30 นาที</Option>
                                <Option value={60}>60 นาที</Option>
                            </Select>
                        </Form.Item>
                        <p className="text-xs text-purple-600 mt-2">* ระบบจะข้ามช่วงพักเที่ยง (12:00-13:00) ให้โดยอัตโนมัติ</p>
                    </div>
                )}

                <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
                    {initialData ? (
                        <Button danger type="text" icon={<DeleteOutlined />} onClick={handleDelete}>ยกเลิกนัด</Button>
                    ) : <div />}

                    <div className="flex gap-3">
                        <Button onClick={onClose}>ยกเลิก</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className={mode === 'auto' ? 'bg-purple-600' : 'bg-[#9a0120]'}
                        >
                            {mode === 'auto' ? 'เริ่มจัดตาราง' : 'บันทึก'}
                        </Button>
                    </div>
                </div>
            </Form>
        </Modal>
    );
}