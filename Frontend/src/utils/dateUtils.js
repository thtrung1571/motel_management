/**
 * Format date string to Vietnamese format
 * @param {string|Date} date - Date string or Date object
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} Formatted date string
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    
    // Kiểm tra date có hợp lệ không
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    // Format options cơ bản
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };

    // Thêm options cho giờ nếu cần
    if (includeTime) {
      Object.assign(options, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    return new Intl.DateTimeFormat('vi-VN', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date range
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate, includeTime = false) => {
  const start = formatDate(startDate, includeTime);
  const end = formatDate(endDate, includeTime);
  
  if (!start || !end) return '';
  return `${start} - ${end}`;
};

/**
 * Get relative time string (e.g. "2 giờ trước", "3 ngày trước")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
    const now = new Date();
    const diff = dateObj.getTime() - now.getTime();
    
    const diffInMinutes = Math.floor(diff / (1000 * 60));
    const diffInHours = Math.floor(diff / (1000 * 60 * 60));
    const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(diffInMinutes, 'minute');
    } else if (Math.abs(diffInHours) < 24) {
      return rtf.format(diffInHours, 'hour');
    } else {
      return rtf.format(diffInDays, 'day');
    }
  } catch (error) {
    console.error('Error getting relative time:', error);
    return '';
  }
};

/**
 * Check if a date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = new Date(date);
    const today = new Date();
    
    return dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear();
  } catch (error) {
    return false;
  }
};
