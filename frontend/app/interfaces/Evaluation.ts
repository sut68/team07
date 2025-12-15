
export interface IEvaluationProject {
  id: number;
  group_number: number;
  project_name: string;
  status: "Pending" | "Graded";
  is_graded: boolean;
}

export interface IRubricLevel {
  id: number;
  description: string;
  score: number;
}

export interface ICriteriaForm {
  id: number;
  name: string;
  max_score: number;
  levels: IRubricLevel[];
}

export interface IStudentForm {
  student_id: number;
  code: string;
  name: string;
}

export interface IEvaluationFormResponse {
  appointment_id: number;
  project_id: number;
  project_name: string;
  eval_type: string;
  current_evaluation?: string;
  available_evaluations?: string[];
  
  group_criteria: ICriteriaForm[];
  individual_criteria: ICriteriaForm[];
  students: IStudentForm[];
  existing_scores?: Record<string, number>;
}


export interface IGroupScoreData {
  criteria_id: number;
  criteria_level_id?: number | null;
  score: number;
  comment?: string;
}

export interface IIndividualScoreData {
  student_id: number;
  criteria_id: number;
  criteria_level_id?: number | null;
  score: number;
}

export interface ISaveEvaluationRequest {
  appointment_id: number;
  group_scores: IGroupScoreData[];
  individual_scores: IIndividualScoreData[];
  evaluation_name?: string;
}

export interface IPeerScoreData {
  target_student_id: number;
  criteria_id: number;
  criteria_level_id?: number | null;
  score: number;
}

export interface ISaveEvaluationPeerRequest {
  appointment_id: number;
  scores: IPeerScoreData[];

}

export interface IEvaluationResultResponse {
  group_scores: IGroupScoreData[];
  individual_scores: IIndividualScoreData[];
}


export interface ISummaryDetail {
  evaluation_name: string;
  teacher_count: number;
  average_score: string;
  full_score: number;
}

export interface IEvaluationSummaryResponse {
  project_id: string;
  total_score: string;
  details: ISummaryDetail[];
}


export interface ICreateCriteriaRequest {
  name: string;
  max_score: number;
  order: number;
  evaluation_id: number;
}

export interface ICreateLevelRequest {
  description: string;
  score: number;
  criteria_id: number;
}