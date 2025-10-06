import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  Stack,
  Alert,
  Chip,
  TableContainer
} from '@mui/material';
import api from '../../../api';
import { formatPrice, formatDateTime } from '../../../utils/formatters';
import { toast } from 'react-hot-toast';

const INITIAL_CASH = 1500000; // Tiền mặt định 1.5 triệu

const ShiftReportModal = ({ open, onClose, shift, onConfirm }) => {
  const [shiftData, setShiftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      fetchShiftReport();
    }
  }, [open]);

  const fetchShiftReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/shifts/current/report');
      if (response.data.status === 'success') {
        setShiftData(response.data.data);
      } else {
        setShiftData({
          cashAmount: 0,
          bankingAmount: 0,
          totalRevenue: 0,
          transactions: [],
          roomStats: {
            total: 0,
            occupied: 0,
            cleaning: 0,
            available: 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching shift report:', error);
      setShiftData({
        cashAmount: 0,
        bankingAmount: 0,
        totalRevenue: 0,
        transactions: [],
        roomStats: {
          total: 0,
          occupied: 0,
          cleaning: 0,
          available: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      toast.error('Không thể kết thúc ca làm việc');
    }
  };

  const calculateTotalCash = (shiftData) => {
    return shiftData.cashAmount + INITIAL_CASH;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Thống kê giao ca</Typography>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Nhân viên: {shiftData?.employee?.name || shiftData?.user?.name || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bắt đầu: {shiftData?.startTime ? formatDateTime(shiftData.startTime) : 'N/A'}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Thống kê tổng quan */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Thống kê tổng quan
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatBox 
                      title="Tổng doanh thu" 
                      value={formatPrice(shiftData?.totalRevenue || 0)} 
                      color="primary" 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatBox 
                      title="Tiền mặt" 
                      value={formatPrice(shiftData?.cashAmount || 0)} 
                      color="success" 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatBox 
                      title="Chuyển khoản" 
                      value={formatPrice(shiftData?.bankingAmount || 0)} 
                      color="info" 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatBox 
                      title="Tổng tiền mặt cuối ca" 
                      value={formatPrice(calculateTotalCash(shiftData || { cashAmount: 0 }))} 
                      color="warning" 
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Thống kê phòng */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Thống kê phòng
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <StatBox 
                      title="Tổng số phòng" 
                      value={shiftData?.roomStats?.total || 0} 
                      color="primary" 
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <StatBox 
                      title="Đang sử dụng" 
                      value={shiftData?.roomStats?.occupied || 0} 
                      color="error" 
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <StatBox 
                      title="Đang dọn dẹp" 
                      value={shiftData?.roomStats?.cleaning || 0} 
                      color="warning" 
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <StatBox 
                      title="Phòng trống" 
                      value={shiftData?.roomStats?.available || 0} 
                      color="success" 
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Danh sách giao dịch */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Giao dịch trong ca
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Phòng</TableCell>
                        <TableCell>Loại</TableCell>
                        <TableCell>Thời gian</TableCell>
                        <TableCell>Số khách</TableCell>
                        <TableCell>Số tiền</TableCell>
                        <TableCell>Thanh toán</TableCell>
                        <TableCell>Trạng thái</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shiftData?.transactions?.length > 0 ? (
                        shiftData.transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{transaction.roomNumber}</TableCell>
                            <TableCell>
                              {transaction.type === 'checkin' ? 'Check-in' : 
                               transaction.type === 'checkout' ? 'Check-out' : 
                               transaction.type}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(transaction.transactionTime || transaction.createdAt)}
                            </TableCell>
                            <TableCell>
                              {transaction.details?.numberOfGuests || transaction.rental?.numberOfGuests || '-'}
                            </TableCell>
                            <TableCell>
                              {formatPrice(transaction.amount || 0)}
                            </TableCell>
                            <TableCell>
                              {transaction.method === 'cash' ? 'Tiền mặt' : 
                               transaction.method === 'banking' ? 'Chuyển khoản' : '-'}
                            </TableCell>
                            <TableCell>
                              {transaction.isCrossShift && (
                                <Chip 
                                  size="small" 
                                  color="warning" 
                                  label="Xuyên ca" 
                                  sx={{ mr: 1 }} 
                                />
                              )}
                              {transaction.status === 'completed' ? 
                                <Chip size="small" color="success" label="Hoàn thành" /> : 
                                <Chip size="small" color="info" label="Đang xử lý" />}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            Không có giao dịch nào
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Danh sách giao dịch xuyên ca */}
            {shiftData?.crossShiftTransactions?.length > 0 && (
              <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Giao dịch xuyên ca (Check-in từ ca trước)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Phòng</TableCell>
                          <TableCell>Check-in</TableCell>
                          <TableCell>Số khách</TableCell>
                          <TableCell>Ca check-in</TableCell>
                          <TableCell>Trạng thái</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {shiftData.crossShiftTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{transaction.roomNumber}</TableCell>
                            <TableCell>
                              {formatDateTime(transaction.rental?.checkInTime || transaction.transactionTime)}
                            </TableCell>
                            <TableCell>
                              {transaction.details?.numberOfGuests || transaction.rental?.numberOfGuests || '-'}
                            </TableCell>
                            <TableCell>
                              {transaction.checkInShiftId || 'Ca trước'}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                size="small" 
                                color="warning" 
                                label="Xuyên ca" 
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Đóng
        </Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Xác nhận giao ca
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const StatBox = ({ title, value, color }) => (
  <Paper sx={{ p: 2, textAlign: 'center' }}>
    <Typography color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h5" sx={{ color, fontWeight: 'bold' }}>
      {value}
    </Typography>
  </Paper>
);

export default ShiftReportModal; 