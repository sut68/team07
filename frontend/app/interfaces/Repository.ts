export interface ProjectStorage {
    ID: number;
    title: string;
    abstract: string;
    keywords: string;
    year: number;
    file_path: string;
    teacher_id: number;
    teacher?: {
        id: number;
        first_name: string;
        last_name: string;
    };
    CreatedAt: string;
    UpdatedAt: string;
}
