"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/lib/toast/toast-context";
import type { Schedule, Program } from "@/lib/supabase/types";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

interface ScheduleWithProgram extends Schedule {
  program?: Program;
}

export default function SchedulesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [schedules, setSchedules] = useState<ScheduleWithProgram[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<Partial<Schedule>>({
    program_id: undefined,
    day_of_week: 1,
    start_time: "09:00",
    end_time: "10:30",
    subject_name: "",
    instructor_name: "",
    room_number: "",
    is_active: true,
  });
  const [selectedProgram, setSelectedProgram] = useState<number | "">("");

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
      console.error("Error loading programs:", err);
    } finally {
      setLoadingPrograms(false);
    }
  };

  // Load schedules from database
  const loadSchedules = async () => {
    if (!user?.academy_no) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("schedules")
        .select("*")
        .eq("academy_no", user.academy_no)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (fetchError) throw fetchError;

      // Fetch program details for each schedule
      const schedulesWithPrograms = await Promise.all(
        (data || []).map(async (schedule) => {
          const { data: programData } = await supabase
            .from("programs")
            .select("*")
            .eq("id", schedule.program_id)
            .single();

          return {
            ...schedule,
            program: programData || undefined,
          };
        })
      );

      setSchedules(schedulesWithPrograms);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.academy_no) {
      loadPrograms();
      loadSchedules();
    }
  }, [user?.academy_no]);

  // Filter schedules by selected program
  const filteredSchedules = selectedProgram
    ? schedules.filter((s) => s.program_id === selectedProgram)
    : schedules;

  const handleOpenDialog = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        program_id: schedule.program_id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        subject_name: schedule.subject_name || "",
        instructor_name: schedule.instructor_name || "",
        room_number: schedule.room_number || "",
        is_active: schedule.is_active,
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        program_id: selectedProgram || undefined,
        day_of_week: 1,
        start_time: "09:00",
        end_time: "10:30",
        subject_name: "",
        instructor_name: "",
        room_number: "",
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSchedule(null);
    setFormData({
      program_id: undefined,
      day_of_week: 1,
      start_time: "09:00",
      end_time: "10:30",
      subject_name: "",
      instructor_name: "",
      room_number: "",
      is_active: true,
    });
  };

  const handleSubmit = async () => {
    if (!user?.academy_no) {
      toast.showError("User academy number not found");
      return;
    }

    if (!formData.program_id || formData.start_time === undefined || formData.end_time === undefined) {
      toast.showError("Program, Start Time, and End Time are required");
      return;
    }

    // Validate time
    if (formData.start_time >= formData.end_time) {
      toast.showError("End time must be after start time");
      return;
    }

    setLoading(true);

    try {
      if (editingSchedule) {
        // Update existing schedule
        const { error: updateError } = await supabase
          .from("schedules")
          .update({
            program_id: formData.program_id,
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            subject_name: formData.subject_name || null,
            instructor_name: formData.instructor_name || null,
            room_number: formData.room_number || null,
            is_active: formData.is_active ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingSchedule.id)
          .eq("academy_no", user.academy_no);

        if (updateError) throw updateError;
        toast.showSuccess("Schedule updated successfully");
      } else {
        // Create new schedule
        const { error: insertError } = await supabase
          .from("schedules")
          .insert([
            {
              academy_no: user.academy_no,
              program_id: formData.program_id,
              day_of_week: formData.day_of_week,
              start_time: formData.start_time,
              end_time: formData.end_time,
              subject_name: formData.subject_name || null,
              instructor_name: formData.instructor_name || null,
              room_number: formData.room_number || null,
              is_active: formData.is_active ?? true,
            },
          ]);

        if (insertError) throw insertError;
        toast.showSuccess("Schedule created successfully");
      }

      handleCloseDialog();
      loadSchedules();
    } catch (err: any) {
      toast.showError(err.message || "Failed to save schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!user?.academy_no) {
      toast.showError("User academy number not found");
      return;
    }

    if (!confirm("Are you sure you want to delete this schedule?")) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("schedules")
        .delete()
        .eq("id", id)
        .eq("academy_no", user.academy_no);

      if (deleteError) throw deleteError;
      toast.showSuccess("Schedule deleted successfully");
      loadSchedules();
    } catch (err: any) {
      toast.showError(err.message || "Failed to delete schedule");
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (day: number) => {
    return DAYS_OF_WEEK.find((d) => d.value === day)?.label || "Unknown";
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Class Schedules
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage class timings and schedules for programs
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ minWidth: 140 }}
        >
          Add Schedule
        </Button>
      </Box>

      {/* Program Filter */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <FormControl fullWidth sx={{ maxWidth: 300 }}>
          <InputLabel>Filter by Program</InputLabel>
          <Select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value as number | "")}
            label="Filter by Program"
          >
            <MenuItem value="">All Programs</MenuItem>
            {programs.map((program) => (
              <MenuItem key={program.id} value={program.id}>
                {program.code} - {program.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>


      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Program</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Day</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Instructor</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && filteredSchedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Loading schedules...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredSchedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No schedules found. Click "Add Schedule" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredSchedules.map((schedule) => (
                <TableRow key={schedule.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {schedule.program?.code || "N/A"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {schedule.program?.name || "Unknown Program"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{getDayName(schedule.day_of_week)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {schedule.start_time} - {schedule.end_time}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{schedule.subject_name || "-"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{schedule.instructor_name || "-"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{schedule.room_number || "-"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={schedule.is_active ? "Active" : "Inactive"}
                      color={schedule.is_active ? "success" : "default"}
                      size="small"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(schedule)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(schedule.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSchedule ? "Edit Schedule" : "Add New Schedule"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Program</InputLabel>
              <Select
                value={formData.program_id || ""}
                onChange={(e) => setFormData({ ...formData, program_id: e.target.value as number })}
                label="Program"
                disabled={loadingPrograms}
              >
                {loadingPrograms ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading programs...
                  </MenuItem>
                ) : (
                  programs.map((program) => (
                    <MenuItem key={program.id} value={program.id}>
                      {program.code} - {program.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Day of Week</InputLabel>
              <Select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value as number })}
                label="Day of Week"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <MenuItem key={day.value} value={day.value}>
                    {day.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="End Time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Subject Name"
              value={formData.subject_name}
              onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
              fullWidth
              placeholder="e.g., Mathematics, Physics"
            />

            <TextField
              label="Instructor Name"
              value={formData.instructor_name}
              onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
              fullWidth
              placeholder="e.g., Dr. John Smith"
            />

            <TextField
              label="Room Number"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              fullWidth
              placeholder="e.g., Room 101, Lab A"
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.value === "active" })
                }
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || !formData.program_id || !formData.start_time || !formData.end_time}
          >
            {loading ? "Saving..." : editingSchedule ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

