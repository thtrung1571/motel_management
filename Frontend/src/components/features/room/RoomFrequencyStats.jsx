import { Box, Stack, Typography, Chip, Paper, Grid } from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  TrendingUp as HighFreqIcon,
  TrendingFlat as MediumFreqIcon,
  TrendingDown as LowFreqIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

const RoomFrequencyStats = ({ rooms, selectedRoomId, onRoomSelect }) => {
  // Phân loại phòng theo tầng
  const roomsByFloor = rooms.reduce((acc, room) => {
    const floor = Math.floor(parseInt(room.number) / 100);
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});

  const getFrequencyIcon = (frequency) => {
    switch (frequency) {
      case 'high':
        return <HighFreqIcon color="error" />;
      case 'low':
        return <LowFreqIcon color="warning" />;
      default:
        return <MediumFreqIcon color="success" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đang có khách':
        return 'error';
      case 'Đang dọn dẹp':
        return 'warning';
      case 'Đang bảo trì':
        return 'error';
      case 'Sẵn sàng':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatLastUsed = (lastUsed) => {
    if (!lastUsed) return 'Chưa dùng';
    
    const lastUsedDate = dayjs(lastUsed);
    const today = dayjs();
    
    if (lastUsedDate.isSame(today, 'day')) {
      return lastUsedDate.format('HH:mm');
    }
    return lastUsedDate.format('DD/MM/YYYY');
  };

  const renderFloorRooms = (floor, floorRooms) => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Tầng {floor}
      </Typography>
      
      <Timeline position="right" sx={{ p: 0 }}>
        {floorRooms.map((room) => {
          // Kiểm tra phòng có thể chọn được không
          const isSelectable = room.currentStatus === 'Sẵn sàng';
          
          return (
            <TimelineItem 
              key={room.id}
              sx={{
                cursor: isSelectable ? 'pointer' : 'not-allowed',
                opacity: isSelectable ? 1 : 0.6,
                '&:hover': isSelectable ? { bgcolor: 'action.hover' } : {},
                bgcolor: selectedRoomId === room.id ? 'action.selected' : 'transparent',
                borderRadius: 1,
                transition: 'all 0.2s',
                minHeight: 'auto',
                '&:before': {
                  display: 'none'
                }
              }}
              onClick={() => isSelectable && onRoomSelect(room)}
            >
              <TimelineSeparator>
                <TimelineDot sx={{ p: 0, my: 0.5 }}>
                  {getFrequencyIcon(room.frequency)}
                </TimelineDot>
              </TimelineSeparator>
              <TimelineContent sx={{ py: 0.5 }}>
                <Grid container spacing={1} alignItems="center">
                  {/* Số phòng */}
                  <Grid item xs={3}>
                    <Typography 
                      variant="subtitle2"
                      color={selectedRoomId === room.id ? 'primary' : 'text.primary'}
                      noWrap
                    >
                      Phòng {room.number}
                    </Typography>
                  </Grid>

                  {/* Trạng thái */}
                  <Grid item xs={4}>
                    <Chip 
                      size="small"
                      label={room.currentStatus || 'Sẵn sàng'}
                      color={getStatusColor(room.currentStatus)}
                    />
                  </Grid>

                  {/* Số lần sử dụng */}
                  <Grid item xs={2}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {room.usageCount} lần
                    </Typography>
                  </Grid>

                  {/* Lần cuối sử dụng */}
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {formatLastUsed(room.lastUsed)}
                    </Typography>
                  </Grid>
                </Grid>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </Box>
  );

  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Typography variant="subtitle2" color="primary" gutterBottom>
        Tần suất sử dụng phòng (30 ngày gần nhất)
      </Typography>

      <Grid container spacing={2}>
        {Object.entries(roomsByFloor).map(([floor, floorRooms]) => (
          <Grid item xs={12} md={6} key={floor}>
            {renderFloorRooms(floor, floorRooms)}
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default RoomFrequencyStats; 