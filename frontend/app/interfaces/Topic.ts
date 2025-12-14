import { GroupProject } from './Group';

export type TopicStatus = 'Open' | 'Closed' | 'Pending' | 'Approved' | 'Rejected';

export interface Topic {
    id: number;
    title: string;
    objective: string;
    scope: string;
    description: string;
    status: TopicStatus;
    attachment?: string; 
    proposerId: number;
    proposerRole: 'Teacher' | 'Student';

    approval?: TopicApproval;
    group?: GroupProject; // Group info for proposals 
}

export interface TopicApproval {
    id: number;
    topicId: number;
    status: TopicStatus;
    comment: string;
    TeacherId: number;
}