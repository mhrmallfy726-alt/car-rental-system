
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Cars from './pages/Cars';
import CarDetail from './pages/CarDetail';
import Profile from './pages/Profile';
import UserSettings from './pages/UserSettings';
import ComplaintChat from './pages/ComplaintChat';
import VendorJoin from './pages/VendorJoin';
import MarketingChoice from './pages/marketing/MarketingChoice';
import MarketingRole from './pages/marketing/MarketingRole';
// Customer
import MyReservations from './pages/customer/MyReservations';
import Checkout from './pages/customer/Checkout';

// Supplier
import SupplierDashboard from './pages/supplier/Dashboard';
import MyCars from './pages/supplier/MyCars';
import AddCar from './pages/supplier/AddCar';
import SupplierReservations from './pages/supplier/Reservations';
import SupplierSettings from './pages/supplier/Settings';
import EditCar from './pages/supplier/EditCar';
import SupplierReservationDetail from './pages/supplier/Reservations';
//import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
// import EmployeesList from './pages/supplier/EmployeeList';
import EmployeeList from './pages/supplier/EmployeesList';
import EmployeeForm from './pages/supplier/EmployeeForm';
import EmployeeDetail from './pages/supplier/EmployeeDetail';
import AdvertisementRequest from './pages/supplier/AdvertisementRequest';

// import Login from './pages/SUPPLIER/Login';
//import { AuthProvider, useAuth } from './store/auth';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminComplaints from './pages/admin/Complaints';
import AdminCars from './pages/admin/AdminCars';
import AdminSettings from './pages/admin/AdminSettings';
import Adminadvertisements from './pages/admin/advertisements';
import Adminadvertisement from './pages/admin/advertisementCenter';

import SupplierRequests from "./pages/admin/SupplierRequests";
import EmployeeDashboard from './pages/employee/DashboardEMP';

// Guards
const PrivateRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
          },
          duration: 4000,
        }}
      />
      
      <Navbar />
      
      <Routes>

        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/MarketingChoice" element={<MarketingChoice />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Vendor-Join" element={<VendorJoin />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/cars/:id" element={<CarDetail />} />
        <Route path="/supplier-benefits" element={<MarketingRole role="supplier" />} />
        <Route path="/renter-benefits" element={<MarketingRole role="renter" />} />
        {/* Profile & Chat (Any authenticated user) */}
        <Route path="/profile" element={
          <PrivateRoute><Profile /></PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute><UserSettings /></PrivateRoute>
        } />
        <Route path="/complaints/:id" element={
          <PrivateRoute><ComplaintChat /></PrivateRoute>
        } />
  {/* Employee */}
       <Route path="/employee/dashboard" element={
          <PrivateRoute roles={['employee']}><EmployeeDashboard /></PrivateRoute>
        } />

        {/* Customer */}
        <Route path="/my-reservations" element={
          <PrivateRoute roles={['customer']}><MyReservations /></PrivateRoute>
        } />
        <Route path="/checkout/:reservationId" element={
          <PrivateRoute roles={['customer']}><Checkout /></PrivateRoute>
        } />

        {/* Supplier */}
        <Route path="/supplier/dashboard" element={
          <PrivateRoute roles={['supplier']}><SupplierDashboard /></PrivateRoute>
        } />
        <Route path="/supplier/cars" element={
          <PrivateRoute roles={['supplier']}><MyCars /></PrivateRoute>
        } />
        <Route path="/supplier/cars/add" element={
          <PrivateRoute roles={['supplier']}><AddCar /></PrivateRoute>
        } />
        <Route path="/supplier/cars/edit/:id" element={
          <PrivateRoute roles={['supplier']}><EditCar /></PrivateRoute>
        } />
        <Route path="/supplier/reservations" element={
          <PrivateRoute roles={['supplier']}><SupplierReservations /></PrivateRoute>
        } />
        <Route path="/supplier/reservations/:id" element={
          <PrivateRoute roles={['supplier']}><SupplierReservationDetail /></PrivateRoute>
        } />
       
        <Route path="/supplier/settings" element={
          <PrivateRoute roles={['supplier']}><SupplierSettings /></PrivateRoute>
        } />       
        <Route path="/supplier/login" element={<Login />} />
         
        {/* Admin */}
        <Route path="/admin/dashboard" element={
          <PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>
        } />
        <Route path="/admin/users" element={
          <PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>
        } />
        <Route path="/admin/complaints" element={
          <PrivateRoute roles={['admin']}><AdminComplaints /></PrivateRoute>
        } />
        <Route path="/admin/advertisements" element={
          <PrivateRoute roles={['admin']}><Adminadvertisements /></PrivateRoute>
        } />
         <Route path="/admin/advertisementCenter" element={
          <PrivateRoute roles={['admin']}><Adminadvertisement /></PrivateRoute>
        } />
        <Route path="/admin/cars" element={
          <PrivateRoute roles={['admin']}><AdminCars /></PrivateRoute>
        } />
        <Route path="/admin/settings" element={
          <PrivateRoute roles={['admin']}><AdminSettings /></PrivateRoute>
        } />
        <Route path="/admin/supplier-requests" element={
            <PrivateRoute roles={['admin']}><SupplierRequests /> </PrivateRoute>
        }/>
         <Route path="/pages/supplier/employees/:id" element={<PrivateRoute roles={['supplier']}><EmployeeDetail /></PrivateRoute>} />
  <Route path="/supplier/EmployeeForm" element={
          <PrivateRoute roles={['supplier']}><EmployeeForm /></PrivateRoute>
        } />
         <Route path="/supplier/AdvertisementRequest" element={
          <PrivateRoute roles={['supplier']}><AdvertisementRequest /></PrivateRoute>
        } />
          <Route path="/supplier/EmployeeList" element={
          <PrivateRoute roles={['supplier']}><EmployeeList /></PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace  />} />
      </Routes>
    </>
  
  );
  



}