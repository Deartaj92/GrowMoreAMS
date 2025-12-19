// Student feature types
import { BaseEntity } from "@/types";

export interface Student extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  enrollmentDate?: string;
  status?: "active" | "inactive" | "graduated";
}

