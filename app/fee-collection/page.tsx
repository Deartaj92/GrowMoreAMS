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
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/lib/toast/toast-context";
import { Student, Program, FeeChallan, FeePayment } from "@/lib/supabase/types";
import { format } from "date-fns";
import PageLoader from "@/components/common/PageLoader";

export default function FeeCollectionPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [challans, setChallans] = useState<FeeChallan[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<FeeChallan | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [expandedPayments, setExpandedPayments] = useState<Set<number>>(new Set());
  const [deletePaymentDialogOpen, setDeletePaymentDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<FeePayment | null>(null);
  const [paymentData, setPaymentData] = useState({
    paymentAmount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    paymentReference: "",
    notes: "",
  });

  // Load students with active status and active program assignments
  const loadStudents = async () => {
    if (!user?.academy_no) return;
    setLoadingStudents(true);
    try {
      // Get all active programs first
      const { data: activePrograms } = await supabase
        .from("programs")
        .select("id")
        .eq("academy_no", user.academy_no)
        .eq("status", "active");

      if (!activePrograms || activePrograms.length === 0) {
        setStudents([]);
        return;
      }

      const activeProgramIds = activePrograms.map((p) => p.id);

      // Get all active program enrollments
      const { data: enrollments } = await supabase
        .from("student_programs")
        .select("student_id")
        .eq("academy_no", user.academy_no)
        .eq("status", "active")
        .in("program_id", activeProgramIds);

      if (!enrollments || enrollments.length === 0) {
        setStudents([]);
        return;
      }

      const studentIds = Array.from(new Set(enrollments.map((e) => e.student_id)));

      // Get students with active status
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("status", "active")
        .in("id", studentIds)
        .order("name", { ascending: true });

      if (error) throw error;
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

  // Load challans for selected student
  const loadChallans = async () => {
    if (!user?.academy_no || !selectedStudent) {
      setChallans([]);
      setPayments([]);
      return;
    }

    setLoading(true);
    try {
      const { data: challansData, error: challansError } = await supabase
        .from("fee_challans")
        .select("*")
        .eq("academy_no", user.academy_no)
        .eq("student_id", selectedStudent.id)
        .order("issue_date", { ascending: false });

      if (challansError) throw challansError;
      setChallans(challansData || []);

      // Load payments for all challans
      if (challansData && challansData.length > 0) {
        const challanIds = challansData.map((c) => c.id);
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("fee_payments")
          .select("*")
          .eq("academy_no", user.academy_no)
          .in("challan_id", challanIds)
          .order("payment_date", { ascending: false })
          .order("created_at", { ascending: false });

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
      loadStudents();
      loadPrograms();
    }
  }, [user?.academy_no]);

  useEffect(() => {
    if (selectedStudent) {
      loadChallans();
    } else {
      setChallans([]);
    }
  }, [selectedStudent]);

  const handleOpenPaymentDialog = (challan: FeeChallan) => {
    setSelectedChallan(challan);
    const currentPaid = challan.paid_amount || 0;
    const remaining = challan.amount - currentPaid;
    setPaymentData({
      paymentAmount: remaining, // Default to full remaining amount
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      paymentReference: "",
      notes: challan.notes || "",
    });
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedChallan(null);
    setPaymentData({
      paymentAmount: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      paymentReference: "",
      notes: "",
    });
  };

  const handleRecordPayment = async () => {
    if (!selectedChallan || !user?.academy_no) {
      toast.showError("Please select a challan");
      return;
    }

    if (paymentData.paymentAmount <= 0) {
      toast.showError("Payment amount must be greater than 0");
      return;
    }

    const currentPaid = selectedChallan.paid_amount || 0;
    const newPaidAmount = currentPaid + paymentData.paymentAmount;
    const remainingAmount = selectedChallan.amount - newPaidAmount;

    if (newPaidAmount > selectedChallan.amount) {
      toast.showError(`Payment amount cannot exceed remaining balance of Rs. ${(selectedChallan.amount - currentPaid).toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      // Determine new status
      let newStatus: "paid" | "partially_paid" | "pending" = "pending";
      if (newPaidAmount >= selectedChallan.amount) {
        newStatus = "paid";
      } else if (newPaidAmount > 0) {
        newStatus = "partially_paid";
      }

      // Update challan
      const { error: challanError } = await supabase
        .from("fee_challans")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          payment_date: paymentData.paymentDate,
          payment_method: paymentData.paymentMethod || null,
          payment_reference: paymentData.paymentReference || null,
          notes: paymentData.notes || null,
          updated_by: user.id,
        })
        .eq("id", selectedChallan.id);

      if (challanError) throw challanError;

      // Insert payment record
      const { error: paymentError } = await supabase
        .from("fee_payments")
        .insert({
          academy_no: user.academy_no,
          challan_id: selectedChallan.id,
          student_id: selectedChallan.student_id,
          amount: paymentData.paymentAmount,
          payment_date: paymentData.paymentDate,
          payment_method: paymentData.paymentMethod || null,
          payment_reference: paymentData.paymentReference || null,
          notes: paymentData.notes || null,
          created_by: user.id,
        });

      if (paymentError) throw paymentError;

      toast.showSuccess(
        newStatus === "paid"
          ? "Payment recorded successfully! Challan fully paid."
          : `Payment of Rs. ${paymentData.paymentAmount.toFixed(2)} recorded. Remaining: Rs. ${remainingAmount.toFixed(2)}`
      );
      await loadChallans();
      handleClosePaymentDialog();
    } catch (err: any) {
      toast.showError(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const getProgramName = (programId: number) => {
    return programs.find((p) => p.id === programId)?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "partially_paid":
        return "info";
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

  const handleToggleRow = (challanId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(challanId)) {
        newSet.delete(challanId);
      } else {
        newSet.add(challanId);
      }
      return newSet;
    });
  };

  const handleTogglePaymentRow = (paymentId: number) => {
    setExpandedPayments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const handleOpenDeletePaymentDialog = (payment: FeePayment) => {
    setPaymentToDelete(payment);
    setDeletePaymentDialogOpen(true);
  };

  const handleCloseDeletePaymentDialog = () => {
    setDeletePaymentDialogOpen(false);
    setPaymentToDelete(null);
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete || !user?.academy_no) {
      toast.showError("Please select a payment");
      return;
    }

    setLoading(true);
    try {
      // Delete payment
      const { error: paymentError } = await supabase.from("fee_payments").delete().eq("id", paymentToDelete.id);

      if (paymentError) throw paymentError;

      // Find the challan and recalculate paid_amount
      const challan = challans.find((c) => c.id === paymentToDelete.challan_id);
      if (challan) {
        const remainingPayments = payments.filter((p) => p.challan_id === challan.id && p.id !== paymentToDelete.id);
        const newPaidAmount = remainingPayments.reduce((sum, p) => sum + p.amount, 0);

        // Determine new status
        let newStatus: "paid" | "partially_paid" | "pending" = "pending";
        if (newPaidAmount >= challan.amount) {
          newStatus = "paid";
        } else if (newPaidAmount > 0) {
          newStatus = "partially_paid";
        }

        // Update challan
        const { error: challanError } = await supabase
          .from("fee_challans")
          .update({
            paid_amount: newPaidAmount,
            status: newStatus,
            updated_by: user.id,
          })
          .eq("id", challan.id);

        if (challanError) throw challanError;
      }

      toast.showSuccess("Payment deleted successfully!");
      await loadChallans();
      handleCloseDeletePaymentDialog();
    } catch (err: any) {
      toast.showError(err.message || "Failed to delete payment");
    } finally {
      setLoading(false);
    }
  };

  // Filter pending, overdue, and partially paid challans
  const pendingChallans = challans.filter(
    (c) => c.status === "pending" || c.status === "overdue" || c.status === "partially_paid"
  );
  // Only show fully paid challans in Payment History
  const paidChallans = challans.filter((c) => {
    const paid = c.paid_amount || 0;
    return c.status === "paid" && paid >= c.amount;
  });
  const totalPending = pendingChallans.reduce((sum, c) => {
    const paid = c.paid_amount || 0;
    return sum + (c.amount - paid);
  }, 0);
  const totalPaid = challans.reduce((sum, c) => sum + (c.paid_amount || 0), 0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Fee Collection
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Record fee payments for students
        </Typography>
      </Box>

      {/* Student Selection */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Select Student
        </Typography>
        <Autocomplete
          options={students}
          getOptionLabel={(option) => `${option.name}${option.phone ? ` - ${option.phone}` : ""}`}
          value={selectedStudent}
          onChange={(_, newValue) => setSelectedStudent(newValue)}
          loading={loadingStudents}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Student"
              placeholder="Type to search..."
              InputProps={{
                ...params.InputProps,
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
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
      </Paper>

      {selectedStudent && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper elevation={1} sx={{ p: 2, bgcolor: "warning.light" }}>
                <Typography variant="caption" color="text.secondary">
                  Pending Amount
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Rs. {totalPending.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {pendingChallans.length} challan(s)
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={1} sx={{ p: 2, bgcolor: "success.light" }}>
                <Typography variant="caption" color="text.secondary">
                  Paid Amount
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Rs. {totalPaid.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {paidChallans.length} challan(s)
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={1} sx={{ p: 2, bgcolor: "info.light" }}>
                <Typography variant="caption" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Rs. {(totalPending + totalPaid).toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {challans.length} challan(s)
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Pending Challans */}
          {loading ? (
            <PageLoader message="Loading challans..." fullScreen={false} />
          ) : (
            <>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Pending Challans
                </Typography>
                {pendingChallans.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <ReceiptIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No pending challans
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, width: 50 }}></TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Challan #</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Program</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Issue Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Total Amount</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Paid</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Remaining</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingChallans.map((challan) => {
                          const paid = challan.paid_amount || 0;
                          const remaining = challan.amount - paid;
                          const isExpanded = expandedRows.has(challan.id);
                          return (
                            <React.Fragment key={challan.id}>
                              <TableRow hover>
                                <TableCell>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleToggleRow(challan.id)}
                                    sx={{ p: 0.5 }}
                                  >
                                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  </IconButton>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {challan.challan_number}
                                  </Typography>
                                </TableCell>
                                <TableCell>{getProgramName(challan.program_id)}</TableCell>
                                <TableCell>{formatDate(challan.issue_date)}</TableCell>
                                <TableCell>{formatDate(challan.due_date)}</TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Rs. {challan.amount.toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" color="success.main">
                                    Rs. {paid.toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
                                    Rs. {remaining.toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={challan.status === "partially_paid" ? "Partially Paid" : challan.status}
                                    size="small"
                                    color={getStatusColor(challan.status) as any}
                                    sx={{ textTransform: "capitalize" }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<PaymentIcon />}
                                    onClick={() => handleOpenPaymentDialog(challan)}
                                    disabled={challan.status === "paid"}
                                  >
                                    {paid > 0 ? "Pay More" : "Pay"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                              {isExpanded && (() => {
                                const challanPayments = payments.filter((p) => p.challan_id === challan.id);
                                const totalPaidFromPayments = challanPayments.reduce((sum, p) => sum + p.amount, 0);
                                return (
                                  <TableRow>
                                    <TableCell colSpan={10} sx={{ py: 2, bgcolor: "background.default" }}>
                                      <Box sx={{ pl: 4 }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            Payment History
                                          </Typography>
                                          <Box sx={{ display: "flex", gap: 2 }}>
                                            <Box>
                                              <Typography variant="caption" color="text.secondary">
                                                Total Paid
                                              </Typography>
                                              <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                                                Rs. {totalPaidFromPayments.toFixed(2)}
                                              </Typography>
                                            </Box>
                                            <Box>
                                              <Typography variant="caption" color="text.secondary">
                                                Remaining
                                              </Typography>
                                              <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
                                                Rs. {remaining.toFixed(2)}
                                              </Typography>
                                            </Box>
                                          </Box>
                                        </Box>
                                        {challanPayments.length === 0 ? (
                                          <Box sx={{ textAlign: "center", py: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                              No payments recorded yet
                                            </Typography>
                                          </Box>
                                        ) : (
                                           <TableContainer>
                                             <Table size="small">
                                               <TableHead>
                                                 <TableRow>
                                                   <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                                                   <TableCell sx={{ fontWeight: 600 }}>Payment Date</TableCell>
                                                   <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                                                   <TableCell sx={{ fontWeight: 600 }}>Payment Method</TableCell>
                                                   <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                                                   <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                                                 </TableRow>
                                               </TableHead>
                                               <TableBody>
                                                 {challanPayments.map((payment, index) => (
                                                   <TableRow key={payment.id} hover>
                                                     <TableCell>{index + 1}</TableCell>
                                                     <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                                     <TableCell align="right">
                                                       <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                         Rs. {payment.amount.toFixed(2)}
                                                       </Typography>
                                                     </TableCell>
                                                 <TableCell>{payment.payment_method || "N/A"}</TableCell>
                                                 <TableCell>{payment.payment_reference || "N/A"}</TableCell>
                                                 <TableCell>
                                                   <Typography variant="body2" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                                                     {payment.notes || "—"}
                                                   </Typography>
                                                 </TableCell>
                                                 <TableCell align="right">
                                                   <IconButton
                                                     size="small"
                                                     onClick={() => handleOpenDeletePaymentDialog(payment)}
                                                     color="error"
                                                   >
                                                     <DeleteIcon fontSize="small" />
                                                   </IconButton>
                                                 </TableCell>
                                               </TableRow>
                                                 ))}
                                               </TableBody>
                                             </Table>
                                           </TableContainer>
                                         )}
                                       </Box>
                                     </TableCell>
                                   </TableRow>
                                 );
                               })()}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>

               {/* Payment History */}
               {paidChallans.length > 0 && (
                 <Paper elevation={1} sx={{ p: 2 }}>
                   <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                     Payment History
                   </Typography>
                   <TableContainer>
                     <Table size="small">
                       <TableHead>
                         <TableRow>
                           <TableCell sx={{ fontWeight: 600, width: 50 }}></TableCell>
                           <TableCell sx={{ fontWeight: 600 }}>Challan #</TableCell>
                           <TableCell sx={{ fontWeight: 600 }}>Program</TableCell>
                           <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                           <TableCell sx={{ fontWeight: 600 }}>Payment Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Payment Method</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paidChallans.map((challan) => {
                          const isExpanded = expandedRows.has(challan.id);
                          const challanPayments = payments.filter((p) => p.challan_id === challan.id);
                          return (
                            <React.Fragment key={challan.id}>
                              <TableRow hover>
                                <TableCell>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleToggleRow(challan.id)}
                                    sx={{ p: 0.5 }}
                                  >
                                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  </IconButton>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {challan.challan_number}
                                  </Typography>
                                </TableCell>
                                <TableCell>{getProgramName(challan.program_id)}</TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Rs. {challan.amount.toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell>{formatDate(challan.payment_date)}</TableCell>
                                <TableCell>{challan.payment_method || "N/A"}</TableCell>
                                <TableCell>{challan.payment_reference || "N/A"}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={challan.status}
                                    size="small"
                                    color={getStatusColor(challan.status) as any}
                                    sx={{ textTransform: "capitalize" }}
                                  />
                                </TableCell>
                              </TableRow>
                               {isExpanded && challanPayments.length > 0 && (
                                 <TableRow>
                                   <TableCell colSpan={8} sx={{ py: 2, bgcolor: "background.default" }}>
                                     <Box sx={{ pl: 4 }}>
                                       <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                         Individual Payments
                                       </Typography>
                                       <TableContainer>
                                         <Table size="small">
                                           <TableHead>
                                             <TableRow>
                                               <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                                               <TableCell sx={{ fontWeight: 600 }}>Payment Date</TableCell>
                                               <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                                               <TableCell sx={{ fontWeight: 600 }}>Payment Method</TableCell>
                                               <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                                               <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                                               <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                                             </TableRow>
                                           </TableHead>
                                           <TableBody>
                                             {challanPayments.map((payment, index) => (
                                               <TableRow key={payment.id} hover>
                                                 <TableCell>{index + 1}</TableCell>
                                                 <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                                 <TableCell align="right">
                                                   <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                     Rs. {payment.amount.toFixed(2)}
                                                   </Typography>
                                                 </TableCell>
                                                 <TableCell>{payment.payment_method || "N/A"}</TableCell>
                                                 <TableCell>{payment.payment_reference || "N/A"}</TableCell>
                                                 <TableCell>
                                                   <Typography variant="body2" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                                                     {payment.notes || "—"}
                                                   </Typography>
                                                 </TableCell>
                                                 <TableCell align="right">
                                                   <IconButton
                                                     size="small"
                                                     onClick={() => handleOpenDeletePaymentDialog(payment)}
                                                     color="error"
                                                   >
                                                     <DeleteIcon fontSize="small" />
                                                   </IconButton>
                                                 </TableCell>
                                               </TableRow>
                                             ))}
                                           </TableBody>
                                         </Table>
                                       </TableContainer>
                                     </Box>
                                   </TableCell>
                                 </TableRow>
                               )}
                             </React.Fragment>
                           );
                         })}
                       </TableBody>
                     </Table>
                   </TableContainer>
                 </Paper>
               )}
            </>
          )}
        </>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Record Payment
          </Typography>
          <IconButton size="small" onClick={handleClosePaymentDialog}>
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
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Rs. {selectedChallan.amount.toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Already Paid
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "success.main" }}>
                      Rs. {(selectedChallan.paid_amount || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p: 1.5, bgcolor: "warning.light", borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Remaining Balance
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "error.main" }}>
                      Rs. {(selectedChallan.amount - (selectedChallan.paid_amount || 0)).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider />
              <TextField
                fullWidth
                label="Payment Amount"
                type="number"
                value={paymentData.paymentAmount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  const maxAmount = selectedChallan.amount - (selectedChallan.paid_amount || 0);
                  setPaymentData({ ...paymentData, paymentAmount: Math.min(value, maxAmount) });
                }}
                inputProps={{ min: 0, step: 0.01, max: selectedChallan.amount - (selectedChallan.paid_amount || 0) }}
                size="small"
                required
                helperText={`Maximum: Rs. ${(selectedChallan.amount - (selectedChallan.paid_amount || 0)).toFixed(2)}`}
              />
              <TextField
                fullWidth
                label="Payment Date"
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size="small"
                required
              />
              <FormControl fullWidth size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  label="Payment Method"
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="online">Online Payment</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Payment Reference (Optional)"
                value={paymentData.paymentReference}
                onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                size="small"
                placeholder="Transaction ID, Cheque Number, etc."
              />
              <TextField
                fullWidth
                label="Notes (Optional)"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                multiline
                rows={2}
                size="small"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClosePaymentDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<PaymentIcon />}
            onClick={handleRecordPayment}
            disabled={loading}
          >
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Payment Confirmation Dialog */}
      <Dialog open={deletePaymentDialogOpen} onClose={handleCloseDeletePaymentDialog} maxWidth="sm">
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Delete Payment
          </Typography>
          <IconButton size="small" onClick={handleCloseDeletePaymentDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {paymentToDelete && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete this payment of <strong>Rs. {paymentToDelete.amount.toFixed(2)}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This will update the challan's paid amount and status. This action cannot be undone.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeletePaymentDialog} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDeletePayment} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

