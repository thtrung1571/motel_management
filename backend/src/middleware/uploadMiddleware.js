const multer = require('multer');
const AppError = require('../utils/appError');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Debug log
    console.log('File mimetype:', file.mimetype);
    console.log('File originalname:', file.originalname);

    // Danh sách MIME types được chấp nhận
    const allowedMimes = [
      'application/json',                                                // .json
      'text/json',                                                      // Một số trình duyệt có thể trả về mime type này
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // .xlsx
      'application/vnd.ms-excel',                                           // .xls
      'application/x-excel',                                                // Một số trình duyệt có thể trả về mime type này
      'application/excel'                                                   // Một số trình duyệt có thể trả về mime type này
    ];

    // Kiểm tra file extension
    const isJson = file.originalname.toLowerCase().endsWith('.json');
    const isExcel = file.originalname.toLowerCase().match(/\.(xlsx|xls)$/);

    if (isJson && file.mimetype.includes('json')) {
      cb(null, true);
    } else if (isExcel && allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Log để debug
      console.log('Rejected file type:', file.mimetype);
      cb(new AppError('Chỉ chấp nhận file JSON hoặc Excel (.xlsx, .xls)', 400), false);
    }
  }
});

module.exports = upload;