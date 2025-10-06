import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { fetchDashboardData } from "../../../store/slices/dashboardSlice";
import { formatPrice } from "../../../utils/formatters";
import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";
import ErrorAlert from "../../common/ErrorAlert/ErrorAlert";
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PeopleIcon from '@mui/icons-material/People';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ROOM_STATUS_LABELS = {
  'available': 'Phòng Trống',
  'maintenance': 'Bảo trì',
  'occupied': 'P.Có khách',
  'cleaning': 'Phòng Dơ'
};

const ROOM_STATUS_DESCRIPTIONS = {
  'available': 'Phòng đã dọn dẹp và sẵn sàng đón khách',
  'maintenance': 'Phòng đang được sửa chữa hoặc bảo trì',
  'occupied': 'Phòng đang có khách thuê',
  'cleaning': 'Phòng đang chờ dọn dẹp'
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ 
    height: '100%',
    background: `linear-gradient(135deg, ${color}15, ${color}05)`,
    border: `1px solid ${color}30`,
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: `0 4px 20px ${color}30`
    }
  }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ 
          p: 1, 
          borderRadius: '50%', 
          bgcolor: `${color}20`,
          color: color 
        }}>
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);



const Dashboard = () => {
  const dispatch = useDispatch();
  const dashboardData = useSelector((state) => state.dashboard.data);
  const loading = useSelector((state) => state.dashboard.loading);
  const error = useSelector((state) => state.dashboard.error);

  const handleRefresh = () => {
    dispatch(fetchDashboardData());
  };

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!dashboardData) return null;

  const {
    totalRevenue,
    todayRevenue,
    roomStats,
    recentRentals,
    dailyRevenue,
    totalCustomers,
    newCustomersToday
  } = dashboardData;

  const formattedRoomStats = roomStats?.map(stat => ({
    ...stat,
    name: ROOM_STATUS_LABELS[stat.name] || stat.name
  }));

  // Tạo object để map trạng thái với số lượng
  const roomStatusCount = roomStats?.reduce((acc, stat) => {
    acc[stat.name] = stat.value;
    return acc;
  }, {});

  // Format dữ liệu cho biểu đồ doanh thu
  const formattedDailyRevenue = dailyRevenue?.map(item => ({
    ...item,
    date: format(new Date(item.date), 'dd-MM-yyyy', { locale: vi }),
    revenue: item.revenue,
    formattedRevenue: formatPrice(item.revenue)
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Tổng quan
        </Typography>
        <Tooltip title="Làm mới">
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={4}>
          <StatCard
            title="Doanh thu hôm nay"
            value={formatPrice(todayRevenue)}
            icon={<AccountBalanceWalletIcon />}
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Tổng doanh thu tháng"
            value={formatPrice(totalRevenue)}
            icon={<TimelineIcon />}
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Khách hàng mới hôm nay"
            value={newCustomersToday}
            icon={<PeopleIcon />}
            color="#FF9800"
          />
        </Grid>

        {/* Room Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 3, 
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff, #f5f5f5)',
          }}>
            <Typography variant="h6" gutterBottom>
              Trạng thái phòng
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Stack spacing={1}>
                {Object.entries(ROOM_STATUS_LABELS).map(([key, label], index) => (
                  <Box 
                    key={key}
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1 
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%',
                        bgcolor: COLORS[index % COLORS.length] 
                      }} 
                    />
                    <Typography variant="body2" fontWeight="medium">
                      {label}:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {roomStatusCount?.[key] || 0}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formattedRoomStats}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {formattedRoomStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Daily Revenue Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 3,
            background: 'linear-gradient(135deg, #ffffff, #f5f5f5)',
          }}>
            <Typography variant="h6" gutterBottom>
              Doanh thu theo ngày
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formattedDailyRevenue}>
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => {
                    if (value === 0) return '0';
                    if (value >= 1000) {
                      return (value / 1000).toString() + 'K';
                    }
                    return value;
                  }}
                />
                <RechartsTooltip 
                  formatter={(value) => formatPrice(value)}
                  labelFormatter={(label) => `Ngày: ${label}`}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#82ca9d"
                  radius={[4, 4, 0, 0]}
                  name="Doanh thu"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Rentals */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 3,
            background: 'linear-gradient(135deg, #ffffff, #f5f5f5)',
          }}>
            <Typography variant="h6" gutterBottom>
              Giao dịch gần đây
            </Typography>
            <List>
              {recentRentals?.map((rental, index) => (
                <Box key={rental._id || rental.id}>
                  <ListItem sx={{
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      borderRadius: 1
                    }
                  }}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                          {`Phòng ${rental.room?.number} - ${rental.carNumber}`}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {`${formatPrice(rental.totalAmount)} - ${new Date(rental.checkOutTime || rental.checkOutDate).toLocaleString()}`}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < recentRentals.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
