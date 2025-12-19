"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Print as PrintIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/lib/toast/toast-context";
import { Student, Program, FeePlan, FeeChallan, FeePayment } from "@/lib/supabase/types";
import { format } from "date-fns";
import PageLoader from "@/components/common/PageLoader";

export default function FeeChallansPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingFeePlans, setLoadingFeePlans] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [challans, setChallans] = useState<FeeChallan[]>([]);
  const [selectedFeePlanIds, setSelectedFeePlanIds] = useState<Set<number>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewChallan, setPreviewChallan] = useState<FeeChallan | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<FeeChallan | null>(null);
  const [challanToDelete, setChallanToDelete] = useState<FeeChallan | null>(null);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [editChallanData, setEditChallanData] = useState({
    issueDate: "",
    dueDate: "",
    amount: 0,
    notes: "",
  });
  const [formData, setFormData] = useState({
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
  });

  // Load active fee plans (only those with active students and programs)
  const loadFeePlans = async () => {
    if (!user?.academy_no) return;
    setLoadingFeePlans(true);
    try {
      // Get all fee plans
      const { data: allFeePlans, error: plansError } = await supabase
        .from("fee_plans")
        .select("*")
        .eq("academy_no", user.academy_no)
        .order("created_at", { ascending: false });

      if (plansError) throw plansError;

      // Get active students
      const { data: activeStudents } = await supabase
        .from("students")
        .select("id")
        .eq("academy_no", user.academy_no)
        .eq("status", "active");

      const activeStudentIds = new Set((activeStudents || []).map((s) => s.id));

      // Get active programs
      const { data: activePrograms } = await supabase
        .from("programs")
        .select("id")
        .eq("academy_no", user.academy_no)
        .eq("status", "active");

      const activeProgramIds = new Set((activePrograms || []).map((p) => p.id));

      // Filter fee plans to only include those with active students and programs
      const filteredPlans = (allFeePlans || []).filter(
        (plan) => activeStudentIds.has(plan.student_id) && activeProgramIds.has(plan.program_id)
      );

      setFeePlans(filteredPlans);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load fee plans");
    } finally {
      setLoadingFeePlans(false);
    }
  };

  // Load students
  const loadStudents = async () => {
    if (!user?.academy_no) return;
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      // Silent fail
    }
  };

  // Load programs
  const loadPrograms = async () => {
    if (!user?.academy_no) return;
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) throw error;
      setPrograms(data || []);
    } catch (err: any) {
      // Silent fail
    }
  };

  // Load challans
  const loadChallans = async () => {
    if (!user?.academy_no) return;
    setLoading(true);
    try {
      const { data: challansData, error: challansError } = await supabase
        .from("fee_challans")
        .select("*")
        .eq("academy_no", user.academy_no)
        .order("created_at", { ascending: false });

      if (challansError) throw challansError;
      setChallans(challansData || []);

      // Load payments for all challans
      if (challansData && challansData.length > 0) {
        const challanIds = challansData.map((c) => c.id);
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("fee_payments")
          .select("*")
          .eq("academy_no", user.academy_no)
          .in("challan_id", challanIds);

        if (paymentsError) throw paymentsError;
        setPayments(paymentsData || []);
      } else {
        setPayments([]);
      }
    } catch (err: any) {
      toast.showError(err.message || "Failed to load challans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.academy_no) {
      loadFeePlans();
      loadStudents();
      loadPrograms();
      loadChallans();
    }
  }, [user?.academy_no]);

  // Generate challan number
  const generateChallanNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `CH-${year}${month}-${random}`;
  };

  const handleSelectFeePlan = (feePlanId: number) => {
    setSelectedFeePlanIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(feePlanId)) {
        newSet.delete(feePlanId);
      } else {
        newSet.add(feePlanId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedFeePlanIds.size === feePlans.length) {
      setSelectedFeePlanIds(new Set());
    } else {
      setSelectedFeePlanIds(new Set(feePlans.map((p) => p.id)));
    }
  };

  const handleGenerateBulkChallans = async () => {
    if (selectedFeePlanIds.size === 0) {
      toast.showError("Please select at least one fee plan");
      return;
    }

    if (!user?.academy_no) {
      toast.showError("User information not available");
      return;
    }

    setGenerating(true);
    try {
      const selectedPlans = feePlans.filter((plan) => selectedFeePlanIds.has(plan.id));
      const challansToCreate = selectedPlans.map((plan) => ({
        academy_no: user.academy_no,
        fee_plan_id: plan.id,
        student_id: plan.student_id,
        program_id: plan.program_id,
        challan_number: generateChallanNumber(),
        issue_date: formData.issueDate,
        due_date: formData.dueDate,
        amount: plan.fee_after_discount,
        status: "pending" as const,
        notes: formData.notes || null,
        created_by: user.id,
      }));

      const { data, error } = await supabase.from("fee_challans").insert(challansToCreate).select();

      if (error) throw error;

      toast.showSuccess(`Successfully generated ${challansToCreate.length} challan(s)!`);
      await loadChallans();
      setSelectedFeePlanIds(new Set());
      setFormData({
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        notes: "",
      });
    } catch (err: any) {
      toast.showError(err.message || "Failed to generate challans");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenEditDialog = (challan: FeeChallan) => {
    setSelectedChallan(challan);
    setEditChallanData({
      issueDate: challan.issue_date,
      dueDate: challan.due_date,
      amount: challan.amount,
      notes: challan.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedChallan(null);
    setEditChallanData({
      issueDate: "",
      dueDate: "",
      amount: 0,
      notes: "",
    });
  };

  const handleUpdateChallan = async () => {
    if (!selectedChallan || !user?.academy_no) {
      toast.showError("Please select a challan");
      return;
    }

    if (editChallanData.amount <= 0) {
      toast.showError("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("fee_challans")
        .update({
          issue_date: editChallanData.issueDate,
          due_date: editChallanData.dueDate,
          amount: editChallanData.amount,
          notes: editChallanData.notes || null,
          updated_by: user.id,
        })
        .eq("id", selectedChallan.id);

      if (error) throw error;

      toast.showSuccess("Challan updated successfully!");
      await loadChallans();
      handleCloseEditDialog();
    } catch (err: any) {
      toast.showError(err.message || "Failed to update challan");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (challan: FeeChallan) => {
    setChallanToDelete(challan);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setChallanToDelete(null);
  };

  const handleDeleteChallan = async () => {
    if (!challanToDelete || !user?.academy_no) {
      toast.showError("Please select a challan");
      return;
    }

    // Check if challan has payments
    const challanPayments = payments.filter((p) => p.challan_id === challanToDelete.id);
    if (challanPayments.length > 0) {
      toast.showError("Cannot delete challan with existing payments. Please delete payments first.");
      handleCloseDeleteDialog();
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("fee_challans").delete().eq("id", challanToDelete.id);

      if (error) throw error;

      toast.showSuccess("Challan deleted successfully!");
      await loadChallans();
      handleCloseDeleteDialog();
    } catch (err: any) {
      toast.showError(err.message || "Failed to delete challan");
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId: number) => {
    return students.find((s) => s.id === studentId)?.name || "Unknown";
  };

  const getProgramName = (programId: number) => {
    return programs.find((p) => p.id === programId)?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "overdue":
        return "error";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "N/A";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Fee Challans
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generate and manage fee challans for students
        </Typography>
      </Box>

      {/* Fee Plans Selection Section */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Active Fee Plans
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedFeePlanIds.size === feePlans.length && feePlans.length > 0}
                  indeterminate={selectedFeePlanIds.size > 0 && selectedFeePlanIds.size < feePlans.length}
                  onChange={handleSelectAll}
                  size="small"
                />
              }
              label={`Select All (${selectedFeePlanIds.size}/${feePlans.length})`}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleGenerateBulkChallans}
              disabled={selectedFeePlanIds.size === 0 || generating}
            >
              {generating ? `Generating ${selectedFeePlanIds.size}...` : `Generate ${selectedFeePlanIds.size} Challan(s)`}
            </Button>
          </Box>
        </Box>

        {/* Date Selection */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Issue Date"
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              size="small"
              placeholder="Notes for all challans"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Fee Plans List */}
        {loadingFeePlans ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : feePlans.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <ReceiptIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No active fee plans found
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: 50 }}>
                    <Checkbox
                      checked={selectedFeePlanIds.size === feePlans.length && feePlans.length > 0}
                      indeterminate={selectedFeePlanIds.size > 0 && selectedFeePlanIds.size < feePlans.length}
                      onChange={handleSelectAll}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Program</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actual Fee</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Discount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Amount Due</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feePlans.map((plan) => {
                  const isSelected = selectedFeePlanIds.has(plan.id);
                  const student = students.find((s) => s.id === plan.student_id);
                  const program = programs.find((p) => p.id === plan.program_id);
                  return (
                    <TableRow
                      key={plan.id}
                      hover
                      selected={isSelected}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "action.hover" },
                      }}
                      onClick={() => handleSelectFeePlan(plan.id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectFeePlan(plan.id)}
                          onClick={(e) => e.stopPropagation()}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {student?.name || "Unknown"}
                        </Typography>
                        {student?.phone && (
                          <Typography variant="caption" color="text.secondary">
                            {student.phone}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{program?.name || "Unknown"}</Typography>
                        {program?.code && (
                          <Typography variant="caption" color="text.secondary">
                            {program.code}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">Rs. {plan.actual_fee.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          Rs. {plan.discount_amount.toFixed(2)} ({plan.discount_percent.toFixed(2)}%)
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Rs. {plan.fee_after_discount.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Existing Challans List */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Generated Challans
        </Typography>
        {loading && challans.length === 0 ? (
          <PageLoader message="Loading challans..." fullScreen={false} />
        ) : challans.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <ReceiptIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No challans generated yet
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Challan #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Program</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Issue Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {challans.map((challan) => (
                  <TableRow key={challan.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {challan.challan_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStudentName(challan.student_id)}</TableCell>
                    <TableCell>{getProgramName(challan.program_id)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Rs. {challan.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(challan.issue_date)}</TableCell>
                    <TableCell>{formatDate(challan.due_date)}</TableCell>
                    <TableCell>
                      <Chip
                        label={challan.status}
                        size="small"
                        color={getStatusColor(challan.status) as any}
                        sx={{ textTransform: "capitalize" }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setPreviewChallan(challan);
                            setPreviewOpen(true);
                          }}
                        >
                          <PrintIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(challan)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDeleteDialog(challan)}
                          color="error"
                          disabled={payments.filter((p) => p.challan_id === challan.id).length > 0}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Challan Preview/Print Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            "@media print": {
              boxShadow: "none",
              margin: 0,
              maxWidth: "100%",
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Fee Challan
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <IconButton size="small" onClick={() => setPreviewOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {previewChallan && (
            <Box
              sx={{
                "@media print": {
                  "& .no-print": {
                    display: "none",
                  },
                },
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  border: "2px solid",
                  borderColor: "divider",
                  "@media print": {
                    boxShadow: "none",
                    border: "1px solid #000",
                  },
                }}
              >
                {/* Header */}
                <Box sx={{ textAlign: "center", mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    Grow More Academy
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fee Challan
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Challan Details */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Challan Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {previewChallan.challan_number}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">
                      Issue Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatDate(previewChallan.issue_date)}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Student Details */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Student Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {getStudentName(previewChallan.student_id)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Program
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {getProgramName(previewChallan.program_id)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Fee Details */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Fee Details
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Amount Due</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          Rs. {previewChallan.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Due Date</TableCell>
                        <TableCell align="right">
                          {formatDate(previewChallan.due_date)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={previewChallan.status}
                            size="small"
                            color={getStatusColor(previewChallan.status) as any}
                            sx={{ textTransform: "capitalize" }}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>

                {previewChallan.notes && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Notes
                      </Typography>
                      <Typography variant="body2">{previewChallan.notes}</Typography>
                    </Box>
                  </>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Footer */}
                <Box sx={{ textAlign: "center", mt: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    This is a computer-generated challan. Please keep this for your records.
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Challan Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Edit Challan
          </Typography>
          <IconButton size="small" onClick={handleCloseEditDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {selectedChallan && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Challan Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedChallan.challan_number}
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Issue Date"
                type="date"
                value={editChallanData.issueDate}
                onChange={(e) => setEditChallanData({ ...editChallanData, issueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size="small"
                required
              />
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={editChallanData.dueDate}
                onChange={(e) => setEditChallanData({ ...editChallanData, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size="small"
                required
              />
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={editChallanData.amount}
                onChange={(e) => setEditChallanData({ ...editChallanData, amount: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, step: 0.01 }}
                size="small"
                required
              />
              <TextField
                fullWidth
                label="Notes (Optional)"
                value={editChallanData.notes}
                onChange={(e) => setEditChallanData({ ...editChallanData, notes: e.target.value })}
                multiline
                rows={2}
                size="small"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEditDialog} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={<EditIcon />} onClick={handleUpdateChallan} disabled={loading}>
            {loading ? "Updating..." : "Update Challan"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Challan Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm">
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Delete Challan
          </Typography>
          <IconButton size="small" onClick={handleCloseDeleteDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {challanToDelete && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete challan <strong>{challanToDelete.challan_number}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This action cannot be undone. Challans with existing payments cannot be deleted.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteChallan} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

