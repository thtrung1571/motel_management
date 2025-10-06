import { Box, Button, Typography } from '@mui/material';
import { ExitToApp as CheckoutIcon } from '@mui/icons-material';

const RentalDetailHeader = ({ rentalData, onCheckout, loading }) => {
  const formatRoomNumber = (number) => `P${number}`;
  
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 2
    }}>
      <Box>
        <Typography variant="h6" component="div">
          Chi tiết thuê phòng {formatRoomNumber(rentalData?.room?.number)}
        </Typography>
        {rentalData?.room?.type?.name && (
          <Typography variant="subtitle2" color="text.secondary">
            Loại phòng: {rentalData.room.type.name}
          </Typography>
        )}
      </Box>
      <Button
        variant="contained"
        color="error"
        startIcon={<CheckoutIcon />}
        onClick={onCheckout}
        disabled={loading}
      >
        {loading ? 'Đang xử lý...' : 'Trả phòng'}
      </Button>
    </Box>
  );
};

export default RentalDetailHeader; 