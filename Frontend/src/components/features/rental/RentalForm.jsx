import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Input from "../../common/Input/Input";
import Button from "../../common/Button/Button";
import { createRental } from "../../../store/slices/rentalSlice";

const RentalForm = ({ room, onSuccess }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    carNumber: "",
    numberOfGuests: 1,
    rentType: "overnight",
    checkInTime: new Date().toISOString(),
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
      await dispatch(
        createRental({
          ...formData,
          roomId: room._id,
        }),
      ).unwrap();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create rental:", error);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Cho thuê phòng {room.roomNumber}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Input
              label="Biển số xe"
              name="carNumber"
              value={formData.carNumber}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Input
              label="Số khách"
              name="numberOfGuests"
              type="number"
              value={formData.numberOfGuests}
              onChange={handleChange}
              required
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Loại thuê</InputLabel>
              <Select
                name="rentType"
                value={formData.rentType}
                onChange={handleChange}
                label="Loại thuê"
              >
                <MenuItem value="overnight">Qua đêm</MenuItem>
                <MenuItem value="hourly">Theo giờ</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" fullWidth variant="contained">
              Xác nhận
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default RentalForm;
