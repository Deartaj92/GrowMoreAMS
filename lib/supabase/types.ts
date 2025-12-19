// Database types for Grow More AMS
// These types match the Supabase database schema

export interface Student {
  id: number;
  academy_no: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  admission_date?: string | null;
  notification_channel?: "whatsapp" | "sms";
  picture_url?: string | null;
  dob?: string | null;
  student_id?: string | null; // Form B / NIC
  gender?: "Male" | "Female" | "Other";
  cast?: string | null;
  orphan?: string | null;
  osc?: string | null; // OSC Number
  id_mark?: string | null; // Identification Mark
  blood_group?: "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-" | "Unknown" | null;
  qualification_class?: string | null; // Qualification/Class
  religion?: "Muslim" | "Christianity" | "Hinduism" | "Sikhism" | "Other";
  nationality?: "Pakistani" | "Afghan" | "Other";
  disease?: string | null;
  additional_note?: string | null;
  total_siblings?: number | null;
  address?: string | null;
  // Father/Guardian Information
  father_name?: string | null;
  father_national_id?: string | null;
  father_education?: string | null;
  father_mobile?: string | null;
  father_occupation?: string | null;
  father_income?: number | null;
  // Mother Information
  mother_name?: string | null;
  mother_national_id?: string | null;
  mother_education?: string | null;
  mother_mobile?: string | null;
  mother_occupation?: string | null;
  mother_income?: number | null;
  // Status
  status?: "active" | "inactive" | "graduated";
  created_at?: string;
  updated_at?: string;
}

export interface Program {
  id: number;
  academy_no: string;
  code: string;
  name: string;
  description?: string | null;
  duration?: number | null;
  duration_unit?: "years" | "months" | null;
  fee_amount?: number | null;
  status?: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  academy_no: string;
  full_name?: string | null;
  email?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Schedule {
  id: number;
  academy_no: string;
  program_id: number;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string; // TIME format
  end_time: string; // TIME format
  subject_name?: string | null;
  instructor_name?: string | null;
  room_number?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StudentProgram {
  id: number;
  academy_no: string;
  student_id: number;
  program_id: number;
  schedule_id?: number | null;
  fee_amount?: number | null;
  enrollment_date?: string | null;
  status?: "active" | "completed" | "withdrawn";
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id: number;
  academy_no: string;
  student_id: number;
  program_id?: number | null;
  schedule_id?: number | null;
  attendance_date: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string | null;
  marked_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface FeePlan {
  id: number;
  academy_no: string;
  student_id: number;
  program_id: number;
  actual_fee: number;
  discount_amount: number;
  discount_percent: number;
  fee_after_discount: number;
  effective_from: string;
  discount_type?: string | null;
  discount_reason?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface FeeChallan {
  id: number;
  academy_no: string;
  fee_plan_id: number;
  student_id: number;
  program_id: number;
  challan_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  paid_amount?: number | null;
  status: "pending" | "paid" | "overdue" | "cancelled" | "partially_paid";
  payment_date?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  notes?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface FeePayment {
  id: number;
  academy_no: string;
  challan_id: number;
  student_id: number;
  amount: number;
  payment_date: string;
  payment_method?: string | null;
  payment_reference?: string | null;
  notes?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Database table type (matches Supabase table name)
export interface Database {
  public: {
    Tables: {
      students: {
        Row: Student;
        Insert: Omit<Student, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Student, "id" | "created_at">>;
      };
      programs: {
        Row: Program;
        Insert: Omit<Program, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Program, "id" | "created_at">>;
      };
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      schedules: {
        Row: Schedule;
        Insert: Omit<Schedule, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Schedule, "id" | "created_at">>;
      };
      student_programs: {
        Row: StudentProgram;
        Insert: Omit<StudentProgram, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<StudentProgram, "id" | "created_at">>;
      };
      attendance: {
        Row: Attendance;
        Insert: Omit<Attendance, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Attendance, "id" | "created_at">>;
      };
      fee_plans: {
        Row: FeePlan;
        Insert: Omit<FeePlan, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<FeePlan, "id" | "created_at">>;
      };
      fee_challans: {
        Row: FeeChallan;
        Insert: Omit<FeeChallan, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<FeeChallan, "id" | "created_at">>;
      };
      fee_payments: {
        Row: FeePayment;
        Insert: Omit<FeePayment, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<FeePayment, "id" | "created_at">>;
      };
    };
  };
}

