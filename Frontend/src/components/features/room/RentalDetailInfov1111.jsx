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

const CustomerDetails = memo(({ customer, isVisible, onToggle, formatDateTime }) => {
  if (!customer) return null;
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Thông tin khách hàng
      </Typography>
      
      <Stack spacing={2}>
        {/* Thông tin cơ bản */}
        <Box>
          <Typography variant="body1">
            Tên: {customer.fullName || 'Chưa có thông tin'}
          </Typography>
          <Typography variant="body1">
            Số lần thuê: {customer.visitCount || 1}
          </Typography>
          <Typography variant="body1">
            Lần cuối: {formatDateTime(customer.lastVisit)}
          </Typography>
        </Box>

        {/* Thống kê phòng */}
        {customer.roomStats && (
          <Box>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Thống kê phòng ({customer.roomStats.completionRate}% hoàn thành)
            </Typography>
            
            <Stack spacing={1}>
              {/* Tầng 1 */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Tầng 1:
                </Typography>
                {customer.roomStats.floor1.visited.length > 0 ? (
                  <Typography variant="body2" color="success.main">
                    Đã ở: {customer.roomStats.floor1.visited.join(', ')}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Chưa từng ở tầng 1
                  </Typography>
                )}
              </Box>

              {/* Tầng 2 */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Tầng 2:
                </Typography>
                {customer.roomStats.floor2.visited.length > 0 ? (
                  <Typography variant="body2" color="success.main">
                    Đã ở: {customer.roomStats.floor2.visited.join(', ')}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Chưa từng ở tầng 2
                  </Typography>
                )}
              </Box>

              {/* Tổng kết */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="info.main">
                  {customer.roomStats.totalVisited}/{customer.roomStats.totalRooms} phòng
                </Typography>
                {customer.roomStats.remainingRooms > 0 && (
                  <Typography variant="body2" color="warning.main">
                    (Còn {customer.roomStats.remainingRooms} phòng mới)
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Box>
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
            customer={car.customerInfo || car.customerId}
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

  const handleCustomerSelect = useCallback((customer) => {
    if (customer?.carNumber) {
      setNewCarNumber(customer.carNumber);
      setIsWalkIn(false);
    }
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(',', '');
  };

  const handleTimeChange = (newTime) => {
    if (!newTime) return;
    
    const currentDate = dayjs();
    const adjustedTime = currentDate
      .hour(newTime.hour())
      .minute(newTime.minute())
      .second(0)
      .millisecond(0);
    
    console.log('RentalDetailInfo - Time changed:', {
      newTime: newTime.format('YYYY-MM-DD HH:mm:ss'),
      adjustedTime: adjustedTime.format('YYYY-MM-DD HH:mm:ss')
    });
    
    setCheckOutTime(adjustedTime);
    if (onCheckoutTimeChange) {
      console.log('RentalDetailInfo - Calling onCheckoutTimeChange with:', adjustedTime.format('YYYY-MM-DD HH:mm:ss'));
      onCheckoutTimeChange(adjustedTime);
    }
  };

  useEffect(() => {
    console.log('RentalDetailInfo - Initial checkOutTime:', checkOutTime.format('YYYY-MM-DD HH:mm:ss'));
    if (onCheckoutTimeChange) {
      onCheckoutTimeChange(checkOutTime);
    }
  }, []);

  useEffect(() => {
    if (rentalData) {
      console.log('RentalData updated:', rentalData);
    }
  }, [rentalData]);

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
              customer={rentalData?.customerInfo || rentalData?.customer}
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
              <Button
                variant={isWalkIn ? "contained" : "outlined"}
                onClick={() => setIsWalkIn(!isWalkIn)}
              >
                {isWalkIn ? "Khách bộ hành" : "Khách có xe"}
              </Button>
              
              {!isWalkIn && (
                <Box sx={{ flexGrow: 1 }}>
                  <CustomerSearchInput
                    value={newCarNumber}
                    onChange={(newValue) => setNewCarNumber(newValue)}
                    onCustomerSelect={handleCustomerSelect}
                    mainCustomerId={rentalData?.customer?.id}
                    size="small"
                    disabled={loading}
                  />
                </Box>
              )}
              
              <Button 
                variant="contained" 
                onClick={handleAddCar}
                disabled={(!isWalkIn && !newCarNumber.trim()) || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Thêm'}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
});

export default RentalDetailInfo; 