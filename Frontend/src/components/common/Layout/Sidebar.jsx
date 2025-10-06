import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Typography,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Hotel as HotelIcon,
  LocalDrink as DrinkIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { logout } from "../../../store/slices/authSlice";

const Sidebar = ({ open: propOpen, onClose, width = 240 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [openSettings, setOpenSettings] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(propOpen);
  const [autoCloseTimer, setAutoCloseTimer] = useState(null);

  // Kiểm tra role admin từ Redux state
  useEffect(() => {
    const isUserAdmin = user?.role === "admin";
    setIsAdmin(isUserAdmin);
  }, [user]);

  useEffect(() => {
    setOpen(propOpen);
  }, [propOpen]);

  // Auto close timer
  useEffect(() => {
    let timer;
    if (open) {
      timer = setTimeout(() => {
        setOpen(false);
        onClose?.();
      }, 3000);
      setAutoCloseTimer(timer);
    }
    return () => timer && clearTimeout(timer);
  }, [open, onClose]);

  const menuItems = useMemo(() => [
    {
      text: "Tổng quan",
      icon: <DashboardIcon />,
      path: "/dashboard",
      show: isAdmin,
    },
    {
      text: "Phòng",
      icon: <HotelIcon />,
      path: "/rooms",
      show: true,
    },
    {
      text: "Lịch Sử Phòng",
      icon: <HistoryIcon />,
      path: isAdmin ? "/admin/room-history" : "/room-history",
      show: true,
    },
    {
      text: "Khách hàng",
      icon: <PeopleIcon />,
      path: "/customers",
      show: true,
    },
    {
      text: "Cài đặt",
      icon: <SettingsIcon />,
      path: "/settings/room-types",
      show: isAdmin,
    },
  ], [isAdmin]);

  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleSettingsClick = () => {
    setOpenSettings(!openSettings);
  };

  const handleLogout = async () => {
    try {
      dispatch(logout());
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Drawer
      variant="permanent"
      open={open}
      onClose={onClose}
      sx={{
        width: open ? width : 70,
        transition: "width 0.3s ease-in-out",
        "& .MuiDrawer-paper": {
          width: open ? width : 70,
          transition: "width 0.3s ease-in-out",
          backgroundColor: "#1a237e",
          color: "white",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          overflow: "auto",
          mt: 2,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1,
          }}
        >
          {open && (
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Menu
            </Typography>
          )}
          <IconButton onClick={() => setOpen(!open)} sx={{ color: "white" }}>
            <MenuIcon />
          </IconButton>
        </Box>
        <Divider sx={{ bgcolor: "rgba(255,255,255,0.12)" }} />

        <List sx={{ flexGrow: 1 }}>
          {menuItems
            .filter((item) => item.show)
            .map((item) =>
              item.children ? (
                <Box key={item.text}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={handleSettingsClick}
                      sx={{
                        minHeight: 48,
                        px: 2.5,
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,0.08)",
                        },
                      }}
                    >
                      <Tooltip title={!open ? item.text : ""} placement="right">
                        <ListItemIcon sx={{ color: "white" }}>
                          {item.icon}
                        </ListItemIcon>
                      </Tooltip>
                      {open && (
                        <>
                          <ListItemText primary={item.text} />
                          {openSettings ? <ExpandLess /> : <ExpandMore />}
                        </>
                      )}
                    </ListItemButton>
                  </ListItem>
                  <Collapse
                    in={openSettings && open}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div" disablePadding>
                      {item.children
                        .filter((child) => child.show)
                        .map((child) => (
                          <ListItemButton
                            key={child.text}
                            sx={{
                              pl: 4,
                              minHeight: 48,
                              "&.Mui-selected": {
                                backgroundColor: "rgba(255,255,255,0.16)",
                                "&:hover": {
                                  backgroundColor: "rgba(255,255,255,0.24)",
                                },
                              },
                              "&:hover": {
                                backgroundColor: "rgba(255,255,255,0.08)",
                              },
                            }}
                            selected={location.pathname === child.path}
                            onClick={() => handleNavigate(child.path)}
                          >
                            <Tooltip
                              title={!open ? child.text : ""}
                              placement="right"
                            >
                              <ListItemIcon sx={{ color: "white" }}>
                                {child.icon}
                              </ListItemIcon>
                            </Tooltip>
                            {open && <ListItemText primary={child.text} />}
                          </ListItemButton>
                        ))}
                    </List>
                  </Collapse>
                </Box>
              ) : (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    selected={location.pathname === item.path}
                    onClick={() => handleNavigate(item.path)}
                    sx={{
                      minHeight: 48,
                      px: 2.5,
                      "&.Mui-selected": {
                        backgroundColor: "rgba(255,255,255,0.16)",
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,0.24)",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.08)",
                      },
                    }}
                  >
                    <Tooltip title={!open ? item.text : ""} placement="right">
                      <ListItemIcon sx={{ color: "white" }}>
                        {item.icon}
                      </ListItemIcon>
                    </Tooltip>
                    {open && <ListItemText primary={item.text} />}
                  </ListItemButton>
                </ListItem>
              ),
            )}
        </List>
      </Box>

      <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            minHeight: 48,
            px: 2.5,
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.08)",
            },
            color: "error.light",
          }}
        >
          <Tooltip title={!open ? "Đăng xuất" : ""} placement="right">
            <ListItemIcon sx={{ color: "error.light" }}>
              <LogoutIcon />
            </ListItemIcon>
          </Tooltip>
          {open && <ListItemText primary="Đăng xuất" />}
        </ListItemButton>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
