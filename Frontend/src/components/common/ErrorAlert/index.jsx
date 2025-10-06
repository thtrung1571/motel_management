import { Alert, Box } from "@mui/material";
import PropTypes from "prop-types";

const ErrorAlert = ({ message }) => {
  return (
    <Box mt={2} mb={2}>
      <Alert severity="error">
        {message || "Có lỗi xảy ra. Vui lòng thử lại."}
      </Alert>
    </Box>
  );
};

ErrorAlert.propTypes = {
  message: PropTypes.string,
};

export default ErrorAlert;
