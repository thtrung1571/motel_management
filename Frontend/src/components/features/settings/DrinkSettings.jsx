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
  Typography,
  Tooltip,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  fetchDrinks,
  createDrink,
  updateDrink,
  deleteDrink,
} from "../../../store/slices/drinkSlice";

const DrinkSettings = () => {
  const dispatch = useDispatch();
  const { drinks, loading } = useSelector((state) => state.drinks);
  const [open, setOpen] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    costPrice: "",
    sellingPrice: "",
    unitsPerPack: 24,
    packStock: 0,
    unitStock: 0,
    alertThreshold: 10,
  });

  useEffect(() => {
    dispatch(fetchDrinks());
  }, [dispatch]);

  const handleOpen = (drink = null) => {
    if (drink) {
      setSelectedDrink(drink);
      setFormData({
        name: drink.name,
        costPrice: drink.costPrice,
        sellingPrice: drink.sellingPrice,
        unitsPerPack: drink.unitsPerPack,
        packStock: drink.packStock,
        unitStock: drink.unitStock,
        alertThreshold: drink.alertThreshold,
      });
    } else {
      setSelectedDrink(null);
      setFormData({
        name: "",
        costPrice: "",
        sellingPrice: "",
        unitsPerPack: 24,
        packStock: 0,
        unitStock: 0,
        alertThreshold: 10,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedDrink(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const numericFormData = {
        ...formData,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        unitsPerPack: Number(formData.unitsPerPack),
        packStock: Number(formData.packStock),
        unitStock: Number(formData.unitStock),
        alertThreshold: Number(formData.alertThreshold),
      };

      if (selectedDrink) {
        await dispatch(updateDrink({ id: selectedDrink.id, ...numericFormData })).unwrap();
      } else {
        await dispatch(createDrink(numericFormData)).unwrap();
      }
      handleClose();
      dispatch(fetchDrinks());
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (drinkId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đồ uống này?")) {
      try {
        await dispatch(deleteDrink(drinkId)).unwrap();
        dispatch(fetchDrinks());
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const calculateTotalUnits = (drink) => {
    return drink.packStock * drink.unitsPerPack + drink.unitStock;
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Quản lý đồ uống</Typography>
        <Button variant="contained" onClick={() => handleOpen()}>
          Thêm đồ uống
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên đồ uống</TableCell>
              <TableCell align="right">Giá nhập</TableCell>
              <TableCell align="right">Giá bán</TableCell>
              <TableCell align="right">Tổng tồn kho</TableCell>
              <TableCell align="right">Cảnh báo hết</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drinks?.map((drink) => {
              const totalUnits = calculateTotalUnits(drink);
              return (
                <TableRow
                  key={drink.id}
                  sx={{
                    backgroundColor:
                      totalUnits <= drink.alertThreshold ? "#fff3f3" : "inherit",
                  }}
                >
                  <TableCell>{drink.name}</TableCell>
                  <TableCell align="right">
                    {Number(drink.costPrice).toLocaleString()}đ
                  </TableCell>
                  <TableCell align="right">
                    {Number(drink.sellingPrice).toLocaleString()}đ
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={`${drink.packStock} thùng * ${drink.unitsPerPack} + ${drink.unitStock} lẻ`}>
                      <span>{totalUnits}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">{drink.alertThreshold}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleOpen(drink)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(drink.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedDrink ? "Cập nhật đồ uống" : "Thêm đồ uống mới"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="dense"
              label="Tên đồ uống"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Giá nhập"
              type="number"
              fullWidth
              required
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Giá bán"
              type="number"
              fullWidth
              required
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Số lon/chai/thùng"
              type="number"
              fullWidth
              required
              value={formData.unitsPerPack}
              onChange={(e) => setFormData({ ...formData, unitsPerPack: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Số thùng"
              type="number"
              fullWidth
              required
              value={formData.packStock}
              onChange={(e) => setFormData({ ...formData, packStock: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Số lẻ"
              type="number"
              fullWidth
              required
              value={formData.unitStock}
              onChange={(e) => setFormData({ ...formData, unitStock: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Cảnh báo khi còn"
              type="number"
              fullWidth
              required
              value={formData.alertThreshold}
              onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="submit" variant="contained">
              {selectedDrink ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DrinkSettings;
