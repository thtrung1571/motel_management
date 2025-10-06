import {
  Card,
  CardContent,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Box,
  IconButton,
  Paper,
  Stack,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useState } from 'react';
import api from '../../../api';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';

const DrinksList = ({ drinks, onUpdateQuantity, loading }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  return (
    <List>
      {drinks.map((item) => (
        <ListItem
          key={item.id || `${item.name}-${item.createdAt}`}
          secondaryAction={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => onUpdateQuantity(item.id, -1)}
                disabled={loading}
              >
                <RemoveIcon />
              </IconButton>
              <Typography>{item.quantity}</Typography>
              <IconButton
                size="small"
                onClick={() => onUpdateQuantity(item.id, 1)}
                disabled={loading}
              >
                <AddIcon />
              </IconButton>
            </Box>
          }
        >
          <ListItemText
            primary={item.name}
            secondary={formatPrice(item.price)}
          />
        </ListItem>
      ))}
    </List>
  );
};

const DrinkGrid = ({ drinks, onAddDrink, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const getTotalUnits = (drink) => {
    return (drink.packStock * drink.unitsPerPack) + drink.unitStock;
  };

  const filteredDrinks = drinks.filter(drink => 
    drink.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="primary">
          Thêm đồ uống
        </Typography>

        <TextField
          size="small"
          fullWidth
          placeholder="Tìm đồ uống..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 1
        }}>
          {filteredDrinks.map((drink) => {
            const totalUnits = getTotalUnits(drink);
            const isOutOfStock = totalUnits === 0;
            
            return (
              <Paper
                key={drink.id}
                variant="outlined"
                onClick={() => !isOutOfStock && onAddDrink(drink)}
                sx={{
                  p: 1,
                  cursor: (loading || isOutOfStock) ? 'not-allowed' : 'pointer',
                  opacity: (loading || isOutOfStock) ? 0.7 : 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (loading || isOutOfStock) ? undefined : 'action.hover',
                    transform: (loading || isOutOfStock) ? undefined : 'translateY(-2px)'
                  }
                }}
              >
                <Stack spacing={0.5} alignItems="center">
                  <Typography variant="body2" align="center">
                    {drink.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="primary"
                    sx={{ fontWeight: 'medium' }}
                  >
                    {formatPrice(drink.sellingPrice)}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color={totalUnits <= drink.alertThreshold ? "error" : "text.secondary"}
                  >
                    Còn: {totalUnits}
                  </Typography>
                </Stack>
              </Paper>
            );
          })}
        </Box>
      </Stack>
    </Paper>
  );
};

const RentalDetailDrinks = ({ 
  rental,
  drinks, 
  processedDrinks, 
  onAddDrink,
  onUpdateQuantity,
  loading,
  onDrinkStockUpdate
}) => {
  const handleUpdateQuantity = async (drinkId, change) => {
    try {
      const response = await api.patch(`/api/rentals/${rental.id}/drinks/${drinkId}`, {
        change
      });

      if (response.data.status === 'success') {
        // Cập nhật state rental
        onUpdateQuantity(response.data.data.rental);
        
        // Cập nhật state drinks với stock mới
        if (response.data.data.drinkStock) {
          onDrinkStockUpdate(response.data.data.drinkStock);
        }
      }
    } catch (error) {
      console.error('Failed to update drink quantity:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật số lượng');
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Đồ uống
        </Typography>
        
        {/* Đồ uống đã chọn */}
        <DrinksList 
          drinks={processedDrinks} 
          onUpdateQuantity={handleUpdateQuantity}
          loading={loading}
        />

        <Divider sx={{ my: 2 }} />

        {/* Danh sách đồ uống có thể thêm */}
        <Typography variant="subtitle1" gutterBottom>
          Thêm đồ uống:
        </Typography>
        <DrinkGrid 
          drinks={drinks} 
          onAddDrink={onAddDrink}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
};

RentalDetailDrinks.propTypes = {
  rental: PropTypes.shape({
    id: PropTypes.number.isRequired,
  }),
  drinks: PropTypes.array.isRequired,
  processedDrinks: PropTypes.array.isRequired,
  onAddDrink: PropTypes.func.isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  onDrinkStockUpdate: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default RentalDetailDrinks; 