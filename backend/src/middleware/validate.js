const validateRental = (req, res, next) => {
  const { roomId, customerId, numberOfGuests } = req.body;
  if (!roomId || !customerId || !numberOfGuests) {
    return res.status(400).json({
      status: 'error',
      message: 'Thiếu thông tin bắt buộc'
    });
  }
  next();
}; 