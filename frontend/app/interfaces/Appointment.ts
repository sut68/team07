export interface IRoom {
  id: number;
  name: string;
  location: string;
  capacity: number;
}

export interface IAppointmentType {
  id: number;
  name: string;
}

export interface IGroupSearchResult {
  id: number;
  group_number: number;
  group_status: string;
  advisor_id?: number;
  advisor_name?: string;
}

export interface IAppointment {
  id: number;
  start_date_time: string;
  duration_min: number;
  appointment_status: string;
  

  type_name: string;
  room_name: string;
  location: string;
  group_number: number;
  group_name: string;
  teacher_id: number;
  teacher_name: string;
  evaluation_name?: string;
}

export interface IAppointmentDetail extends IAppointment {
  type_id: number;
  room_id: number;
  group_project_id: number;
  group_status: string;
  teacher_id: number;
  teacher_email: string;
  teacher_phone: string;
}

export interface ICreateAppointmentRequest {
  start_date_time: string;
  duration_min: number;
  appointment_status: string;
  appointment_type_id: number;
  room_id: number;
  group_project_id: number;
  evaluation_id?: number;
}

export interface IAutoScheduleRequest {
  start_date_time: string;
  end_date_time: string;
  duration_min: number;
  room_id: number;
  appointment_type_id: number;
}

export interface IUpdateAppointmentRequest {
  start_date_time?: string;
  duration_min?: number;
  room_id?: number;
}

export interface IStudentAppointmentSlot {
  id: number;
  type: string;
  date_time: string;
  room: string;
  location: string;
  evaluation_name?: string;
}

export interface IStudentAppointmentOverview {
  appointments?: IStudentAppointmentSlot[];
  appointment?: IStudentAppointmentSlot | null;
  group_number?: number | string;
  project_name?: string;
  advisor_name?: string;
}