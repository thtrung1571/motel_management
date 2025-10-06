const formatLicensePlate = (rawNumber, isCarPlate = false) => {
  // Loại bỏ tất cả ký tự đặc biệt và khoảng trắng, chuyển thành chữ hoa
  let cleaned = rawNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  if (isCarPlate) {
    // Format xe ô tô: 60A-789.88
    if (cleaned.length === 7) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    }
  } else {
    // Format xe máy
    if (cleaned.length === 7) {
      // Format: 60A1-234.5
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}.${cleaned.slice(6)}`;
    } else if (cleaned.length === 8) {
      if (cleaned[3].match(/[A-Z]/)) {
        // Format: 60AB-123.4
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}.${cleaned.slice(7)}`;
      } else {
        // Format: 60A1-234.56
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}.${cleaned.slice(7)}`;
      }
    } else if (cleaned.length === 9) {
      // Format: 60AB-123.45
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}.${cleaned.slice(7)}`;
    }
  }
  
  return cleaned; // Trả về số đã được clean nếu không match format nào
};

module.exports = formatLicensePlate; 