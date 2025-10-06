import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Grid, Typography, Avatar } from "@mui/material";
import Input from "../../common/Input/Input";
import Button from "../../common/Button/Button";
import { updateProfile } from "../../../store/slices/authSlice";

const ProfileSettings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(formData)).unwrap();
      // Show success message
    } catch (error) {
      // Show error message
    }
  };

  return (
    <Box>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} display="flex" justifyContent="center">
            <Avatar
              sx={{ width: 100, height: 100, mb: 2 }}
              src={user?.avatar}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Input
              label="Họ tên"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Input
              label="Số điện thoại"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Đổi mật khẩu
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Input
              label="Mật khẩu hiện tại"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Input
              label="Mật khẩu mới"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Input
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" variant="contained">
              Cập nhật
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ProfileSettings;
