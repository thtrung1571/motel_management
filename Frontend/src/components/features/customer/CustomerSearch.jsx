import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Paper, InputAdornment, IconButton, CircularProgress } from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";
import Input from "../../common/Input/Input";
import { debounce } from "lodash";

const CustomerSearch = ({ onSearch, value, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (value !== searchTerm) {
      setSearchTerm(value || "");
    }
  }, [value]);

  useEffect(() => {
    if (isLoading) {
      const cursorPosition = inputRef.current?.selectionStart;
      setTimeout(() => {
        inputRef.current?.focus();
        if (cursorPosition !== undefined) {
          inputRef.current?.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    }
  }, [isLoading]);

  const debouncedSearch = useCallback(
    debounce((term) => {
      onSearch(term);
    }, 500),
    [onSearch]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setSearchTerm(value);
    debouncedSearch(value);
    setTimeout(() => {
      inputRef.current?.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
    inputRef.current?.focus();
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box display="flex" gap={2}>
        <Box flexGrow={1}>
          <Input
            inputRef={inputRef}
            label="Tìm kiếm khách hàng"
            value={searchTerm}
            onChange={handleChange}
            placeholder="Tìm theo biển số, tên, CCCD..."
            fullWidth
            autoComplete="off"
            autoFocus
            sx={{
              '& .MuiInputBase-root': {
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                },
              },
            }}
            onFocus={(e) => {
              const length = e.target.value.length;
              e.target.setSelectionRange(length, length);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color={searchTerm ? "primary" : "action"} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {isLoading ? (
                    <CircularProgress size={20} />
                  ) : searchTerm && (
                    <IconButton
                      onClick={handleClear}
                      size="small"
                      aria-label="clear search"
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default CustomerSearch;
