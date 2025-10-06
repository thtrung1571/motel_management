import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Form,
  InputNumber,
  TimePicker,
  Button,
  Space,
  Divider,
  message,
  Typography,
  Table,
} from "antd";
import dayjs from "dayjs";
import {
  fetchPriceSettings,
  updatePriceSettings,
  fetchRoomTypes,
} from "../../../store/slices/settingsSlice";
import api from "../../../api";

const { Text } = Typography;

const LogicPriceSetting = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { priceLogic, loading, roomTypes } = useSelector(
    (state) => state.settings,
  );

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchPriceSettings());
    dispatch(fetchRoomTypes());
  }, [dispatch]);

  // Set form values khi priceLogic thay đổi
  useEffect(() => {
    if (priceLogic && roomTypes.length > 0) {
      let roomPrices = {};
      
      try {
        // Parse roomPrices từ backend
        const existingPrices = priceLogic.roomPrices ? JSON.parse(priceLogic.roomPrices) : {};
        
        // Tạo object mới với key là roomType.id
        roomTypes.forEach(type => {
          roomPrices[type.id] = existingPrices[type.id] || {
            halfDayPrice: 0,
            fullDayPrice: 0
          };
        });
      } catch (error) {
        console.error('Error parsing roomPrices:', error);
        // Fallback to default prices if parsing fails
        roomTypes.forEach(type => {
          roomPrices[type.id] = {
            halfDayPrice: 0,
            fullDayPrice: 0
          };
        });
      }

      form.setFieldsValue({
        hourlyThreshold: priceLogic.hourlyThreshold,
        baseHourPrice: parseFloat(priceLogic.baseHourPrice),
        additionalHourPrice: parseFloat(priceLogic.additionalHourPrice),
        halfDayStart: dayjs(priceLogic.halfDayStart, "HH:mm"),
        halfDayEnd: dayjs(priceLogic.halfDayEnd, "HH:mm"),
        minHalfDayHours: priceLogic.minHalfDayHours,
        maxHalfDayHours: priceLogic.maxHalfDayHours,
        minFullDayHours: priceLogic.minFullDayHours,
        maxFullDayHours: priceLogic.maxFullDayHours,
        roomPrices: roomPrices
      });
    }
  }, [priceLogic, roomTypes, form]);

  const onFinish = async (values) => {
    try {
      // Chuyển đổi roomPrices thành object với key là roomType.id
      const roomPrices = {};
      Object.entries(values.roomPrices).forEach(([id, prices]) => {
        if (prices) {
          roomPrices[id] = {
            halfDayPrice: prices.halfDayPrice || 0,
            fullDayPrice: prices.fullDayPrice || 0
          };
        }
      });

      const formattedValues = {
        ...values,
        halfDayStart: values.halfDayStart.format("HH:mm"),
        halfDayEnd: values.halfDayEnd.format("HH:mm"),
        baseHourPrice: values.baseHourPrice.toString(),
        additionalHourPrice: values.additionalHourPrice.toString(),
        roomPrices: JSON.stringify(roomPrices)
      };

      const response = await api.put("/api/settings/price-logic", formattedValues);

      if (response.data.status === "success") {
        message.success("Cập nhật cài đặt thành công");
        dispatch(fetchPriceSettings());
      }
    } catch (error) {
      message.error("Lỗi khi cập nhật cài đặt");
      console.error("Error:", error);
    }
  };

  // Hàm format và parse số tiền
  const formatCurrency = (value) => {
    if (!value) return "";
    return `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} VNĐ`;
  };

  const parseCurrency = (value) => {
    if (!value) return "";
    return value.replace(/\s?VNĐ/g, "").replace(/\./g, "");
  };

  const columns = [
    {
      title: "Loại phòng",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Giá nửa ngày",
      dataIndex: "halfDayPrice",
      key: "halfDayPrice",
      render: (_, record) => (
        <Form.Item name={["roomPrices", record.id, "halfDayPrice"]} noStyle>
          <InputNumber
            min={0}
            step={10000}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            style={{ width: 150 }}
          />
        </Form.Item>
      ),
    },
    {
      title: "Giá nguyên ngày",
      dataIndex: "fullDayPrice",
      key: "fullDayPrice",
      render: (_, record) => (
        <Form.Item name={["roomPrices", record.id, "fullDayPrice"]} noStyle>
          <InputNumber
            min={0}
            step={10000}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            style={{ width: 150 }}
          />
        </Form.Item>
      ),
    },
  ];

  return (
    <Card title="Cài đặt logic tính giá">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Divider>Cài đặt tính giờ</Divider>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Form.Item
            label="Số giờ tối đa tính theo giờ"
            name="hourlyThreshold"
            rules={[{ required: true, message: "Vui lòng nhập số giờ" }]}
            tooltip="Nếu thuê vượt quá số giờ này sẽ tính theo nửa ngày"
          >
            <InputNumber min={1} max={24} />
          </Form.Item>

          <Space>
            <Form.Item
              label="Giá giờ đầu tiên"
              name="baseHourPrice"
              rules={[{ required: true, message: "Vui lòng nhập giá giờ đầu" }]}
            >
              <InputNumber
                min={0}
                step={10000}
                formatter={formatCurrency}
                parser={parseCurrency}
                style={{ width: 150 }}
              />
            </Form.Item>

            <Form.Item
              label="Giá mỗi giờ tiếp theo"
              name="additionalHourPrice"
              rules={[{ required: true, message: "Vui lòng nhập giá giờ tiếp theo" }]}
            >
              <InputNumber
                min={0}
                step={10000}
                formatter={formatCurrency}
                parser={parseCurrency}
                style={{ width: 150 }}
              />
            </Form.Item>
          </Space>
        </Space>

        <Divider>Cài đặt thời gian nửa ngày</Divider>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space>
            <Form.Item
              label="Thời gian bắt đầu nửa ngày"
              name="halfDayStart"
              rules={[{ required: true, message: "Vui lòng chọn giờ" }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>

            <Form.Item
              label="Thời gian kết thúc nửa ngày"
              name="halfDayEnd"
              rules={[{ required: true, message: "Vui lòng chọn giờ" }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
          </Space>

          <Space>
            <Form.Item
              label="Số giờ tối thiểu tính nửa ngày"
              name="minHalfDayHours"
              rules={[{ required: true, message: "Vui lòng nhập số giờ" }]}
              tooltip="Thời gian tối thiểu để áp dụng giá nửa ngày"
            >
              <InputNumber min={11} max={14} />
            </Form.Item>

            <Form.Item
              label="Số giờ tối đa tính nửa ngày"
              name="maxHalfDayHours"
              rules={[{ required: true, message: "Vui lòng nhập số giờ" }]}
              tooltip="Nếu vượt quá sẽ tính thành nguyên ngày"
            >
              <InputNumber min={11} max={14} />
            </Form.Item>
          </Space>
        </Space>

        <Divider>Cài đặt thời gian nguyên ngày</Divider>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space>
            <Form.Item
              label="Số giờ tối thiểu tính nguyên ngày"
              name="minFullDayHours"
              rules={[{ required: true, message: "Vui lòng nhập số giờ" }]}
              tooltip="Thời gian tối thiểu để áp dụng giá nguyên ngày"
            >
              <InputNumber min={15} max={24} />
            </Form.Item>

            <Form.Item
              label="Số giờ tối đa tính nguyên ngày"
              name="maxFullDayHours"
              rules={[{ required: true, message: "Vui lòng nhập số giờ" }]}
              tooltip="Nếu vượt quá sẽ tính thêm phụ phí"
            >
              <InputNumber min={15} max={24} />
            </Form.Item>
          </Space>
        </Space>

        <Divider>Cài đặt giá theo loại phòng</Divider>
        <Table
          columns={columns}
          dataSource={roomTypes}
          rowKey="id"
          pagination={false}
          bordered
        />

        <Form.Item style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu cài đặt
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default LogicPriceSetting;
