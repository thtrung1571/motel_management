import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Paper,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../../store/slices/userSlice";

const UserSettings = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.users);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "user",
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleOpen = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        username: user.username,
        name: user.name,
        role: user.role,
        password: "", // Không hiển thị password cũ
      });
    } else {
      setSelectedUser(null);
      setFormData({
        username: "",
        password: "",
        name: "",
        role: "user",
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;

        await dispatch(
          updateUser({ id: selectedUser.id, ...updateData }),
        ).unwrap();
      } else {
        await dispatch(createUser(formData)).unwrap();
      }
      handleClose();
      dispatch(fetchUsers());
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      try {
        await dispatch(deleteUser(userId)).unwrap();
        dispatch(fetchUsers());
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={() => handleOpen()}
          sx={{ backgroundColor: "#1976d2" }}
        >
          Thêm người dùng
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Họ tên</TableCell>
              <TableCell>Tên đăng nhập</TableCell>
              <TableCell>Vai trò</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  {user.role === "admin" ? "Quản trị viên" : "Nhân viên"}
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpen(user)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(user.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {selectedUser ? "Cập nhật người dùng" : "Thêm người dùng mới"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="dense"
              label="Họ tên"
              fullWidth
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Tên đăng nhập"
              fullWidth
              required
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label={
                selectedUser
                  ? "Mật khẩu mới (để trống nếu không đổi)"
                  : "Mật khẩu"
              }
              type="password"
              fullWidth
              required={!selectedUser}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={formData.role}
                label="Vai trò"
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                required
              >
                <MenuItem value="user">Nhân viên</MenuItem>
                <MenuItem value="admin">Quản trị viên</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedUser ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UserSettings;
