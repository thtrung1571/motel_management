import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { lazy, Suspense } from "react";
import LoadingSpinner from "../components/common/LoadingSpinner";

const LoginForm = lazy(() => import("../components/auth/Login"));
const Dashboard = lazy(() => import("../components/features/dashboard/Dashboard"));
const RoomList = lazy(() => import("../components/features/room/RoomList"));
const RoomDetails = lazy(() => import("../components/features/room/RoomDetails"));
const ActiveRentals = lazy(() => import("../components/features/rental/ActiveRentals"));
const RentalHistory = lazy(() => import("../components/features/rental/RentalHistory"));
const CustomerList = lazy(() => import("../components/features/customer/CustomerList"));
const Settings = lazy(() => import("../components/features/settings/Settings"));
const RoomSettings = lazy(() => import("../components/features/settings/RoomSettings"));
const RoomManagement = lazy(() => import("../components/features/settings/RoomManagement"));
const ProfileSettings = lazy(() => import("../components/features/settings/ProfileSettings"));
const UserSettings = lazy(() => import("../components/features/settings/UserSettings"));
const DrinkSettings = lazy(() => import("../components/features/settings/DrinkSettings"));
const PriceSettings = lazy(() => import("../components/features/settings/PriceSettings"));
const LogicPriceSetting = lazy(() => import("../components/features/settings/LogicPriceSetting"));
const MainLayout = lazy(() => import("../components/common/Layout/MainLayout"));
const RoomHistory = lazy(() => import("../components/features/room/RoomHistory"));
const AdminRoomHistory = lazy(() => import("../components/features/room/AdminRoomHistory"));

const PrivateRoute = ({ children }) => {
  const { token, user } = useSelector((state) => state.auth);
  
  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  );
};

const AdminRoute = ({ children }) => {
  const { token, user } = useSelector((state) => state.auth);
  
  if (!token || user?.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  );
};

const DefaultRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  return <Navigate to={user?.role === 'admin' ? '/dashboard' : '/rooms'} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <LoginForm />
          </Suspense>
        } 
      />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <DefaultRedirect />
          </PrivateRoute>
        }
      />

      <Route
        path="/rooms"
        element={
          <PrivateRoute>
            <MainLayout>
              <RoomList />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/rooms/:id"
        element={
          <PrivateRoute>
            <MainLayout>
              <RoomDetails />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/rentals/active"
        element={
          <PrivateRoute>
            <MainLayout>
              <ActiveRentals />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/rentals/history"
        element={
          <PrivateRoute>
            <MainLayout>
              <RentalHistory />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <PrivateRoute>
            <MainLayout>
              <CustomerList />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <MainLayout>
              <Settings />
            </MainLayout>
          </PrivateRoute>
        }
      >
        <Route path="room-types" element={<RoomSettings />} />
        <Route path="rooms" element={<RoomManagement />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="users" element={<UserSettings />} />
        <Route path="drinks" element={<DrinkSettings />} />
        <Route path="prices" element={<PriceSettings />} />
        <Route path="price-logic" element={<LogicPriceSetting />} />
        <Route index element={<Navigate to="room-types" replace />} />
      </Route>

      <Route
        path="/room-history"
        element={
          <PrivateRoute>
            <MainLayout>
              <RoomHistory />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/room-history"
        element={
          <AdminRoute>
            <MainLayout>
              <AdminRoomHistory />
            </MainLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route 
        path="*" 
        element={
          <PrivateRoute>
            <DefaultRedirect />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
