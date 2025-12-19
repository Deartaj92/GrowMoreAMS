"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Autocomplete,
  Chip,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/lib/toast/toast-context";
import { Student, Program, StudentProgram, Schedule } from "@/lib/supabase/types";

export default function AssignProgramsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [studentPrograms, setStudentPrograms] = useState<StudentProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [enrollmentDate, setEnrollmentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<"active" | "completed" | "withdrawn">("active");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState("");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<string>("all");
  const [assignmentProgramFilter, setAssignmentProgramFilter] = useState<number | null>(null);

  // Load students
  const loadStudents = async () => {
    if (!user?.academy_no) return;

    setLoadingStudents(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("students")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("status", "active")
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;
      setStudents(data || []);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load students");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Load programs
  const loadPrograms = async () => {
    if (!user?.academy_no) return;

    setLoadingPrograms(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("programs")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("status", "active")
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;
      setPrograms(data || []);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load programs");
    } finally {
      setLoadingPrograms(false);
    }
  };

  // Load schedules for selected program
  const loadSchedules = async (programId: number) => {
    if (!user?.academy_no) return;

    setLoadingSchedules(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("schedules")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("program_id", programId)
        .eq("is_active", true)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (fetchError) throw fetchError;
      setSchedules(data || []);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load schedules");
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Load student-program assignments
  const loadStudentPrograms = async () => {
    if (!user?.academy_no) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("student_programs")
        .select("*")
        .eq("academy_no", user.academy_no)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setStudentPrograms(data || []);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.academy_no) {
      loadStudents();
      loadPrograms();
      loadStudentPrograms();
    }
  }, [user?.academy_no]);

  // Filter students based on search
  const filteredStudents = students.filter(
    (student) =>
      !searchQuery.trim() ||
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone?.includes(searchQuery) ||
      student.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper functions for filtering assignments
  const getStudentName = (studentId: number) => {
    return students.find((s) => s.id === studentId)?.name || "Unknown";
  };

  const getProgramName = (programId: number) => {
    return programs.find((p) => p.id === programId)?.name || "Unknown";
  };

  const getScheduleDetails = async (scheduleId: number | null | undefined) => {
    if (!scheduleId) return null;
    try {
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("id", scheduleId)
        .single();
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  };

  // Load all schedules for display
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    const loadAllSchedules = async () => {
      if (!user?.academy_no) return;
      try {
        const { data, error } = await supabase
          .from("schedules")
          .select("*")
          .eq("academy_no", user.academy_no)
          .eq("is_active", true);
        if (!error && data) {
          setAllSchedules(data);
        }
      } catch (err) {
        // Silent fail
      }
    };
    loadAllSchedules();
  }, [user?.academy_no]);

  const getScheduleDisplay = (scheduleId: number | null | undefined) => {
    if (!scheduleId) return null;
    const schedule = allSchedules.find((s) => s.id === scheduleId);
    if (!schedule) return null;
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return `${days[schedule.day_of_week]} ${schedule.start_time}-${schedule.end_time}`;
  };

  // Filter assignments based on search and filters
  const filteredAssignments = studentPrograms.filter((assignment) => {
    // Search filter
    if (assignmentSearchQuery.trim()) {
      const studentName = getStudentName(assignment.student_id).toLowerCase();
      const programName = getProgramName(assignment.program_id).toLowerCase();
      const query = assignmentSearchQuery.toLowerCase();
      if (!studentName.includes(query) && !programName.includes(query)) {
        return false;
      }
    }

    // Status filter
    if (assignmentStatusFilter !== "all" && assignment.status !== assignmentStatusFilter) {
      return false;
    }

    // Program filter
    if (assignmentProgramFilter !== null && assignment.program_id !== assignmentProgramFilter) {
      return false;
    }

    return true;
  });

  const handleOpenAssignDialog = (student: Student) => {
    setSelectedStudent(student);
    setSelectedProgram(null);
    setSelectedSchedule(null);
    setEnrollmentDate(new Date().toISOString().split("T")[0]);
    setStatus("active");
    setSchedules([]);
    setAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedStudent(null);
    setSelectedProgram(null);
    setSelectedSchedule(null);
    setSchedules([]);
  };

  // Load schedules when program is selected
  useEffect(() => {
    if (selectedProgram) {
      loadSchedules(selectedProgram.id);
    } else {
      setSchedules([]);
      setSelectedSchedule(null);
    }
  }, [selectedProgram]);

  const handleAssignProgram = async () => {
    if (!selectedStudent || !selectedProgram || !user?.academy_no) {
      toast.showError("Please select both student and program");
      return;
    }

    setLoading(true);

    try {
      // Check if assignment already exists
      const { data: existing } = await supabase
        .from("student_programs")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("student_id", selectedStudent.id)
        .eq("program_id", selectedProgram.id)
        .single();

      if (existing) {
        toast.showError("This student is already assigned to this program");
        setLoading(false);
        return;
      }

      // Create new assignment
      const assignmentData: any = {
        academy_no: user.academy_no,
        student_id: selectedStudent.id,
        program_id: selectedProgram.id,
        enrollment_date: enrollmentDate,
        status: status,
      };

      // Add schedule_id if selected
      if (selectedSchedule) {
        assignmentData.schedule_id = selectedSchedule;
      }

      const { error: insertError } = await supabase.from("student_programs").insert([assignmentData]);

      if (insertError) throw insertError;

      toast.showSuccess("Program assigned successfully!");
      await loadStudentPrograms();
      setTimeout(() => {
        handleCloseAssignDialog();
      }, 1000);
    } catch (err: any) {
      toast.showError(err.message || "Failed to assign program");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to remove this assignment?")) return;

    setLoading(true);

    try {
      const { error: deleteError } = await supabase
        .from("student_programs")
        .delete()
        .eq("id", assignmentId);

      if (deleteError) throw deleteError;

      toast.showSuccess("Assignment removed successfully!");
      await loadStudentPrograms();
    } catch (err: any) {
      toast.showError(err.message || "Failed to remove assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (assignmentId: number, newStatus: "active" | "completed" | "withdrawn") => {
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from("student_programs")
        .update({ status: newStatus })
        .eq("id", assignmentId);

      if (updateError) throw updateError;

      toast.showSuccess("Status updated successfully!");
      await loadStudentPrograms();
    } catch (err: any) {
      toast.showError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "info";
      case "withdrawn":
        return "default";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Assign Programs to Students
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage student program enrollments
        </Typography>
      </Box>

      {/* Alerts */}

      <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
        {/* Left Column: Student Selection */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 2, display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 200px)" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Select Student
            </Typography>
            <TextField
              fullWidth
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />,
              }}
              sx={{ mb: 2 }}
            />
            <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {loadingStudents ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredStudents.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <PersonIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No students found
                  </Typography>
                </Box>
              ) : (
                filteredStudents.map((student) => (
                  <Card
                    key={student.id}
                    elevation={1}
                    sx={{
                      mb: 1,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        boxShadow: 3,
                        transform: "translateY(-2px)",
                      },
                    }}
                    onClick={() => handleOpenAssignDialog(student)}
                  >
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {student.name}
                      </Typography>
                      {student.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {student.phone}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Assignments List */}
        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ p: 2, display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 200px)" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Program Assignments
            </Typography>

            {/* Search and Filter Controls */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2, flexShrink: 0 }}>
              <TextField
                fullWidth
                placeholder="Search by student or program name..."
                value={assignmentSearchQuery}
                onChange={(e) => setAssignmentSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />,
                }}
              />
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={assignmentStatusFilter}
                    onChange={(e) => setAssignmentStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="withdrawn">Withdrawn</MenuItem>
                  </Select>
                </FormControl>
                <Autocomplete
                  options={programs}
                  getOptionLabel={(option) => option.name}
                  value={programs.find((p) => p.id === assignmentProgramFilter) || null}
                  onChange={(_, newValue) => setAssignmentProgramFilter(newValue?.id || null)}
                  loading={loadingPrograms}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Program"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingPrograms ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  size="small"
                  sx={{ minWidth: 200 }}
                />
                {(assignmentStatusFilter !== "all" || assignmentProgramFilter !== null || assignmentSearchQuery.trim()) && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setAssignmentSearchQuery("");
                      setAssignmentStatusFilter("all");
                      setAssignmentProgramFilter(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Showing {filteredAssignments.length} of {studentPrograms.length} assignments
              </Typography>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredAssignments.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <SchoolIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {studentPrograms.length === 0
                      ? "No program assignments yet"
                      : "No assignments match your filters"}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {filteredAssignments.map((assignment) => (
                  <Card key={assignment.id} elevation={1}>
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {getStudentName(assignment.student_id)}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            <SchoolIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {getProgramName(assignment.program_id)}
                            </Typography>
                          </Box>
                          {assignment.schedule_id && (
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                              Schedule: {getScheduleDisplay(assignment.schedule_id) || "N/A"}
                            </Typography>
                          )}
                          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                            <Chip
                              label={assignment.status || "active"}
                              size="small"
                              color={getStatusColor(assignment.status) as any}
                              sx={{ height: 20, fontSize: "0.65rem" }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Enrolled: {formatDate(assignment.enrollment_date)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5, alignItems: "flex-start" }}>
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={assignment.status || "active"}
                              onChange={(e) =>
                                handleUpdateStatus(assignment.id, e.target.value as "active" | "completed" | "withdrawn")
                              }
                              sx={{ fontSize: "0.75rem", height: 28 }}
                            >
                              <MenuItem value="active">Active</MenuItem>
                              <MenuItem value="completed">Completed</MenuItem>
                              <MenuItem value="withdrawn">Withdrawn</MenuItem>
                            </Select>
                          </FormControl>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            sx={{ height: 28, width: 28 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Assign Program Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Assign Program
          </Typography>
          <IconButton size="small" onClick={handleCloseAssignDialog}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Student
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                {selectedStudent?.name}
              </Typography>
            </Box>

            <Autocomplete
              options={programs}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={selectedProgram}
              onChange={(_, newValue) => setSelectedProgram(newValue)}
              loading={loadingPrograms}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Program"
                  size="small"
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingPrograms ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              size="small"
            />

            <FormControl fullWidth size="small" disabled={!selectedProgram || loadingSchedules}>
              <InputLabel>Schedule (Optional)</InputLabel>
              <Select
                value={selectedSchedule || ""}
                onChange={(e) => setSelectedSchedule(e.target.value ? Number(e.target.value) : null)}
                label="Schedule (Optional)"
                endAdornment={loadingSchedules ? <CircularProgress size={20} /> : undefined}
              >
                {loadingSchedules ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading schedules...
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem value="">No Schedule</MenuItem>
                    {schedules.map((schedule) => {
                      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                      return (
                        <MenuItem key={schedule.id} value={schedule.id}>
                          {days[schedule.day_of_week]} - {schedule.start_time} to {schedule.end_time}
                          {schedule.subject_name && ` (${schedule.subject_name})`}
                        </MenuItem>
                      );
                    })}
                  </>
                )}
              </Select>
            </FormControl>

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Enrollment Date"
                  type="date"
                  value={enrollmentDate}
                  onChange={(e) => setEnrollmentDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={status} onChange={(e) => setStatus(e.target.value as any)} label="Status">
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="withdrawn">Withdrawn</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={handleCloseAssignDialog} size="small" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignProgram}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || !selectedProgram}
            size="small"
          >
            {loading ? "Assigning..." : "Assign Program"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

