import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Tab,
  Tabs,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import api from "../../../api";
import { toast } from "react-toastify";

const ImportCustomer = ({ onImportComplete }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (['json', 'xlsx', 'xls'].includes(fileExtension)) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setError("Chỉ hỗ trợ file JSON hoặc Excel (.xlsx, .xls)");
      setFile(null);
      event.target.value = null;
    }
  };

  const downloadTemplate = (type) => {
    let template;
    let fileName;
    let fileType;

    if (type === 'json') {
      template = [
        {
          "CCCD": "092082005678",
          "Họ tên": "VÕ TẤN ĐẠI",
          "Ngày sinh": "12/09/1982",
          "Giới Tính": "Nam",
          "Địa chỉ": "360 Thạch Phú, Thường Thạch, Cái Răng, Cần Thơ"
        },
        {
          "CCCD": "080174015451",
          "Họ tên": "NGUYỄN THỊ PHƯỢNG",
          "Ngày sinh": "01/01/1974",
          "Giới Tính": "Nữ",
          "Địa chỉ": "73/3E, Tổ 15, KP2, An Bình, Biên Hòa, Đồng Nai"
        }
      ];
      fileName = 'mau_import_khach_hang.json';
      fileType = 'application/json';
      
      const blob = new Blob(
        [JSON.stringify(template, null, 2)],
        { type: fileType }
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else if (type === 'excel') {
      // Tạo file Excel mẫu
      try {
        // Cần import XLSX
        const XLSX = require('xlsx');
        
        // Tạo workbook mới
        const wb = XLSX.utils.book_new();
        
        // Tạo dữ liệu mẫu
        const data = [
          ['STT', 'Họ Tên', 'Ngày Sinh', 'CCCD', 'Địa chỉ', 'Giới Tính'],
          [1, 'VÕ TẤN ĐẠI', '12/09/1982', '092082005678', '360 Thạch Phú, Thường Thạch, Cái Răng, Cần Thơ', 'Nam'],
          [2, 'NGUYỄN THỊ PHƯỢNG', '01/01/1974', '080174015451', '73/3E, Tổ 15, KP2, An Bình, Biên Hòa, Đồng Nai', 'Nữ']
        ];
        
        // Tạo worksheet
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(wb, ws, "Khách hàng");
        
        // Tạo file Excel
        XLSX.writeFile(wb, "mau_import_khach_hang.xlsx");
      } catch (error) {
        console.error("Lỗi khi tạo file Excel:", error);
        toast.error("Không thể tạo file Excel mẫu. Vui lòng thử lại sau.");
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/api/customers/import", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === 'success') {
        setResult(response.data.data);
        toast.success(response.data.message);
        if (onImportComplete) onImportComplete();
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error.response?.data?.message || "Lỗi khi import dữ liệu";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setResult(null);
    setError(null);
    setActiveTab(0);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<UploadIcon />}
        onClick={() => setOpen(true)}
      >
        Import khách hàng
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            Import danh sách khách hàng
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Import" />
            <Tab label="Hướng dẫn" />
          </Tabs>

          {activeTab === 0 ? (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Chọn file để import
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadTemplate('json')}
                  >
                    Tải file mẫu JSON
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadTemplate('excel')}
                  >
                    Tải file mẫu Excel
                  </Button>
                </Stack>

                <input
                  type="file"
                  accept=".json,.xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: 'block' }}
                />

                {file && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    File đã chọn: {file.name}
                  </Alert>
                )}
              </Paper>

              {loading && <LinearProgress sx={{ mb: 2 }} />}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {result && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Kết quả import
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Tổng số bản ghi"
                        secondary={
                          <Chip 
                            label={result.total} 
                            size="small"
                            color="default"
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Import thành công"
                        secondary={
                          <Chip 
                            label={result.created} 
                            size="small"
                            color="success"
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Cập nhật"
                        secondary={
                          <Chip 
                            label={result.updated} 
                            size="small"
                            color="primary"
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Bỏ qua/Lỗi"
                        secondary={
                          <Chip 
                            label={result.skipped} 
                            size="small"
                            color="warning"
                          />
                        }
                      />
                    </ListItem>
                  </List>

                  {result.errors?.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="error" gutterBottom>
                        Lỗi chi tiết
                      </Typography>
                      <List dense>
                        {result.errors.map((error, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={error.carNumber || 'Không có biển số'}
                              secondary={error.error}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Paper>
              )}
            </Box>
          ) : (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Hướng dẫn import
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                File import cần có các trường sau (chú ý đúng tên trường):
              </Alert>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="CCCD"
                    secondary="Số CCCD/CMND của khách hàng (bắt buộc)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Họ tên"
                    secondary="Họ và tên đầy đủ của khách hàng (bắt buộc)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Ngày sinh"
                    secondary="Định dạng: DD/MM/YYYY (không bắt buộc)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Giới Tính"
                    secondary="Nam/Nữ/Khác (không bắt buộc)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Địa chỉ"
                    secondary="Địa chỉ thường trú (không bắt buộc)"
                  />
                </ListItem>
              </List>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Lưu ý: Tên các trường phải chính xác như trên (có dấu, có khoảng trắng)
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            {result ? 'Đóng' : 'Hủy'}
          </Button>
          {activeTab === 0 && !result && (
            <Button
              onClick={handleImport}
              variant="contained"
              disabled={!file || loading}
            >
              {loading ? 'Đang xử lý...' : 'Import'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImportCustomer;

