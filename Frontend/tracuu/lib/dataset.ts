export type CustomerRecord = {
  plateNumber: string;
  fullName: string;
  cccd: string;
  vehicle: string;
  phone: string;
  lastVisit: string;
};

export const mockRecords: CustomerRecord[] = [
  {
    plateNumber: "51A-12345",
    fullName: "Nguyễn Văn A",
    cccd: "012345678901",
    vehicle: "Toyota Vios",
    phone: "0901 234 567",
    lastVisit: "2024-02-12"
  },
  {
    plateNumber: "43B-67890",
    fullName: "Trần Thị B",
    cccd: "098765432109",
    vehicle: "Honda SH",
    phone: "0934 567 890",
    lastVisit: "2024-03-02"
  },
  {
    plateNumber: "60C-43210",
    fullName: "Lê Quốc C",
    cccd: "023456789012",
    vehicle: "Ford Ranger",
    phone: "0978 456 321",
    lastVisit: "2024-01-25"
  },
  {
    plateNumber: "72D-98765",
    fullName: "Phạm Thị D",
    cccd: "034567890123",
    vehicle: "Hyundai Accent",
    phone: "0912 345 678",
    lastVisit: "2024-04-15"
  },
  {
    plateNumber: "30E-24680",
    fullName: "Đỗ Minh E",
    cccd: "045678901234",
    vehicle: "Kia Seltos",
    phone: "0909 876 543",
    lastVisit: "2024-03-28"
  }
];
