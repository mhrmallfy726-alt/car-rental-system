import api from '../API/axios.js';


  // Services تتطابق مع مسارات backend/routes/employeeRoutes.js:
  // - GET /api/employees?supplier_id=...
  // - GET /api/employees/:id
  // - POST /api/employees
  // - PUT /api/employees/:id
  // - DELETE /api/employees/:id
  // - GET /api/employees/:id/permissions
  // - PUT /api/employees/:id/permissions
  // - GET /api/employees/permissions/list


export const listEmployees = (supplier_email) => {
  return api.get('/employees', { params: { supplier_email } }).then(r => r.data);
};

export const getEmployee = (id) => api.get(`/employees/${id}`).then(r => r.data);

export const createEmployee = (payload) => api.post('/', payload).then(r => r.data);

export const updateEmployee = (id, payload) => api.put(`/employees/${id}`, payload).then(r => r.data);

export const deleteEmployee = (id) => api.delete(`/employees/${id}`).then(r => r.data);

export const getEmployeePermissions = (id) => api.get(`/employees/${id}/permissions`).then(r => r.data);

export const updateEmployeePermissions = (id, permission_ids) => api.put(`/employees/${id}/permissions`, { permission_ids }).then(r => r.data);

export const listPermissions = () => api.get('/employees/permissions/list').then(r => r.data);






// import api from '../API/axios.js';


//   // Services تتطابق مع مسارات backend/routes/employeeRoutes.js:
//   // - GET /api/employees?supplier_id=...
//   // - GET /api/employees/:id
//   // - POST /api/employees
//   // - PUT /api/employees/:id
//   // - DELETE /api/employees/:id
//   // - GET /api/employees/:id/permissions
//   // - PUT /api/employees/:id/permissions
//   // - GET /api/employees/permissions/list


// export const listEmployees = (supplier_email) => {
//   return api.get('/employees', { params: { supplier_email } }).then(r => r.data);
// };

// export const getEmployee = (id) => api.get(`/supplier/EmployeeList${id}`).then(r => r.data);

// export const createEmployee = (payload) => api.post('/supplier/EmployeeForm', payload).then(r => r.data);

// export const updateEmployee = (id, payload) => api.put(`/supplier/EmployeeList${id}`, payload).then(r => r.data);

// export const deleteEmployee = (id) => api.delete(`/supplier/EmployeeList${id}`).then(r => r.data);

// export const getEmployeePermissions = (id) => api.get(`/supplier/EmployeeDetail${id}/permissions`).then(r => r.data);

// export const updateEmployeePermissions = (id, permission_ids) => api.put(`/supplier/EmployeeForm${id}/permissions`, { permission_ids }).then(r => r.data);

// export const listPermissions = () => api.get('/employees/permissions/list').then(r => r.data);




