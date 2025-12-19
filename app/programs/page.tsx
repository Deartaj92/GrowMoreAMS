"use client";

import React, { useState } from "react";
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
  Alert,
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

interface Program {
  id: number;
  academy_no: string;
  name: string;
  code: string;
  description?: string;
  duration?: number;
  duration_unit?: "years" | "months";
  fee_amount?: number;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export default function ProgramsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState<Partial<Program>>({
    name: "",
    code: "",
    description: "",
    duration: undefined,
    duration_unit: "years",
    fee_amount: undefined,
    status: "active",
  });

  // Load programs from database filtered by academy_no
  const loadPrograms = async () => {
    if (!user?.academy_no) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("programs")
        .select("*")
        .eq("academy_no", user.academy_no)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setPrograms(data || []);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (user?.academy_no) {
      loadPrograms();
    }
  }, [user?.academy_no]);

  const handleOpenDialog = (program?: Program) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        name: program.name,
        code: program.code,
        description: program.description || "",
        duration: program.duration,
        duration_unit: program.duration_unit || "years",
        fee_amount: program.fee_amount,
        status: program.status,
      });
    } else {
      setEditingProgram(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        duration: undefined,
        duration_unit: "years",
        fee_amount: undefined,
        status: "active",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProgram(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      duration: undefined,
      duration_unit: "years",
      fee_amount: undefined,
      status: "active",
    });
  };

  const handleSubmit = async () => {
    if (!user?.academy_no) {
      toast.showError("User academy number not found");
      return;
    }

    if (!formData.name || !formData.code) {
      toast.showError("Name and Code are required");
      return;
    }

    setLoading(true);

    try {
      if (editingProgram) {
        // Update existing program
        const { error: updateError } = await supabase
          .from("programs")
          .update({
            name: formData.name,
            code: formData.code,
            description: formData.description || null,
            duration: formData.duration || null,
            duration_unit: formData.duration_unit || null,
            fee_amount: formData.fee_amount || null,
            status: formData.status || "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingProgram.id)
          .eq("academy_no", user.academy_no);

        if (updateError) throw updateError;
        toast.showSuccess("Program updated successfully");
      } else {
        // Create new program
        const { error: insertError } = await supabase
          .from("programs")
          .insert([
            {
              academy_no: user.academy_no,
              name: formData.name,
              code: formData.code,
              description: formData.description || null,
              duration: formData.duration || null,
              duration_unit: formData.duration_unit || null,
              fee_amount: formData.fee_amount || null,
              status: formData.status || "active",
            },
          ]);

        if (insertError) throw insertError;
        toast.showSuccess("Program created successfully");
      }

      handleCloseDialog();
      loadPrograms();
    } catch (err: any) {
      toast.showError(err.message || "Failed to save program");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!user?.academy_no) {
      toast.showError("User academy number not found");
      return;
    }

    if (!confirm("Are you sure you want to delete this program?")) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("programs")
        .delete()
        .eq("id", id)
        .eq("academy_no", user.academy_no);

      if (deleteError) throw deleteError;
      toast.showSuccess("Program deleted successfully");
      loadPrograms();
    } catch (err: any) {
      toast.showError(err.message || "Failed to delete program");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Manage Programs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage programs that are part of the courses offered
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ minWidth: 140 }}
        >
          Add Program
        </Button>
      </Box>


      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Fee Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && programs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Loading programs...</Typography>
                </TableCell>
              </TableRow>
            ) : programs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No programs found. Click "Add Program" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              programs.map((program) => (
                <TableRow key={program.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {program.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{program.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {program.description || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {program.duration ? (
                      <Typography variant="body2">
                        {program.duration} {program.duration_unit || "years"}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {program.fee_amount ? (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Rs. {program.fee_amount.toFixed(2)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={program.status}
                      color={program.status === "active" ? "success" : "default"}
                      size="small"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(program)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(program.id)}
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProgram ? "Edit Program" : "Add New Program"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Program Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
              fullWidth
              placeholder="e.g., BSCS, MBA"
              helperText="Unique code for the program (unique per academy)"
            />
            <TextField
              label="Program Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              placeholder="e.g., Bachelor of Science in Computer Science"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Brief description of the program"
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Duration"
                type="number"
                value={formData.duration || ""}
                onChange={(e) =>
                  setFormData({ ...formData, duration: parseInt(e.target.value) || undefined })
                }
                fullWidth
                inputProps={{ min: 1 }}
              />
              <TextField
                label="Duration Unit"
                select
                value={formData.duration_unit || "years"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_unit: e.target.value as "years" | "months",
                  })
                }
                SelectProps={{
                  native: true,
                }}
                sx={{ minWidth: 120 }}
              >
                <option value="years">Years</option>
                <option value="months">Months</option>
              </TextField>
            </Box>
            <TextField
              label="Fee Amount (Rs.)"
              type="number"
              value={formData.fee_amount || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fee_amount: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
              placeholder="0.00"
              helperText="Default fee amount for this program (optional)"
            />
            <TextField
              label="Status"
              select
              value={formData.status || "active"}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as "active" | "inactive" })
              }
              SelectProps={{
                native: true,
              }}
              fullWidth
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </TextField>
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
            disabled={loading || !formData.name || !formData.code}
          >
            {loading ? "Saving..." : editingProgram ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

