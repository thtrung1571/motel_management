import { memo } from 'react';
import { Stack, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

const RENT_TYPES = [
  { value: 'hourly', label: 'Theo giờ' },
  { value: 'halfday', label: 'Nửa ngày' },
  { value: 'overnight', label: 'Nguyên ngày' }
];

const CheckInForm = memo(({ 
  rentType, 
  setRentType, 
  checkInTime, 
  setCheckInTime,
  numberOfGuests,
  setNumberOfGuests 
}) => {
  return (
    <Stack spacing={2}>
      <FormControl fullWidth>
        <InputLabel>Loại thuê</InputLabel>
        <Select
          value={rentType}
          label="Loại thuê"
          onChange={(e) => setRentType(e.target.value)}
        >
          {RENT_TYPES.map(type => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <DateTimePicker
          label="Thời gian nhận phòng"
          value={checkInTime}
          onChange={setCheckInTime}
          format="HH:mm"
          ampm={false}
          views={['hours', 'minutes']}
          sx={{
            '& .MuiInputBase-input': {
              fontSize: '0.875rem'
            }
          }}
        />
      </FormControl>

      <TextField
        type="number"
        label="Số khách"
        value={numberOfGuests}
        onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 1)}
        inputProps={{ min: 1 }}
        fullWidth
      />
    </Stack>
  );
});

CheckInForm.displayName = 'CheckInForm';
export default CheckInForm; 