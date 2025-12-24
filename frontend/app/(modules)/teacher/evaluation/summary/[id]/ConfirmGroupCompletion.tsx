"use client";
import { useState } from 'react';
import { Button, Modal, message } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { UpdateGroupStatus } from '../../../../../services/group';
import { Toast_success,Toast_fail } from '../../../../../components/Webmessage';
interface ConfirmGroupCompletionProps {
    groupId: number;
    currentStatus?: string;
    onSuccess?: () => void;
}

export default function ConfirmGroupCompletion({ groupId, currentStatus, onSuccess }: ConfirmGroupCompletionProps) {
    const [loading, setLoading] = useState(false);
    const isCompleted = currentStatus === "Completed";

    const showConfirm = () => {
        if (isCompleted) return;
        
        Modal.confirm({
            title: 'ยืนยันกลุ่มจบการศึกษา',
            icon: <ExclamationCircleOutlined />,
            content: 'ถ้ายืนยันกลุ่มนี้จะถือว่าจบหลักสูตร และคนที่ไม่ติด F จะให้ผ่าน ต้องการยืนยันหรือไม่?',
            okText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            onOk: handleConfirm,
        });
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const res = await UpdateGroupStatus(groupId, "Completed");
            if (res) {
                Toast_success("อัปเดตสถานะกลุ่มเรียบร้อยแล้ว");
                if (onSuccess) onSuccess();
            } else {
                Toast_fail("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
            }
        } catch (error: any) {
            Toast_fail(error?.response?.data?.error || "เกิดข้อผิดพลาดในการอัปเดตสถานะ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button 
            type="primary" 
            icon={isCompleted ? <CheckCircleOutlined /> : <CheckCircleOutlined />} 
            onClick={showConfirm}
            loading={loading}
            disabled={isCompleted}
            style={{ 
                backgroundColor: isCompleted ? '#52c41a' : '#9a0120', 
                borderColor: isCompleted ? '#52c41a' : '#9a0120',
                opacity: isCompleted ? 0.8 : 1
            }}
        >
            {isCompleted ? "กลุ่มจบการศึกษาแล้ว" : "ยืนยันกลุ่มจบ"}
        </Button>
    );
}
