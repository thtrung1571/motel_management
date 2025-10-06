import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoomDetails } from "../../../store/slices/roomSlice";
import RentalForm from "../rental/RentalForm";
import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";
import ErrorAlert from "../../common/ErrorAlert/ErrorAlert";

const RoomDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentRoom, loading, error } = useSelector((state) => state.rooms);
  const [showRentalForm, setShowRentalForm] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchRoomDetails(id));
    }
  }, [dispatch, id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!currentRoom) return null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Chi tiết phòng {currentRoom.roomNumber}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin phòng
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Số phòng"
                  secondary={currentRoom.roomNumber}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Tầng" secondary={currentRoom.floor} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Loại phòng"
                  secondary={currentRoom.roomType}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Trạng thái"
                  secondary={
                    currentRoom.status === "available" ? "Trống" : "Đang thuê"
                  }
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          {currentRoom.status === "available" && showRentalForm ? (
            <RentalForm
              room={currentRoom}
              onSuccess={() => {
                setShowRentalForm(false);
                dispatch(fetchRoomDetails(id));
              }}
            />
          ) : (
            <Button
              variant="contained"
              fullWidth
              onClick={() => setShowRentalForm(true)}
              disabled={currentRoom.status !== "available"}
            >
              Thuê phòng
            </Button>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default RoomDetails;
