import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  Stack,
  MenuItem,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import api from '../../../api';
import { format } from 'date-fns';

const RoomHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [filters, setFilters] = useState({
    roomNumber: '',
    startDate: null,
    endDate: null,
    status: 'all'
  });
  const [selectedRental, setSelectedRental] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'completed', label: 'Đã hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' }
  ];

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...(filters.roomNumber && { roomNumber: filters.roomNumber }),
        ...(filters.startDate && { 
          startDate: format(filters.startDate, 'yyyy-MM-dd') 
        }),
        ...(filters.endDate && { 
          endDate: format(filters.endDate, 'yyyy-MM-dd')
        }),
        ...(filters.status !== 'all' && { status: filters.status })
      });

      const response = await api.get(`/api/rentals/history?${queryParams}`);
      
      if (response.data.status === 'success') {
        setHistory(response.data.data.rentals || []);
        setTotalRows(response.data.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching room history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, rowsPerPage, filters]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0);
  };

  const formatDateTime = (date) => {
    return format(new Date(date), 'HH:mm - dd/MM/yyyy', { locale: vi });
  };

  const formatDuration = (duration) => {
    if (!duration) return '-';
    const { hours, minutes } = duration;
    return `${hours}h${minutes > 0 ? ` ${minutes}p` : ''}`;
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      completed: { color: 'success', label: 'Hoàn thành' },
      cancelled: { color: 'error', label: 'Đã hủy' },
      active: { color: 'primary', label: 'Đang thuê' }
    };

    const config = statusConfig[status] || { color: 'default', label: status };

    return (
      <Chip
        size="small"
        color={config.color}
        label={config.label}
      />
    );
  };

  const formatPaymentMethod = (method) => {
    switch (method) {
      case 'cash':
        return 'Tiền mặt';
      case 'banking':
        return 'Chuyển khoản';
      default:
        return method;
    }
  };

  const handleOpenDetail = (rental) => {
    setSelectedRental(rental);
  };

  const handleCloseDetail = () => {
    setSelectedRental(null);
  };

  const RentalDetailModal = ({ rental, onClose }) => {
    if (!rental) return null;
    const charges = rental.charges ? JSON.parse(rental.charges) : null;

    return (
      <Dialog 
        open={Boolean(rental)} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          px: 3,
          py: 2
        }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <InfoIcon color="primary" />
            <Typography variant="h6">Chi tiết thuê phòng #{rental.id}</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Thông tin cơ bản */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ p: 2, height: '100%', borderRadius: 2 }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Thông tin phòng
                    </Typography>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">Số phòng:</Typography>
                        <Typography>{rental.room?.number || '-'}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">Loại phòng:</Typography>
                        <Typography>{rental.room?.type?.name || '-'}</Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Thông tin khách hàng
                    </Typography>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">Tên:</Typography>
                        <Typography>{rental.customer?.fullName || '-'}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">Biển số xe:</Typography>
                        <Typography>{rental.carNumber || '-'}</Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Thời gian thuê
                    </Typography>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">Check-in:</Typography>
                        <Typography>{formatDateTime(rental.checkInTime)}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">Check-out:</Typography>
                        <Typography>{formatDateTime(rental.checkOutTime)}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">Thời gian sử dụng:</Typography>
                        <Typography>{formatDuration(JSON.parse(rental.duration))}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Thông tin đồ uống và thanh toán */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ p: 2, height: '100%', borderRadius: 2 }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Đồ uống
                    </Typography>
                    {rental.drinks && rental.drinks.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Tên</TableCell>
                              <TableCell align="right">SL</TableCell>
                              <TableCell align="right">Đơn giá</TableCell>
                              <TableCell align="right">Thành tiền</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rental.drinks.map((drink, index) => (
                              <TableRow key={index}>
                                <TableCell>{drink.name}</TableCell>
                                <TableCell align="right">{drink.quantity}</TableCell>
                                <TableCell align="right">
                                  {drink.price?.toLocaleString('vi-VN')}đ
                                </TableCell>
                                <TableCell align="right">
                                  {(drink.price * drink.quantity).toLocaleString('vi-VN')}đ
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography color="text.secondary">Không có đồ uống</Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Thanh toán
                    </Typography>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">Tiền phòng:</Typography>
                        <Typography>{charges?.room.amount.toLocaleString('vi-VN')}đ</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">Tiền đồ uống:</Typography>
                        <Typography>{charges?.drinks.total.toLocaleString('vi-VN')}đ</Typography>
                      </Box>
                      {charges?.additional > 0 && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Phụ thu:</Typography>
                          <Typography>{charges.additional.toLocaleString('vi-VN')}đ</Typography>
                        </Box>
                      )}
                      <Divider />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="subtitle2">Tổng cộng:</Typography>
                        <Typography variant="subtitle2" color="primary">
                          {rental.totalAmount.toLocaleString('vi-VN')}đ
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">Phương thức:</Typography>
                        <Chip 
                          size="small"
                          label={formatPaymentMethod(rental.payment_method)}
                          color="default"
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="text.secondary">Trạng thái:</Typography>
                        {getStatusChip(rental.status)}
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Ghi chú */}
            {rental.note && (
              <Grid item xs={12}>
                <Paper 
                  elevation={0} 
                  variant="outlined" 
                  sx={{ p: 2, borderRadius: 2 }}
                >
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Ghi chú
                  </Typography>
                  <Typography>{rental.note}</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={onClose}
            variant="contained"
            disableElevation
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Lịch sử sử dụng phòng
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Số phòng"
              value={filters.roomNumber}
              onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
              size="small"
            />
            
            <DatePicker
              label="Từ ngày"
              value={filters.startDate}
              onChange={(date) => handleFilterChange('startDate', date)}
              slotProps={{ textField: { size: 'small' } }}
            />
            
            <DatePicker
              label="Đến ngày"
              value={filters.endDate}
              onChange={(date) => handleFilterChange('endDate', date)}
              slotProps={{ textField: { size: 'small' } }}
            />
            
            <TextField
              select
              label="Trạng thái"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Tooltip title="Làm mới">
              <IconButton onClick={() => fetchHistory()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </LocalizationProvider>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Số phòng</TableCell>
              <TableCell>Loại phòng</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell>Biển số xe</TableCell>
              <TableCell>Thời gian check-in</TableCell>
              <TableCell>Thời gian check-out</TableCell>
              <TableCell>Số khách</TableCell>
              <TableCell>Tổng tiền</TableCell>
              <TableCell>Thanh toán</TableCell>
              <TableCell>Chi tiết</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              history.map((rental) => (
                <TableRow key={rental._id || rental.id}>
                  <TableCell>{rental.room?.number || '-'}</TableCell>
                  <TableCell>{rental.room?.type?.name || '-'}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {rental.customer?.name || '-'}
                      </Typography>
                      {rental.additionalCars?.map((car, index) => (
                        <Typography 
                          key={index} 
                          variant="body2" 
                          sx={{ mt: 0.5 }}
                        >
                          {car.customer?.name || '-'}
                        </Typography>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {rental.carNumber || '-'}
                      </Typography>
                      {rental.additionalCars?.map((car, index) => (
                        <Typography 
                          key={index} 
                          variant="body2" 
                          sx={{ mt: 0.5 }}
                        >
                          {car.carNumber || '-'}
                        </Typography>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{rental.checkInTime ? formatDateTime(rental.checkInTime) : '-'}</TableCell>
                  <TableCell>{rental.checkOutTime ? formatDateTime(rental.checkOutTime) : '-'}</TableCell>
                  <TableCell>{rental.numberOfGuests || '-'}</TableCell>
                  <TableCell>
                    {rental.totalAmount ? `${rental.totalAmount.toLocaleString('vi-VN')}đ` : '-'}
                  </TableCell>
                  <TableCell>
                    {formatPaymentMethod(rental.payment_method) || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<InfoIcon />}
                      onClick={() => handleOpenDetail(rental)}
                    >
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalRows}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} trên ${count !== -1 ? count : `hơn ${to}`}`
          }
        />
      </TableContainer>

      <RentalDetailModal
        rental={selectedRental}
        onClose={handleCloseDetail}
      />
    </Box>
  );
};

export default RoomHistory; 