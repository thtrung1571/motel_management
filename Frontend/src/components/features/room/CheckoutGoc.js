import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  Divider,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Select,
  MenuItem,
} from "@mui/material";
import api from '../../../api';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  boxShadow: 'none',
  border: `1px solid ${theme.palette.divider}`
}));

const DetailRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(0.5, 0)
}));

const DetailItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingLeft: theme.spacing(2)
}));

const CheckoutModal = ({ open, onClose, rental, onConfirm, initialCheckoutTime }) => {
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [additionalCharge, setAdditionalCharge] = useState(0);
  const [inputValue, setInputValue] = useState('0');
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [checkoutTime, setCheckoutTime] = useState(dayjs());

  useEffect(() => {
    if (initialCheckoutTime) {
      console.log('CheckoutModal - Received new time:', {
        initialTime: initialCheckoutTime.format('YYYY-MM-DD HH:mm:ss'),
        currentState: checkoutTime.format('YYYY-MM-DD HH:mm:ss')
      });
      setCheckoutTime(initialCheckoutTime);
    }
  }, [initialCheckoutTime]);

  useEffect(() => {
    if (open && rental?.id) {
      console.log('CheckoutModal - Initial calculation with time:', 
        checkoutTime.format('YYYY-MM-DD HH:mm:ss')
      );
      calculateCheckout();
    }
  }, [open, rental?.id]);

  useEffect(() => {
    if (open && rental?.id && 
      (additionalCharge !== 0 || checkoutTime.format() !== initialCheckoutTime?.format())) {
      console.log('CheckoutModal - Recalculating due to changes:', {
        additionalCharge,
        checkoutTime: checkoutTime.format('YYYY-MM-DD HH:mm:ss')
      });
      calculateCheckout();
    }
  }, [additionalCharge, checkoutTime]);

  const calculateCheckout = async () => {
    try {
      console.log('CheckoutModal - Calculating checkout with time:', 
        checkoutTime.format('YYYY-MM-DD HH:mm:ss')
      );
      const response = await api.post(`/api/rentals/calculate-checkout`, {
        rentalId: rental.id,
        additionalCharges: additionalCharge,
        checkoutTime: checkoutTime.toISOString()
      });
      console.log('CheckoutModal - Calculation response:', response.data);
      setCheckoutData(response.data.data);
    } catch (error) {
      console.error('CheckoutModal - Calculate checkout failed:', error);
      setError('Có lỗi xảy ra khi tính tiền');
    }
  };

  const handleTimeChange = (newTime) => {
    if (!newTime) return;
    
    const currentTime = dayjs();
    const adjustedTime = currentTime
      .hour(newTime.hour())
      .minute(newTime.minute())
      .second(0)
      .millisecond(0);
    
    setCheckoutTime(adjustedTime);
  };

  const handleAdditionalChargeChange = (event) => {
    const value = event.target.value.replace(/[^\d-]/g, '');
    
    if (value === '' || value === '-') {
      setInputValue(value);
      setAdditionalCharge(0);
      return;
    }

    const number = parseInt(value);
    if (!isNaN(number)) {
      setInputValue(value);
      setAdditionalCharge(number);
    }
  };

  const handleAdditionalChargeBlur = () => {
    if (inputValue === '' || inputValue === '-') {
      setInputValue('0');
      setAdditionalCharge(0);
    } else {
      const formattedValue = formatNumberWithCommas(Math.abs(additionalCharge));
      setInputValue(additionalCharge < 0 ? `-${formattedValue}` : formattedValue);
    }
  };

  const handleAdditionalChargeFocus = (event) => {
    const rawValue = additionalCharge.toString();
    setInputValue(rawValue);
    event.target.select();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatNumberWithCommas = (number) => {
    if (!number) return "0";
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      console.log('CheckoutModal - Confirming checkout with time:', 
        checkoutTime.format('YYYY-MM-DD HH:mm:ss')
      );
      
      await onConfirm({
        additionalCharges: additionalCharge,
        payment_method: paymentMethod,
        note: '',
        checkoutTime: checkoutTime.toISOString()
      });
      
      onClose();
    } catch (error) {
      console.error('Checkout failed:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Thanh toán phòng {rental?.room?.number}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Thời gian trả phòng: {checkoutTime.format('HH:mm')}
        </Typography>
        {checkoutData?.charges?.room?.warning && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {checkoutData.charges.room.warningMessage}
          </Alert>
        )}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Chi tiết thanh toán */}
          <StyledPaper>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Chi tiết thanh toán
            </Typography>
            <Stack spacing={2}>
              {/* Thời gian sử dụng và Chi tiết tính giờ */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tính giờ:
                </Typography>
                <Stack spacing={1}>
                  <DetailItem>
                    <Typography variant="body2">• Thời gian sử dụng</Typography>
                    <Typography variant="body2">
                      {checkoutData?.duration?.hours || 0} giờ {" "}
                      {checkoutData?.duration?.minutes || 0} phút
                    </Typography>
                  </DetailItem>
                  
                  {/* Giờ đầu cho rentType hourly */}
                  {rental?.rentType === 'hourly' && (
                    <DetailItem>
                      <Typography variant="body2">• Giờ đầu</Typography>
                      <Typography variant="body2">
                        {formatCurrency(checkoutData?.charges?.room?.details?.firstHour?.price || 0)}
                      </Typography>
                    </DetailItem>
                  )}

                  {/* Giá cơ bản cho halfday và overnight */}
                  {rental?.rentType !== 'hourly' && (
                    <DetailItem>
                      <Typography variant="body2">
                        • {rental?.rentType === 'halfday' ? 'Nửa ngày' : 'Nguyên ngày'}
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(checkoutData?.charges?.room?.details?.basePrice || 0)}
                      </Typography>
                    </DetailItem>
                  )}

                  {/* Phụ trội */}
                  {rental?.rentType === 'hourly' && checkoutData?.charges?.room?.details?.additionalHours && (
                    <DetailItem>
                      <Typography variant="body2">
                        • Giờ phụ trội ({checkoutData.charges.room.details.additionalHours.hours} giờ x {
                          formatCurrency(checkoutData.charges.room.details.additionalHours.pricePerHour)
                        })
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(checkoutData.charges.room.details.additionalHours.total)}
                      </Typography>
                    </DetailItem>
                  )}

                  {/* Phụ trội cho halfday và overnight */}
                  {rental?.rentType !== 'hourly' && checkoutData?.charges?.room?.details?.extraHours && (
                    <DetailItem>
                      <Typography variant="body2">
                        {rental?.rentType === 'halfday' ?
                          `• Giờ phụ trội (${checkoutData.charges.room.details.extraHours.hours} giờ x ${
                            formatCurrency(checkoutData.charges.room.details.extraHours.pricePerHour)
                          })` :
                          `• Phụ trội (${checkoutData.charges.room.details.extraHours.type === 'hourly' ? 
                            `${checkoutData.charges.room.details.extraHours.hours} giờ x ${
                              formatCurrency(checkoutData.charges.room.details.extraHours.pricePerHour)
                            }` : 
                            checkoutData.charges.room.details.extraHours.type === 'halfday' ?
                            'Nửa ngày' :
                            checkoutData.charges.room.details.extraHours.type === 'halfday_plus' ?
                            `Nửa ngày + ${checkoutData.charges.room.details.extraHours.extraHours.hours} giờ` :
                            'Nguyên ngày'
                          })`
                        }
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(checkoutData.charges.room.details.extraHours.total)}
                      </Typography>
                    </DetailItem>
                  )}
                </Stack>
              </Box>

              {/* Chi tiết đồ uống */}
              {checkoutData?.charges?.drinks?.items?.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Đồ uống:
                  </Typography>
                  <Stack spacing={1}>
                    {checkoutData.charges.drinks.items.map((drink, index) => (
                      <DetailItem key={index}>
                        <Typography variant="body2">
                          • {drink.name} ({drink.quantity} x {formatCurrency(drink.price)})
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(drink.quantity * drink.price)}
                        </Typography>
                      </DetailItem>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </StyledPaper>

          {/* Tổng tiền thanh toán */}
          <StyledPaper>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Tổng tiền thanh toán
            </Typography>
            <Stack spacing={2}>
              <DetailRow>
                <Typography>Tiền phòng</Typography>
                <Typography sx={{ fontWeight: 500 }}>
                  {formatCurrency(checkoutData?.charges?.room?.amount || 0)}
                </Typography>
              </DetailRow>
              <DetailRow>
                <Typography>Tiền nước</Typography>
                <Typography sx={{ fontWeight: 500 }}>
                  {formatCurrency(checkoutData?.charges?.drinks?.total || 0)}
                </Typography>
              </DetailRow>
              <DetailRow>
                <Typography>Phụ thu</Typography>
                <TextField
                  size="small"
                  value={inputValue}
                  onChange={handleAdditionalChargeChange}
                  onBlur={handleAdditionalChargeBlur}
                  onFocus={handleAdditionalChargeFocus}
                  sx={{ 
                    width: '150px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                  InputProps={{
                    endAdornment: <Typography>đ</Typography>
                  }}
                />
              </DetailRow>
              <DetailRow>
                <Typography>Thanh toán</Typography>
                <Box sx={{ minWidth: 150 }}>
                  <Select
                    size="small"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    sx={{ 
                      width: '150px',
                      borderRadius: 2
                    }}
                  >
                    <MenuItem value="cash">Tiền mặt</MenuItem>
                    <MenuItem value="banking">Chuyển khoản</MenuItem>
                  </Select>
                </Box>
              </DetailRow>
            </Stack>
          </StyledPaper>

          {/* Tổng cộng */}
          <StyledPaper sx={{ 
            backgroundColor: (theme) => theme.palette.primary.main,
            color: 'white'
          }}>
            <DetailRow>
              <Typography variant="h6">Tổng cộng</Typography>
              <Typography variant="h6">
                {formatCurrency(checkoutData?.charges?.total || 0)}
              </Typography>
            </DetailRow>
          </StyledPaper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading}
          sx={{ 
            borderRadius: 2,
            minWidth: 120
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Xác nhận'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CheckoutModal;
