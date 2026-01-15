import React from 'react';
import { Typography } from 'antd';

const { Title, Text } = Typography;

interface CustomEmptyStateProps {
    title: string;
    description: React.ReactNode;
    icon: React.ReactNode;
}

const CustomEmptyState: React.FC<CustomEmptyStateProps> = ({ title, description, icon }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center',
        minHeight: 400
    }}>
        <div style={{
            fontSize: 48,
            color: '#c26072ff',
            marginBottom: 24,
            opacity: 0.9,
            background: '#fce6e8ff',
            borderRadius: '50%',
            padding: 24,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {icon}
        </div>
        <Title level={3} style={{ fontSize: 16, marginBottom: 10, color: '#333' }}>
            {title}
        </Title>
        <Text type="secondary" style={{ fontSize: 14, maxWidth: 600, lineHeight: 1.5 }}>
            {description}
        </Text>
    </div>
);

export default CustomEmptyState;
