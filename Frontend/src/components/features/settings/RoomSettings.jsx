import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
  fetchRoomTypes,
  addRoomType,
  updateRoomType,
  deleteRoomType,
} from "../../../store/slices/settingsSlice";

const RoomSettings = () => {
  const dispatch = useDispatch();
  const { roomTypes, loading, error } = useSelector((state) => state.settings);
  const [open, setOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
  });

  useEffect(() => {
    dispatch(fetchRoomTypes());
  }, [dispatch]);

  const handleOpen = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
      });
    } else {
      setEditingType(null);
      setFormData({
        name: "",
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingType(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await dispatch(
          updateRoomType({
            id: editingType.id,
            ...formData,
          }),
        ).unwrap();
      } else {
        await dispatch(addRoomType(formData)).unwrap();
      }
      handleClose();
      dispatch(fetchRoomTypes());
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa loại phòng này?")) {
      try {
        await dispatch(deleteRoomType(id)).unwrap();
        dispatch(fetchRoomTypes());
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Quản lý loại phòng</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
            >
              Thêm loại phòng
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tên loại phòng</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roomTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.name}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleOpen(type)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(type.id)}
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
        </Grid>
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editingType ? "Cập nhật loại phòng" : "Thêm loại phòng mới"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Tên loại phòng"
              fullWidth
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingType ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default RoomSettings;
