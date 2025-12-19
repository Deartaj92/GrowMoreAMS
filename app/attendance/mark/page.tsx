"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
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
  Checkbox,
  Avatar,
  IconButton,
  Chip,
  InputAdornment,
} from "@mui/material";
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  RemoveCircle as RemoveCircleIcon,
  AccessTime as AccessTimeIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/lib/toast/toast-context";
import { Student, Program, Schedule } from "@/lib/supabase/types";

interface StudentWithStatus extends Student {
  status?: "present" | "absent" | "late" | "excused";
  remarks?: string;
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

export default function MarkAttendancePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentWithStatus[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [hasAttendanceRecords, setHasAttendanceRecords] = useState(false);

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

  // Load schedules for a program
  const loadSchedules = async (programId: number) => {
    if (!user?.academy_no) return;

    try {
      const dayOfWeek = new Date(selectedDate).getDay();
      const { data, error: fetchError } = await supabase
        .from("schedules")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("program_id", programId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .order("start_time", { ascending: true });

      if (fetchError) throw fetchError;
      setSchedules(data || []);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load schedules");
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Load students for marking attendance - only those with active program assignments
  const loadStudentsForAttendance = async () => {
    if (!user?.academy_no) return;

    setLoading(true);
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
        setLoading(false);
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
        setLoading(false);
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
      setLoading(false);
      setLoadingStudents(false);
    }
  };

  // Load existing attendance data
  const loadExistingAttendance = async () => {
    if (!user?.academy_no || students.length === 0) return;

    try {
      let query = supabase
        .from("attendance")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("attendance_date", selectedDate);

      if (selectedProgram) {
        query = query.eq("program_id", selectedProgram);
      } else {
        query = query.is("program_id", null);
      }

      if (selectedSchedule) {
        query = query.eq("schedule_id", selectedSchedule);
      } else {
        query = query.is("schedule_id", null);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setHasAttendanceRecords(true);
        const attendanceMap = new Map<number, { status: string; remarks?: string }>();
        data.forEach((record) => {
          attendanceMap.set(record.student_id, {
            status: record.status,
            remarks: record.remarks || undefined,
          });
        });

        setStudents((prev) =>
          prev.map((student) => {
            const attendance = attendanceMap.get(student.id);
            return {
              ...student,
              status: (attendance?.status as any) || "present",
              remarks: attendance?.remarks || "",
            };
          })
        );

        // Select students who have attendance records
        setSelectedRows(data.map((r) => r.student_id));
      } else {
        setHasAttendanceRecords(false);
        // Initialize with default status
        setStudents((prev) =>
          prev.map((s) => ({ ...s, status: "present" as const, remarks: "" }))
        );
        // Select all students by default
        setSelectedRows(students.map((s) => s.id));
      }
    } catch (err: any) {
      // Silent fail - just use defaults
      setStudents((prev) =>
        prev.map((s) => ({ ...s, status: "present" as const, remarks: "" }))
      );
      setSelectedRows(students.map((s) => s.id));
    }
  };

  useEffect(() => {
    if (user?.academy_no) {
      loadPrograms();
    }
  }, [user?.academy_no]);

  useEffect(() => {
    if (selectedProgram) {
      loadSchedules(selectedProgram);
    } else {
      setSchedules([]);
      setSelectedSchedule(null);
    }
  }, [selectedProgram, selectedDate]);

  useEffect(() => {
    if (user?.academy_no) {
      loadStudentsForAttendance();
    }
  }, [selectedProgram, selectedDate, user?.academy_no]);

  useEffect(() => {
    if (students.length > 0 && user?.academy_no) {
      loadExistingAttendance();
    }
  }, [selectedDate, selectedProgram, selectedSchedule, students.length]);

  // Filter students based on search
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.father_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone?.includes(searchTerm)
  );

  // Statistics
  const totalStudents = filteredStudents.length;
  const presentCount = filteredStudents.filter((s) => s.status === "present").length;
  const absentCount = filteredStudents.filter((s) => s.status === "absent").length;
  const lateCount = filteredStudents.filter((s) => s.status === "late").length;
  const excusedCount = filteredStudents.filter((s) => s.status === "excused").length;

  // Handle status change
  const handleStatusChange = (studentId: number, status: "present" | "absent" | "late" | "excused") => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  // Handle remarks change
  const handleRemarksChange = (studentId: number, remarks: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, remarks } : s))
    );
  };

  // Handle row selection
  const handleRowSelect = (studentId: number) => {
    setSelectedRows((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.length === filteredStudents.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredStudents.map((s) => s.id));
    }
  };

  // Handle mark all
  const handleMarkAll = (status: "present" | "absent") => {
    setStudents((prev) =>
      prev.map((s) =>
        selectedRows.includes(s.id) ? { ...s, status } : s
      )
    );
  };

  // Handle save attendance
  const handleSaveAttendance = async () => {
    if (!user?.academy_no) {
      toast.showError("User information not available");
      return;
    }

    if (selectedRows.length === 0) {
      toast.showError("Please select at least one student");
      return;
    }

    setSaving(true);

    try {
      const records = students
        .filter((s) => selectedRows.includes(s.id))
        .map((student) => ({
          academy_no: user.academy_no,
          student_id: student.id,
          program_id: selectedProgram || null,
          schedule_id: selectedSchedule || null,
          attendance_date: selectedDate,
          status: student.status || "absent",
          remarks: student.remarks || null,
          marked_by: user.full_name || user.username,
        }));

      // Delete existing records for selected students
      if (selectedRows.length > 0) {
        let deleteQuery = supabase
          .from("attendance")
          .delete()
          .eq("academy_no", user.academy_no)
          .eq("attendance_date", selectedDate)
          .in("student_id", selectedRows);

        if (selectedProgram) {
          deleteQuery = deleteQuery.eq("program_id", selectedProgram);
        } else {
          deleteQuery = deleteQuery.is("program_id", null);
        }

        if (selectedSchedule) {
          deleteQuery = deleteQuery.eq("schedule_id", selectedSchedule);
        } else {
          deleteQuery = deleteQuery.is("schedule_id", null);
        }

        await deleteQuery;
      }

      // Insert new records
      const { error: insertError } = await supabase.from("attendance").insert(records);

      if (insertError) throw insertError;

      toast.showSuccess("Attendance saved successfully!");
    } catch (err: any) {
      toast.showError(err.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete attendance
  const handleDeleteAttendance = async () => {
    if (!user?.academy_no || selectedRows.length === 0) {
      toast.showError("Please select at least one student");
      return;
    }

    if (!confirm(`Are you sure you want to delete attendance for ${selectedRows.length} student(s)?`)) {
      return;
    }

    setDeleting(true);

    try {
      let deleteQuery = supabase
        .from("attendance")
        .delete()
        .eq("academy_no", user.academy_no)
        .eq("attendance_date", selectedDate)
        .in("student_id", selectedRows);

      if (selectedProgram) {
        deleteQuery = deleteQuery.eq("program_id", selectedProgram);
      } else {
        deleteQuery = deleteQuery.is("program_id", null);
      }

      if (selectedSchedule) {
        deleteQuery = deleteQuery.eq("schedule_id", selectedSchedule);
      } else {
        deleteQuery = deleteQuery.is("schedule_id", null);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) throw deleteError;

      // Reload attendance data
      await loadExistingAttendance();
      toast.showSuccess("Attendance deleted successfully!");
    } catch (err: any) {
      toast.showError(err.message || "Failed to delete attendance");
    } finally {
      setDeleting(false);
    }
  };

  // Status button component
  const StatusButton: React.FC<{
    status: "present" | "absent" | "late" | "excused";
    active: boolean;
    onClick: () => void;
    label: string;
  }> = ({ status, active, onClick, label }) => (
    <Button
      variant={active ? "contained" : "outlined"}
      onClick={onClick}
      sx={{
        minWidth: { xs: 40, sm: 90 },
        height: { xs: 32, sm: 36 },
        borderRadius: { xs: "50%", sm: "22px" },
        fontSize: { xs: "0.75rem", sm: "0.875rem" },
        fontWeight: 700,
        backgroundColor: active ? STATUS_COLORS[status] : "transparent",
        color: active ? "#fff" : STATUS_COLORS[status],
        borderColor: STATUS_COLORS[status],
        borderWidth: 1.5,
        borderStyle: "solid",
        "&:hover": {
          backgroundColor: STATUS_COLORS[status],
          color: "#fff",
        },
        boxShadow: active ? `0 0 8px 2px ${STATUS_COLORS[status]}33` : "none",
      }}
    >
      {label}
    </Button>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pb: 10 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Mark Attendance
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Mark student attendance for a specific date
        </Typography>
      </Box>


      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Program (Optional)</InputLabel>
              <Select
                value={selectedProgram || ""}
                onChange={(e) => {
                  setSelectedProgram(e.target.value ? Number(e.target.value) : null);
                  setSelectedSchedule(null);
                }}
                label="Program (Optional)"
                disabled={loadingPrograms}
              >
                {loadingPrograms ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading programs...
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem value="">All Students</MenuItem>
                    {programs.map((program) => (
                      <MenuItem key={program.id} value={program.id}>
                        {program.name}
                      </MenuItem>
                    ))}
                  </>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" disabled={!selectedProgram || loadingSchedules}>
              <InputLabel>Schedule (Optional)</InputLabel>
              <Select
                value={selectedSchedule || ""}
                onChange={(e) => setSelectedSchedule(e.target.value ? Number(e.target.value) : null)}
                label="Schedule (Optional)"
              >
                {loadingSchedules ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading schedules...
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem value="">All Schedules</MenuItem>
                    {schedules.map((schedule) => {
                      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                      return (
                        <MenuItem key={schedule.id} value={schedule.id}>
                          {days[schedule.day_of_week]} - {schedule.start_time} to {schedule.end_time}
                        </MenuItem>
                      );
                    })}
                  </>
                )}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Search */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name, father name, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredStudents.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {searchTerm
              ? "No students found matching your search."
              : selectedProgram
              ? "No students enrolled in this program."
              : "Please add students first."}
          </Typography>
        </Box>
      ) : (
        <>
          {/* Statistics Cards */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card elevation={1}>
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Students
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {totalStudents}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={1}>
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">
                    Present
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: STATUS_COLORS.present }}>
                    {presentCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={1}>
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">
                    Absent
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: STATUS_COLORS.absent }}>
                    {absentCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={1}>
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">
                    Late/Excused
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: STATUS_COLORS.late }}>
                    {lateCount + excusedCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Bulk Actions */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Checkbox
              checked={selectedRows.length === filteredStudents.length && filteredStudents.length > 0}
              indeterminate={selectedRows.length > 0 && selectedRows.length < filteredStudents.length}
              onChange={handleSelectAll}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              Select All ({selectedRows.length}/{filteredStudents.length})
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              size="small"
              variant="outlined"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleMarkAll("present")}
              disabled={selectedRows.length === 0}
              sx={{ minWidth: 100 }}
            >
              All Present
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => handleMarkAll("absent")}
              disabled={selectedRows.length === 0}
              sx={{ minWidth: 100 }}
            >
              All Absent
            </Button>
          </Box>

          {/* Students Table */}
          <TableContainer component={Paper} elevation={1}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: 40 }}>
                    <Checkbox
                      checked={selectedRows.length === filteredStudents.length && filteredStudents.length > 0}
                      indeterminate={selectedRows.length > 0 && selectedRows.length < filteredStudents.length}
                      onChange={handleSelectAll}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    selected={selectedRows.includes(student.id)}
                    sx={{
                      "&:hover": { backgroundColor: "action.hover" },
                      backgroundColor: selectedRows.includes(student.id) ? "action.selected" : "transparent",
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRows.includes(student.id)}
                        onChange={() => handleRowSelect(student.id)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar
                          src={student.picture_url || undefined}
                          alt={student.name}
                          sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.875rem" }}
                        >
                          {student.name?.charAt(0)?.toUpperCase() || "?"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {student.name}
                          </Typography>
                          {student.father_name && (
                            <Typography variant="caption" color="text.secondary">
                              {student.father_name}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          gap: { xs: 0.5, sm: 1 },
                          justifyContent: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <StatusButton
                          status="present"
                          active={student.status === "present"}
                          onClick={() => handleStatusChange(student.id, "present")}
                          label="P"
                        />
                        <StatusButton
                          status="absent"
                          active={student.status === "absent"}
                          onClick={() => handleStatusChange(student.id, "absent")}
                          label="A"
                        />
                        <StatusButton
                          status="late"
                          active={student.status === "late"}
                          onClick={() => handleStatusChange(student.id, "late")}
                          label="Lt"
                        />
                        <StatusButton
                          status="excused"
                          active={student.status === "excused"}
                          onClick={() => handleStatusChange(student.id, "excused")}
                          label="E"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        placeholder="Optional remarks"
                        value={student.remarks || ""}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        sx={{ minWidth: { xs: 120, sm: 200 } }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Floating Action Buttons */}
      {filteredStudents.length > 0 && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            display: "flex",
            gap: 1,
            zIndex: 1000,
          }}
        >
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteAttendance}
            disabled={deleting || selectedRows.length === 0}
            sx={{
              borderRadius: "28px",
              px: 2,
              minWidth: 100,
            }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            onClick={handleSaveAttendance}
            disabled={saving || selectedRows.length === 0}
            sx={{
              borderRadius: "28px",
              px: 2,
              minWidth: 100,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </Box>
      )}
    </Box>
  );
}
