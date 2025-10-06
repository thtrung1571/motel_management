import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../../store/slices/customerSlice";
import CustomerSearch from "./CustomerSearch";
import ImportCustomer from "./ImportCustomer";
import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";
import ErrorAlert from "../../common/ErrorAlert/ErrorAlert";
import AddEditCustomer from "./AddEditCustomer";
import ConfirmDialog from "../../common/ConfirmDialog";
import { formatDate } from "../../../utils/dateUtils";

const CustomerList = () => {
  const dispatch = useDispatch();
  const {
    customers = [],
    total = 0,
    loading: mainLoading,
    error,
  } = useSelector((state) => state.customers);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [openAddEdit, setOpenAddEdit] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  // Tách riêng hàm fetchData để tái sử dụng
  const fetchCustomerData = useCallback(async (params, isSearching = false) => {
    if (isSearching) {
      setSearchLoading(true);
    }
    
    try {
      const response = await dispatch(fetchCustomers(params)).unwrap();
      if (response.status === 'success') {
        // Không làm gì đặc biệt để tránh re-render không cần thiết
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      // Giảm delay khi set loading về false
      setTimeout(() => {
        if (isSearching) {
          setSearchLoading(false);
        }
      }, 100);
    }
  }, [dispatch]);

  // Xử lý search với debounce
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setPage(0);
    
    fetchCustomerData({ 
      page: 1, 
      limit: rowsPerPage,
      search: term
    }, true);
  }, [fetchCustomerData, rowsPerPage]);

  // Initial load
  useEffect(() => {
    fetchCustomerData({ 
      page: page + 1, 
      limit: rowsPerPage
    });
  }, []);

  // Xử lý phân trang
  const handleChangePage = (_, newPage) => {
    setPage(newPage);
    fetchCustomerData({ 
      page: newPage + 1, 
      limit: rowsPerPage,
      search: searchTerm 
    });
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchCustomerData({ 
      page: 1, 
      limit: newRowsPerPage,
      search: searchTerm 
    });
  };

  const handleAdd = () => {
    setSelectedCustomer(null);
    setOpenAddEdit(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setOpenAddEdit(true);
  };

  const handleDelete = (customer) => {
    setSelectedCustomer(customer);
    setOpenConfirmDelete(true);
  };

  const handleSubmitCustomer = async (data) => {
    try {
      let response;
      if (selectedCustomer) {
        response = await dispatch(updateCustomer({ 
          id: selectedCustomer.id, 
          data: {
            ...data,
            id: selectedCustomer.id
          }
        })).unwrap();
      } else {
        response = await dispatch(createCustomer(data)).unwrap();
      }
      
      if (response.status === 'success') {
        // Đóng form chỉ khi thành công
        setOpenAddEdit(false);
        setSelectedCustomer(null);
        
        // Refresh data sau khi thêm/cập nhật thành công
        await dispatch(fetchCustomers({ 
          page: page + 1, 
          limit: rowsPerPage,
          search: searchTerm 
        }));
      }
    } catch (error) {
      console.error("Error submitting customer:", error);
      // Có thể thêm thông báo lỗi ở đây
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteCustomer(selectedCustomer.id)).unwrap();
      setOpenConfirmDelete(false);
      // Refresh current page
      dispatch(fetchCustomers({ 
        page: page + 1, 
        limit: rowsPerPage,
        search: searchTerm 
      }));
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  if (mainLoading && !searchLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Danh sách khách hàng</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ mr: 2 }}
          >
            Thêm khách hàng
          </Button>
          <ImportCustomer 
            onImportComplete={() => {
              setPage(0);
              dispatch(fetchCustomers({ 
                page: 1, 
                limit: rowsPerPage 
              }));
            }} 
          />
        </Box>
      </Box>

      <CustomerSearch 
        onSearch={handleSearch}
        value={searchTerm}
        isLoading={searchLoading}
      />

      <TableContainer 
        component={Paper} 
        sx={{ 
          mt: 3,
          opacity: searchLoading ? 0.7 : 1,
          transition: 'opacity 0.2s ease-in-out',
          pointerEvents: searchLoading ? 'none' : 'auto'
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Biển số</TableCell>
              <TableCell>Họ và tên</TableCell>
              <TableCell>CCCD</TableCell>
              <TableCell>Giới tính</TableCell>
              <TableCell>Địa chỉ</TableCell>
              <TableCell align="right">Số lần ghé</TableCell>
              <TableCell align="right">Lần cuối</TableCell>
              <TableCell>Khách quen đi cùng</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.length > 0 ? (
              customers.map((customer) => (
                <TableRow 
                  key={`customer-${customer.id}`}
                  sx={{ 
                    opacity: searchLoading ? 0.5 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  <TableCell>
                    {customer.carNumber}
                  </TableCell>
                  <TableCell>{customer.fullName}</TableCell>
                  <TableCell>{customer.cccd}</TableCell>
                  <TableCell>{customer.gender}</TableCell>
                  <TableCell>
                    <Tooltip title={customer.placeLiving} arrow>
                      <Typography
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {customer.placeLiving}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">{customer.visitCount}</TableCell>
                  <TableCell align="right">
                    {customer.lastVisit
                      ? formatDate(customer.lastVisit)
                      : "Chưa có"}
                  </TableCell>
                  <TableCell>
                    {customer.relatedCustomers?.length > 0 ? (
                      <Tooltip 
                        title={
                          <Box>
                            {customer.relatedCustomers.map(rc => (
                              <Typography key={rc.id} variant="body2">
                                {rc.carNumber} - {rc.fullName} ({rc.frequency} lần)
                              </Typography>
                            ))}
                          </Box>
                        }
                        arrow
                      >
                        <Typography>
                          {customer.relatedCustomers.length} khách quen
                        </Typography>
                      </Tooltip>
                    ) : (
                      "Chưa có"
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Sửa">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(customer)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(customer)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {searchLoading ? "Đang tìm kiếm..." : "Không tìm thấy khách hàng nào"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} của ${count}`
          }
        />
      </TableContainer>

      <AddEditCustomer
        open={openAddEdit}
        onClose={() => setOpenAddEdit(false)}
        customer={selectedCustomer}
        onSubmit={handleSubmitCustomer}
      />

      <ConfirmDialog
        open={openConfirmDelete}
        onClose={() => setOpenConfirmDelete(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa"
        content="Bạn có chắc chắn muốn xóa khách hàng này?"
      />
    </Box>
  );
};

export default CustomerList;
