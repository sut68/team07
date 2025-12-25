export interface ProjectStorage {
    ID: number;
    title: string;
    abstract: string;
    keywords: string;
    year: number;
    file_path: string;
    teacher_id: number;
    teacher?: {
        ID: number;
        firstname: string;
        lastname: string;
    };
    CreatedAt: string;
    UpdatedAt: string;
}
