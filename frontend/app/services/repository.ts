import { ProjectStorage } from '../interfaces/Repository';

// Mock data for development
const mockProjects: ProjectStorage[] = [
    {
        ID: 1,
        title: "ระบบจัดการโครงงานนักศึกษาออนไลน์",
        abstract: "ระบบที่พัฒนาขึ้นเพื่อช่วยในการจัดการโครงงานของนักศึกษา ตั้งแต่การเสนอหัวข้อ การติดตามความคืบหน้า การนัดหมายกับอาจารย์ที่ปรึกษา และการประเมินผล ระบบนี้ช่วยให้การบริหารจัดการโครงงานมีประสิทธิภาพมากขึ้น",
        keywords: "project management, student, web application, online system",
        year: 2024,
        file_path: "project_2024_001.pdf",
        teacher_id: 1,
        teacher: {
            id: 1,
            first_name: "สมชาย",
            last_name: "ใจดี"
        },
        CreatedAt: "2024-06-15T10:30:00Z",
        UpdatedAt: "2024-06-15T10:30:00Z"
    },
    {
        ID: 2,
        title: "แอปพลิเคชันจัดการการเงินส่วนบุคคล",
        abstract: "แอปพลิเคชันมือถือที่ช่วยให้ผู้ใช้สามารถบันทึกรายรับรายจ่าย วิเคราะห์พฤติกรรมการใช้จ่าย และวางแผนการเงินได้อย่างมีประสิทธิภาพ พร้อมกราฟและรายงานที่เข้าใจง่าย",
        keywords: "mobile app, finance, personal finance, budget planning, React Native",
        year: 2024,
        file_path: "project_2024_002.pdf",
        teacher_id: 2,
        teacher: {
            id: 2,
            first_name: "สมหญิง",
            last_name: "รักเรียน"
        },
        CreatedAt: "2024-05-20T14:15:00Z",
        UpdatedAt: "2024-05-20T14:15:00Z"
    },
    {
        ID: 3,
        title: "ระบบแนะนำหนังสือด้วย Machine Learning",
        abstract: "ระบบที่ใช้เทคนิค Machine Learning ในการวิเคราะห์พฤติกรรมการอ่านของผู้ใช้และแนะนำหนังสือที่เหมาะสม โดยใช้ Collaborative Filtering และ Content-based Filtering เพื่อเพิ่มความแม่นยำในการแนะนำ",
        keywords: "machine learning, recommendation system, collaborative filtering, Python, data science",
        year: 2023,
        file_path: "project_2023_015.pdf",
        teacher_id: 1,
        teacher: {
            id: 1,
            first_name: "สมชาย",
            last_name: "ใจดี"
        },
        CreatedAt: "2023-11-10T09:00:00Z",
        UpdatedAt: "2023-11-10T09:00:00Z"
    },
    {
        ID: 4,
        title: "เว็บไซต์อีคอมเมิร์ซสำหรับผลิตภัณฑ์ท้องถิ่น",
        abstract: "แพลตฟอร์มอีคอมเมิร์ซที่เชื่อมโยงผู้ผลิตสินค้าท้องถิ่นกับผู้บริโภค มีระบบจัดการสินค้า ระบบชำระเงิน และระบบติดตามพัสดุ เพื่อส่งเสริมเศรษฐกิจชุมชน",
        keywords: "e-commerce, local products, web development, payment gateway, Next.js",
        year: 2023,
        file_path: "project_2023_022.pdf",
        teacher_id: 3,
        teacher: {
            id: 3,
            first_name: "วิชัย",
            last_name: "สุขใจ"
        },
        CreatedAt: "2023-10-05T16:45:00Z",
        UpdatedAt: "2023-10-05T16:45:00Z"
    },
    {
        ID: 5,
        title: "ระบบตรวจจับและแจ้งเตือนอัคคีภัยด้วย IoT",
        abstract: "ระบบที่ใช้เซ็นเซอร์ตรวจจับควันและความร้อนเชื่อมต่อกับ IoT Platform เพื่อแจ้งเตือนผ่านแอปพลิเคชันมือถือแบบ Real-time พร้อมระบบบันทึกข้อมูลและวิเคราะห์แนวโน้ม",
        keywords: "IoT, fire detection, sensor, real-time alert, Arduino, mobile notification",
        year: 2023,
        file_path: "project_2023_008.pdf",
        teacher_id: 2,
        teacher: {
            id: 2,
            first_name: "สมหญิง",
            last_name: "รักเรียน"
        },
        CreatedAt: "2023-09-18T11:20:00Z",
        UpdatedAt: "2023-09-18T11:20:00Z"
    },
    {
        ID: 6,
        title: "แชทบอทช่วยตอบคำถามเกี่ยวกับมหาวิทยาลัย",
        abstract: "แชทบอทที่ใช้ Natural Language Processing เพื่อตอบคำถามเกี่ยวกับข้อมูลมหาวิทยาลัย เช่น หลักสูตร การลงทะเบียน สถานที่ต่างๆ และกิจกรรม สามารถเรียนรู้จากการสนทนาและปรับปรุงคำตอบได้",
        keywords: "chatbot, NLP, natural language processing, AI, student services",
        year: 2022,
        file_path: "project_2022_031.pdf",
        teacher_id: 1,
        teacher: {
            id: 1,
            first_name: "สมชาย",
            last_name: "ใจดี"
        },
        CreatedAt: "2022-12-01T13:30:00Z",
        UpdatedAt: "2022-12-01T13:30:00Z"
    }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getProjects = async (params?: { year?: number; keyword?: string }): Promise<{ data: ProjectStorage[] }> => {
    await delay(300);

    let filtered = [...mockProjects];

    if (params?.year) {
        filtered = filtered.filter(p => p.year === params.year);
    }

    if (params?.keyword) {
        const keyword = params.keyword.toLowerCase();
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(keyword) ||
            p.abstract.toLowerCase().includes(keyword) ||
            p.keywords.toLowerCase().includes(keyword)
        );
    }

    return { data: filtered };
};

