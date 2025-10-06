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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Switch,
  Tooltip,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BuildIcon from "@mui/icons-material/Build";
import {
  fetchRooms,
  addRoom,
  updateRoom,
  deleteRoom,
} from "../../../store/slices/roomSlice";
import { fetchRoomTypes } from "../../../store/slices/settingsSlice";
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

const RoomManagement = () => {
  const dispatch = useDispatch();
  const { rooms, loading } = useSelector((state) => state.rooms);
  const { roomTypes } = useSelector((state) => state.settings);
  const [open, setOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    number: "",
    type: "",
    floor: "",
    status: "available",
  });
  const [isMultiRoom, setIsMultiRoom] = useState(false);
  const [multiRoomData, setMultiRoomData] = useState({
    startNumber: '',
    endNumber: '',
    type: '',
    floor: '',
  });

  useEffect(() => {
    dispatch(fetchRooms());
    dispatch(fetchRoomTypes());
  }, [dispatch]);

  const handleOpen = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        number: room.number,
        type: room.type.id,
        floor: room.floor,
        status: room.status || 'available'
      });
    } else {
      setFormData({
        number: '',
        type: '',
        floor: '',
        status: 'available'
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingRoom(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await dispatch(
          updateRoom({
            id: editingRoom.id,
            number: formData.number,
            type: formData.type,
            floor: formData.floor,
            status: formData.status,
            hasLoveChair: editingRoom.hasLoveChair
          }),
        ).unwrap();
      } else {
        if (isMultiRoom) {
          const start = parseInt(multiRoomData.startNumber);
          const end = parseInt(multiRoomData.endNumber);
          
          if (start > end) {
            alert('Số phòng bắt đầu phải nhỏ hơn số phòng kết thúc');
            return;
          }

          const createPromises = [];
          for (let i = start; i <= end; i++) {
            const roomNumber = i.toString().padStart(3, '0');
            createPromises.push(
              dispatch(
                addRoom({
                  number: roomNumber,
                  type: multiRoomData.type,
                  floor: getFloorFromRoomNumber(roomNumber),
                  hasLoveChair: false
                })
              )
            );
          }

          await Promise.all(createPromises);
        } else {
          await dispatch(
            addRoom({
              number: formData.number,
              type: formData.type,
              floor: formData.floor,
              hasLoveChair: false
            }),
          ).unwrap();
        }
      }
      handleClose();
      dispatch(fetchRooms());
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phòng này?")) {
      try {
        await dispatch(deleteRoom(id)).unwrap();
        dispatch(fetchRooms());
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      available: "Trống",
      occupied: "Đang sử dụng",
      maintenance: "Bảo trì",
    };
    return statusMap[status] || status;
  };

  const handleStatusToggle = async (room, newStatus) => {
    try {
      await dispatch(
        updateRoom({
          id: room.id,
          number: room.number,
          type: room.type._id,
          floor: room.floor,
          status: newStatus,
          hasLoveChair: room.hasLoveChair,
        }),
      ).unwrap();
      dispatch(fetchRooms());
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleLoveChairToggle = async (room) => {
    try {
      await dispatch(
        updateRoom({
          id: room.id,
          number: room.number,
          type: room.type._id,
          floor: room.floor,
          status: room.status,
          hasLoveChair: !room.hasLoveChair,
        }),
      ).unwrap();
      dispatch(fetchRooms());
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Thêm hàm sắp xếp phòng
  const sortRooms = (rooms) => {
    return [...rooms].sort((a, b) => a.number.localeCompare(b.number));
  };

  // Thêm hàm để lấy số tầng từ số phòng
  const getFloorFromRoomNumber = (roomNumber) => {
    if (!roomNumber) return '';
    // Lấy chữ số đầu tiên của số phòng
    const firstDigit = roomNumber.toString().charAt(0);
    return firstDigit || '';
  };

  // Cập nhật xử lý thay đổi số phòng
  const handleRoomNumberChange = (e) => {
    const newNumber = e.target.value;
    setFormData({
      ...formData,
      number: newNumber,
      floor: getFloorFromRoomNumber(newNumber) // Tự động cập nhật số tầng
    });
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
            <Typography variant="h6">Quản lý phòng</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
            >
              Thêm phòng
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Số phòng</TableCell>
                  <TableCell>Loại phòng</TableCell>
                  <TableCell>Tầng</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="center">Ghế tình nhân</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortRooms(rooms).map((room, index) => (
                  <TableRow key={`room-${room.id}-${index}`}>
                    <TableCell>{room.number}</TableCell>
                    <TableCell>{room.type?.name}</TableCell>
                    <TableCell>{room.floor}</TableCell>
                    <TableCell>{getStatusLabel(room.status)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ghế tình nhân">
                        <Switch
                          checked={room.hasLoveChair}
                          onChange={() => handleLoveChairToggle(room)}
                          disabled={room.status === "occupied"}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Bảo trì">
                        <Switch
                          icon={<BuildIcon />}
                          checkedIcon={<BuildIcon color="warning" />}
                          checked={room.status === "maintenance"}
                          onChange={(e) =>
                            handleStatusToggle(
                              room,
                              e.target.checked ? "maintenance" : "available",
                            )
                          }
                          disabled={room.status === "occupied"}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleOpen(room)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(room.id)}
                        color="error"
                        disabled={room.status === "occupied"}
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
          {editingRoom ? "Cập nhật phòng" : "Thêm phòng mới"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {!editingRoom && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isMultiRoom}
                    onChange={(e) => setIsMultiRoom(e.target.checked)}
                  />
                }
                label="Tạo nhiều phòng cùng lúc"
              />
            )}

            {!editingRoom && isMultiRoom ? (
              <>
                <TextField
                  margin="dense"
                  label="Số phòng bắt đầu"
                  fullWidth
                  required
                  value={multiRoomData.startNumber}
                  onChange={(e) =>
                    setMultiRoomData({
                      ...multiRoomData,
                      startNumber: e.target.value,
                      floor: getFloorFromRoomNumber(e.target.value)
                    })
                  }
                  helperText="VD: 101"
                />
                <TextField
                  margin="dense"
                  label="Số phòng kết thúc"
                  fullWidth
                  required
                  value={multiRoomData.endNumber}
                  onChange={(e) =>
                    setMultiRoomData({
                      ...multiRoomData,
                      endNumber: e.target.value
                    })
                  }
                  helperText="VD: 110"
                />
                <FormControl fullWidth margin="dense">
                  <InputLabel>Loại phòng</InputLabel>
                  <Select
                    value={multiRoomData.type}
                    label="Loại phòng"
                    onChange={(e) =>
                      setMultiRoomData({
                        ...multiRoomData,
                        type: e.target.value
                      })
                    }
                    required
                  >
                    {roomTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  margin="dense"
                  label="Tầng"
                  fullWidth
                  disabled
                  value={multiRoomData.floor}
                  helperText="Tầng được xác định tự động từ số phòng bắt đầu"
                />
              </>
            ) : (
              <>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Số phòng"
                  fullWidth
                  required
                  value={formData.number}
                  onChange={handleRoomNumberChange}
                  helperText="Số phòng sẽ tự động xác định tầng (VD: 101 -> Tầng 1)"
                />
                <FormControl fullWidth margin="dense">
                  <InputLabel>Loại phòng</InputLabel>
                  <Select
                    value={formData.type}
                    label="Loại phòng"
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    required
                  >
                    {roomTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  margin="dense"
                  label="Tầng"
                  fullWidth
                  required
                  type="number"
                  value={formData.floor}
                  onChange={(e) =>
                    setFormData({ ...formData, floor: e.target.value })
                  }
                  disabled={!editingRoom}
                  helperText={!editingRoom ? "Tầng được xác định tự động từ số phòng" : ""}
                />
              </>
            )}

            {editingRoom && (
              <FormControl fullWidth margin="dense">
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={formData.status}
                  label="Trạng thái"
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <MenuItem value="available">Trống</MenuItem>
                  <MenuItem value="maintenance">Bảo trì</MenuItem>
                  <MenuItem value="occupied">Đang sử dụng</MenuItem>
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingRoom ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default RoomManagement;
