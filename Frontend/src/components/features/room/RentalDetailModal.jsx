import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Stack,
} from '@mui/material';
import api from '../../../api';
import CheckoutModal from './CheckoutModal';
import { useRentalDetail } from '../../../hooks/useRentalDetail';
import { useDrinks } from '../../../hooks/useDrinks';
import LoadingDialog from '../../common/LoadingDialog';
import RentalDetailHeader from './RentalDetailHeader';
import RentalDetailInfo from './RentalDetailInfo';
import RentalDetailDrinks from './RentalDetailDrinks';
import RentalDetailSettings from './RentalDetailSettings';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';

const RentalDetailModal = ({ open, onClose, rental, onCheckout, onUpdate }) => {
  const { rentalData, isLoading, setRentalData } = useRentalDetail(rental, open);
  const { 
    drinks, 
    processedDrinks, 
    setProcessedDrinks, 
    updateDrinkStock  // Make sure this is destructured
  } = useDrinks(rental, open);
  
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutTime, setCheckoutTime] = useState(dayjs());
  const [customerDetailsVisible, setCustomerDetailsVisible] = useState({
    main: false,
    additional: {}
  });

  const handleCheckoutTimeChange = useCallback((newTime) => {
    console.log('RentalDetailModal - Checkout time changed:', newTime.format('YYYY-MM-DD HH:mm:ss'));
    setCheckoutTime(newTime);
  }, []);

  const handleAddCarNumber = async (carNumber, isWalkIn = false) => {
    if (!rentalData?.id) return;

    try {
      setLoading(true);
      const response = await api.post(`/api/rentals/${rentalData.id}/cars`, {
        carNumber: isWalkIn ? `WALK-IN-${Date.now()}` : carNumber.trim().toUpperCase(),
        numberOfNewGuests: 1,
        isWalkIn
      });

      if (response.data?.status === 'success') {
        const updatedRental = await api.get(`/api/rentals/${rentalData.id}`);
        if (updatedRental.data?.status === 'success') {
          console.log('Updated rental data:', updatedRental.data.data);
          setRentalData(updatedRental.data.data);
          
          if (updatedRental.data.data.additionalCars?.length > 0) {
            const newIndex = updatedRental.data.data.additionalCars.length - 1;
            setCustomerDetailsVisible(prev => ({
              ...prev,
              additional: {
                ...prev.additional,
                [newIndex]: true
              }
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to add car number:', error);
      alert(error.response?.data?.message || 'Không thể thêm biển số xe');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrink = async (drink) => {
    if (!rentalData?.id) return;

    try {
      setLoading(true);
      const response = await api.post(`/api/rentals/${rentalData.id}/drinks`, {
        drinkId: drink.id,
        name: drink.name,
        quantity: 1,
        price: drink.sellingPrice
      });
      
      if (response.data?.status === 'success') {
        const updatedRental = response.data.data?.rental || response.data.data;
        
        if (updatedRental) {
          setRentalData(updatedRental);
          if (updatedRental.drinks) {
            setProcessedDrinks(updatedRental.drinks);
          }
        }

        if (response.data.data?.drinkStock) {
          updateDrinkStock(response.data.data.drinkStock);
        }
      }
    } catch (error) {
      console.error('Failed to add drink:', error);
      console.error('Response:', error.response?.data);
      alert('Không thể thêm đồ uống');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDrinkQuantity = (updatedRental) => {
    setRentalData(updatedRental);
    setProcessedDrinks(updatedRental.drinks);
  };

  const handleShowCheckoutModal = () => {
    if (!rentalData?.id) return;
    setShowCheckoutModal(true);
  };

  const handleCheckoutConfirm = async (checkoutData) => {
    if (!rentalData?.id) return;

    try {
      setLoading(true);
      await onCheckout(rentalData.id, checkoutData);
      setShowCheckoutModal(false);
      onClose();
    } catch (error) {
      console.error('Checkout failed:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (settings) => {
    if (!rentalData?.id) return;

    try {
      setLoading(true);
      const response = await api.patch(`/api/rentals/${rentalData.id}/settings`, settings);

      if (response.data?.status === 'success') {
        setRentalData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert(error.response?.data?.message || 'Không thể cập nhật cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (rentalData) {
      onUpdate && onUpdate(rentalData);
    }
    onClose();
  };

  if (isLoading) {
    return <LoadingDialog open={open} />;
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <RentalDetailHeader 
            rentalData={rentalData} 
            onCheckout={handleShowCheckoutModal}
            loading={loading}
          />
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <RentalDetailInfo 
                  rentalData={rentalData}
                  onAddCar={handleAddCarNumber}
                  loading={loading}
                  customerDetailsVisible={customerDetailsVisible}
                  setCustomerDetailsVisible={setCustomerDetailsVisible}
                  onCheckoutTimeChange={handleCheckoutTimeChange}
                />
                
                <RentalDetailSettings
                  rentalData={rentalData}
                  onUpdateSettings={handleUpdateSettings}
                  loading={loading}
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              {rentalData && (
                <RentalDetailDrinks
                  rental={rentalData}
                  drinks={drinks}
                  processedDrinks={processedDrinks}
                  onAddDrink={handleAddDrink}
                  onUpdateQuantity={handleUpdateDrinkQuantity}
                  onDrinkStockUpdate={updateDrinkStock}
                  loading={loading}
                />
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <CheckoutModal
        open={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        rental={rentalData}
        onConfirm={handleCheckoutConfirm}
        initialCheckoutTime={checkoutTime}
      />
    </>
  );
};

RentalDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  rental: PropTypes.object,
  onCheckout: PropTypes.func.isRequired,
  onUpdate: PropTypes.func
};

export default RentalDetailModal; 