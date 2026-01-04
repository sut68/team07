export interface IProject {
    ID: number;
    title: string;
    abstract: string;
    keywords: string;
    year: number;
    status: string;
    file_path: string;
    selection_id: number;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface ICreateProjectRequest {
    abstract: string;
    keywords: string;
    project_document?: File;
}

export interface IUpdateProjectRequest {
    abstract?: string;
    keywords?: string;
    status?: string;
    project_document?: File;
}
