import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import About from './pages/About';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import Register from './pages/auth/Register';
import Cars from './pages/Cars';
import CarDetail from './pages/CarDetail';
import Profile from './pages/Profile';
import UserSettings from './pages/UserSettings';
import ComplaintChat from './pages/ComplaintChat';
import NotificationDetail from './pages/NotificationDetail';
import VendorJoin from './pages/VendorJoin';
import MarketingChoice from './pages/marketing/MarketingChoice';
import MarketingRole from './pages/marketing/MarketingRole';
import MyReservations from './pages/customer/MyReservations';
import Checkout from './pages/customer/Checkout';
import SupplierDashboard from './pages/supplier/Dashboard';
import MyCars from './pages/supplier/MyCars';
import AddCar from './pages/supplier/AddCar';
import SupplierReservations from './pages/supplier/Reservations';
import SupplierSettings from './pages/supplier/Settings';
import EditCar from './pages/supplier/EditCar';
import SupplierReservationDetail from './pages/supplier/ReservationDetail';
import SupplierFinance from './pages/supplier/Finance';
import EmployeeList from './pages/supplier/EmployeesList';
import EmployeeForm from './pages/supplier/EmployeeForm';
import EmployeeDetail from './pages/supplier/EmployeeDetail';
import AdvertisementRequest from './pages/supplier/AdvertisementRequest';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminComplaints from './pages/admin/Complaints';
import AdminCars from './pages/admin/AdminCars';
import AdminSettings from './pages/admin/AdminSettings';
import Adminadvertisement from './pages/admin/AdvertisementCenter';
import FinanceCenter from './pages/admin/FinanceCenter';
import SupplierRequests from './pages/admin/SupplierRequests';
import EmployeeDashboard from './pages/employee/DashboardEMP';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';

const getDashboardPath = (user) => {
  if (!user) return '/';
  if (user.account_type === 'employee' || user.role === 'employee') return '/employee/dashboard';
  if (user.role === 'admin') return '/admin/dashboard';
  if (user.role === 'supplier') return '/supplier/dashboard';
  return '/my-reservations';
};

const LegacyCarRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/cars/${id}`} replace />;
};

const LegacyEmployeeRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/supplier/employees/${id}`} replace />;
};

const PrivateRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore();
  const location = useLocation();
  if (!token || !user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  const isEmployeeAccount = user.account_type === 'employee' || user.role === 'employee';
  const roleAllowed = !roles || roles.includes(user.role) || (roles.includes('employee') && isEmployeeAccount);
  if (!roleAllowed) return <Navigate to={getDashboardPath(user)} replace state={{ deniedFrom: location.pathname }} />;
  return children;
};

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a2e', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }, duration: 4000 }} />
      <Navbar />
      <div className="rc-app-shell">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/marketing" element={<MarketingChoice />} />
          <Route path="/MarketingChoice" element={<Navigate to="/marketing" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/supplier/join" element={<VendorJoin />} />
          <Route path="/Vendor-Join" element={<Navigate to="/supplier/join" replace />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/cars/:id" element={<CarDetail />} />
          <Route path="/car/:id" element={<LegacyCarRedirect />} />
          <Route path="/supplier-benefits" element={<MarketingRole role="supplier" />} />
          <Route path="/renter-benefits" element={<MarketingRole role="renter" />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><UserSettings /></PrivateRoute>} />
          <Route path="/complaints/:id" element={<PrivateRoute><ComplaintChat /></PrivateRoute>} />
          <Route path="/notifications/:id" element={<PrivateRoute><NotificationDetail /></PrivateRoute>} />
          <Route path="/employee/dashboard" element={<PrivateRoute roles={['employee']}><EmployeeDashboard /></PrivateRoute>} />
          <Route path="/my-reservations" element={<PrivateRoute roles={['customer']}><MyReservations /></PrivateRoute>} />
          <Route path="/checkout/:reservationId" element={<PrivateRoute roles={['customer']}><Checkout /></PrivateRoute>} />
          <Route path="/supplier/dashboard" element={<PrivateRoute roles={['supplier']}><SupplierDashboard /></PrivateRoute>} />
          <Route path="/supplier/cars" element={<PrivateRoute roles={['supplier']}><MyCars /></PrivateRoute>} />
          <Route path="/supplier/cars/add" element={<PrivateRoute roles={['supplier']}><AddCar /></PrivateRoute>} />
          <Route path="/supplier/cars/edit/:id" element={<PrivateRoute roles={['supplier']}><EditCar /></PrivateRoute>} />
          <Route path="/supplier/reservations" element={<PrivateRoute roles={['supplier']}><SupplierReservations /></PrivateRoute>} />
          <Route path="/supplier/reservations/:id" element={<PrivateRoute roles={['supplier']}><SupplierReservationDetail /></PrivateRoute>} />
          <Route path="/supplier/finance" element={<PrivateRoute roles={['supplier']}><SupplierFinance /></PrivateRoute>} />
          <Route path="/supplier/settings" element={<PrivateRoute roles={['supplier']}><SupplierSettings /></PrivateRoute>} />
          <Route path="/supplier/login" element={<Login />} />
          <Route path="/supplier/employees/:id" element={<PrivateRoute roles={['supplier']}><EmployeeDetail /></PrivateRoute>} />
          <Route path="/supplier/employees/new" element={<PrivateRoute roles={['supplier']}><EmployeeForm /></PrivateRoute>} />
          <Route path="/supplier/advertisement-request" element={<PrivateRoute roles={['supplier']}><AdvertisementRequest /></PrivateRoute>} />
          <Route path="/supplier/employees" element={<PrivateRoute roles={['supplier']}><EmployeeList /></PrivateRoute>} />
          <Route path="/pages/supplier/employees/:id" element={<LegacyEmployeeRedirect />} />
          <Route path="/supplier/EmployeeForm" element={<Navigate to="/supplier/employees/new" replace />} />
          <Route path="/supplier/AdvertisementRequest" element={<Navigate to="/supplier/advertisement-request" replace />} />
          <Route path="/supplier/EmployeeList" element={<Navigate to="/supplier/employees" replace />} />
          <Route path="/admin/dashboard" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
          <Route path="/admin/complaints" element={<PrivateRoute roles={['admin']}><AdminComplaints /></PrivateRoute>} />
          <Route path="/admin/advertisement-center" element={<PrivateRoute roles={['admin']}><Adminadvertisement /></PrivateRoute>} />
          <Route path="/admin/advertisements" element={<Navigate to="/admin/advertisement-center" replace />} />
          <Route path="/admin/advertisementCenter" element={<Navigate to="/admin/advertisement-center" replace />} />
          <Route path="/admin/cars" element={<PrivateRoute roles={['admin']}><AdminCars /></PrivateRoute>} />
          <Route path="/admin/finance" element={<PrivateRoute roles={['admin']}><FinanceCenter /></PrivateRoute>} />
          <Route path="/admin/settings" element={<PrivateRoute roles={['admin']}><AdminSettings /></PrivateRoute>} />
          <Route path="/admin/supplier-requests" element={<PrivateRoute roles={['admin']}><SupplierRequests /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
