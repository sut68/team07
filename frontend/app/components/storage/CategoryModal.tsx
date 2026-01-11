import React from 'react';
import { Modal, Button, Typography, Row, Col } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { TAG_CATEGORIES } from '@/app/interfaces/storage';

const { Title, Text } = Typography;

interface CategoryModalProps {
    open: boolean;
    onCancel: () => void;
    selectedTags: string[];
    onTagToggle: (tag: string) => void;
    projectCount?: number;
    mode?: 'filter' | 'select';
}

const CategoryModal: React.FC<CategoryModalProps> = ({ open, onCancel, selectedTags, onTagToggle, projectCount = 0, mode = 'filter' }) => {
    return (
        <Modal
            title={null}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={800}
            centered
            className="category-modal"
            styles={{ body: { padding: '24px' } }}
        >
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap');
                
                .category-modal,
                .category-modal .ant-typography,
                .category-modal .ant-btn,
                .category-modal * {
                    font-family: 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif !important;
                }
            `}</style>
            <div style={{ marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>
                    {mode === 'select' ? 'เลือกคำสำคัญของโครงงาน' : 'ค้นหาตามหมวดหมู่'}
                </Title>
                <Text type="secondary">
                    {mode === 'select' ? 'เลือกคำสำคัญที่ตรงกับโครงงานของคุณเพื่อช่วยในการค้นหา' : 'เลือกหมวดหมู่ที่สนใจเพื่อกรองผลลัพธ์โครงงาน'}
                </Text>
            </div>

            <Row gutter={[24, 24]}>
                {TAG_CATEGORIES.map((category, index) => (
                    <Col span={24} key={index}>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <div style={{ width: '180px', flexShrink: 0, paddingRight: 16, paddingTop: 4 }}>
                                <Title level={5} style={{ margin: 0, color: '#1a1a1a', fontSize: '14px' }}>
                                    {category.title}
                                </Title>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {category.options.map((option) => {
                                    const isSelected = selectedTags.includes(option.value);
                                    return (
                                        <div
                                            key={option.value}
                                            onClick={() => onTagToggle(option.value)}
                                            style={{
                                                cursor: 'pointer',
                                                color: isSelected ? '#1890ff' : '#666',
                                                backgroundColor: isSelected ? '#e6f7ff' : '#f5f5f5',
                                                border: isSelected ? '1px solid #1890ff' : '1px solid transparent',
                                                borderRadius: '20px',
                                                padding: '4px 12px',
                                                fontSize: '13px',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6
                                            }}
                                        >
                                            {option.label}
                                            {isSelected && <CheckOutlined style={{ fontSize: 10 }} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>

            <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #eee', textAlign: 'right' }}>
                <Button size="large" onClick={onCancel}>
                    {mode === 'select' ? 'ปิด' : 'ปิดหน้าต่าง'}
                </Button>
                <Button
                    type="primary"
                    size="large"
                    style={{ marginLeft: 12 }}
                    onClick={onCancel}
                >
                    {mode === 'select' ? 'ยืนยันการเลือก' : `ดูผลลัพธ์ (${projectCount})`}
                </Button>
            </div>
        </Modal>
    );
};

export default CategoryModal;
