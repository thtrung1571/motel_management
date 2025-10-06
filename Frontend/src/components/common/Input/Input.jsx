import { TextField } from "@mui/material";
import PropTypes from "prop-types";

const Input = ({ label, error, helperText, inputRef, ...props }) => {
  return (
    <TextField
      fullWidth
      label={label}
      error={!!error}
      helperText={error || helperText}
      variant="outlined"
      inputRef={inputRef}
      InputProps={{
        ...props.InputProps,
        autoComplete: 'off',
        spellCheck: false,
      }}
      {...props}
    />
  );
};

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};

export default Input;
