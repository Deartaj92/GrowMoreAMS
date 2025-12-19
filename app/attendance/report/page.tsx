"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  Button,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  EventBusy as EventBusyIcon,
  CalendarMonth as CalendarMonthIcon,
  BarChart as BarChartIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import { format, getDaysInMonth, parseISO, isSunday } from "date-fns";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/lib/toast/toast-context";
import { Student, Program, Attendance, Schedule } from "@/lib/supabase/types";

interface AttendanceRecord extends Attendance {
  student_name?: string;
  program_name?: string;
  schedule_details?: string;
}

const STATUS_COLORS = {
  present: "#16a34a",
  absent: "#dc2626",
  late: "#f59e42",
  excused: "#4a6cf7",
};

const STATUS_LABELS = {
  present: "P",
  absent: "A",
  late: "Lt",
  excused: "E",
};

export default function AttendanceReportPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [attendanceMatrix, setAttendanceMatrix] = useState<string[][]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [workingDays, setWorkingDays] = useState(0);
  const [avgAttendance, setAvgAttendance] = useState(0);

  // Load programs with active student enrollments
  const loadPrograms = async () => {
    if (!user?.academy_no) return;

    setLoadingPrograms(true);
    try {
      const { data: allPrograms, error: programsError } = await supabase
        .from("programs")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("status", "active")
        .order("name", { ascending: true });

      if (programsError) throw programsError;

      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("student_programs")
        .select("program_id")
        .eq("academy_no", user.academy_no)
        .eq("status", "active");

      if (enrollmentsError) throw enrollmentsError;

      const enrolledProgramIds = new Set(enrollments?.map((e) => e.program_id) || []);
      const filteredPrograms = (allPrograms || []).filter((program) =>
        enrolledProgramIds.has(program.id)
      );

      setPrograms(filteredPrograms);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load programs");
    } finally {
      setLoadingPrograms(false);
    }
  };

  // Load students with active program assignments
  const loadStudents = async () => {
    if (!user?.academy_no) return;

    setLoadingStudents(true);
    try {
      // Get all active programs first
      const { data: activePrograms, error: programsError } = await supabase
        .from("programs")
        .select("id")
        .eq("academy_no", user.academy_no)
        .eq("status", "active");

      if (programsError) throw programsError;

      const activeProgramIds = (activePrograms || []).map((p) => p.id);

      if (activeProgramIds.length === 0) {
        setStudents([]);
        setAttendanceMatrix([]);
        setLoadingStudents(false);
        return;
      }

      // Get all active program enrollments for active programs
      let enrollmentsQuery = supabase
        .from("student_programs")
        .select("student_id, program_id")
        .eq("academy_no", user.academy_no)
        .eq("status", "active")
        .in("program_id", activeProgramIds);

      if (selectedProgram) {
        enrollmentsQuery = enrollmentsQuery.eq("program_id", selectedProgram);
      }

      const { data: enrollments, error: enrollmentsError } = await enrollmentsQuery;

      if (enrollmentsError) throw enrollmentsError;

      if (!enrollments || enrollments.length === 0) {
        setStudents([]);
        setAttendanceMatrix([]);
        setLoadingStudents(false);
        return;
      }

      const enrollmentStudentIds = enrollments.map((e) => e.student_id);

      // Get students with active status
      const { data, error: fetchError } = await supabase
        .from("students")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("status", "active")
        .in("id", enrollmentStudentIds)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;
      setStudents(data || []);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load students");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Load attendance data for the month
  const loadAttendanceData = async () => {
    if (!user?.academy_no || students.length === 0) return;

    setLoading(true);
    try {
      const startDate = selectedMonth + "-01";
      const daysInMonth = getDaysInMonth(parseISO(startDate));
      const endDate = format(
        new Date(parseISO(startDate).getFullYear(), parseISO(startDate).getMonth(), daysInMonth),
        "yyyy-MM-dd"
      );

      let query = supabase
        .from("attendance")
        .select("*")
        .eq("academy_no", user.academy_no)
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate);

      if (selectedProgram) {
        query = query.eq("program_id", selectedProgram);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Build attendance matrix
      const attMap: Record<number, Record<number, string>> = {};
      (data || []).forEach((record: Attendance) => {
        const day = parseInt(record.attendance_date.split("-")[2], 10);
        if (!attMap[record.student_id]) attMap[record.student_id] = {};
        attMap[record.student_id][day] =
          record.status === "present"
            ? "P"
            : record.status === "absent"
            ? "A"
            : record.status === "late"
            ? "Lt"
            : record.status === "excused"
            ? "E"
            : "-";
      });

      const matrix = students.map((student) =>
        Array.from({ length: daysInMonth }, (_, i) => attMap[student.id]?.[i + 1] || "-")
      );
      setAttendanceMatrix(matrix);

      // Calculate working days (days with at least one attendance record, excluding Sundays)
      const daysWithAttendance = new Set<number>();
      (data || []).forEach((record: Attendance) => {
        const day = parseInt(record.attendance_date.split("-")[2], 10);
        const date = parseISO(record.attendance_date);
        if (!isSunday(date)) {
          daysWithAttendance.add(day);
        }
      });
      setWorkingDays(daysWithAttendance.size);

      // Calculate average attendance
      let presentCount = 0;
      let totalPossible = students.length * daysWithAttendance.size;
      matrix.forEach((row) => {
        daysWithAttendance.forEach((day) => {
          const status = row[day - 1];
          if (status === "P" || status === "Lt") presentCount++;
        });
      });
      setAvgAttendance(totalPossible ? Math.round((presentCount / totalPossible) * 100) : 0);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.academy_no) {
      loadPrograms();
    }
  }, [user?.academy_no]);

  useEffect(() => {
    if (user?.academy_no) {
      loadStudents();
    }
  }, [selectedProgram, user?.academy_no]);

  useEffect(() => {
    if (students.length > 0 && user?.academy_no) {
      loadAttendanceData();
    }
  }, [selectedMonth, selectedProgram, students.length, user?.academy_no]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.father_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.phone?.includes(searchQuery)
    );
  }, [students, searchQuery]);

  const daysInMonth = selectedMonth ? getDaysInMonth(parseISO(selectedMonth + "-01")) : 31;

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "P":
        return STATUS_COLORS.present;
      case "A":
        return STATUS_COLORS.absent;
      case "Lt":
        return STATUS_COLORS.late;
      case "E":
        return STATUS_COLORS.excused;
      default:
        return "#888";
    }
  };

  // Export to PDF (simplified version)
  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      // This would require jsPDF library - for now just show a message
      toast.showInfo("PDF export functionality will be implemented with jsPDF library");
    } catch (err: any) {
      toast.showError(err.message || "Failed to export PDF");
    } finally {
      setExportLoading(false);
    }
  };

  const hasSelection = !!selectedMonth;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Attendance Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View monthly attendance records and statistics
        </Typography>
      </Box>


      {/* Header with Stats and Filters */}
      <Paper
        elevation={1}
        sx={{
          p: 1.5,
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "background.paper",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* Stats */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "action.hover",
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
              }}
            >
              <CalendarMonthIcon fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                Working Days:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {loadingStudents ? "..." : workingDays}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "action.hover",
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
              }}
            >
              <BarChartIcon fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                Avg Attendance:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {loadingStudents ? "..." : `${avgAttendance}%`}
              </Typography>
            </Box>
          </Box>

          {/* Mobile Filter Toggle */}
          <IconButton
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            sx={{ display: { xs: "flex", sm: "none" } }}
          >
            <FilterListIcon />
          </IconButton>

          {/* Desktop Filters */}
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth.split("-")[1] || ""}
                onChange={(e) => {
                  const year = selectedMonth.split("-")[0] || new Date().getFullYear().toString();
                  setSelectedMonth(`${year}-${e.target.value.padStart(2, "0")}`);
                }}
                label="Month"
              >
                <option value="">Month</option>
                <MenuItem value="01">January</MenuItem>
                <MenuItem value="02">February</MenuItem>
                <MenuItem value="03">March</MenuItem>
                <MenuItem value="04">April</MenuItem>
                <MenuItem value="05">May</MenuItem>
                <MenuItem value="06">June</MenuItem>
                <MenuItem value="07">July</MenuItem>
                <MenuItem value="08">August</MenuItem>
                <MenuItem value="09">September</MenuItem>
                <MenuItem value="10">October</MenuItem>
                <MenuItem value="11">November</MenuItem>
                <MenuItem value="12">December</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedMonth.split("-")[0] || ""}
                onChange={(e) => {
                  const month = selectedMonth.split("-")[1] || "01";
                  setSelectedMonth(`${e.target.value}-${month}`);
                }}
                label="Year"
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  return (
                    <MenuItem key={year} value={year.toString()}>
                      {year}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Program</InputLabel>
              <Select
                value={selectedProgram || ""}
                onChange={(e) => setSelectedProgram(e.target.value ? Number(e.target.value) : null)}
                label="Program"
                disabled={loadingPrograms}
              >
                {loadingPrograms ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading programs...
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem value="">All Programs</MenuItem>
                    {programs.map((program) => (
                      <MenuItem key={program.id} value={program.id}>
                        {program.name}
                      </MenuItem>
                    ))}
                  </>
                )}
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 180 }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleExportPDF}
              disabled={!hasSelection || exportLoading || loading || loadingStudents}
            >
              {exportLoading ? "Exporting..." : "Export PDF"}
            </Button>
          </Box>
        </Box>

        {/* Mobile Filters */}
        {showMobileFilters && (
          <Box
            sx={{
              display: { xs: "grid", sm: "none" },
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
              mt: 2,
            }}
          >
            <FormControl size="small">
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth.split("-")[1] || ""}
                onChange={(e) => {
                  const year = selectedMonth.split("-")[0] || new Date().getFullYear().toString();
                  setSelectedMonth(`${year}-${e.target.value.padStart(2, "0")}`);
                }}
                label="Month"
              >
                <MenuItem value="01">January</MenuItem>
                <MenuItem value="02">February</MenuItem>
                <MenuItem value="03">March</MenuItem>
                <MenuItem value="04">April</MenuItem>
                <MenuItem value="05">May</MenuItem>
                <MenuItem value="06">June</MenuItem>
                <MenuItem value="07">July</MenuItem>
                <MenuItem value="08">August</MenuItem>
                <MenuItem value="09">September</MenuItem>
                <MenuItem value="10">October</MenuItem>
                <MenuItem value="11">November</MenuItem>
                <MenuItem value="12">December</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedMonth.split("-")[0] || ""}
                onChange={(e) => {
                  const month = selectedMonth.split("-")[1] || "01";
                  setSelectedMonth(`${e.target.value}-${month}`);
                }}
                label="Year"
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  return (
                    <MenuItem key={year} value={year.toString()}>
                      {year}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ gridColumn: "1 / -1" }}>
              <InputLabel>Program</InputLabel>
              <Select
                value={selectedProgram || ""}
                onChange={(e) => setSelectedProgram(e.target.value ? Number(e.target.value) : null)}
                label="Program"
                disabled={loadingPrograms}
              >
                {loadingPrograms ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading programs...
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem value="">All Programs</MenuItem>
                    {programs.map((program) => (
                      <MenuItem key={program.id} value={program.id}>
                        {program.name}
                      </MenuItem>
                    ))}
                  </>
                )}
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ gridColumn: "1 / -1" }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleExportPDF}
              disabled={!hasSelection || exportLoading || loading || loadingStudents}
              sx={{ gridColumn: "1 / -1" }}
            >
              {exportLoading ? "Exporting..." : "Export PDF"}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Attendance Table */}
      {loadingStudents ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredStudents.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {searchQuery
              ? "No students found matching your search."
              : selectedProgram
              ? "No students enrolled in this program."
              : "No students with active program assignments found."}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={1}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, minWidth: 40 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Student</TableCell>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const date = new Date(parseISO(selectedMonth + "-01"));
                  date.setDate(i + 1);
                  const isSunday = date.getDay() === 0;
                  return (
                    <TableCell
                      key={i + 1}
                      sx={{
                        fontWeight: 600,
                        minWidth: 34,
                        maxWidth: 36,
                        textAlign: "center",
                        bgcolor: isSunday ? "error.light" : "transparent",
                        color: isSunday ? "error.main" : "inherit",
                      }}
                    >
                      {i + 1}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((student, idx) => {
                const studentIndexInOriginal = students.findIndex((s) => s.id === student.id);
                const attendanceRow = attendanceMatrix[studentIndexInOriginal] || [];
                return (
                  <TableRow key={student.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {student.name}
                      </Typography>
                    </TableCell>
                    {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                      const date = new Date(parseISO(selectedMonth + "-01"));
                      date.setDate(dayIdx + 1);
                      const isSunday = date.getDay() === 0;
                      const status = attendanceRow[dayIdx] || "-";
                      const statusColor = getStatusColor(status);

                      if (isSunday) {
                        return (
                          <TableCell
                            key={dayIdx}
                            sx={{
                              bgcolor: "error.light",
                              color: "error.main",
                              textAlign: "center",
                              fontStyle: "italic",
                            }}
                          >
                            -
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell
                          key={dayIdx}
                          sx={{
                            textAlign: "center",
                            minWidth: 34,
                            maxWidth: 36,
                            p: 0.5,
                          }}
                        >
                          {status !== "-" && (
                            <Chip
                              label={status}
                              size="small"
                              sx={{
                                height: 24,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                bgcolor: `${statusColor}22`,
                                color: statusColor,
                                border: `1px solid ${statusColor}`,
                                minWidth: 28,
                              }}
                            />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
              {/* Summary Row */}
              <TableRow sx={{ bgcolor: "action.hover", fontWeight: 700 }}>
                <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                  Absents/Leaves:
                </TableCell>
                {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                  const date = new Date(parseISO(selectedMonth + "-01"));
                  date.setDate(dayIdx + 1);
                  const isSunday = date.getDay() === 0;

                  if (isSunday) {
                    return (
                      <TableCell
                        key={dayIdx}
                        sx={{
                          bgcolor: "error.light",
                          color: "error.main",
                          textAlign: "center",
                        }}
                      >
                        -
                      </TableCell>
                    );
                  }

                  // Count absent and leave students for this day
                  let absentCount = 0;
                  filteredStudents.forEach((student) => {
                    const studentIndexInOriginal = students.findIndex((s) => s.id === student.id);
                    const status = attendanceMatrix[studentIndexInOriginal]?.[dayIdx];
                    if (status === "A" || status === "E") {
                      absentCount++;
                    }
                  });

                  return (
                    <TableCell
                      key={dayIdx}
                      sx={{
                        textAlign: "center",
                        color: absentCount > 0 ? "error.main" : "inherit",
                        fontWeight: 700,
                      }}
                    >
                      {absentCount > 0 ? absentCount : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
