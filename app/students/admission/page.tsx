"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  IconButton,
  Divider,
  InputAdornment,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/lib/toast/toast-context";
import { useRouter } from "next/navigation";
import type { Student } from "@/lib/supabase/types";
import imageCompression from "browser-image-compression";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"];
const RELIGIONS = ["Muslim", "Christianity", "Hinduism", "Sikhism", "Other"];
const NATIONALITIES = ["Pakistani", "Afghan", "Other"];

interface FormData {
  name: string;
  admissionDate: string;
  phone: string;
  notificationChannel: "whatsapp" | "sms";
  dob: string;
  studentId: string;
  gender: "Male" | "Female" | "Other";
  cast: string;
  orphan: string;
  osc: string;
  idMark: string;
  bloodGroup: string;
  qualificationClass: string;
  religion: string;
  nationality: string;
  disease: string;
  additionalNote: string;
  totalSiblings: string;
  address: string;
  // Father Information
  fatherName: string;
  fatherNationalId: string;
  fatherEducation: string;
  fatherMobile: string;
  fatherOccupation: string;
  fatherIncome: string;
  // Mother Information
  motherName: string;
  motherNationalId: string;
  motherEducation: string;
  motherMobile: string;
  motherOccupation: string;
  motherIncome: string;
}

export default function StudentAdmissionPage() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    admissionDate: new Date().toISOString().split("T")[0],
    phone: "",
    notificationChannel: "whatsapp",
    dob: "",
    studentId: "",
    gender: "Male",
    cast: "",
    orphan: "",
    osc: "",
    idMark: "",
    bloodGroup: "",
    qualificationClass: "",
    religion: "Muslim",
    nationality: "Pakistani",
    disease: "",
    additionalNote: "",
    totalSiblings: "",
    address: "",
    fatherName: "",
    fatherNationalId: "",
    fatherEducation: "",
    fatherMobile: "",
    fatherOccupation: "",
    fatherIncome: "",
    motherName: "",
    motherNationalId: "",
    motherEducation: "",
    motherMobile: "",
    motherOccupation: "",
    motherIncome: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCompressing(true);

      try {
        // Aggressive compression settings to minimize file size
        const options = {
          maxSizeMB: 0.05, // Maximum file size: 50KB
          maxWidthOrHeight: 400, // Maximum dimension
          useWebWorker: true, // Use web worker for better performance
          fileType: "image/jpeg", // Convert to JPEG for better compression
          initialQuality: 0.6, // Start with 60% quality (aggressive compression)
          alwaysKeepResolution: false, // Allow resizing
        };

        // Compress the image
        const compressedFile = await imageCompression(file, options);

        // If still too large, compress again with lower quality
        if (compressedFile.size > 50 * 1024) {
          const retryOptions = {
            ...options,
            initialQuality: 0.4, // Even more aggressive: 40% quality
          };
          const retryCompressed = await imageCompression(file, retryOptions);
          setImageFile(retryCompressed);
          const url = URL.createObjectURL(retryCompressed);
          setImage(url);
        } else {
          setImageFile(compressedFile);
          const url = URL.createObjectURL(compressedFile);
          setImage(url);
        }
      } catch (err: any) {
        console.error("Image compression error:", err);
        toast.showError("Failed to process image. Please try another image.");
        // Fallback: use original file if compression fails
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (event) => setImage(event.target?.result as string);
        reader.readAsDataURL(file);
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = () => {
    setFormData({
      name: "",
      admissionDate: new Date().toISOString().split("T")[0],
      phone: "",
      notificationChannel: "whatsapp",
      dob: "",
      studentId: "",
      gender: "Male",
      cast: "",
      orphan: "",
      osc: "",
      idMark: "",
      bloodGroup: "",
      qualificationClass: "",
      religion: "Muslim",
      nationality: "Pakistani",
      disease: "",
      additionalNote: "",
      totalSiblings: "",
      address: "",
      fatherName: "",
      fatherNationalId: "",
      fatherEducation: "",
      fatherMobile: "",
      fatherOccupation: "",
      fatherIncome: "",
      motherName: "",
      motherNationalId: "",
      motherEducation: "",
      motherMobile: "",
      motherOccupation: "",
      motherIncome: "",
    });
    setImage(null);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.academy_no) {
      toast.showError("User academy number not found");
      return;
    }

    if (!formData.name.trim()) {
      toast.showError("Student name is required");
      return;
    }

    if (!formData.fatherName.trim()) {
      toast.showError("Father name is required");
      return;
    }

    setLoading(true);

    try {
      // Upload image if present
      let pictureUrl: string | null = null;
      if (imageFile) {
        // Always use .jpg extension since we convert to JPEG during compression
        const fileName = `student_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("student-avatars")
          .upload(fileName, imageFile, { 
            upsert: true,
            contentType: "image/jpeg",
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("student-avatars").getPublicUrl(fileName);
        pictureUrl = publicUrl;
      }

      // Prepare student data
      const studentData: any = {
        academy_no: user.academy_no,
        name: formData.name,
        phone: formData.phone || null,
        admission_date: formData.admissionDate || null,
        notification_channel: formData.notificationChannel,
        picture_url: pictureUrl,
        dob: formData.dob || null,
        student_id: formData.studentId || null,
        gender: formData.gender,
        cast: formData.cast || null,
        orphan: formData.orphan || null,
        osc: formData.osc || null,
        id_mark: formData.idMark || null,
        blood_group: formData.bloodGroup || null,
        qualification_class: formData.qualificationClass || null,
        religion: formData.religion,
        nationality: formData.nationality,
        disease: formData.disease || null,
        additional_note: formData.additionalNote || null,
        total_siblings: formData.totalSiblings ? parseInt(formData.totalSiblings) : null,
        address: formData.address || null,
        father_name: formData.fatherName || null,
        father_national_id: formData.fatherNationalId || null,
        father_education: formData.fatherEducation || null,
        father_mobile: formData.fatherMobile || null,
        father_occupation: formData.fatherOccupation || null,
        father_income: formData.fatherIncome ? parseFloat(formData.fatherIncome) : null,
        mother_name: formData.motherName || null,
        mother_national_id: formData.motherNationalId || null,
        mother_education: formData.motherEducation || null,
        mother_mobile: formData.motherMobile || null,
        mother_occupation: formData.motherOccupation || null,
        mother_income: formData.motherIncome ? parseFloat(formData.motherIncome) : null,
        status: "active",
      };

      const { data, error: insertError } = await supabase.from("students").insert([studentData]).select().single();

      if (insertError) throw insertError;

      toast.showSuccess(`Student "${formData.name}" admitted successfully!`);
      setTimeout(() => {
        handleReset();
        router.push("/students");
      }, 2000);
    } catch (err: any) {
      toast.showError(err.message || "Failed to admit student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 1400, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Student Admission Form
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Register a new student to the academy
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => router.push("/students")}>
          Cancel
        </Button>
      </Box>


      <Paper elevation={2} sx={{ p: 2.5 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Student Photo Section */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
            <Box sx={{ position: "relative", display: "inline-block" }}>
              <Tooltip title={compressing ? "Compressing image..." : image ? "Click to change photo" : "Click to upload photo"}>
                <Avatar
                  src={image || undefined}
                  sx={{
                    width: 100,
                    height: 100,
                    cursor: compressing ? "wait" : "pointer",
                    border: 2,
                    borderColor: "primary.main",
                    opacity: compressing ? 0.6 : 1,
                  }}
                  onClick={() => !compressing && fileInputRef.current?.click()}
                >
                  {compressing ? (
                    <CircularProgress size={40} />
                  ) : !image ? (
                    <AccountCircleIcon sx={{ fontSize: 60 }} />
                  ) : null}
                </Avatar>
              </Tooltip>
              {image && !compressing && (
                <IconButton
                  size="small"
                  onClick={handleRemoveImage}
                  sx={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    bgcolor: "error.main",
                    color: "white",
                    "&:hover": { bgcolor: "error.dark" },
                    width: 24,
                    height: 24,
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
              {imageFile && !compressing && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: -18,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "0.65rem",
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                  }}
                >
                  {(imageFile.size / 1024).toFixed(1)} KB
                </Box>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
                disabled={compressing}
              />
            </Box>
          </Box>

          {/* Section 1: Student Information */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 1,
                  bgcolor: "primary.main",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                1
              </Box>
              Student Information
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="name"
                  label="Student Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="admissionDate"
                  label="Date of Admission"
                  type="date"
                  value={formData.admissionDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="dob"
                  label="Date of Birth"
                  type="date"
                  value={formData.dob}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select name="gender" value={formData.gender} onChange={handleSelectChange} label="Gender">
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="phone"
                  label="Mobile No. for SMS/WhatsApp"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setFormData((prev) => ({ ...prev, phone: value }));
                  }}
                  inputProps={{ maxLength: 11, minLength: 10 }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Notification Channel</InputLabel>
                  <Select
                    name="notificationChannel"
                    value={formData.notificationChannel}
                    onChange={handleSelectChange}
                    label="Notification Channel"
                  >
                    <MenuItem value="whatsapp">WhatsApp</MenuItem>
                    <MenuItem value="sms">SMS</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="studentId"
                  label="Student Birth Form ID / NIC"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="osc"
                  label="OSC Number"
                  value={formData.osc}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="idMark"
                  label="Identification Mark"
                  value={formData.idMark}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="qualificationClass"
                  label="Qualification/Class"
                  value={formData.qualificationClass}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Blood Group</InputLabel>
                  <Select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleSelectChange}
                    label="Blood Group"
                  >
                    <MenuItem value="">Select</MenuItem>
                    {BLOOD_GROUPS.map((bg) => (
                      <MenuItem key={bg} value={bg}>
                        {bg}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Religion</InputLabel>
                  <Select name="religion" value={formData.religion} onChange={handleSelectChange} label="Religion">
                    {RELIGIONS.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Nationality</InputLabel>
                  <Select
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleSelectChange}
                    label="Nationality"
                  >
                    {NATIONALITIES.map((n) => (
                      <MenuItem key={n} value={n}>
                        {n}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="cast"
                  label="Cast"
                  value={formData.cast}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="totalSiblings"
                  label="Total Siblings"
                  type="number"
                  value={formData.totalSiblings}
                  onChange={handleInputChange}
                  inputProps={{ min: 0 }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="orphan"
                  label="Orphan Student"
                  value={formData.orphan}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="disease"
                  label="Disease If Any?"
                  value={formData.disease}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="address"
                  label="Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="additionalNote"
                  label="Additional Note"
                  value={formData.additionalNote}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Section 2: Father/Guardian Information */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 1,
                  bgcolor: "primary.main",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                2
              </Box>
              Father/Guardian Information
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="fatherName"
                  label="Father Name"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="fatherNationalId"
                  label="Father National ID"
                  value={formData.fatherNationalId}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="fatherEducation"
                  label="Education"
                  value={formData.fatherEducation}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="fatherMobile"
                  label="Mobile No"
                  value={formData.fatherMobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setFormData((prev) => ({ ...prev, fatherMobile: value }));
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="fatherOccupation"
                  label="Occupation"
                  value={formData.fatherOccupation}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="fatherIncome"
                  label="Income"
                  type="number"
                  value={formData.fatherIncome}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                  }}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Section 3: Mother Information */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 1,
                  bgcolor: "primary.main",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                3
              </Box>
              Mother Information
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="motherName"
                  label="Mother Name"
                  value={formData.motherName}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="motherNationalId"
                  label="Mother National ID"
                  value={formData.motherNationalId}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="motherEducation"
                  label="Education"
                  value={formData.motherEducation}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="motherMobile"
                  label="Mobile No"
                  value={formData.motherMobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setFormData((prev) => ({ ...prev, motherMobile: value }));
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="motherOccupation"
                  label="Occupation"
                  value={formData.motherOccupation}
                  onChange={handleInputChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  name="motherIncome"
                  label="Income"
                  type="number"
                  value={formData.motherIncome}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                  }}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>


          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", pt: 2, mt: 1, borderTop: 1, borderColor: "divider" }}>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={handleReset} 
              disabled={loading}
              size="medium"
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading || !formData.name || !formData.fatherName}
              size="medium"
            >
              {loading ? "Saving..." : "Save Student"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

