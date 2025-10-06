import React, { useState, useCallback, memo, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Button,
  Collapse,
  IconButton,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import CustomerSearchInput from '../../common/CustomerSearchInput';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

const CustomerDetails = memo(({ customer, formatDateTime }) => {
  if (!customer) return null;
  
  return (
    <Box sx={{ 
      p: 2, 
      borderRadius: 1,
      bgcolor: 'background.paper',
      boxShadow: 1,
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <Stack spacing={2}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="primary">
            Thông tin khách hàng
          </Typography>
          <Box sx={{ 
            px: 1, 
            py: 0.5, 
            bgcolor: 'primary.lighter', 
            borderRadius: 1,
            display: 'inline-flex'
          }}>
            <Typography variant="caption" color="primary.main">
              {customer.visitCount || 0} lần thuê
            </Typography>
          </Box>
        </Stack>

        {/* Basic Info */}
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
              Tên:
            </Typography>
            <Typography variant="body2">
              {customer.fullName || 'Chưa có thông tin'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
              Lần cuối:
            </Typography>
            <Typography variant="body2">
              {formatDateTime(customer.lastVisit)}
            </Typography>
          </Stack>
        </Stack>

        {/* Room Stats */}
        {customer.roomStats && (
          <>
            <Divider />
            <Stack spacing={1.5}>
              {/* Progress */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ 
                    height: 6, 
                    bgcolor: 'grey.100', 
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${customer.roomStats.completionRate}%`,
                      height: '100%',
                      bgcolor: 'primary.main',
                      transition: 'width 0.5s ease-in-out'
                    }} />
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {customer.roomStats.completionRate}%
                </Typography>
              </Stack>

              {/* Floor Stats */}
              <Stack spacing={1}>
                {/* Floor 1 */}
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Tầng 1
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5, 
                    flexWrap: 'wrap',
                    mt: 0.5
                  }}>
                    {customer.roomStats.floor1.visited.length > 0 ? (
                      customer.roomStats.floor1.visited.map((room) => (
                        <Box
                          key={room}
                          sx={{
                            px: 1,
                            py: 0.25,
                            bgcolor: 'success.lighter',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'success.light'
                          }}
                        >
                          <Typography variant="caption" color="success.dark">
                            {room}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Chưa từng ở
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Floor 2 */}
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Tầng 2
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5, 
                    flexWrap: 'wrap',
                    mt: 0.5
                  }}>
                    {customer.roomStats.floor2.visited.length > 0 ? (
                      customer.roomStats.floor2.visited.map((room) => (
                        <Box
                          key={room}
                          sx={{
                            px: 1,
                            py: 0.25,
                            bgcolor: 'success.lighter',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'success.light'
                          }}
                        >
                          <Typography variant="caption" color="success.dark">
                            {room}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Chưa từng ở
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Stack>

              {/* Summary */}
              <Box sx={{
                p: 1,
                bgcolor: 'info.lighter',
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="caption" color="info.dark">
                  {customer.roomStats.totalVisited}/{customer.roomStats.totalRooms} phòng
                </Typography>
                {customer.roomStats.remainingRooms > 0 && (
                  <Typography variant="caption" color="warning.dark">
                    Còn {customer.roomStats.remainingRooms} phòng mới
                  </Typography>
                )}
              </Box>
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  );
});

const AdditionalCars = memo(({ cars, customerDetailsVisible, onToggle, formatDateTime }) => {
  if (!cars?.length) return null;

  return (
    <>
      <Divider />
      <Typography variant="subtitle1">Khách bổ sung:</Typography>
      {cars.map((car, index) => (
        <Box key={`${car.carNumber}-${index}`}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Biển số: {car.carNumber}
          </Typography>
          <CustomerDetails 
            customer={car.customer}
            isVisible={customerDetailsVisible[index]}
            onToggle={() => onToggle(index)}
            formatDateTime={formatDateTime}
          />
        </Box>
      ))}
    </>
  );
});

const RentalDetailInfo = memo(({ rentalData, onAddCar, loading, onCheckoutTimeChange }) => {
  const [customerDetailsVisible, setCustomerDetailsVisible] = useState({
    main: false,
    additional: {}
  });
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [newCarNumber, setNewCarNumber] = useState('');
  const [checkOutTime, setCheckOutTime] = useState(dayjs());

  const toggleMainCustomerDetails = useCallback(() => {
    setCustomerDetailsVisible(prev => ({
      ...prev,
      main: !prev.main
    }));
  }, []);

  const toggleAdditionalCustomerDetails = useCallback((index) => {
    setCustomerDetailsVisible(prev => ({
      ...prev,
      additional: {
        ...prev.additional,
        [index]: !prev.additional[index]
      }
    }));
  }, []);

  const handleAddCar = useCallback(async () => {
    if (isWalkIn || (newCarNumber && newCarNumber.trim())) {
      await onAddCar(isWalkIn ? `WALK-IN-${Date.now()}` : newCarNumber.trim(), isWalkIn);
      setNewCarNumber('');
      setIsWalkIn(false);
    }
  }, [newCarNumber, isWalkIn, onAddCar]);

  const handleCustomerSelect = useCallback(({ customerInfo, isWalkIn, isNewCustomer }) => {
    if (isWalkIn) {
      onAddCar('WALK-IN', true);
    } else if (customerInfo) {
      onAddCar(customerInfo.carNumber, false);
    }
  }, [onAddCar]);

  const handleAddWalkIn = () => {
    onAddCar('WALK-IN', true);
  };

  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(',', '');
  }, []);

  const handleTimeChange = useCallback((newTime) => {
    if (!newTime) return;
    setCheckOutTime(newTime);
    if (onCheckoutTimeChange) {
      onCheckoutTimeChange(newTime);
    }
  }, [onCheckoutTimeChange]);

  if (!rentalData) {
    return (
      <Card variant="outlined">
        <CardContent>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" gutterBottom>
            Thông tin chính
          </Typography>
          
          <Typography variant="body1">
            Thời gian vào: {formatDateTime(rentalData?.checkInTime)}
          </Typography>

          <DateTimePicker
            label="Thời gian ra dự kiến"
            value={checkOutTime}
            onChange={handleTimeChange}
            format="HH:mm"
            views={['hours', 'minutes']}
            ampm={false}
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small"
              }
            }}
          />

          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {isWalkIn ? 'Khách bộ hành' : `Biển số: ${rentalData?.carNumber || ''}`}
            </Typography>
            <CustomerDetails 
              customer={rentalData?.customer}
              isVisible={customerDetailsVisible.main}
              onToggle={toggleMainCustomerDetails}
              formatDateTime={formatDateTime}
            />
          </Box>

          {rentalData?.additionalCars && rentalData.additionalCars.length > 0 && (
            <AdditionalCars 
              cars={rentalData.additionalCars}
              customerDetailsVisible={customerDetailsVisible.additional}
              onToggle={toggleAdditionalCustomerDetails}
              formatDateTime={formatDateTime}
            />
          )}

          <Stack spacing={1}>
            <Typography variant="subtitle1">Thêm khách</Typography>
            <Stack direction="row" spacing={1}>
              <CustomerSearchInput
                type="additional"
                onSelect={handleCustomerSelect}
                existingCarNumbers={[
                  rentalData?.carNumber,
                  ...(rentalData?.additionalCars?.map(car => car.carNumber) || [])
                ]}
                disabled={loading}
              />
              <Button
                variant="outlined"
                onClick={handleAddWalkIn}
                disabled={loading}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {loading ? <CircularProgress size={20} /> : 'Thêm khách bộ hành'}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
});

// Add display names for better debugging
CustomerDetails.displayName = 'CustomerDetails';
AdditionalCars.displayName = 'AdditionalCars';
RentalDetailInfo.displayName = 'RentalDetailInfo';

export default RentalDetailInfo; 