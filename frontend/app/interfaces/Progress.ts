export interface FullProgress {
    id: number;
    group_project_id: number;
    file: string;
    comment: string;
}

export interface PickProgress {
    group_project_id: number;
}

export interface AssignProgress {
    group_project_id: number;
    file: string;
    comment: string;
}

export interface UpdateProgress {
    id: number,
    file: string;
    comment: string;
}


export interface DeleteProgress {
    id: number;
}