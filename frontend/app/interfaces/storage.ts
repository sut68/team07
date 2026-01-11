export interface ProjectStorage {
    ID: number;
    id?: number;
    title: string;
    abstract: string;
    keywords: string;
    status: string;
    year: number;
    file_path: string;
    teacher_id: number;
    teacher?: {
        ID: number;
        id?: number;
        firstname: string;
        lastname: string;
    };
    CreatedAt: string;
    UpdatedAt: string;
}

export const TAG_CATEGORIES = [
    {
        title: "เทคโนโลยี / เครื่องมือ",
        options: [
            { value: "Web Application", label: "Web Application" },
            { value: "Mobile Application", label: "Mobile Application" },
            { value: "IoT", label: "IoT" },
            { value: "Embedded System", label: "Embedded System" },
            { value: "AI", label: "AI" },
            { value: "Machine Learning", label: "Machine Learning" },
            { value: "Deep Learning", label: "Deep Learning" },
            { value: "Cloud Computing", label: "Cloud Computing" },
            { value: "Blockchain", label: "Blockchain" },
            { value: "AR/VR", label: "AR/VR" },
        ]
    },
    {
        title: "แนวคิด / ปัญหาที่แก้",
        options: [
            { value: "Smart System", label: "Smart System" },
            { value: "Automation", label: "Automation" },
            { value: "Decision Support", label: "Decision Support" },
            { value: "Monitoring System", label: "Monitoring System" },
            { value: "Tracking System", label: "Tracking System" },
            { value: "Recommendation System", label: "Recommendation System" },
            { value: "Data Analytics", label: "Data Analytics" },
            { value: "Image Processing", label: "Image Processing" },
            { value: "Natural Language Processing", label: "Natural Language Processing" },
        ]
    },
    {
        title: "อุปกรณ์ / Hardware",
        options: [
            { value: "ESP32", label: "ESP32" },
            { value: "Arduino", label: "Arduino" },
            { value: "Raspberry Pi", label: "Raspberry Pi" },
            { value: "RFID", label: "RFID" },
            { value: "Sensor", label: "Sensor" },
            { value: "DHT22", label: "DHT22" },
            { value: "Camera", label: "Camera" },
            { value: "PLC", label: "PLC" },
            { value: "Actuator", label: "Actuator" },
        ]
    },
    {
        title: "Software / ภาษา / Framework",
        options: [
            { value: "Go", label: "Go" },
            { value: "Python", label: "Python" },
            { value: "Java", label: "Java" },
            { value: "JavaScript", label: "JavaScript" },
            { value: "React", label: "React" },
            { value: "Next.js", label: "Next.js" },
            { value: "Node.js", label: "Node.js" },
            { value: "Spring Boot", label: "Spring Boot" },
            { value: "MySQL", label: "MySQL" },
            { value: "PostgreSQL", label: "PostgreSQL" },
            { value: "MongoDB", label: "MongoDB" },
        ]
    },
    {
        title: "ขอบเขตการใช้งาน",
        options: [
            { value: "การศึกษา", label: "การศึกษา" },
            { value: "โรงพยาบาล", label: "โรงพยาบาล" },
            { value: "อุตสาหกรรม", label: "อุตสาหกรรม" },
            { value: "Smart City", label: "Smart City" },
            { value: "เกษตรอัจฉริยะ", label: "เกษตรอัจฉริยะ" },
            { value: "โลจิสติกส์", label: "โลจิสติกส์" },
            { value: "พลังงาน", label: "พลังงาน" },
            { value: "สิ่งแวดล้อม", label: "สิ่งแวดล้อม" },
        ]
    }
]; ``
