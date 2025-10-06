import React, { memo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField
} from '@mui/material';
import PropTypes from 'prop-types';

const RentalDetailSettings = memo(({ 
  rentalData, 
  onUpdateSettings,
  loading 
}) => {
  const handleRentTypeChange = (event) => {
    onUpdateSettings({
      rentType: event.target.value,
      numberOfGuests: rentalData.numberOfGuests
    });
  };

  const handleGuestsChange = (event) => {
    const value = parseInt(event.target.value) || 1;
    onUpdateSettings({
      rentType: rentalData.rentType,
      numberOfGuests: value
    });
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" gutterBottom>
            Cài đặt thuê phòng
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Hình thức thuê</InputLabel>
            <Select
              value={rentalData?.rentType || 'hourly'}
              onChange={handleRentTypeChange}
              disabled={loading}
              label="Hình thức thuê"
            >
              <MenuItem value="hourly">Theo giờ</MenuItem>
              <MenuItem value="halfday">Nửa ngày</MenuItem>
              <MenuItem value="overnight">Nguyên ngày</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Số lượng khách"
            type="number"
            value={rentalData?.numberOfGuests || 1}
            onChange={handleGuestsChange}
            disabled={loading}
            InputProps={{
              inputProps: { 
                min: 1,
                max: 10
              }
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
});

RentalDetailSettings.propTypes = {
  rentalData: PropTypes.shape({
    rentType: PropTypes.string,
    numberOfGuests: PropTypes.number
  }),
  onUpdateSettings: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default RentalDetailSettings; 