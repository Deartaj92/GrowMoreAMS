"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  EventBusy as EventBusyIcon,
  CalendarMonth as CalendarMonthIcon,
  BarChart as BarChartIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/lib/toast/toast-context";
import { Student, Program, StudentProgram, Attendance, FeePlan, FeeChallan, FeePayment } from "@/lib/supabase/types";
import { useRouter } from "next/navigation";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalPrograms: number;
  activePrograms: number;
  totalAssignments: number;
  activeAssignments: number;
  totalSchedules: number;
  recentStudents: Student[];
  topPrograms: { program_id: number; count: number; program_name: string }[];
  attendanceToday: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
  };
  attendanceThisWeek: {
    total: number;
    present: number;
    percentage: number;
  };
  attendanceThisMonth: {
    total: number;
    present: number;
    percentage: number;
  };
  feeStats: {
    totalFeePlans: number;
    activeFeePlans: number;
    totalChallans: number;
    pendingChallans: number;
    paidChallans: number;
    overdueChallans: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    thisMonthPayments: number;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalPrograms: 0,
    activePrograms: 0,
    totalAssignments: 0,
    activeAssignments: 0,
    totalSchedules: 0,
    recentStudents: [],
    topPrograms: [],
    attendanceToday: {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      percentage: 0,
    },
    attendanceThisWeek: {
      total: 0,
      present: 0,
      percentage: 0,
    },
    attendanceThisMonth: {
      total: 0,
      present: 0,
      percentage: 0,
    },
    feeStats: {
      totalFeePlans: 0,
      activeFeePlans: 0,
      totalChallans: 0,
      pendingChallans: 0,
      paidChallans: 0,
      overdueChallans: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      thisMonthPayments: 0,
    },
  });

  useEffect(() => {
    if (user?.academy_no) {
      loadDashboardData();
    }
  }, [user?.academy_no]);

  const loadDashboardData = async () => {
    if (!user?.academy_no) return;

    setLoading(true);

    try {
      // Load students
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("academy_no", user.academy_no)
        .order("created_at", { ascending: false })
        .limit(5);

      if (studentsError) throw studentsError;

      const { count: totalStudents } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("academy_no", user.academy_no);

      const { count: activeStudents } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("academy_no", user.academy_no)
        .eq("status", "active");

      // Load programs
      const { count: totalPrograms } = await supabase
        .from("programs")
        .select("*", { count: "exact", head: true })
        .eq("academy_no", user.academy_no);

      const { count: activePrograms } = await supabase
        .from("programs")
        .select("*", { count: "exact", head: true })
        .eq("academy_no", user.academy_no)
        .eq("status", "active");

      // Load assignments
      const { count: totalAssignments } = await supabase
        .from("student_programs")
        .select("*", { count: "exact", head: true })
        .eq("academy_no", user.academy_no);

      const { count: activeAssignments } = await supabase
        .from("student_programs")
        .select("*", { count: "exact", head: true })
        .eq("academy_no", user.academy_no)
        .eq("status", "active");

      // Load schedules
      const { count: totalSchedules } = await supabase
        .from("schedules")
        .select("*", { count: "exact", head: true })
        .eq("academy_no", user.academy_no)
        .eq("is_active", true);

      // Load top programs by enrollment
      const { data: assignmentsData } = await supabase
        .from("student_programs")
        .select("program_id")
        .eq("academy_no", user.academy_no)
        .eq("status", "active");

      // Count enrollments per program
      const programCounts: { [key: number]: number } = {};
      assignmentsData?.forEach((assignment) => {
        programCounts[assignment.program_id] = (programCounts[assignment.program_id] || 0) + 1;
      });

      // Get program names
      const { data: programsData } = await supabase
        .from("programs")
        .select("id, name")
        .eq("academy_no", user.academy_no);

      const topPrograms = Object.entries(programCounts)
        .map(([program_id, count]) => {
          const program = programsData?.find((p) => p.id === parseInt(program_id));
          return {
            program_id: parseInt(program_id),
            count,
            program_name: program?.name || "Unknown",
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Load attendance data
      const today = format(new Date(), "yyyy-MM-dd");
      const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date()), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      // Today's attendance
      const { data: todayAttendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("attendance_date", today);

      const todayStats = {
        total: todayAttendance?.length || 0,
        present: todayAttendance?.filter((a) => a.status === "present").length || 0,
        absent: todayAttendance?.filter((a) => a.status === "absent").length || 0,
        late: todayAttendance?.filter((a) => a.status === "late").length || 0,
        excused: todayAttendance?.filter((a) => a.status === "excused").length || 0,
        percentage: 0,
      };
      todayStats.percentage =
        todayStats.total > 0 ? Math.round((todayStats.present / todayStats.total) * 100) : 0;

      // This week's attendance
      const { data: weekAttendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("academy_no", user.academy_no)
        .gte("attendance_date", weekStart)
        .lte("attendance_date", weekEnd);

      const weekStats = {
        total: weekAttendance?.length || 0,
        present: weekAttendance?.filter((a) => a.status === "present" || a.status === "late").length || 0,
        percentage: 0,
      };
      weekStats.percentage = weekStats.total > 0 ? Math.round((weekStats.present / weekStats.total) * 100) : 0;

      // This month's attendance
      const { data: monthAttendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("academy_no", user.academy_no)
        .gte("attendance_date", monthStart)
        .lte("attendance_date", monthEnd);

      const monthStats = {
        total: monthAttendance?.length || 0,
        present: monthAttendance?.filter((a) => a.status === "present" || a.status === "late").length || 0,
        percentage: 0,
      };
      monthStats.percentage = monthStats.total > 0 ? Math.round((monthStats.present / monthStats.total) * 100) : 0;

      // Load fee plans
      const { count: totalFeePlans } = await supabase
        .from("fee_plans")
        .select("*", { count: "exact", head: true })
        .eq("academy_no", user.academy_no);

      // Load active fee plans (with active students and programs)
      const { data: allFeePlans } = await supabase
        .from("fee_plans")
        .select("student_id, program_id")
        .eq("academy_no", user.academy_no);

      // Get active students
      const { data: activeStudentsForFee } = await supabase
        .from("students")
        .select("id")
        .eq("academy_no", user.academy_no)
        .eq("status", "active");

      const activeStudentIds = new Set((activeStudentsForFee || []).map((s) => s.id));

      // Get active programs
      const { data: activeProgramsForFee } = await supabase
        .from("programs")
        .select("id")
        .eq("academy_no", user.academy_no)
        .eq("status", "active");

      const activeProgramIds = new Set((activeProgramsForFee || []).map((p) => p.id));

      const activeFeePlans = (allFeePlans || []).filter(
        (plan) => activeStudentIds.has(plan.student_id) && activeProgramIds.has(plan.program_id)
      ).length;

      // Load challans
      const { data: challans } = await supabase
        .from("fee_challans")
        .select("*")
        .eq("academy_no", user.academy_no);

      const pendingChallans = (challans || []).filter((c) => c.status === "pending" || c.status === "partially_paid").length;
      const paidChallans = (challans || []).filter((c) => c.status === "paid").length;
      const overdueChallans = (challans || []).filter((c) => c.status === "overdue").length;

      // Calculate amounts
      const totalAmount = (challans || []).reduce((sum, c) => sum + c.amount, 0);
      const paidAmount = (challans || []).reduce((sum, c) => sum + (c.paid_amount || 0), 0);
      const pendingAmount = totalAmount - paidAmount;

      // This month's payments (reuse monthStart and monthEnd from above)
      const { data: thisMonthPayments } = await supabase
        .from("fee_payments")
        .select("amount")
        .eq("academy_no", user.academy_no)
        .gte("payment_date", monthStart)
        .lte("payment_date", monthEnd);

      const thisMonthPaymentsTotal = (thisMonthPayments || []).reduce((sum, p) => sum + p.amount, 0);

      setStats({
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        totalPrograms: totalPrograms || 0,
        activePrograms: activePrograms || 0,
        totalAssignments: totalAssignments || 0,
        activeAssignments: activeAssignments || 0,
        totalSchedules: totalSchedules || 0,
        recentStudents: students || [],
        topPrograms,
        attendanceToday: todayStats,
        attendanceThisWeek: weekStats,
        attendanceThisMonth: monthStats,
        feeStats: {
          totalFeePlans: totalFeePlans || 0,
          activeFeePlans,
          totalChallans: challans?.length || 0,
          pendingChallans,
          paidChallans,
          overdueChallans,
          totalAmount,
          paidAmount,
          pendingAmount,
          thisMonthPayments: thisMonthPaymentsTotal,
        },
      });
    } catch (err: any) {
      toast.showError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back! Here&apos;s an overview of your academy
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                    Total Students
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {stats.totalStudents}
                  </Typography>
                  <Typography variant="caption" color="success.main" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 14 }} />
                    {stats.activeStudents} active
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                    Programs
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {stats.totalPrograms}
                  </Typography>
                  <Typography variant="caption" color="success.main" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 14 }} />
                    {stats.activePrograms} active
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "success.main", width: 56, height: 56 }}>
                  <SchoolIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                    Assignments
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {stats.totalAssignments}
                  </Typography>
                  <Typography variant="caption" color="success.main" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 14 }} />
                    {stats.activeAssignments} active
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "warning.main", width: 56, height: 56 }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                    Schedules
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {stats.totalSchedules}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Active classes
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "info.main", width: 56, height: 56 }}>
                  <ScheduleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Attendance Summary */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Attendance Summary
              </Typography>
              <Chip
                label="View Reports"
                size="small"
                onClick={() => router.push("/attendance/report")}
                sx={{ cursor: "pointer" }}
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {/* Today's Attendance */}
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ bgcolor: "action.hover", height: "100%" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                        Today&apos;s Attendance
                      </Typography>
                      <CalendarMonthIcon fontSize="small" color="action" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats.attendanceToday.percentage}%
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={`${stats.attendanceToday.present} Present`}
                        size="small"
                        color="success"
                        sx={{ height: 24, fontSize: "0.7rem" }}
                      />
                      <Chip
                        icon={<CancelIcon />}
                        label={`${stats.attendanceToday.absent} Absent`}
                        size="small"
                        color="error"
                        sx={{ height: 24, fontSize: "0.7rem" }}
                      />
                      {(stats.attendanceToday.late > 0 || stats.attendanceToday.excused > 0) && (
                        <Chip
                          icon={<AccessTimeIcon />}
                          label={`${stats.attendanceToday.late + stats.attendanceToday.excused} Late/Excused`}
                          size="small"
                          color="warning"
                          sx={{ height: 24, fontSize: "0.7rem" }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      {stats.attendanceToday.total} total records
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* This Week's Attendance */}
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ bgcolor: "action.hover", height: "100%" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                        This Week
                      </Typography>
                      <BarChartIcon fontSize="small" color="action" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats.attendanceThisWeek.percentage}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.attendanceThisWeek.present} present out of {stats.attendanceThisWeek.total} records
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* This Month's Attendance */}
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ bgcolor: "action.hover", height: "100%" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                        This Month
                      </Typography>
                      <TrendingUpIcon fontSize="small" color="action" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats.attendanceThisMonth.percentage}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.attendanceThisMonth.present} present out of {stats.attendanceThisMonth.total} records
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Fee Summary */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Fee Summary
              </Typography>
              <Chip
                label="View Finance"
                size="small"
                onClick={() => router.push("/fee-challans")}
                sx={{ cursor: "pointer" }}
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {/* Fee Plans */}
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ bgcolor: "action.hover", height: "100%" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                        Fee Plans
                      </Typography>
                      <AccountBalanceIcon fontSize="small" color="action" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats.feeStats.totalFeePlans}
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {stats.feeStats.activeFeePlans} active
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Total Amount */}
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ bgcolor: "action.hover", height: "100%" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                        Total Amount
                      </Typography>
                      <AttachMoneyIcon fontSize="small" color="action" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Rs. {stats.feeStats.totalAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      All challans
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Paid Amount */}
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ bgcolor: "action.hover", height: "100%" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                        Paid Amount
                      </Typography>
                      <PaymentIcon fontSize="small" color="action" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: "success.main" }}>
                      Rs. {stats.feeStats.paidAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stats.feeStats.paidChallans} challans paid
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Pending Amount */}
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ bgcolor: "action.hover", height: "100%" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                        Pending Amount
                      </Typography>
                      <ReceiptIcon fontSize="small" color="action" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: "warning.main" }}>
                      Rs. {stats.feeStats.pendingAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stats.feeStats.pendingChallans} pending
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* This Month Payments */}
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ bgcolor: "action.hover", height: "100%" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                        This Month
                      </Typography>
                      <CalendarMonthIcon fontSize="small" color="action" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: "info.main" }}>
                      Rs. {stats.feeStats.thisMonthPayments.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Payments collected
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Challans Status */}
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ bgcolor: "action.hover", height: "100%" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                        Challans
                      </Typography>
                      <ReceiptIcon fontSize="small" color="action" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats.feeStats.totalChallans}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      <Chip
                        label={`${stats.feeStats.paidChallans} Paid`}
                        size="small"
                        color="success"
                        sx={{ height: 20, fontSize: "0.65rem" }}
                      />
                      <Chip
                        label={`${stats.feeStats.pendingChallans} Pending`}
                        size="small"
                        color="warning"
                        sx={{ height: 20, fontSize: "0.65rem" }}
                      />
                      {stats.feeStats.overdueChallans > 0 && (
                        <Chip
                          label={`${stats.feeStats.overdueChallans} Overdue`}
                          size="small"
                          color="error"
                          sx={{ height: 20, fontSize: "0.65rem" }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Students and Top Programs */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Recent Students
              </Typography>
              <Chip
                label="View All"
                size="small"
                onClick={() => router.push("/students")}
                sx={{ cursor: "pointer" }}
              />
            </Box>
            <Divider sx={{ mb: 1.5 }} />
            {stats.recentStudents.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <PersonAddIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No students yet
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {stats.recentStudents.map((student, index) => (
                  <React.Fragment key={student.id}>
                    <ListItem
                      sx={{
                        px: 0,
                        py: 1,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                      onClick={() => router.push("/students")}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={student.picture_url || undefined}
                          sx={{ bgcolor: "primary.main", width: 40, height: 40 }}
                        >
                          {student.name?.charAt(0)?.toUpperCase() || "?"}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={student.name}
                        secondary={
                          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
                            {student.phone && (
                              <Typography variant="caption" color="text.secondary">
                                {student.phone}
                              </Typography>
                            )}
                            {student.admission_date && (
                              <Typography variant="caption" color="text.secondary">
                                • {formatDate(student.admission_date)}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Chip
                        label={student.status || "active"}
                        size="small"
                        color={student.status === "active" ? "success" : "default"}
                        sx={{ height: 20, fontSize: "0.65rem" }}
                      />
                    </ListItem>
                    {index < stats.recentStudents.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Top Programs
              </Typography>
              <Chip
                label="View All"
                size="small"
                onClick={() => router.push("/programs")}
                sx={{ cursor: "pointer" }}
              />
            </Box>
            <Divider sx={{ mb: 1.5 }} />
            {stats.topPrograms.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <SchoolIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No program enrollments yet
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {stats.topPrograms.map((program, index) => (
                  <React.Fragment key={program.program_id}>
                    <ListItem
                      sx={{
                        px: 0,
                        py: 1,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                      onClick={() => router.push("/programs")}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "success.main", width: 40, height: 40 }}>
                          <SchoolIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={program.program_name}
                        secondary={
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            {program.count} {program.count === 1 ? "student" : "students"} enrolled
                          </Typography>
                        }
                      />
                      <Chip
                        label={program.count}
                        size="small"
                        color="primary"
                        sx={{ height: 24, fontSize: "0.75rem", fontWeight: 600 }}
                      />
                    </ListItem>
                    {index < stats.topPrograms.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
