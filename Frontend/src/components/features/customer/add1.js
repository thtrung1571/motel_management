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

  const [formData, setFormData] = useState({
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
  });

  const [errors, setErrors] = useState({});

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
      // Reset form khi thêm mới
      setFormData({
        carNumber: "",
        isCarPlate: false,
        isWalkIn: false,
        fullName: "",
        gender: "",
        cccd: "",
        birthDay: null,
        placeLiving: "",
        note: "",
      });
    }
  }, [customer, open]);

  const validateForm = () => {
    const newErrors = {};
    const isExistingCustomer = !!customer;
    
    // Nếu là khách hàng cũ, chỉ validate các trường tối thiểu
    if (isOldCustomer) {
      // Validate carNumber
      if (!formData.isWalkIn) {
        if (!formData.carNumber.trim()) {
          newErrors.carNumber = 'Vui lòng nhập biển số xe';
        } else if (formData.carNumber.length < 5) {
          newErrors.carNumber = 'Biển số xe không hợp lệ';
        }
      }

      // Chỉ yêu cầu ít nhất một trong hai trường: tên hoặc biển số
      if (!formData.carNumber.trim() && !formData.fullName.trim()) {
        newErrors.fullName = 'Vui lòng nhập ít nhất biển số xe hoặc họ tên';
      }

      // Validate CCCD format nếu có nhập
      if (formData.cccd.trim() && !/^\d{12}$/.test(formData.cccd)) {
        newErrors.cccd = 'CCCD phải có 12 chữ số';
      }
    } else {
      // Validate carNumber chỉ khi không phải khách bộ hành
      if (!formData.isWalkIn) {
        if (!formData.carNumber.trim()) {
          newErrors.carNumber = 'Vui lòng nhập biển số xe';
        } else if (formData.carNumber.length < 5) {
          newErrors.carNumber = 'Biển số xe không hợp lệ';
        }
      }

      // Validate CCCD - Chỉ bắt buộc cho khách hàng mới
      if (!isExistingCustomer) {
        if (!formData.cccd.trim()) {
          newErrors.cccd = 'Vui lòng nhập CCCD';
        } else if (!/^\d{12}$/.test(formData.cccd)) {
          newErrors.cccd = 'CCCD phải có 12 chữ số';
        }
      } else if (formData.cccd.trim() && !/^\d{12}$/.test(formData.cccd)) {
        // Nếu có nhập CCCD thì phải đúng format
        newErrors.cccd = 'CCCD phải có 12 chữ số';
      }

      // Validate fullName - Bắt buộc cho khách hàng mới
      if (!isExistingCustomer && !formData.fullName.trim()) {
        newErrors.fullName = 'Vui lòng nhập họ tên';
      }

      // Validate gender - Bắt buộc cho khách hàng mới
      if (!isExistingCustomer && !formData.gender) {
        newErrors.gender = 'Vui lòng chọn giới tính';
      }

      // Validate birthDay - Không bắt buộc nhưng phải hợp lệ nếu có
      if (formData.birthDay) {
        const today = new Date();
        const age = today.getFullYear() - formData.birthDay.getFullYear();
        if (age < 18 || age > 100) {
          newErrors.birthDay = 'Ngày sinh không hợp lệ (tuổi phải từ 18-100)';
        }
      }

      // Validate placeLiving - Không bắt buộc cho dữ liệu cũ
      if (!isExistingCustomer && !formData.placeLiving.trim()) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submissionData = {
      ...formData,
      carNumber: formData.isWalkIn 
        ? formData.carNumber
        : formData.carNumber.toUpperCase(),
      isCarPlate: !formData.isWalkIn && formData.carNumber.length > 9,
      birthDay: formData.birthDay ? new Date(formData.birthDay) : null,
      cccd: formData.cccd.trim()
    };

    onSubmit(submissionData);
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
                  Chế độ nhập khách hàng cũ: Chỉ cần nhập biển số xe hoặc họ tên
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
                  required={!isOldCustomer || !formData.fullName.trim()}
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
                required={!isOldCustomer || (!formData.isWalkIn && !formData.carNumber.trim())}
                error={!!errors.fullName}
                helperText={errors.fullName}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl 
                fullWidth 
                required={!isOldCustomer}
                error={!!errors.gender}
              >
                <InputLabel>Giới tính</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
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
                required={!isOldCustomer}
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
                required={!isOldCustomer}
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
