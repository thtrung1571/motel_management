import React from "react";
import { Menu } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";

const Settings = () => {
  const location = useLocation();
  const selectedKey = location.pathname.split("/").pop();

  const menuItems = [
    {
      key: "room-types",
      label: <Link to="room-types">Loại phòng</Link>,
    },
    {
      key: "rooms",
      label: <Link to="rooms">Quản lý phòng</Link>,
    },
    {
      key: "price-logic",
      label: <Link to="price-logic">Cài đặt tính giá</Link>,
    },
    {
      key: "prices",
      label: <Link to="prices">Bảng giá</Link>,
    },
    {
      key: "drinks",
      label: <Link to="drinks">Đồ uống</Link>,
    },
    {
      key: "users",
      label: <Link to="users">Người dùng</Link>,
    },
    {
      key: "profile",
      label: <Link to="profile">Hồ sơ</Link>,
    },
  ];

  return (
    <div style={{ display: "flex" }}>
      <Menu
        mode="inline"
        style={{ width: 256 }}
        selectedKeys={[selectedKey]}
        items={menuItems}
      />
      <div style={{ flex: 1, padding: "0 24px" }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Settings;
