import { Dialog, DialogContent, Box, CircularProgress } from '@mui/material';

const LoadingDialog = ({ open }) => {
  return (
    <Dialog open={open} maxWidth="md" fullWidth>
      <DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingDialog; 