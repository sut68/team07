"use client";
import { useState, useEffect } from 'react';
import { Button, Empty, message, ConfigProvider, Select, Input, Tag, Row, Col } from 'antd';
import CustomEmptyState from '@/app/components/topic/CustomEmptyState';
import { SearchOutlined, AppstoreOutlined, FilterOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { ProjectStorage } from '@/app/interfaces/storage';
import { getProjects } from '@/app/services/storage';
import '../../../style/storage.css';

import ProjectCard from '../../../components/storage/ProjectCard';
import CategoryModal from '../../../components/storage/CategoryModal';
import ProjectDetailModal from '../../../components/storage/ProjectDetailModal';

const { Search } = Input;

const StudentStoragePage = () => {
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectStorage | null>(null);

    const [projects, setProjects] = useState<ProjectStorage[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<ProjectStorage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await getProjects({ year: selectedYear, keyword: searchKeyword, role: 'Student' });
            setProjects(res.data);
        } catch (error) {
            console.error("Failed to fetch projects", error);
            message.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [selectedYear, searchKeyword]);

    useEffect(() => {
        if (selectedTags.length > 0) {
            const filtered = projects.filter(project => {
                if (!project.keywords) return false;
                const projectKeywords = project.keywords.toLowerCase();
                return selectedTags.some(tag => projectKeywords.includes(tag.toLowerCase()));
            });
            setFilteredProjects(filtered);
        } else {
            setFilteredProjects(projects);
        }
    }, [projects, selectedTags]);

    const handleViewDetail = (project: ProjectStorage) => {
        setSelectedProject(project);
        setIsDetailModalOpen(true);
    };

    const handleSearch = (value: string) => {
        setSearchKeyword(value);
    };

    const handleTagToggle = (tag: string) => {
        const trimmedTag = tag.trim();
        setSelectedTags(prev => {
            if (prev.includes(trimmedTag)) {
                return prev.filter(t => t !== trimmedTag);
            } else {
                return [...prev, trimmedTag];
            }
        });
    };

    const handleYearChange = (value: number | undefined) => {
        setSelectedYear(value);
    };

    const handleDownload = () => {
        if (selectedProject?.file_path) {
            const link = document.createElement('a');
            const filePath = selectedProject.file_path.replace(/^\.\//, '');
            const fullPath = filePath.startsWith('uploads') ? filePath : `uploads/projects/${filePath}`;
            link.href = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/team07api"}/${fullPath}`;
            link.download = selectedProject.file_path.split('/').pop() || 'document';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            message.success('กำลังดาวน์โหลดไฟล์รายงาน...');
        } else {
            message.warning('ไม่พบไฟล์รายงานสำหรับโครงงานนี้');
        }
    };

    // Generate year options (Current Year + 1 down to 2543)
    const currentYear = new Date().getFullYear() + 543;
    const yearOptions = [];
    for (let i = currentYear + 1; i >= 2543; i--) {
        yearOptions.push({
            label: i.toString(),
            value: i
        });
    }

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#9a0120',
                    fontFamily: "'Noto Sans Thai', sans-serif",
                },
            }}
        >
            <div className="storage-page" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
                <div className="storage-container animate-fade-in">
                    <div className="page-title-box">
                        <h1>คลังโครงงาน</h1>
                        <p>ค้นหาและศึกษาโครงงานที่ผ่านมาเพื่อใช้เป็นแนวทางในการทำโครงงาน</p>
                    </div>

                    <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <Search
                            placeholder="ค้นหาโครงงาน ชื่ออาจารย์ที่ปรึกษา"
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            onSearch={handleSearch}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            style={{ flex: 4, minWidth: 300 }}
                        />
                        <Select
                            placeholder="ปีการศึกษา"
                            allowClear
                            size="large"
                            style={{ flex: 1, minWidth: 150 }}
                            options={[{ label: 'ทั้งหมด', value: 0 }, ...yearOptions]}
                            onChange={handleYearChange}
                            value={selectedYear}
                        />
                        <Button
                            type="default"
                            size="large"
                            icon={<AppstoreOutlined />}
                            onClick={() => setIsCategoryModalOpen(true)}
                            style={{ flex: 1, minWidth: 150, textAlign: 'left', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                            <span>เลือกหมวดหมู่ ({selectedTags.length})</span>
                        </Button>
                    </div>

                    {selectedTags.length > 0 && (
                        <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <span style={{ display: 'flex', alignItems: 'center', marginRight: 8, color: '#666' }}>
                                <FilterOutlined style={{ marginRight: 4 }} /> ที่เลือกไว้:
                            </span>
                            {selectedTags.map(tag => (
                                <Tag
                                    key={tag}
                                    closable
                                    onClose={() => handleTagToggle(tag)}
                                    color="blue"
                                    style={{ fontSize: 14, padding: '4px 10px' }}
                                >
                                    {tag}
                                </Tag>
                            ))}
                            <Button type="link" size="small" onClick={() => setSelectedTags([])} style={{ color: '#999' }}>
                                ล้างทั้งหมด
                            </Button>
                        </div>
                    )}

                    {filteredProjects.length === 0 && !loading ? (
                        <div style={{ marginTop: 40 }}>
                            <CustomEmptyState
                                title="ไม่พบโครงงาน"
                                description="ไม่พบโครงงานที่ตรงกับเงื่อนไขการค้นหา ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง"
                                icon={<FolderOpenOutlined />}
                            />
                        </div>
                    ) : (
                        <Row gutter={[24, 24]}>
                            {filteredProjects.map(project => (
                                <ProjectCard
                                    key={project.ID}
                                    project={project}
                                    onClick={handleViewDetail}
                                />
                            ))}
                        </Row>
                    )}

                    <CategoryModal
                        open={isCategoryModalOpen}
                        onCancel={() => setIsCategoryModalOpen(false)}
                        selectedTags={selectedTags}
                        onTagToggle={handleTagToggle}
                        projectCount={filteredProjects.length}
                    />

                    <ProjectDetailModal
                        open={isDetailModalOpen}
                        onCancel={() => setIsDetailModalOpen(false)}
                        project={selectedProject}
                        onDownload={handleDownload}
                    />
                </div>
            </div>
        </ConfigProvider>
    );
};

export default StudentStoragePage;