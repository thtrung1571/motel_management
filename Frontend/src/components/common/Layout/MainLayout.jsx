import { useState } from "react";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = 240;

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        width={sidebarWidth}
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${sidebarOpen ? sidebarWidth : 0}px)` },
          ml: { sm: `${sidebarOpen ? sidebarWidth : 0}px` },
          transition: "margin-left 0.3s ease-in-out, width 0.3s ease-in-out",
          backgroundColor: "background.default",
          minHeight: "100vh",
          p: 1
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
