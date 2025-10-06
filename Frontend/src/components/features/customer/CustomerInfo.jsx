import { memo } from 'react';
import { Box, Stack, Typography, Chip, Paper, Grid } from '@mui/material';
import dayjs from 'dayjs';

const CustomerStats = memo(({ customerInfo }) => {
  // ... stats component code như cũ ...
});

const CustomerRentalHistory = memo(({ rentalHistory }) => {
  if (!rentalHistory?.length) return null;

  const formatDate = (dateStr) => {
    const date = dayjs(dateStr);
    const today = dayjs();
    
    if (date.format('YYYY-MM-DD') === today.format('YYYY-MM-DD')) {
      return date.format('DD/MM/YYYY');
    }
    return date.format('DD/MM/YYYY');
  };

  const formatDrinks = (drinks) => {
    if (!drinks?.length) return '';
    return drinks.map(drink => `${drink.quantity} ${drink.name}`).join(' + ');
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Lịch sử thuê phòng
      </Typography>
      <Stack spacing={1}>
        {rentalHistory.map((rental, index) => (
          <Paper key={index} sx={{ p: 1.5 }}>
            <Grid container alignItems="center" wrap="nowrap">
              <Grid item sx={{ width: 130 }}>
                <Typography variant="caption">
                  {formatDate(rental.date)}
                </Typography>
              </Grid>
              <Grid item sx={{ width: 130 }}>
                <Typography variant="caption" color="primary">
                  Phòng {rental.roomNumber}
                </Typography>
              </Grid>
              <Grid item sx={{ width: 130 }}>
                <Typography variant="caption" color="text.secondary">
                  {rental.rentType === 'hourly' ? 'Giờ' : 'Ngày'}
                </Typography>
              </Grid>
              <Grid item sx={{ width: 130 }}>
                <Typography variant="caption" color="success.main">
                  {rental.totalAmount}đ
                </Typography>
              </Grid>
              {rental.drinks?.length > 0 && (
                <Grid item sx={{ width: 200 }}>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {formatDrinks(rental.drinks)}
                  </Typography>
                </Grid>
              )}
              <Grid item sx={{ flexGrow: 1 }}>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {rental.note || ''}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
});

const CustomerInfo = memo(({ customer }) => {
  if (!customer) return null;

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {customer.fullName || 'Chưa có thông tin'}
          </Typography>
          <Chip
            label={`${customer.visitCount || 0} lần thuê`}
            color="primary"
          />
        </Stack>

        <CustomerStats customerInfo={customer} />
        <CustomerRentalHistory rentalHistory={customer.rentalHistory} />
      </Stack>
    </Box>
  );
});

CustomerInfo.displayName = 'CustomerInfo';
CustomerStats.displayName = 'CustomerStats';
CustomerRentalHistory.displayName = 'CustomerRentalHistory';

export default CustomerInfo; 