export const RentalStatus = {
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const RentalStatusText = {
  [RentalStatus.ACTIVE]: "Đang thuê",
  [RentalStatus.COMPLETED]: "Đã trả phòng",
  [RentalStatus.CANCELLED]: "Đã hủy",
};
