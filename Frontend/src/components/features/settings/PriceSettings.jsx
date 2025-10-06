import React from "react";
import { Card, Table, Typography, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoomTypesWithPrices } from "../../../store/slices/settingsSlice";

const { Text } = Typography;

const PriceSettings = () => {
  const dispatch = useDispatch();
  const { roomTypesWithPrices, loading } = useSelector(
    (state) => state.settings,
  );

  React.useEffect(() => {
    dispatch(fetchRoomTypesWithPrices());
  }, [dispatch]);

  const columns = [
    {
      title: "Số phòng",
      dataIndex: "roomCount",
      key: "roomCount",
      width: 100,
    },
    {
      title: "Loại phòng",
      dataIndex: "name",
      key: "name",
      width: 120,
    },
    {
      title: "Giá theo giờ",
      children: [
        {
          title: "Giờ đầu",
          key: "baseHourPrice",
          width: 120,
          render: (_, record) => (
            <Tooltip title={`Áp dụng cho ${record.prices.hourly.threshold} giờ đầu`}>
              <span>
                {new Intl.NumberFormat("vi-VN").format(record.prices.hourly.base)} VNĐ
              </span>
            </Tooltip>
          ),
        },
        {
          title: "Giờ tiếp theo",
          key: "additionalHourPrice",
          width: 120,
          render: (_, record) => (
            <span>
              {new Intl.NumberFormat("vi-VN").format(record.prices.hourly.additional)} VNĐ
            </span>
          ),
        },
      ],
    },
    {
      title: "Giá nửa ngày",
      key: "halfDayPrice",
      width: 120,
      render: (_, record) => (
        <span>
          {new Intl.NumberFormat("vi-VN").format(record.prices.halfDay.price)} VNĐ
        </span>
      ),
    },
    {
      title: "Giá nguyên ngày",
      key: "fullDayPrice", 
      width: 120,
      render: (_, record) => (
        <span>
          {new Intl.NumberFormat("vi-VN").format(record.prices.fullDay.price)} VNĐ
        </span>
      ),
    },
  ];

  return (
    <Card title="Bảng giá theo loại phòng">
      <Table
        columns={columns}
        dataSource={roomTypesWithPrices}
        rowKey={(record) => record.id}
        loading={loading}
        bordered
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default PriceSettings;
