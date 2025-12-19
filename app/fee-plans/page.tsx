"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Autocomplete,
  Grid,
  Divider,
  InputAdornment,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/lib/toast/toast-context";
import { Student, Program, FeePlan } from "@/lib/supabase/types";

const DISCOUNT_TYPES = [
  "Siblings",
  "Merit",
  "Need-based",
  "Staff",
  "Early Payment",
  "Bulk Payment",
  "Other",
];

export default function FeePlansPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [expandedPlans, setExpandedPlans] = useState<Set<number>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FeePlan | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({
    effectiveFrom: new Date().toISOString().split("T")[0],
    actualFee: 0,
    discountAmount: 0,
    discountPercent: 0,
    feeAfterDiscount: 0,
    discountType: "",
    discountReason: "",
    notes: "",
  });

  // Load programs - filtered by selected student if available
  const loadPrograms = async (studentId?: number) => {
    if (!user?.academy_no) return;
    setLoadingPrograms(true);
    try {
      if (studentId) {
        // Get programs assigned to the selected student
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("student_programs")
          .select("program_id")
          .eq("academy_no", user.academy_no)
          .eq("student_id", studentId)
          .eq("status", "active");

        if (enrollmentsError) throw enrollmentsError;

        if (!enrollments || enrollments.length === 0) {
          setPrograms([]);
          return;
        }

        const programIds = enrollments.map((e) => e.program_id);

        // Get active programs that are assigned to the student
        const { data: activePrograms, error: programsError } = await supabase
          .from("programs")
          .select("id")
          .eq("academy_no", user.academy_no)
          .eq("status", "active")
          .in("id", programIds);

        if (programsError) throw programsError;

        const activeProgramIds = (activePrograms || []).map((p) => p.id);

        if (activeProgramIds.length === 0) {
          setPrograms([]);
          return;
        }

        // Get program details
        const { data, error: fetchError } = await supabase
          .from("programs")
          .select("*")
          .eq("academy_no", user.academy_no)
          .eq("status", "active")
          .in("id", activeProgramIds)
          .order("name", { ascending: true });

        if (fetchError) throw fetchError;
        setPrograms(data || []);
      } else {
        // No student selected, show all active programs
        const { data, error: fetchError } = await supabase
          .from("programs")
          .select("*")
          .eq("academy_no", user.academy_no)
          .eq("status", "active")
          .order("name", { ascending: true });
        if (fetchError) throw fetchError;
        setPrograms(data || []);
      }
    } catch (err: any) {
      toast.showError(err.message || "Failed to load programs");
    } finally {
      setLoadingPrograms(false);
    }
  };

  // Load students with active status and at least one active program assignment
  const loadStudents = async () => {
    if (!user?.academy_no) return;
    setLoadingStudents(true);
    try {
      // First, get all active programs
      const { data: activePrograms, error: programsError } = await supabase
        .from("programs")
        .select("id")
        .eq("academy_no", user.academy_no)
        .eq("status", "active");

      if (programsError) throw programsError;

      const activeProgramIds = (activePrograms || []).map((p) => p.id);

      if (activeProgramIds.length === 0) {
        setStudents([]);
        return;
      }

      // Get all active program enrollments for active programs
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("student_programs")
        .select("student_id")
        .eq("academy_no", user.academy_no)
        .eq("status", "active")
        .in("program_id", activeProgramIds);

      if (enrollmentsError) throw enrollmentsError;

      if (!enrollments || enrollments.length === 0) {
        setStudents([]);
        return;
      }

      // Get unique student IDs with active program assignments
      const studentIds = Array.from(new Set(enrollments.map((e) => e.student_id)));

      // Get students with active status
      const { data, error: fetchError } = await supabase
        .from("students")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("status", "active")
        .in("id", studentIds)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;
      setStudents(data || []);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load students");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Load fee plans
  const loadFeePlans = async () => {
    if (!user?.academy_no) return;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("fee_plans")
        .select("*")
        .eq("academy_no", user.academy_no)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setFeePlans(data || []);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load fee plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.academy_no) {
      loadStudents();
      loadFeePlans();
    }
  }, [user?.academy_no]);

  // Load programs when student is selected or deselected
  useEffect(() => {
    if (user?.academy_no) {
      loadPrograms(selectedStudent?.id);
    }
  }, [selectedStudent, user?.academy_no]);

  // When program is selected, set actual fee from program
  useEffect(() => {
    if (selectedProgram && selectedProgram.fee_amount) {
      const programFee = selectedProgram.fee_amount;
      setFormData((prev) => {
        const discountAmount = prev.discountAmount;
        const feeAfterDiscount = programFee - discountAmount;
        const discountPercent = programFee > 0 ? (discountAmount / programFee) * 100 : 0;
        return {
          ...prev,
          actualFee: programFee,
          feeAfterDiscount: Math.max(0, feeAfterDiscount),
          discountPercent: Math.round(discountPercent * 100) / 100,
        };
      });
    } else if (selectedProgram && !selectedProgram.fee_amount) {
      setFormData((prev) => ({
        ...prev,
        actualFee: 0,
        feeAfterDiscount: 0,
        discountAmount: 0,
        discountPercent: 0,
      }));
    }
  }, [selectedProgram]);

  const handleOpenDialog = () => {
    setEditingPlan(null);
    setSelectedStudent(null);
    setSelectedProgram(null);
    setFormData({
      effectiveFrom: new Date().toISOString().split("T")[0],
      actualFee: 0,
      discountAmount: 0,
      discountPercent: 0,
      feeAfterDiscount: 0,
      discountType: "",
      discountReason: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPlan(null);
    setSelectedStudent(null);
    setSelectedProgram(null);
  };

  const handleEdit = (plan: FeePlan) => {
    setEditingPlan(plan);
    setSelectedStudent(students.find((s) => s.id === plan.student_id) || null);
    setSelectedProgram(programs.find((p) => p.id === plan.program_id) || null);
    setFormData({
      effectiveFrom: plan.effective_from,
      actualFee: plan.actual_fee,
      discountAmount: plan.discount_amount,
      discountPercent: plan.discount_percent,
      feeAfterDiscount: plan.fee_after_discount,
      discountType: plan.discount_type || "",
      discountReason: plan.discount_reason || "",
      notes: plan.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDiscountChange = (field: "discountAmount" | "discountPercent" | "feeAfterDiscount", value: number) => {
    const actualFee = formData.actualFee;
    let discountAmount = formData.discountAmount;
    let discountPercent = formData.discountPercent;
    let feeAfterDiscount = formData.feeAfterDiscount;

    if (field === "discountAmount") {
      discountAmount = value;
      feeAfterDiscount = actualFee - discountAmount;
      discountPercent = actualFee > 0 ? (discountAmount / actualFee) * 100 : 0;
    } else if (field === "discountPercent") {
      discountPercent = value;
      discountAmount = (actualFee * discountPercent) / 100;
      feeAfterDiscount = actualFee - discountAmount;
    } else if (field === "feeAfterDiscount") {
      feeAfterDiscount = value;
      discountAmount = actualFee - feeAfterDiscount;
      discountPercent = actualFee > 0 ? (discountAmount / actualFee) * 100 : 0;
    }

    setFormData({
      ...formData,
      discountAmount: Math.max(0, discountAmount),
      discountPercent: Math.round(discountPercent * 100) / 100,
      feeAfterDiscount: Math.max(0, feeAfterDiscount),
    });
  };

  const handleSave = async () => {
    if (!selectedStudent || !selectedProgram || !user?.academy_no) {
      toast.showError("Please select both student and program");
      return;
    }

    if (formData.actualFee <= 0) {
      toast.showError("Program fee amount is required. Please select a program with a fee amount.");
      return;
    }

    setLoading(true);

    try {
      const planData: any = {
        academy_no: user.academy_no,
        student_id: selectedStudent.id,
        program_id: selectedProgram.id,
        actual_fee: formData.actualFee,
        discount_amount: formData.discountAmount,
        discount_percent: formData.discountPercent,
        fee_after_discount: formData.feeAfterDiscount,
        effective_from: formData.effectiveFrom,
        discount_type: formData.discountType || null,
        discount_reason: formData.discountReason || null,
        notes: formData.notes || null,
        created_by: user.id,
        updated_by: user.id,
      };

      if (editingPlan) {
        // Update existing plan
        const { error: updateError } = await supabase
          .from("fee_plans")
          .update({
            ...planData,
            updated_by: user.id,
          })
          .eq("id", editingPlan.id);

        if (updateError) throw updateError;
        toast.showSuccess("Fee plan updated successfully!");
      } else {
        // Create new plan
        const { error: insertError } = await supabase.from("fee_plans").insert(planData);

        if (insertError) throw insertError;
        toast.showSuccess("Fee plan created successfully!");
      }

      await loadFeePlans();
      setTimeout(() => {
        handleCloseDialog();
      }, 1000);
    } catch (err: any) {
      toast.showError(err.message || "Failed to save fee plan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (plan: FeePlan) => {
    if (!confirm(`Are you sure you want to delete the fee plan for ${getStudentName(plan.student_id)}?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error: deleteError } = await supabase.from("fee_plans").delete().eq("id", plan.id);
      if (deleteError) throw deleteError;
      toast.showSuccess("Fee plan deleted successfully!");
      await loadFeePlans();
    } catch (err: any) {
      toast.showError(err.message || "Failed to delete fee plan");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (planId: number) => {
    setExpandedPlans((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  };

  const getStudentName = (studentId: number) => {
    return students.find((s) => s.id === studentId)?.name || "Unknown";
  };

  const getProgramName = (programId: number) => {
    return programs.find((p) => p.id === programId)?.name || "Unknown";
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
            Fee Plans
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage student fee plans with discounts based on program fees
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          Create Fee Plan
        </Button>
      </Box>


      {loading && feePlans.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : feePlans.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <AccountBalanceIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Fee Plans Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first fee plan to get started
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
            Create Fee Plan
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {feePlans.map((plan) => {
            const isExpanded = expandedPlans.has(plan.id);

            return (
              <Card key={plan.id} elevation={1}>
                <CardContent sx={{ p: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 2,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() => toggleExpand(plan.id)}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {getStudentName(plan.student_id)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getProgramName(plan.program_id)} • Effective From:{" "}
                        {new Date(plan.effective_from).toLocaleDateString()} • Fee: Rs.{" "}
                        {plan.fee_after_discount.toFixed(2)}
                        {plan.discount_type && (
                          <>
                            {" "}
                            • <Chip label={plan.discount_type} size="small" sx={{ height: 20, fontSize: "0.65rem" }} />
                          </>
                        )}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(plan);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(plan);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => toggleExpand(plan.id)}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  </Box>

                  {isExpanded && (
                    <>
                      <Divider />
                      <Box sx={{ p: 2 }}>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" color="text.secondary">
                              Actual Fee
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Rs. {plan.actual_fee.toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" color="text.secondary">
                              Discount
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: "success.main" }}>
                              Rs. {plan.discount_amount.toFixed(2)} ({plan.discount_percent.toFixed(2)}%)
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" color="text.secondary">
                              Fee After Discount
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                              Rs. {plan.fee_after_discount.toFixed(2)}
                            </Typography>
                          </Grid>
                        </Grid>

                        {plan.notes && (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            <strong>Notes:</strong> {plan.notes}
                          </Alert>
                        )}
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingPlan ? "Edit Fee Plan" : "Create Fee Plan"}
          </Typography>
          <IconButton size="small" onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Autocomplete
              options={students}
              getOptionLabel={(option) => option.name}
              value={selectedStudent}
              onChange={(_, newValue) => {
                setSelectedStudent(newValue);
                setSelectedProgram(null); // Reset program when student changes
              }}
              loading={loadingStudents}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Student"
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingStudents ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <Autocomplete
              options={programs}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={selectedProgram}
              onChange={(_, newValue) => setSelectedProgram(newValue)}
              disabled={!selectedStudent || loadingPrograms}
              loading={loadingPrograms}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Program"
                  required
                  disabled={!selectedStudent || loadingPrograms}
                  helperText={
                    loadingPrograms
                      ? "Loading programs..."
                      : !selectedStudent
                      ? "Please select a student first"
                      : selectedProgram && !selectedProgram.fee_amount
                      ? "This program has no fee amount set"
                      : selectedProgram && selectedProgram.fee_amount
                      ? `Program fee: Rs. ${selectedProgram.fee_amount.toFixed(2)}`
                      : programs.length === 0
                      ? "No programs assigned to this student"
                      : ""
                  }
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
            />

            {selectedProgram && selectedProgram.fee_amount && (
              <>
                <TextField
                  fullWidth
                  label="Effective From"
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />

                <Divider />

                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Fee Details
                </Typography>

                <TextField
                  fullWidth
                  label="Actual Fee"
                  type="number"
                  value={formData.actualFee}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                    readOnly: true,
                  }}
                  size="small"
                  helperText="Fee from selected program"
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Discount Amount"
                      type="number"
                      value={formData.discountAmount}
                      onChange={(e) =>
                        handleDiscountChange("discountAmount", parseFloat(e.target.value) || 0)
                      }
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Discount Percent"
                      type="number"
                      value={formData.discountPercent}
                      onChange={(e) =>
                        handleDiscountChange("discountPercent", parseFloat(e.target.value) || 0)
                      }
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                      size="small"
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Fee After Discount"
                  type="number"
                  value={formData.feeAfterDiscount}
                  onChange={(e) =>
                    handleDiscountChange("feeAfterDiscount", parseFloat(e.target.value) || 0)
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                  size="small"
                  helperText="Final fee amount after discount"
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Discount Type</InputLabel>
                  <Select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    label="Discount Type"
                  >
                    <MenuItem value="">None</MenuItem>
                    {DISCOUNT_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Discount Reason"
                  value={formData.discountReason}
                  onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
                  size="small"
                  multiline
                  rows={2}
                  placeholder="Optional reason for discount"
                />

                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  size="small"
                  multiline
                  rows={2}
                  placeholder="Additional notes (optional)"
                />
              </>
            )}

            {selectedProgram && !selectedProgram.fee_amount && (
              <Alert severity="warning">
                The selected program does not have a fee amount set. Please set a fee amount for the program first.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading || !selectedStudent || !selectedProgram || !selectedProgram.fee_amount}
          >
            {loading ? "Saving..." : editingPlan ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
