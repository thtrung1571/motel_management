import { Component } from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends Component {
  state = { 
    hasError: false,
    errorInfo: null 
  };

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error(error);
    this.setState({
      hasError: true,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{p: 3, textAlign: 'center'}}>
          <Typography variant="h5" color="error">
            Đã xảy ra lỗi
          </Typography>
          <Button 
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{mt: 2}}
          >
            Tải lại trang
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary; 