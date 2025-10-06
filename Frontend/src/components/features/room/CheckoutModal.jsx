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

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2)
}));

const TotalBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}));

const PaymentField = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1)
}));

const CheckoutModal = ({ open, onClose, rental, onConfirm, initialCheckoutTime }) => {
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [discount, setDiscount] = useState('0');
  const [discountInput, setDiscountInput] = useState('0');
  const [additionalCharge, setAdditionalCharge] = useState('0');
  const [additionalChargeInput, setAdditionalChargeInput] = useState('0');
  const [inputValue, setInputValue] = useState('0');
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [checkoutTime, setCheckoutTime] = useState(dayjs());
  const [customerPayment, setCustomerPayment] = useState('0');

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
      (additionalCharge !== 0 || 
       discount !== 0 ||
       customerPayment !== '0' ||
       checkoutTime.format() !== initialCheckoutTime?.format())) {
      console.log('CheckoutModal - Recalculating due to changes:', {
        additionalCharge,
        discount,
        customerPayment,
        checkoutTime: checkoutTime.format('YYYY-MM-DD HH:mm:ss')
      });
      calculateCheckout();
    }
  }, [additionalCharge, discount, customerPayment, checkoutTime]);

  const calculateCheckout = async () => {
    try {
      console.log('CheckoutModal - Calculating checkout with time:', 
        checkoutTime.format('YYYY-MM-DD HH:mm:ss')
      );

      const response = await api.post(`/api/rentals/calculate-checkout`, {
        rentalId: rental.id,
        checkoutTime: checkoutTime.toISOString(),
        additionalCharges: parseInt(additionalCharge) || 0,
        discount: parseInt(discount) || 0,
        payment: {
          amount: parseInt(customerPayment.replace(/[^\d-]/g, '')) || 0,
          method: paymentMethod
        }
      });

      const calculationData = response.data.data;
      setCheckoutData(calculationData);

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

  const handleDiscountChange = (event) => {
    const value = event.target.value.replace(/[^\d-]/g, '');
    
    if (value === '' || value === '-') {
      setDiscountInput(value);
      setDiscount(0);
      return;
    }

    const number = parseInt(value);
    if (!isNaN(number)) {
      setDiscountInput(value);
      setDiscount(number);
    }
  };

  const handleDiscountBlur = () => {
    if (discountInput === '' || discountInput === '-') {
      setDiscountInput('0');
      setDiscount(0);
    } else {
      const formattedValue = formatNumberWithCommas(Math.abs(discount));
      setDiscountInput(discount < 0 ? `-${formattedValue}` : formattedValue);
    }
  };

  const handleAdditionalChargeChange = (event) => {
    const value = event.target.value.replace(/[^\d-]/g, '');
    
    if (value === '' || value === '-') {
      setAdditionalChargeInput(value);
      setAdditionalCharge(0);
      return;
    }

    const number = parseInt(value);
    if (!isNaN(number)) {
      setAdditionalChargeInput(value);
      setAdditionalCharge(number);
    }
  };

  const handleAdditionalChargeBlur = () => {
    if (additionalChargeInput === '' || additionalChargeInput === '-') {
      setAdditionalChargeInput('0');
      setAdditionalCharge(0);
    } else {
      const formattedValue = formatNumberWithCommas(Math.abs(additionalCharge));
      setAdditionalChargeInput(additionalCharge < 0 ? `-${formattedValue}` : formattedValue);
    }
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

  // Helper function to get first hour price
  const getFirstHourPrice = () => {
    if (checkoutData?.charges?.room?.details?.firstHour?.price) {
      return checkoutData.charges.room.details.firstHour.price;
    }
    
    if (checkoutData?.charges?.room?.type === 'hourly_base' && checkoutData?.charges?.room?.details?.basePrice) {
      return checkoutData.charges.room.details.basePrice;
    }
    
    return 0;
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      console.log('CheckoutModal - Confirming checkout with time:', 
        checkoutTime.format('YYYY-MM-DD HH:mm:ss')
      );
      
      await onConfirm({
        additionalCharges: parseInt(additionalCharge) || 0,
        discount: parseInt(discount) || 0,
        payment_method: paymentMethod,
        customerPayment: parseInt(customerPayment.replace(/[^\d-]/g, '')) || 0,
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

  const calculateAmountDue = () => {
    if (!checkoutData) return 0;
    return checkoutData.charges.final;
  };

  const calculateChange = () => {
    if (!checkoutData) return 0;
    const amountDue = checkoutData.charges.final;
    const paid = parseInt(customerPayment.replace(/[^\d-]/g, '')) || 0;
    return Math.max(0, paid - amountDue);
  };

  const handleCustomerPaymentChange = (event) => {
    const value = event.target.value.replace(/[^\d-]/g, '');
    
    if (value === '' || value === '-') {
      setCustomerPayment('0');
      return;
    }

    const number = parseInt(value);
    if (!isNaN(number)) {
      setCustomerPayment(formatNumberWithCommas(number));
    }
  };

  const handleCustomerPaymentBlur = () => {
    if (!customerPayment || customerPayment === '-') {
      setCustomerPayment('0');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3,
          minHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
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

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Cột trái - Chi tiết thanh toán */}
          <Box sx={{ flex: 1.5 }}>
            <StyledPaper sx={{ p: 3 }}>
              <SectionTitle variant="h6">
                Chi tiết thanh toán
              </SectionTitle>
              
              <Stack spacing={3}>
                {/* Thời gian sử dụng */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Tính giờ
                  </Typography>
                  <Stack spacing={1.5}>
                    <DetailItem>
                      <Typography variant="body2">• Thời gian sử dụng</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {checkoutData?.duration?.hours || 0} giờ {" "}
                        {checkoutData?.duration?.minutes || 0} phút
                      </Typography>
                    </DetailItem>
                    
                    {/* Giờ đầu cho rentType hourly */}
                    {rental?.rentType === 'hourly' && (
                      <DetailItem>
                        <Typography variant="body2">• Giờ đầu</Typography>
                        <Typography variant="body2">
                          {formatCurrency(
                            getFirstHourPrice()
                          )}
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

                {/* Đồ uống */}
                {checkoutData?.charges?.drinks?.items?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Đồ uống
                    </Typography>
                    <Stack spacing={1.5}>
                      {checkoutData.charges.drinks.items.map((drink, index) => (
                        <DetailItem key={index}>
                          <Typography variant="body2">
                            • {drink.name} ({drink.quantity} x {formatCurrency(drink.price)})
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {formatCurrency(drink.quantity * drink.price)}
                          </Typography>
                        </DetailItem>
                      ))}
                    </Stack>
                  </Box>
                )}

                <TotalBox>
                  <Typography variant="h6">Tổng cộng</Typography>
                  <Typography variant="h6">
                    {formatCurrency(checkoutData?.charges?.subtotal || 0)}
                  </Typography>
                </TotalBox>
              </Stack>
            </StyledPaper>
          </Box>

          {/* Cột phải - Tổng tiền thanh toán */}
          <Box sx={{ flex: 1 }}>
            <StyledPaper sx={{ p: 3 }}>
              <SectionTitle variant="h6">
                Tổng tiền thanh toán
              </SectionTitle>
              
              <Stack spacing={2}>
                <PaymentField>
                  <Typography>Tổng tiền</Typography>
                  <Typography fontWeight={500}>
                    {formatCurrency(checkoutData?.charges?.subtotal || 0)}
                  </Typography>
                </PaymentField>

                <PaymentField>
                  <Typography>Giảm giá</Typography>
                  <TextField
                    size="small"
                    value={discountInput}
                    onChange={handleDiscountChange}
                    onBlur={handleDiscountBlur}
                    sx={{ width: '150px' }}
                    InputProps={{
                      endAdornment: <Typography>đ</Typography>,
                      sx: { borderRadius: 2 }
                    }}
                  />
                </PaymentField>

                <PaymentField>
                  <Typography>Thu khác</Typography>
                  <TextField
                    size="small"
                    value={additionalChargeInput}
                    onChange={handleAdditionalChargeChange}
                    onBlur={handleAdditionalChargeBlur}
                    sx={{ width: '150px' }}
                    InputProps={{
                      endAdornment: <Typography>đ</Typography>,
                      sx: { borderRadius: 2 }
                    }}
                  />
                </PaymentField>

                <PaymentField>
                  <Typography>Khách hàng cần trả</Typography>
                  <Typography fontWeight={500} color="primary.main">
                    {formatCurrency(calculateAmountDue())}
                  </Typography>
                </PaymentField>

                <PaymentField>
                  <Typography>Khách hàng thanh toán</Typography>
                  <TextField
                    size="small"
                    value={customerPayment}
                    onChange={handleCustomerPaymentChange}
                    onBlur={handleCustomerPaymentBlur}
                    sx={{ width: '150px' }}
                    InputProps={{
                      endAdornment: <Typography>đ</Typography>,
                      sx: { borderRadius: 2 }
                    }}
                  />
                </PaymentField>

                {calculateChange() > 0 && (
                  <PaymentField>
                    <Typography>Tiền thừa thối khách</Typography>
                    <Typography 
                      fontWeight={500} 
                      color="success.main"
                      sx={{ fontSize: '1.1rem' }}
                    >
                      {formatCurrency(calculateChange())}
                    </Typography>
                  </PaymentField>
                )}

                <PaymentField>
                  <Typography>Phương thức thanh toán</Typography>
                  <Select
                    size="small"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    sx={{ width: '150px', borderRadius: 2 }}
                  >
                    <MenuItem value="cash">Tiền mặt</MenuItem>
                    <MenuItem value="banking">Chuyển khoản</MenuItem>
                  </Select>
                </PaymentField>
              </Stack>
            </StyledPaper>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2, minWidth: 120 }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading}
          sx={{ borderRadius: 2, minWidth: 120 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Xác nhận'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CheckoutModal;
