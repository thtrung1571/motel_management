import { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
} from "@mui/material";
import Input from "../../common/Input/Input";
import Button from "../../common/Button/Button";

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    autoCheckout: true,
    checkoutTime: "12:00",
    sendNotifications: true,
    backupEnabled: true,
    backupTime: "00:00",
    maintenanceMode: false,
  });

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: e.target.type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement save settings
    console.log("Save settings:", settings);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Cài đặt hệ thống
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoCheckout}
                    onChange={handleChange}
                    name="autoCheckout"
                  />
                }
                label="Tự động checkout"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Input
                label="Giờ checkout mặc định"
                type="time"
                name="checkoutTime"
                value={settings.checkoutTime}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.sendNotifications}
                    onChange={handleChange}
                    name="sendNotifications"
                  />
                }
                label="Gửi thông báo"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.backupEnabled}
                    onChange={handleChange}
                    name="backupEnabled"
                  />
                }
                label="Tự động backup dữ liệu"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Input
                label="Giờ backup"
                type="time"
                name="backupTime"
                value={settings.backupTime}
                onChange={handleChange}
                disabled={!settings.backupEnabled}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                    name="maintenanceMode"
                  />
                }
                label="Chế độ bảo trì"
              />
            </Grid>

            <Grid item xs={12}>
              <Button type="submit" variant="contained">
                Lưu cài đặt
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default SystemSettings;
