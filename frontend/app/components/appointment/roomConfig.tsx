"use client";
import { useState } from 'react';
import { Modal, Form, Input, InputNumber, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Toast_success, Toast_fail } from '../Webmessage';
import { CreateRoom } from '../../services/appointment';

interface RoomConfigProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RoomConfig({ visible, onClose, onSuccess }: RoomConfigProps) {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            await CreateRoom(values);
            Toast_success("เพิ่มห้องสอบใหม่สำเร็จ");
            form.resetFields();
            onSuccess();
            onClose();
        } catch (error: any) {
            Toast_fail(error?.response?.data?.error || "บันทึกไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="เพิ่มห้องสอบใหม่"
            open={visible}
            onCancel={onClose}
            footer={null}
            centered
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit} className="pt-4">
                <Form.Item name="name" label="ชื่อห้อง (เช่น B1212)" rules={[{ required: true }]}>
                    <Input placeholder="ระบุชื่อห้อง" />
                </Form.Item>
                <Form.Item name="location" label="สถานที่ / อาคาร" rules={[{ required: true }]}>
                    <Input placeholder="ระบุตึก หรือ ชั้น" />
                </Form.Item>
                <Form.Item name="capacity" label="ความจุ (คน)" rules={[{ required: true }]}>
                    <InputNumber min={1} className="w-full" />
                </Form.Item>

                <div className="flex justify-end gap-2 mt-6">
                    <Button onClick={onClose}>ยกเลิก</Button>
                    <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />} className="bg-[#9a0120]">
                        บันทึก
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}