export const getProject = async (id: number): Promise<{ data: ProjectStorage }> => {
    await delay(200);

    const project = mockProjects.find(p => p.ID === id);
    if (!project) {
        throw new Error('Project not found');
    }

    return { data: project };
};

export const createProject = async (formData: FormData): Promise<{ data: ProjectStorage }> => {
    await delay(500);

    const newProject: ProjectStorage = {
        ID: mockProjects.length + 1,
        title: formData.get('title') as string,
        abstract: formData.get('abstract') as string,
        keywords: formData.get('keywords') as string,
        year: parseInt(formData.get('year') as string),
        file_path: 'mock_file.pdf',
        teacher_id: parseInt(formData.get('teacher_id') as string || '1'),
        teacher: {
            id: 1,
            first_name: "สมชาย",
            last_name: "ใจดี"
        },
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
    };

    mockProjects.push(newProject);
    return { data: newProject };
};

export const updateProject = async (id: number, formData: FormData): Promise<{ data: ProjectStorage }> => {
    await delay(500);

    const index = mockProjects.findIndex(p => p.ID === id);
    if (index === -1) {
        throw new Error('Project not found');
    }

    mockProjects[index] = {
        ...mockProjects[index],
        title: formData.get('title') as string || mockProjects[index].title,
        abstract: formData.get('abstract') as string || mockProjects[index].abstract,
        keywords: formData.get('keywords') as string || mockProjects[index].keywords,
        year: parseInt(formData.get('year') as string) || mockProjects[index].year,
        UpdatedAt: new Date().toISOString()
    };

    return { data: mockProjects[index] };
};

export const deleteProject = async (id: number): Promise<{ data: number }> => {
    await delay(300);

    const index = mockProjects.findIndex(p => p.ID === id);
    if (index === -1) {
        throw new Error('Project not found');
    }

    mockProjects.splice(index, 1);
    return { data: id };
};
