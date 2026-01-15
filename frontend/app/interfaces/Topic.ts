import { GroupProject } from './Group';

export type TopicStatus = 'Approved' | 'Rejected' | 'Pending' | 'Closed';

export const statusMap: Record<TopicStatus, { color: string; text: string }> = {
  Approved: { color: 'success', text: 'อนุมัติแล้ว' },
  Rejected: { color: 'error', text: 'ไม่อนุมัติ' },
  Pending:  { color: 'warning', text: 'รอพิจารณา' },
  Closed:   { color: 'default', text: 'ปิดหัวข้อแล้ว' },
};


export interface Topic {
    ID: number;
    id?: number;
    title: string;
    objective: string;
    scope: string;
    description: string;
    status: TopicStatus;
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
    status: TopicStatus;
    comment: string;
    teacher_id: number;
    approval_date?: string;
}