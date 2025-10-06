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
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Button from "../../common/Button/Button";
import { addDrinksToRental } from "../../../store/slices/rentalSlice";
import { formatPrice } from "../../../utils/formatters";

const DrinkOrder = ({ rental, drinks, onSuccess }) => {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);

  const handleAddDrink = () => {
    setOrders([...orders, { drinkId: "", quantity: 1 }]);
  };

  const handleRemoveDrink = (index) => {
    const newOrders = orders.filter((_, i) => i !== index);
    setOrders(newOrders);
  };

  const handleChange = (index, field, value) => {
    const newOrders = orders.map((order, i) => {
      if (i === index) {
        return { ...order, [field]: value };
      }
      return order;
    });
    setOrders(newOrders);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        addDrinksToRental({
          rentalId: rental._id,
          drinks: orders,
        }),
      ).unwrap();
      onSuccess?.();
      setOrders([]);
    } catch (error) {
      console.error("Failed to add drinks:", error);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Thêm đồ uống
      </Typography>

      <form onSubmit={handleSubmit}>
        {orders.map((order, index) => (
          <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Đồ uống</InputLabel>
                <Select
                  value={order.drinkId}
                  onChange={(e) =>
                    handleChange(index, "drinkId", e.target.value)
                  }
                  label="Đồ uống"
                  required
                >
                  {drinks.map((drink) => (
                    <MenuItem key={drink._id} value={drink._id}>
                      {drink.name} - {formatPrice(drink.price)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Số lượng</InputLabel>
                <Select
                  value={order.quantity}
                  onChange={(e) =>
                    handleChange(index, "quantity", e.target.value)
                  }
                  label="Số lượng"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <MenuItem key={num} value={num}>
                      {num}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <IconButton
                color="error"
                onClick={() => handleRemoveDrink(index)}
              >
                <RemoveIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <Box sx={{ mb: 2 }}>
          <Button
            type="button"
            variant="outlined"
            onClick={handleAddDrink}
            startIcon={<AddIcon />}
          >
            Thêm đồ uống
          </Button>
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={orders.length === 0}
        >
          Xác nhận
        </Button>
      </form>
    </Paper>
  );
};

export default DrinkOrder;
