import { Button as MuiButton } from "@mui/material";
import PropTypes from "prop-types";

const Button = ({
  children,
  variant = "contained",
  color = "primary",
  ...props
}) => {
  return (
    <MuiButton variant={variant} color={color} {...props}>
      {children}
    </MuiButton>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["contained", "outlined", "text"]),
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "error",
    "warning",
    "info",
    "success",
  ]),
};

export default Button;
