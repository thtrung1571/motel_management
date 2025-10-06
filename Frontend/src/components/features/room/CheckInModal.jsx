import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Stack,
  Typography,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { CheckCircleOutline as CheckInIcon } from '@mui/icons-material';
import CustomerSearchInput from '../../common/CustomerSearchInput';
import CustomerInfo from '../customer/CustomerInfo';
import CheckInForm from './CheckInForm';
import DrinkSelection from './DrinkSelection';
import dayjs from 'dayjs';
import api from '../../../api';
import RoomFrequencyStats from './RoomFrequencyStats';
import { toast } from 'react-hot-toast';

const STEPS = ['Thông tin khách hàng', 'Chi tiết thuê phòng'];

const CheckInModal = ({ room: initialRoom, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Thông tin khách hàng
  const [mainCustomer, setMainCustomer] = useState(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  
  // Thông tin check-in
  const [rentType, setRentType] = useState("hourly");
  const [checkInTime, setCheckInTime] = useState(dayjs());
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [selectedDrinks, setSelectedDrinks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(initialRoom);

  useEffect(() => {
    const fetchRoomStats = async () => {
      try {
        const response = await api.get('/api/rooms/frequency');
        if (response.data.status === 'success') {
          setRooms(response.data.rooms);
        }
      } catch (error) {
        console.error('Error fetching room stats:', error);
      }
    };

    if (activeStep === 1) {
      fetchRoomStats();
    }
  }, [activeStep]);

  useEffect(() => {
    setSelectedRoom(initialRoom);
  }, [initialRoom]);

  const handleCustomerSelect = (data) => {
    // Nếu là khách bộ hành, tạo một đối tượng với carNumber là WALK-IN
    if (data.isWalkIn) {
      setMainCustomer({
        isWalkIn: true,
        isNewCustomer: true,
        customerInfo: {
          carNumber: 'WALK-IN', // Backend sẽ thêm timestamp
          fullName: '',
          visitCount: 0
        }
      });
      setSelectedCustomerData(null);
    } else {
      setMainCustomer({
        isWalkIn: false,
        isNewCustomer: data.isNewCustomer,
        customerInfo: data.customerInfo
      });
      setSelectedCustomerData(data.customerInfo);
    }
  };

  const handleNext = () => {
    // Validate bước 1: phải có thông tin khách hàng
    if (activeStep === 0 && !mainCustomer) {
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleRoomSelect = (newRoom) => {
    // Kiểm tra trạng thái phòng từ API frequency
    if (newRoom.currentStatus === 'Sẵn sàng') {
      setSelectedRoom(newRoom);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const checkInData = {
        roomId: selectedRoom.id,
        rentType,
        checkInTime: checkInTime.toISOString(),
        numberOfGuests,
        mainCustomer: {
          isWalkIn: mainCustomer.isWalkIn,
          isNewCustomer: mainCustomer.isNewCustomer,
          ...(mainCustomer.customerInfo && {
            customerId: mainCustomer.customerInfo.id,
            carNumber: mainCustomer.customerInfo.carNumber
          })
        },
        drinks: selectedDrinks.map(drink => ({
          drinkId: drink.id,
          quantity: drink.quantity
        }))
      };

      const response = await api.post('/api/rentals', checkInData);
      
      if (response.data.status === 'success') {
        if (typeof onSuccess === 'function') {
          await onSuccess(response.data.data);
        }
        
        // Reset form
        setMainCustomer(null);
        setSelectedCustomerData(null);
        setRentType("hourly");
        setCheckInTime(dayjs());
        setNumberOfGuests(1);
        setSelectedDrinks([]);
        setActiveStep(0);
        
        setOpen(false);
        
        toast.success('Nhận phòng thành công');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi nhận phòng');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <CustomerSearchInput
              type="main"
              onSelect={handleCustomerSelect}
              selectedCustomer={selectedCustomerData}
            />

            {mainCustomer?.customerInfo && (
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Thông tin khách hàng chính
                </Typography>
                <CustomerInfo customer={mainCustomer.customerInfo} />
              </Paper>
            )}
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }} variant="outlined">
                  <Stack spacing={2}>
                    <Typography variant="subtitle2" color="primary">
                      Thông tin thuê phòng {selectedRoom?.number}
                    </Typography>
                    <CheckInForm
                      rentType={rentType}
                      setRentType={setRentType}
                      checkInTime={checkInTime}
                      setCheckInTime={setCheckInTime}
                      numberOfGuests={numberOfGuests}
                      setNumberOfGuests={setNumberOfGuests}
                    />
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }} variant="outlined">
                  <DrinkSelection
                    selectedDrinks={selectedDrinks}
                    onDrinksChange={setSelectedDrinks}
                  />
                </Paper>
              </Grid>
            </Grid>

            <RoomFrequencyStats 
              rooms={rooms} 
              selectedRoomId={selectedRoom?.id}
              onRoomSelect={handleRoomSelect}
            />
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Button
        fullWidth
        variant="contained"
        color="primary"
        startIcon={<CheckInIcon />}
        onClick={() => setOpen(true)}
        disabled={initialRoom?.currentStatus !== 'Sẵn sàng'}
      >
        Nhận phòng
      </Button>

      <Dialog
        open={open}
        onClose={() => !loading && setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack spacing={3}>
            <Typography variant="h6">
              Nhận phòng {selectedRoom?.number}
              {selectedRoom?.currentStatus !== 'Sẵn sàng' && (
                <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                  (Phòng không khả dụng)
                </Typography>
              )}
            </Typography>
            <Stepper activeStep={activeStep}>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          {renderStepContent(activeStep)}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            Hủy
          </Button>
          {activeStep > 0 && (
            <Button onClick={handleBack}>
              Quay lại
            </Button>
          )}
          {activeStep === STEPS.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Nhận phòng"}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!mainCustomer}
            >
              Tiếp tục
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CheckInModal;
