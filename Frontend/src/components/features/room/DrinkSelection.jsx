import { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Card,
  CardContent,
  IconButton,
  Paper,
  InputAdornment,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  LocalDrink as DrinkIcon
} from '@mui/icons-material';
import api from '../../../api';

const DrinkSelection = ({ selectedDrinks, onDrinksChange }) => {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDrinks = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/drinks');
        if (response.data.status === 'success') {
          setDrinks(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching drinks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrinks();
  }, []);

  const getAvailableStock = (drink, selectedQuantity = 0) => {
    const totalStock = (drink.packStock * drink.unitsPerPack) + drink.unitStock;
    return totalStock - selectedQuantity;
  };

  const handleUpdateQuantity = (drinkId, change) => {
    const drink = drinks.find(d => d.id === drinkId);
    if (!drink) return;

    const existingDrink = selectedDrinks.find(d => d.id === drinkId);
    const newQuantity = (existingDrink?.quantity || 0) + change;
    const availableStock = getAvailableStock(drink, existingDrink?.quantity || 0);

    // Kiểm tra số lượng tồn kho khả dụng
    if (change > 0 && change > availableStock) {
      return; // Không cho phép chọn quá số lượng tồn kho
    }

    if (newQuantity <= 0) {
      onDrinksChange(selectedDrinks.filter(d => d.id !== drinkId));
    } else {
      if (existingDrink) {
        onDrinksChange(
          selectedDrinks.map(d => 
            d.id === drinkId ? { ...d, quantity: newQuantity } : d
          )
        );
      } else {
        onDrinksChange([
          ...selectedDrinks,
          { ...drink, quantity: newQuantity }
        ]);
      }

      // Cập nhật lại số lượng tồn trong drinks
      setDrinks(drinks.map(d => 
        d.id === drinkId 
          ? { 
              ...d, 
              availableStock: getAvailableStock(d, newQuantity)
            } 
          : d
      ));
    }
  };

  const filteredDrinks = drinks.filter(drink => 
    drink.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const getStockStatus = (drink) => {
    const totalStock = (drink.packStock * drink.unitsPerPack) + drink.unitStock;
    if (totalStock <= drink.alertThreshold) {
      return 'warning';
    }
    return 'default';
  };

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" color="primary" fontWeight={500}>
        Đồ uống
      </Typography>

      {/* Đồ uống đã chọn */}
      {selectedDrinks.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Đã chọn:
          </Typography>
          <Stack spacing={1}>
            {selectedDrinks.map((drink) => (
              <Box
                key={drink.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                  bgcolor: 'background.neutral',
                  borderRadius: 1
                }}
              >
                <Box>
                  <Typography variant="body2">{drink.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatPrice(drink.sellingPrice)}
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IconButton
                    size="small"
                    onClick={() => handleUpdateQuantity(drink.id, -1)}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="body2">{drink.quantity}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleUpdateQuantity(drink.id, 1)}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Tìm kiếm */}
      <TextField
        fullWidth
        size="small"
        placeholder="Tìm đồ uống..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          )
        }}
      />

      {/* Danh sách đồ uống */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1 }}>
        {filteredDrinks.map((drink) => {
          const isSelected = selectedDrinks.some(d => d.id === drink.id);
          const selectedQuantity = selectedDrinks.find(d => d.id === drink.id)?.quantity || 0;
          const availableStock = getAvailableStock(drink, selectedQuantity);
          
          return (
            <Card
              key={drink.id}
              variant="outlined"
              sx={{
                cursor: availableStock > 0 ? 'pointer' : 'not-allowed',
                opacity: availableStock > 0 ? 1 : 0.6,
                bgcolor: isSelected ? 'action.selected' : undefined,
                '&:hover': availableStock > 0 ? { bgcolor: 'action.hover' } : {}
              }}
              onClick={() => availableStock > 0 && handleUpdateQuantity(drink.id, isSelected ? -1 : 1)}
            >
              <CardContent sx={{ p: '8px !important' }}>
                <Badge
                  color={getStockStatus(drink)}
                  badgeContent={<DrinkIcon fontSize="small" />}
                  sx={{ width: '100%' }}
                >
                  <Box>
                    <Typography variant="body2" noWrap>
                      {drink.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatPrice(drink.sellingPrice)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Còn: {availableStock}
                    </Typography>
                  </Box>
                </Badge>
                {isSelected && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="caption">
                      {selectedQuantity}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Stack>
  );
};

export default DrinkSelection; 