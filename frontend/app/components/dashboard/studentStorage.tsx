"use client";

import { useEffect, useState } from 'react';
import {  Table,Spin, Empty } from 'antd';
import { useRouter } from 'next/navigation';
import { getProjects } from '@/app/services/storage';
import { ProjectStorage } from '@/app/interfaces/storage';


export default function StudentStorage() {
    const router = useRouter();
    const [projects, setProjects] = useState<ProjectStorage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await getProjects({ role: 'Student' });
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigateToStorage = () => {
        router.push('/student/storage');
    };

    const columns = [
        {
            title: 'ชื่อโครงงาน',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: 'ปี',
            dataIndex: 'year',
            key: 'year',
            width: 80,
            align: 'center' as const,
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className='student-storage-dashboard'>
            <div className='student-storage-dashboard__header'>
                <div>
                    <h2>คลังโครงงาน</h2>
                    <p>ดูโครงงานในปีการศึกษาที่ผ่านมา</p>
                </div>
            </div>

            <div className='student-storage-dashboard__body'>
                {projects.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="ยังไม่มีโครงงานในคลัง"
                    />
                ) : (
                    <Table
                        columns={columns}
                        dataSource={projects.slice(0, 10)}
                        rowKey="ID"
                        pagination={false}
                        size="middle"
                        showHeader={false}
                        onRow={() => ({
                            onClick: () => handleNavigateToStorage(),
                            style: { cursor: 'pointer' },
                        })}
                    />
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <span
                    onClick={handleNavigateToStorage}
                    style={{
                        color: '#6b7280',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                    ดูรายละเอียดโครงงาน →
                </span>
            </div>
        </div>
    );
}
