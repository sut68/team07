"use client";
import { useState } from 'react';
import { Modal, Form, Input, Button, Flex, Popconfirm, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { CreateAppointmentType, DeleteAppointmentType } from '../../services/appointment';

interface TypeManagerProps {
    visible: boolean;
    onClose: () => void;
    types: any[];
    onRefresh: () => void;
}

export default function TypeManager({ visible, onClose, types, onRefresh }: TypeManagerProps) {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleCreate = async (values: any) => {
        setLoading(true);
        try {
            await CreateAppointmentType(values);
            message.success("เพิ่มประเภทสำเร็จ");
            form.resetFields();
            onRefresh();
        } catch (error) {
            message.error("เพิ่มไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await DeleteAppointmentType(id);
            message.success("ลบสำเร็จ");
            onRefresh();
        } catch (error) {
            message.error("ลบไม่สำเร็จ");
        }
    };

    return (
        <Modal
            title="🏷️ จัดการประเภทการนัดหมาย"
            open={visible}
            onCancel={onClose}
            footer={null}
            centered
        >
            {/* Form เพิ่ม */}
            <Form form={form} layout="inline" onFinish={handleCreate} className="mb-6 w-full flex gap-2">
                <Form.Item name="name" className="flex-1 m-0" rules={[{ required: true, message: 'ระบุชื่อ' }]}>
                    <Input placeholder="ชื่อประเภท (เช่น สอบปากเปล่า)" />
                </Form.Item>
                <Form.Item className="m-0">
                    <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />} className="bg-[#9a0120]">
                        เพิ่ม
                    </Button>
                </Form.Item>
            </Form>

            {/* รายการ */}
            <Flex vertical gap={8} className="max-h-60 overflow-y-auto border rounded p-2">
                {types?.map((item) => (
                    <div
                        key={item.id}
                        className="flex justify-between items-center border-b last:border-none pb-1"
                    >
                        <span>{item.name}</span>

                        <Popconfirm title="ยืนยันลบ?" onConfirm={() => handleDelete(item.id)}>
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </div>
                ))}
            </Flex>

        </Modal>
    );
}