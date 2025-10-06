import { useState } from "react";
import {
  Stack,
  TextField,
  FormControlLabel,
  Switch,
  Autocomplete,
  CircularProgress,
  Typography,
  Box,
  Button
} from "@mui/material";
import api from "../../api";

const CustomerSearchInput = ({ 
  onSelect,
  type = 'main',
  existingCarNumbers = [],
  selectedCustomer = null
}) => {
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [carNumber, setCarNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");

  const handleSearch = async (searchValue) => {
    setError("");
    if (!searchValue || searchValue.length < 2) {
      setCustomers([]);
      return;
    }

    if (type === 'additional' && existingCarNumbers.includes(searchValue.trim().toUpperCase())) {
      setError("Biển số xe này đã được thêm");
      setCustomers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/api/customers/search?search=${searchValue}`);
      if (response.data.status === 'success') {
        setCustomers(response.data.suggestions || []);
      }
    } catch (error) {
      console.error("Error searching customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewCustomer = () => {
    if (!carNumber) return;
    
    onSelect({ 
      isWalkIn: false,
      isNewCustomer: true,
      customerInfo: {
        carNumber: carNumber.trim().toUpperCase(),
        fullName: '',
        cccd: '',
        visitCount: 0
      },
      type
    });
  };

  const handleCustomerSelect = async (event, customer) => {
    if (!customer) {
      onSelect({ 
        isWalkIn: false,
        customerInfo: null,
        type
      });
      setCarNumber("");
      setCustomers([]);
      return;
    }

    try {
      const response = await api.get(`/api/customers/search/${customer.id}`);
      if (response.data.status === 'success') {
        onSelect({ 
          isWalkIn: false,
          customerInfo: response.data.customer,
          type
        });
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
    setCarNumber("");
    setCustomers([]);
  };

  const handleWalkInChange = (e) => {
    setIsWalkIn(e.target.checked);
    if (e.target.checked) {
      onSelect({ 
        isWalkIn: true,
        type 
      });
    }
    setCarNumber("");
    setCustomers([]);
  };

  const renderCustomerOption = (props, option) => {
    const { key, ...otherProps } = props;
    
    return (
      <Box component="li" key={key} {...otherProps}>
        <Stack spacing={0.5}>
          <Typography variant="body1">
            {option.carNumber}
            <Typography component="span" color="primary" sx={{ ml: 1, fontSize: '0.875rem' }}>
              ({option.visitCount || 0} lần thuê)
            </Typography>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {option.fullName}
            {option.cccd && ` - CCCD: ${option.cccd}`}
          </Typography>
        </Stack>
      </Box>
    );
  };

  return (
    <Stack spacing={2}>
      {type === 'main' && (
        <FormControlLabel
          control={
            <Switch
              checked={isWalkIn}
              onChange={handleWalkInChange}
            />
          }
          label="Khách bộ hành"
        />
      )}

      {(!isWalkIn || type === 'additional') && (
        <Stack spacing={1}>
          <Autocomplete
            value={selectedCustomer}
            onChange={handleCustomerSelect}
            options={customers}
            getOptionLabel={(option) => option?.carNumber || ""}
            renderOption={renderCustomerOption}
            loading={loading}
            onInputChange={(event, value) => {
              setCarNumber(value);
              handleSearch(value);
            }}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            clearOnBlur={false}
            renderInput={(params) => (
              <TextField
                {...params}
                label={type === 'main' ? "Biển số xe" : "Biển số xe phụ"}
                required
                fullWidth
                error={!!error}
                helperText={error}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading && <CircularProgress color="inherit" size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            noOptionsText={
              carNumber.length < 2 
                ? "Nhập ít nhất 2 ký tự" 
                : <Button 
                    onClick={handleNewCustomer}
                    fullWidth
                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  >
                    Tạo khách hàng mới với biển số: {carNumber}
                  </Button>
            }
          />
        </Stack>
      )}
    </Stack>
  );
};

export default CustomerSearchInput;
