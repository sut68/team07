import { GroupProject } from './Group';

export type TopicStatus = 'Open' | 'Closed' | 'Pending' | 'Approved' | 'Rejected';

export interface Topic {
    ID: number;
    id?: number; // Support for backend returning lowercase id
    title: string;
    objective: string;
    scope: string;
    description: string;
    status: string;
    file_attachment?: string;
    proposer_role: string;
    teacher_id?: number;
    group_project_id?: number;

    // Relations
    topic_approvals?: TopicApproval[];
    group_project?: GroupProject;
}

export interface TopicApproval {
    ID: number;
    topic_id: number;
    status: string;
    comment: string;
    teacher_id: number;
    approval_date?: string;
}