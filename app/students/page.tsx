"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/lib/toast/toast-context";
import { Student } from "@/lib/supabase/types";
import imageCompression from "browser-image-compression";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"];
const RELIGIONS = ["Muslim", "Christianity", "Hinduism", "Sikhism", "Other"];
const NATIONALITIES = ["Pakistani", "Afghan", "Other"];

export default function StudentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Edit form data
  const [editFormData, setEditFormData] = useState<Partial<Student>>({});

  // Load students from database filtered by academy_no
  const loadStudents = async () => {
    if (!user?.academy_no) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("students")
        .select("*")
        .eq("academy_no", user.academy_no)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (err: any) {
      toast.showError(err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.academy_no) {
      loadStudents();
    }
  }, [user?.academy_no]);

  // Filter students based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter(
      (student) =>
        student.name?.toLowerCase().includes(query) ||
        student.phone?.includes(query) ||
        student.student_id?.toLowerCase().includes(query) ||
        student.father_name?.toLowerCase().includes(query) ||
        student.mother_name?.toLowerCase().includes(query)
    );
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, student: Student) => {
    setAnchorEl(event.currentTarget);
    setSelectedStudent(student);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStudent(null);
  };

  const handleView = () => {
    if (selectedStudent) {
      setViewingStudent(selectedStudent);
      setViewModalOpen(true);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedStudent) {
      setEditFormData({
        ...selectedStudent,
        admission_date: selectedStudent.admission_date?.split("T")[0] || "",
        dob: selectedStudent.dob?.split("T")[0] || "",
      });
      setImage(selectedStudent.picture_url || null);
      setImageFile(null);
      setEditModalOpen(true);
    }
    handleMenuClose();
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setViewingStudent(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedStudent(null);
    setEditFormData({});
    setImage(null);
    setImageFile(null);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSelectChange = (e: any) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCompressing(true);

      try {
        const options = {
          maxSizeMB: 0.05,
          maxWidthOrHeight: 400,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (err: any) {
        toast.showError("Failed to compress image: " + err.message);
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent || !user?.academy_no) return;

    setSaving(true);

    try {
      let pictureUrl = editFormData.picture_url;

      // Upload new image if changed
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `students/${selectedStudent.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("student-photos").upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("student-photos").getPublicUrl(fileName);
        pictureUrl = publicUrl;
      }

      // Prepare update data
      const updateData: any = {
        name: editFormData.name,
        phone: editFormData.phone || null,
        admission_date: editFormData.admission_date || null,
        notification_channel: editFormData.notification_channel,
        picture_url: pictureUrl,
        dob: editFormData.dob || null,
        student_id: editFormData.student_id || null,
        gender: editFormData.gender,
        cast: editFormData.cast || null,
        orphan: editFormData.orphan || null,
        osc: editFormData.osc || null,
        id_mark: editFormData.id_mark || null,
        blood_group: editFormData.blood_group || null,
        qualification_class: editFormData.qualification_class || null,
        religion: editFormData.religion,
        nationality: editFormData.nationality,
        disease: editFormData.disease || null,
        additional_note: editFormData.additional_note || null,
        total_siblings: editFormData.total_siblings ? Number(editFormData.total_siblings) : null,
        address: editFormData.address || null,
        father_name: editFormData.father_name || null,
        father_national_id: editFormData.father_national_id || null,
        father_education: editFormData.father_education || null,
        father_mobile: editFormData.father_mobile || null,
        father_occupation: editFormData.father_occupation || null,
        father_income: editFormData.father_income ? Number(editFormData.father_income) : null,
        mother_name: editFormData.mother_name || null,
        mother_national_id: editFormData.mother_national_id || null,
        mother_education: editFormData.mother_education || null,
        mother_mobile: editFormData.mother_mobile || null,
        mother_occupation: editFormData.mother_occupation || null,
        mother_income: editFormData.mother_income ? Number(editFormData.mother_income) : null,
        status: editFormData.status || "active",
      };

      const { error: updateError } = await supabase
        .from("students")
        .update(updateData)
        .eq("id", selectedStudent.id)
        .eq("academy_no", user.academy_no);

      if (updateError) throw updateError;

      toast.showSuccess("Student updated successfully!");
      await loadStudents();
      setTimeout(() => {
        handleCloseEditModal();
      }, 1000);
    } catch (err: any) {
      toast.showError(err.message || "Failed to update student");
    } finally {
      setSaving(false);
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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "default";
      case "graduated":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Students
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and manage all student records
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper elevation={1} sx={{ p: 1.5 }}>
        <TextField
          fullWidth
          placeholder="Search by name, phone, ID, or parent name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>


      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Results Count */}
          <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
            {filteredStudents.length} {filteredStudents.length === 1 ? "student" : "students"} found
          </Typography>

          {/* Student Cards Grid */}
          {filteredStudents.length === 0 ? (
            <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
              <PersonIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No students found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? "Try adjusting your search query" : "Start by adding a new student"}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {filteredStudents.map((student) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={student.id}>
                  <Card
                    elevation={2}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 2, "&:last-child": { pb: 2 } }}>
                      {/* Student Header */}
                      <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1.5, gap: 1.5 }}>
                        <Avatar
                          src={student.picture_url || undefined}
                          alt={student.name}
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: "primary.main",
                            fontSize: "1.25rem",
                            fontWeight: 600,
                          }}
                        >
                          {student.name?.charAt(0)?.toUpperCase() || "?"}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 600,
                              mb: 0.5,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {student.name}
                          </Typography>
                          <Chip
                            label={student.status || "active"}
                            size="small"
                            color={getStatusColor(student.status) as any}
                            sx={{ height: 20, fontSize: "0.65rem" }}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, student)}
                          sx={{ mt: -0.5 }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {/* Student Details */}
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {student.phone && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <PhoneIcon fontSize="small" color="action" sx={{ fontSize: 16 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                              {student.phone}
                            </Typography>
                          </Box>
                        )}
                        {student.admission_date && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CalendarIcon fontSize="small" color="action" sx={{ fontSize: 16 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                              Admitted: {formatDate(student.admission_date)}
                            </Typography>
                          </Box>
                        )}
                        {student.qualification_class && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem", mt: 0.5 }}>
                            Class: {student.qualification_class}
                          </Typography>
                        )}
                        {student.father_name && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                            Father: {student.father_name}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
      </Menu>

      {/* View Details Modal */}
      <Dialog
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: "90vh" },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Student Details
          </Typography>
          <IconButton size="small" onClick={handleCloseViewModal}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {viewingStudent ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Student Photo & Basic Info */}
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <Avatar
                  src={viewingStudent.picture_url || undefined}
                  alt={viewingStudent.name}
                  sx={{ width: 80, height: 80, bgcolor: "primary.main", fontSize: "2rem", fontWeight: 600 }}
                >
                  {viewingStudent.name?.charAt(0)?.toUpperCase() || "?"}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {viewingStudent.name}
                  </Typography>
                  <Chip
                    label={viewingStudent.status || "active"}
                    size="small"
                    color={getStatusColor(viewingStudent.status) as any}
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
                    {viewingStudent.phone && (
                      <Typography variant="body2" color="text.secondary">
                        <PhoneIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5, fontSize: 16 }} />
                        {viewingStudent.phone}
                      </Typography>
                    )}
                    {viewingStudent.email && (
                      <Typography variant="body2" color="text.secondary">
                        {viewingStudent.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Personal Information */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Personal Information
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Date of Birth
                    </Typography>
                    <Typography variant="body2">{formatDate(viewingStudent.dob) || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Gender
                    </Typography>
                    <Typography variant="body2">{viewingStudent.gender || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Admission Date
                    </Typography>
                    <Typography variant="body2">{formatDate(viewingStudent.admission_date) || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Qualification/Class
                    </Typography>
                    <Typography variant="body2">{viewingStudent.qualification_class || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Blood Group
                    </Typography>
                    <Typography variant="body2">{viewingStudent.blood_group || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Religion
                    </Typography>
                    <Typography variant="body2">{viewingStudent.religion || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Nationality
                    </Typography>
                    <Typography variant="body2">{viewingStudent.nationality || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Total Siblings
                    </Typography>
                    <Typography variant="body2">{viewingStudent.total_siblings ?? "N/A"}</Typography>
                  </Grid>
                  {viewingStudent.address && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body2">{viewingStudent.address}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Divider />

              {/* Father/Guardian Information */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Father/Guardian Information
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="body2">{viewingStudent.father_name || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Mobile
                    </Typography>
                    <Typography variant="body2">{viewingStudent.father_mobile || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Occupation
                    </Typography>
                    <Typography variant="body2">{viewingStudent.father_occupation || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Education
                    </Typography>
                    <Typography variant="body2">{viewingStudent.father_education || "N/A"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Mother Information */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Mother Information
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="body2">{viewingStudent.mother_name || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Mobile
                    </Typography>
                    <Typography variant="body2">{viewingStudent.mother_mobile || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Occupation
                    </Typography>
                    <Typography variant="body2">{viewingStudent.mother_occupation || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Education
                    </Typography>
                    <Typography variant="body2">{viewingStudent.mother_education || "N/A"}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={handleCloseViewModal} size="small">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: "90vh" },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Edit Student
          </Typography>
          <IconButton size="small" onClick={handleCloseEditModal}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Student Photo */}
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
              <Avatar
                src={image || undefined}
                alt={editFormData.name}
                sx={{ width: 80, height: 80, bgcolor: "primary.main", fontSize: "2rem", fontWeight: 600 }}
              >
                {editFormData.name?.charAt(0)?.toUpperCase() || "?"}
              </Avatar>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
              >
                {compressing ? "Compressing..." : "Change Photo"}
              </Button>
            </Box>

            {/* Basic Information */}
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="name"
                  label="Student Name"
                  value={editFormData.name || ""}
                  onChange={handleEditInputChange}
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="admission_date"
                  label="Date of Admission"
                  type="date"
                  value={editFormData.admission_date || ""}
                  onChange={handleEditInputChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="dob"
                  label="Date of Birth"
                  type="date"
                  value={editFormData.dob || ""}
                  onChange={handleEditInputChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={editFormData.gender || "Male"}
                    onChange={handleEditSelectChange}
                    label="Gender"
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="phone"
                  label="Mobile No. for SMS/WhatsApp"
                  value={editFormData.phone || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setEditFormData((prev) => ({ ...prev, phone: value }));
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Notification Channel</InputLabel>
                  <Select
                    name="notification_channel"
                    value={editFormData.notification_channel || "whatsapp"}
                    onChange={handleEditSelectChange}
                    label="Notification Channel"
                  >
                    <MenuItem value="whatsapp">WhatsApp</MenuItem>
                    <MenuItem value="sms">SMS</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="qualification_class"
                  label="Qualification/Class"
                  value={editFormData.qualification_class || ""}
                  onChange={handleEditInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={editFormData.status || "active"}
                    onChange={handleEditSelectChange}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="graduated">Graduated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider />

            {/* Father Information */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Father/Guardian Information
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="father_name"
                  label="Father Name"
                  value={editFormData.father_name || ""}
                  onChange={handleEditInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="father_mobile"
                  label="Mobile No"
                  value={editFormData.father_mobile || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setEditFormData((prev) => ({ ...prev, father_mobile: value }));
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="father_occupation"
                  label="Occupation"
                  value={editFormData.father_occupation || ""}
                  onChange={handleEditInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="father_education"
                  label="Education"
                  value={editFormData.father_education || ""}
                  onChange={handleEditInputChange}
                  size="small"
                />
              </Grid>
            </Grid>

            <Divider />

            {/* Mother Information */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Mother Information
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="mother_name"
                  label="Mother Name"
                  value={editFormData.mother_name || ""}
                  onChange={handleEditInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="mother_mobile"
                  label="Mobile No"
                  value={editFormData.mother_mobile || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setEditFormData((prev) => ({ ...prev, mother_mobile: value }));
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="mother_occupation"
                  label="Occupation"
                  value={editFormData.mother_occupation || ""}
                  onChange={handleEditInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="mother_education"
                  label="Education"
                  value={editFormData.mother_education || ""}
                  onChange={handleEditInputChange}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={handleCloseEditModal} size="small" disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving || !editFormData.name}
            size="small"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
