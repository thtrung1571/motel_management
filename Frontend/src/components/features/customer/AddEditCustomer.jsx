import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  FormControlLabel,
  Switch,
  Box,
} from "@mui/material";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import vi from "date-fns/locale/vi";

const AddEditCustomer = ({ open, onClose, customer, onSubmit }) => {
  const [isOldCustomer, setIsOldCustomer] = useState(false);
  
  const initialFormState = {
    carNumber: "",
    isCarPlate: false,
    isWalkIn: false,
    fullName: "",
    gender: "",
    cccd: "",
    birthDay: null,
    placeLiving: "",
    note: "",
    isOldData: false,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  // Reset form khi đóng dialog
  useEffect(() => {
    if (!open) {
      setFormData(initialFormState);
      setErrors({});
      setIsOldCustomer(false);
    }
  }, [open]);

  useEffect(() => {
    if (customer) {
      setFormData({
        ...customer,
        birthDay: customer.birthDay ? new Date(customer.birthDay) : null,
        isCarPlate: customer.carNumber?.length > 9,
        isWalkIn: customer.isWalkIn || false
      });
      setErrors({});
    } else {
      setFormData(initialFormState);
    }
  }, [customer, open]);

  const validateForm = () => {
    const newErrors = {};
    const isExistingCustomer = !!customer;
    
    if (isOldCustomer || isExistingCustomer) {
      // Validation cho khách hàng cũ
      if (formData.isWalkIn) {
        // Khách bộ hành: chỉ yêu cầu họ tên
        if (!formData.fullName.trim()) {
          newErrors.fullName = 'Vui lòng nhập họ tên';
        }
      } else {
        // Khách có xe: yêu cầu biển số hoặc họ tên
        if (!formData.carNumber.trim() && !formData.fullName.trim()) {
          newErrors.carNumber = 'Vui lòng nhập biển số xe hoặc họ tên';
          newErrors.fullName = 'Vui lòng nhập họ tên hoặc biển số xe';
        } else if (formData.carNumber.trim() && formData.carNumber.length < 5) {
          newErrors.carNumber = 'Biển số xe không hợp lệ';
        }
      }

      // Validate format các trường khác nếu có nhập
      if (formData.cccd.trim() && !/^\d{12}$/.test(formData.cccd)) {
        newErrors.cccd = 'CCCD phải có 12 chữ số';
      }

      if (formData.birthDay) {
        const today = new Date();
        const age = today.getFullYear() - formData.birthDay.getFullYear();
        if (age < 18 || age > 100) {
          newErrors.birthDay = 'Ngày sinh không hợp lệ (tuổi phải từ 18-100)';
        }
      }
    } else {
      // Validation đầy đủ cho khách hàng mới
      if (!formData.isWalkIn && (!formData.carNumber.trim() || formData.carNumber.length < 5)) {
        newErrors.carNumber = 'Vui lòng nhập biển số xe hợp lệ';
      }

      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Vui lòng nhập họ tên';
      }

      if (!formData.gender) {
        newErrors.gender = 'Vui lòng chọn giới tính';
      }

      if (!formData.cccd.trim()) {
        newErrors.cccd = 'Vui lòng nhập CCCD';
      } else if (!/^\d{12}$/.test(formData.cccd)) {
        newErrors.cccd = 'CCCD phải có 12 chữ số';
      }

      if (!formData.placeLiving.trim()) {
        newErrors.placeLiving = 'Vui lòng nhập địa chỉ';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'carNumber' && !prev.isWalkIn ? { 
        isCarPlate: value.length > 9,
        carNumber: value.toUpperCase() 
      } : {}),
      ...(name === 'cccd' ? { 
        cccd: value.replace(/\D/g, '').slice(0, 12) 
      } : {})
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submissionData = {
        ...formData,
        carNumber: formData.isWalkIn 
          ? formData.carNumber
          : formData.carNumber.toUpperCase(),
        isCarPlate: !formData.isWalkIn && formData.carNumber.length > 9,
        birthDay: formData.birthDay ? new Date(formData.birthDay) : null,
        // Chỉ gửi các trường có giá trị khi cập nhật
        ...(customer ? {
          cccd: formData.cccd.trim() || undefined,
          gender: formData.gender || undefined,
          placeLiving: formData.placeLiving.trim() || undefined,
          fullName: formData.fullName.trim() || undefined
        } : {
          cccd: formData.cccd.trim(),
          gender: formData.gender,
          placeLiving: formData.placeLiving.trim(),
          fullName: formData.fullName.trim()
        })
      };

      await onSubmit(submissionData);
      
      // Reset form và đóng dialog sau khi submit thành công
      setFormData(initialFormState);
      setErrors({});
      setIsOldCustomer(false);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {customer ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {!customer && (
            <Box mb={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isOldCustomer}
                    onChange={(e) => {
                      setIsOldCustomer(e.target.checked);
                      setFormData(prev => ({
                        ...prev,
                        isOldData: e.target.checked
                      }));
                    }}
                  />
                }
                label="Đây là khách hàng cũ (chỉ yêu cầu thông tin tối thiểu)"
              />
              {isOldCustomer && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  {formData.isWalkIn 
                    ? "Chế độ nhập khách bộ hành cũ: Chỉ cần nhập họ tên"
                    : "Chế độ nhập khách có xe cũ: Chỉ cần nhập biển số xe hoặc họ tên"}
                </Alert>
              )}
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Loại khách</InputLabel>
                <Select
                  name="isWalkIn"
                  value={formData.isWalkIn}
                  onChange={(e) => {
                    const newIsWalkIn = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      isWalkIn: newIsWalkIn,
                      carNumber: newIsWalkIn ? 
                        `WALK-IN-${Date.now()}` : 
                        "",
                      isCarPlate: false
                    }));
                  }}
                  label="Loại khách"
                >
                  <MenuItem value={false}>Khách có xe</MenuItem>
                  <MenuItem value={true}>Khách bộ hành</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {!formData.isWalkIn && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Biển số xe"
                  name="carNumber"
                  value={formData.carNumber}
                  onChange={handleChange}
                  required={!isOldCustomer && !customer && !formData.fullName.trim()}
                  error={!!errors.carNumber}
                  helperText={errors.carNumber || "Biển số xe sẽ tự động được chuyển thành chữ hoa"}
                  inputProps={{
                    style: { textTransform: 'uppercase' },
                    maxLength: 12
                  }}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Họ và tên"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required={isOldCustomer || !customer || (!formData.carNumber.trim() && !formData.isWalkIn)}
                error={!!errors.fullName}
                helperText={errors.fullName}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl 
                fullWidth 
                required={!isOldCustomer && !customer}
                error={!!errors.gender}
              >
                <InputLabel>Giới tính</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  label="Giới tính"
                >
                  <MenuItem value="Nam">Nam</MenuItem>
                  <MenuItem value="Nữ">Nữ</MenuItem>
                  <MenuItem value="Khác">Khác</MenuItem>
                </Select>
                {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CCCD"
                name="cccd"
                value={formData.cccd}
                onChange={handleChange}
                required={!isOldCustomer && !customer}
                error={!!errors.cccd}
                helperText={errors.cccd}
                inputProps={{
                  maxLength: 12,
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={vi}
              >
                <DesktopDatePicker
                  label="Ngày sinh"
                  inputFormat="dd/MM/yyyy"
                  value={formData.birthDay}
                  onChange={(newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      birthDay: newValue,
                    }));
                    if (errors.birthDay) {
                      setErrors(prev => ({ ...prev, birthDay: '' }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required 
                      error={!!errors.birthDay}
                      helperText={errors.birthDay}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ"
                name="placeLiving"
                value={formData.placeLiving}
                onChange={handleChange}
                required={!isOldCustomer && !customer}
                error={!!errors.placeLiving}
                helperText={errors.placeLiving}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ghi chú"
                name="note"
                value={formData.note}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button 
            type="submit" 
            variant="contained"
            color="primary"
          >
            {customer ? "Cập nhật" : "Thêm mới"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddEditCustomer;
