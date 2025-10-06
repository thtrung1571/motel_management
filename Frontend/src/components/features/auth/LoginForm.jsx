import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { login } from "../../../store/slices/authSlice";
import Input from "../../common/Input/Input";
import Button from "../../common/Button/Button";
import ErrorAlert from "../../common/ErrorAlert/ErrorAlert";

const LoginForm = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(login(formData));
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <Card sx={{ maxWidth: 400, width: "100%" }}>
        <CardContent>
          <Typography variant="h5" align="center" mb={3}>
            Đăng nhập
          </Typography>

          {error && <ErrorAlert message={error} />}

          <form onSubmit={handleSubmit}>
            <Box mb={2}>
              <Input
                label="Tên đăng nhập"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </Box>

            <Box mb={3}>
              <Input
                label="Mật khẩu"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Box>

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginForm;
