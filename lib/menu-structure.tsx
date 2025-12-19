import React from "react";
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as AccountBalanceIcon,
  BarChart as BarChartIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";

export interface MenuItem {
  title: string;
  description: string;
  icon: React.ReactElement;
  path: string;
  color: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface MainMenuItem {
  icon: React.ReactElement;
  path: string;
  label: string;
  hasDropdown: boolean;
  menuItems?: MenuSection[];
  columns: number;
}

// Student menu items
export const studentMenuItems: MenuItem[] = [
  {
    title: "All Students",
    description: "View and manage all student records",
    icon: React.createElement(PeopleIcon),
    path: "/students",
    color: "#3b82f6",
  },
  {
    title: "Add Student",
    description: "Register new students",
    icon: React.createElement(PersonAddIcon),
    path: "/students/admission",
    color: "#10b981",
  },
  {
    title: "Assign Programs",
    description: "Assign programs to students",
    icon: React.createElement(AssignmentIcon),
    path: "/students/assign-programs",
    color: "#f59e0b",
  },
];

// Main menu structure
export const menuItems: MainMenuItem[] = [
  {
    icon: React.createElement(PeopleIcon),
    path: "/students",
    label: "Students",
    hasDropdown: true,
    menuItems: [
      {
        title: "Student Management",
        items: studentMenuItems,
      },
    ],
    columns: 1,
  },
  {
    icon: React.createElement(SchoolIcon),
    path: "/academics",
    label: "Academics",
    hasDropdown: true,
    menuItems: [
      {
        title: "Academic Management",
        items: [
          {
            title: "Manage Programs",
            description: "Create and manage academic programs offered",
            icon: React.createElement(CategoryIcon),
            path: "/programs",
            color: "#3b82f6",
          },
          {
            title: "Class Schedules",
            description: "Manage class timings and schedules for programs",
            icon: React.createElement(ScheduleIcon),
            path: "/schedules",
            color: "#10b981",
          },
          {
            title: "Mark Attendance",
            description: "Mark student attendance",
            icon: React.createElement(CheckCircleIcon),
            path: "/attendance/mark",
            color: "#f59e0b",
          },
          {
            title: "Attendance Report",
            description: "View attendance reports and statistics",
            icon: React.createElement(CheckCircleIcon),
            path: "/attendance/report",
            color: "#8b5cf6",
          },
        ],
      },
    ],
    columns: 1,
  },
  {
    icon: React.createElement(AttachMoneyIcon),
    path: "/finance",
    label: "Finance",
    hasDropdown: true,
    menuItems: [
      {
        title: "Fee Management",
        items: [
          {
            title: "Fee Plans",
            description: "Manage student fee plans with discounts",
            icon: React.createElement(AccountBalanceIcon),
            path: "/fee-plans",
            color: "#8b5cf6",
          },
          {
            title: "Fee Challans",
            description: "Generate and manage fee challans",
            icon: React.createElement(ReceiptIcon),
            path: "/fee-challans",
            color: "#ef4444",
          },
          {
            title: "Fee Collection",
            description: "Record fee payments from students",
            icon: React.createElement(PaymentIcon),
            path: "/fee-collection",
            color: "#10b981",
          },
        ],
      },
    ],
    columns: 1,
  },
  {
    icon: React.createElement(SettingsIcon),
    path: "/settings",
    label: "Settings",
    hasDropdown: true,
    menuItems: [
      {
        title: "System Settings",
        items: [
          {
            title: "General Settings",
            description: "Configure general system settings",
            icon: React.createElement(SettingsIcon),
            path: "/settings/general",
            color: "#6366f1",
          },
        ],
      },
    ],
    columns: 1,
  },
];

