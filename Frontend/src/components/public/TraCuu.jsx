import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  TextField,
  IconButton,
  InputAdornment,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Stack,
  Chip,
  CircularProgress,
  Alert
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { publicService } from "../../services/publicService";

const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const TraCuu = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);

  const showSuggestions = useMemo(() => debouncedQuery.trim().length >= 2, [debouncedQuery]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!showSuggestions) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const res = await publicService.lookup(debouncedQuery.trim());
        setSuggestions(Array.isArray(res?.suggestions) ? res.suggestions : []);
      } catch (e) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [debouncedQuery, showSuggestions]);

  const openDetails = async (item) => {
    try {
      const res = await publicService.details(item.id);
      setSelected(res?.customer || null);
      setDialogOpen(true);
    } catch (e) {
      // noop
    }
  };

  const onSubmit = async (e) => {
    e?.preventDefault();
    if (suggestions.length > 0) {
      await openDetails(suggestions[0]);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: (t) => t.palette.mode === 'dark' ? 'background.default' : undefined,
      backgroundImage: (t) => t.palette.mode === 'dark' ? 'none' : 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
    }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>Tra cứu</Typography>
          <Typography variant="body2" color="text.secondary">Tìm khách theo biển số, họ tên, hoặc CCCD</Typography>
        </Box>

        <Box component="form" onSubmit={onSubmit}>
          <TextField
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập biển số, họ tên, hoặc CCCD"
            autoFocus
            InputProps={{
              sx: {
                height: 60,
                bgcolor: 'background.paper',
                boxShadow: 2,
                borderRadius: 10,
                pr: 1,
                transition: 'box-shadow 0.2s ease',
                '&:hover': { boxShadow: 3 },
                '& .MuiInputBase-input': {
                  fontSize: '1.25rem',
                  fontWeight: 700
                }
              },
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {loading && <CircularProgress size={18} sx={{ mr: 1 }} />}
                  {query && (
                    <IconButton aria-label="clear" onClick={() => setQuery("")}> 
                      <CloseIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              )
            }}
          />
        </Box>

        {showSuggestions && (
          <Paper sx={{ mt: 2, borderRadius: 3, overflow: 'hidden' }} elevation={3}>
            {suggestions.length === 0 && !loading ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">Không có thông tin khách hàng</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {suggestions.map((s, idx) => (
                  <ListItemButton key={s.id} onClick={() => openDetails(s)} divider={idx !== suggestions.length - 1}>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{s.carNumber}</Typography>
                          {typeof s.visitCount === 'number' && <Chip size="small" label={`${s.visitCount} lần`} />}
                          {!s.cccd && <Chip size="small" color="error" variant="outlined" label="Thiếu CCCD" />}
                        </Stack>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {s.fullName || 'Khách'}{s.cccd ? ` • CCCD: ${s.cccd}` : ''}{s.lastVisit ? ` • Lần cuối: ${s.lastVisit}` : ''}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        )}

        <Dialog fullWidth maxWidth="sm" open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>
            Thông tin khách hàng
          </DialogTitle>
          <DialogContent dividers>
            {selected && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{selected.carNumber}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(selected.fullName || 'Khách')} {selected.cccd ? `• CCCD: ${selected.cccd}` : ''}
                  </Typography>
                </Box>
                {!selected.cccd && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    Thiếu CCCD — Vui lòng cập nhật để quản lý chính xác hơn.
                  </Alert>
                )}
                <Box>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    {typeof selected.visitCount === 'number' && <Chip label={`Số lần thuê: ${selected.visitCount}`} />}
                    {selected.lastVisit && <Chip label={`Lần cuối: ${selected.lastVisit}`} />}
                    {selected.placeLiving && <Chip label={`Địa chỉ: ${selected.placeLiving}`} />}
                  </Stack>
                </Box>
                {selected.note && (
                  <Box>
                    <Typography variant="subtitle2">Ghi chú</Typography>
                    <Typography variant="body2" color="text.secondary">{selected.note}</Typography>
                  </Box>
                )}
                <Divider />
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Lịch sử gần đây</Typography>
                  {Array.isArray(selected.rentalHistory) && selected.rentalHistory.length > 0 ? (
                    <List dense>
                      {selected.rentalHistory.map((h) => (
                        <ListItemText key={h.id}
                          primary={`${h.date || ''} • Phòng ${h.roomNumber || '-'} • ${h.rentType || ''}`}
                          secondary={`Tổng: ${h.totalAmount ?? '-'}${h.note ? ` • ${h.note}` : ''}`}
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Không có dữ liệu</Typography>
                  )}
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default TraCuu;
