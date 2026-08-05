import { useEffect, useState } from "react";
import { Plus, Search, Eye, Edit, Shield, Trash2 } from "lucide-react";
import api from "../../services/api";

export default function EmployeesList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  // const [formData, setFormData] = useState(...)
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  // const [formData, setFormData] = useState(...)
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [employeeDetails, setEmployeeDetails] = useState(null);
  
  const [employeePermissions, setEmployeePermissions] = useState([]);
  const [permissions,setPermissions] = useState([]);
const [selectedPermissions,setSelectedPermissions] = useState([]);
  // const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    role: "employee",
    status: "",
  });

const [editForm, setEditForm] = useState({
  full_name: "",
  email: "",
  phone_number: "",
  role: "employee",
  status: "active",
});
  const loadEmployees = async () => {
    try {
      const supplier = JSON.parse(localStorage.getItem("car-rental-auth"));

      const supplierId = supplier?.state?.user?.id;

      const res = await api.get(`/employees?supplier_id=${supplierId}`);

      setEmployees(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
  
    try {
      const supplier = JSON.parse(
        localStorage.getItem("car-rental-auth")
      );
  
      const supplierId = supplier.state.user.id;
  
      await api.post("/employees", {
        ...form,
        supplier_id: supplierId,
      });
  
      setShowAddModal(false);
  
      setForm({
        full_name: "",
        email: "",
        phone_number: "",
        password: "",
        role: "employee",
      });
  
      loadEmployees();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "حدث خطأ"
      );
    }
  };
  const openEditModal = (employee) => {

    setSelectedEmployee(employee);
  
    setEditForm({
      full_name: employee.full_name,
      email: employee.email,
      phone_number: employee.phone_number,
      role: employee.role,
      status: employee.status,
    });
  
    setShowEditModal(true);
  };
  const handleUpdateEmployee = async (e) => {

    e.preventDefault();
  
    try {
  
      await api.put(
        `/employees/${selectedEmployee.id}`,
        editForm
      );
  
      setShowEditModal(false);
  
      loadEmployees();
  
    } catch (err) {
  
      alert(
        err.response?.data?.message ||
        "حدث خطأ"
      );
  
    }
  
  };
  const openPermissionModal = async (employee) => {

    try {
  
      setSelectedEmployee(employee);
  
      const all = await api.get("/employees/permissions/list");
  
      const mine = await api.get(
        `/employees/${employee.id}/permissions`
      );
  
      setPermissions(all.data.data);
  
      setSelectedPermissions(
        mine.data.data.map((p) => p.id)
      );
  
      setShowPermissionModal(true);
  
    } catch (err) {
      console.log(err);
    }
  
  };
  const togglePermission = (id) => {

    if (selectedPermissions.includes(id)) {
  
      setSelectedPermissions(
        selectedPermissions.filter((x) => x !== id)
      );
  
    } else {
  
      setSelectedPermissions([
        ...selectedPermissions,
        id,
      ]);
  
    }
  
  };
  const savePermissions = async () => {

    try {
  
      await api.put(
        `/employees/${selectedEmployee.id}/permissions`,
        {
          permission_ids: selectedPermissions,
        }
      );
  
      setShowPermissionModal(false);
  
      alert("تم حفظ الصلاحيات");
  
    } catch (err) {
  
      alert("حدث خطأ");
  
    }
  
  };
  const openDetails = async (employee) => {

    try {
  
      const details = await api.get(`/employees/${employee.id}`);
  
      const permissions = await api.get(
        `/employees/${employee.id}/permissions`
      );
  
      setEmployeeDetails(details.data.data);
  
      setEmployeePermissions(permissions.data.data);
  
      setShowDetailsModal(true);
  
    } catch (err) {
  
      console.log(err);
  
    }
  
  };
  return (
    <div className="container py-4">

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 25,
          alignItems: "center",
        }}
      >
        <h2>إدارة الموظفين</h2>

        <button
  className="btn btn-primary"
  onClick={() => setShowAddModal(true)}
>
          <Plus size={18} />
          إضافة موظف
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          padding: 15,
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Search size={18} />

          <input
            placeholder="بحث..."
            className="form-control"
          />
        </div>
      </div>

      <div className="card">

        <table className="table">

          <thead>

            <tr>

              <th>الاسم</th>

              <th>البريد</th>

              <th>الهاتف</th>

              <th>الدور</th>

              <th>الحالة</th>

              <th>الإجراءات</th>

            </tr>

          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan={6}>جار التحميل...</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6}>لا يوجد موظفون</td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id}>

                  <td>{emp.full_name}</td>

                  <td>{emp.email}</td>

                  <td>{emp.phone_number}</td>

                  <td>{emp.role}</td>

                  <td>
                    {emp.status === "active" ? (
                      <span
                        style={{
                          color: "green",
                          fontWeight: "bold",
                        }}
                      >
                        نشط
                      </span>
                    ) : (
                      <span
                        style={{
                          color: "red",
                          fontWeight: "bold",
                        }}
                      >
                        موقوف
                      </span>
                    )}
                  </td>

                  <td>

                  <button className="btn btn-light" onClick={() => openDetails(emp)}>
                       <Eye size={18}/>
                    </button>

                    <button className="btn btn-warning mx-1"  onClick={() => openEditModal(emp)}>
                       <Edit size={18} />
                   </button>
                    <button className="btn btn-info mx-1">
                      <Shield size={18} />
                    </button>

                    <button className="btn btn-danger">
                      <Trash2 size={18} />
                    </button>

                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>
      {
showAddModal && (

<div
  style={{
    background: "#fff",
    width: "900px",
    maxWidth: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 20px 50px rgba(0,0,0,.25)"
  }}
>
  {/* Header */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "25px",
      borderBottom: "1px solid #eee",
      paddingBottom: "15px"
    }}
  >
    <button
      type="button"
      className="btn btn-outline-secondary"
      onClick={() => setShowAddModal(false)}
    >
      ← رجوع
    </button>

    <h2 style={{ margin: 0 }}>إضافة موظف جديد</h2>
  </div>

  <form onSubmit={handleCreateEmployee}>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px"
      }}
    >

      <div>
        <label>الاسم الكامل</label>
        <input
          className="form-control"
          value={form.full_name}
          onChange={(e)=>
            setForm({...form,full_name:e.target.value})
          }
        />
      </div>

      <div>
        <label>البريد الإلكتروني</label>
        <input
          type="email"
          className="form-control"
          value={form.email}
          onChange={(e)=>
            setForm({...form,email:e.target.value})
          }
        />
      </div>

      <div>
        <label>رقم الهاتف</label>
        <input
          className="form-control"
          value={form.phone_number}
          onChange={(e)=>
            setForm({...form,phone_number:e.target.value})
          }
        />
      </div>

      <div>
        <label>كلمة المرور</label>
        <input
          type="password"
          className="form-control"
          value={form.password}
          onChange={(e)=>
            setForm({...form,password:e.target.value})
          }
        />
      </div>

      <div>
        <label>نوع الموظف</label>
        <select
          className="form-control"
          value={form.role}
          onChange={(e)=>
            setForm({...form,role:e.target.value})
          }
        >
          <option value="employee">موظف</option>
          <option value="manager">مدير</option>
        </select>
      </div>

      <div>
        <label>الحالة</label>
        <select
          className="form-control"
          value={form.status}
          onChange={(e)=>
            setForm({...form,status:e.target.value})
          }
        >
          <option value="active">نشط</option>
          <option value="inactive">موقوف</option>
        </select>
      </div>

    </div>

    <hr style={{ margin: "30px 0" }} />

    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "15px"
      }}
    >
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setShowAddModal(false)}
      >
        إلغاء
      </button>

      <button
        type="submit"
        className="btn btn-success"
      >
        إنشاء الموظف
      </button>
    </div>

  </form>
</div>

)
}
{
showEditModal && (

<div
style={{
position:"fixed",
top:0,
left:0,
right:0,
bottom:0,
background:"rgba(0,0,0,.5)",
display:"flex",
justifyContent:"center",
alignItems:"center",
zIndex:9999
}}
>

<div
style={{
background:"#fff",
padding:30,
borderRadius:15,
width:"550px"
}}
>

<h3>

تعديل الموظف

</h3>

<form onSubmit={handleUpdateEmployee}>

<input
className="form-control mb-3"
value={editForm.full_name}
onChange={(e)=>
setEditForm({
...editForm,
full_name:e.target.value
})
}
/>

<input
className="form-control mb-3"
value={editForm.email}
disabled
/>

<input
className="form-control mb-3"
value={editForm.phone_number}
onChange={(e)=>
setEditForm({
...editForm,
phone_number:e.target.value
})
}
/>

<select
className="form-control mb-3"
value={editForm.role}
onChange={(e)=>
setEditForm({
...editForm,
role:e.target.value
})
}
>

<option value="employee">

موظف

</option>

<option value="manager">

مدير

</option>

</select>

<select
className="form-control mb-3"
value={editForm.status}
onChange={(e)=>
setEditForm({
...editForm,
status:e.target.value
})
}
>

<option value="active">

نشط

</option>

<option value="inactive">

موقوف

</option>

</select>

<div
style={{
display:"flex",
justifyContent:"flex-end",
gap:10
}}
>

<button
type="button"
className="btn btn-secondary"
onClick={()=>
setShowEditModal(false)
}
>
إلغاء
</button>

<button
type="submit"
className="btn btn-success"
>

حفظ التعديلات

</button>

</div>

</form>

</div>

</div>

)
}
{
showPermissionModal && (

<div
style={{
position:"fixed",
top:0,
left:0,
right:0,
bottom:0,
background:"rgba(0,0,0,.5)",
display:"flex",
justifyContent:"center",
alignItems:"center",
zIndex:9999
}}
>

<div
style={{
background:"#fff",
width:"650px",
padding:25,
borderRadius:15,
maxHeight:"80vh",
overflowY:"auto"
}}
>

<h3>

صلاحيات الموظف

</h3>

<hr/>

{
permissions.map((permission)=>(

<div
key={permission.id}
style={{
display:"flex",
alignItems:"center",
marginBottom:15
}}
>

<input

type="checkbox"

checked={selectedPermissions.includes(permission.id)}

onChange={()=>
togglePermission(permission.id)
}

/>

<div style={{marginRight:15}}>

<div
style={{
fontWeight:"bold"
}}
>

{permission.name}

</div>

<div
style={{
color:"#777",
fontSize:13
}}
>

{permission.description}

</div>

</div>

</div>

))
}

<hr/>

<div
style={{
display:"flex",
justifyContent:"flex-end",
gap:10
}}
>

<button
className="btn btn-secondary"
onClick={()=>
setShowPermissionModal(false)
}
>

إلغاء

</button>

<button
className="btn btn-success"
onClick={savePermissions}
>

حفظ الصلاحيات

</button>

</div>

</div>

</div>

)
}
{
showDetailsModal &&
employeeDetails && (

<div
style={{
position:"fixed",
top:0,
left:0,
right:0,
bottom:0,
background:"rgba(0,0,0,.55)",
display:"flex",
justifyContent:"center",
alignItems:"center",
zIndex:9999
}}
>

<div
style={{
background:"#fff",
width:"700px",
borderRadius:15,
padding:30,
maxHeight:"85vh",
overflowY:"auto"
}}
>

<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center"
}}
>

<h3>

تفاصيل الموظف

</h3>

<button
className="btn btn-danger"
onClick={()=>setShowDetailsModal(false)}
>

×

</button>

</div>

<hr/>

<table className="table">

<tbody>

<tr>

<th>الاسم</th>

<td>{employeeDetails.full_name}</td>

</tr>

<tr>

<th>البريد الإلكتروني</th>

<td>{employeeDetails.email}</td>

</tr>

<tr>

<th>الهاتف</th>

<td>{employeeDetails.phone_number}</td>

</tr>

<tr>

<th>الدور</th>

<td>{employeeDetails.role}</td>

</tr>

<tr>

<th>الحالة</th>

<td>{employeeDetails.status}</td>

</tr>

<tr>

<th>المورد</th>

<td>{employeeDetails.supplier_id}</td>

</tr>

<tr>

<th>تاريخ الإنشاء</th>

<td>

{new Date(
employeeDetails.created_at
).toLocaleString()}

</td>

</tr>

</tbody>

</table>

<hr/>

<h4>

الصلاحيات

</h4>

{
employeePermissions.length===0?

<p>

لا توجد صلاحيات

</p>

:

employeePermissions.map(permission=>(

<div
key={permission.id}
style={{
padding:10,
marginBottom:10,
border:"1px solid #ddd",
borderRadius:10
}}
>

<div
style={{
fontWeight:"bold"
}}
>

{permission.name}

</div>

<div
style={{
color:"#777"
}}
>

{permission.description}

</div>

</div>

))
}

<div
style={{
display:"flex",
justifyContent:"flex-end",
marginTop:25
}}
>

<button
className="btn btn-primary"
onClick={()=>setShowDetailsModal(false)}
>

إغلاق

</button>

</div>

</div>

</div>

)
}
    </div>
  );
}




// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import {
//   Search,
//   Plus,
//   Eye,
//   Pencil,
//   Trash2,
//   Users,
// } from "lucide-react";
// // import EmployeeForm from '../supplier/EmployeeForm';
// import { listEmployees, deleteEmployee } from "../../services/employees";
// import useAuthStore from "../../store/authStore";

// export default function EmployeesList() {
//   const { user } = useAuthStore();

//   const [employees, setEmployees] = useState([]);
//   const [search, setSearch] = useState("");
//   const [loading, setLoading] = useState(true);

//   const load = async () => {
//     try {
//       setLoading(true);
//       const res = await listEmployees(user.supplier_id);
//       setEmployees(res.data || []);
//     } catch (err) {
//       alert(err?.response?.data?.message || "خطأ في تحميل الموظفين");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (user?.supplier_id) load();
//   }, [user]);

//   const handleDelete = async (id) => {
//     if (!window.confirm("هل تريد حذف الموظف؟")) return;

//     try {
//       await deleteEmployee(id);
//       setEmployees((prev) => prev.filter((e) => e.id !== id));
//     } catch (err) {
//       alert(err?.response?.data?.message || "فشل الحذف");
//     }
//   };

//   const filtered = employees.filter((e) =>
//     `${e.full_name} ${e.email} ${e.phone_number || ""}`
//       .toLowerCase()
//       .includes(search.toLowerCase())
//   );

//   return (
//     <div className="space-y-6">

//       <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-30">

//         <div>
//           <h1 className="text-3xl font-bold flex items-center gap-8">
//             <Users className="w-8 h-8 text-blue-600" />
//             إدارة الموظفين
//           </h1>

//           <p className="text-gray-500 mt-1">
//             إدارة جميع الموظفين التابعين لمنشأتك
//           </p>
//         </div>

//         <Link to="../supplier/EmployeeForm"className="inline-flex items-center gap-5 rounded-xl bg-blue-600 px-8 py-8 text-white hover:bg-blue-700">
//           <Plus size={40} />
//           إضافة موظف
//         </Link>

//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

//         <div className="rounded-xl0 bg-white shadow p-50">
//           <p className="text-gray-500">إجمالي الموظفين</p>
//           <h2 className="text-3xl font-bold mt-4">
//             {employees.length}
//           </h2>
//         </div>

//         <div className="rounded-xl bg-green-50 shadow p-5">
//           <p className="text-green-600">النشطون</p>
//           <h2 className="text-3xl font-bold">
//             {employees.filter(e=>e.status==="active").length}
//           </h2>
//         </div>

//         <div className="rounded-xl bg-red-50 shadow p-5">
//           <p className="text-red-600">غير النشطين</p>
//           <h2 className="text-3xl font-bold">
//             {employees.filter(e=>e.status!=="active").length}
//           </h2>
//         </div>

//       </div>

//       <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
//         <Search className="text-gray-400" />

//         <input
//           className="flex-10 outline-none"
//           placeholder="ابحث باسم الموظف أو البريد أو الهاتف..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//       </div>

//       <div className="bg-white rounded-xl shadow overflow-hidden">

//         <table className="w-full">
//           <thead style={{ background: '#f8f9fa' }} className="bg-gray-100">
//                       <tr>
//                         <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}> الهاتف</th>
//                         <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الإيميل</th>
//                         <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الدور</th>
//                         <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الحالة</th>
//                         <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef' }}>الإجراءات</th>
                       
//                       </tr>
//                     </thead>
//           <tbody>

//             {loading ? (
//               <tr>
//                 <td colSpan="6" className="text-center p-8">
//                   جاري التحميل...
//                 </td>
//               </tr>
//             ) : filtered.length === 0 ? (
//               <tr>
//                 <td colSpan="6" className="text-center p-8">
//                   لا يوجد موظفون
//                 </td>
//               </tr>
//             ) : (
//               filtered.map((e) => (
//                 <tr key={e.id} className="border-t hover:bg-gray-50">

//                   <td className="p-4 font-medium">{e.full_name}</td>

//                   <td>{e.phone_number || "-"}</td>

//                   <td>{e.email}</td>

//                   <td>{e.role}</td>

//                   <td>
//                     <span
//                       className={`px-3 py-1 rounded-full text-sm ${
//                         e.status === "active"
//                           ? "bg-green-100 text-green-700"
//                           : "bg-red-100 text-red-700"
//                       }`}
//                     >
//                       {e.status}
//                     </span>
//                   </td>

//                   <td>

//                     <div className="flex justify-center gap-2">

//                       <Link
//                         to={`/employees/${e.id}`}
//                         className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
//                       >
//                         <Eye size={18} />
//                       </Link>

//                       <Link
//                         to={`/employees/${e.id}/edit`}
//                         className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
//                       >
//                         <Pencil size={18} />
//                       </Link>

//                       <button
//                         onClick={() => handleDelete(e.id)}
//                         className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
//                       >
//                         <Trash2 size={18} />
//                       </button>

//                     </div>

//                   </td>

//                 </tr>
//               ))
//             )}

//           </tbody>

//         </table>

//       </div>

//     </div>
//   );
// }

// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import {
//   Search,
//   Plus,
//   Eye,
//   Pencil,
//   Trash2,
//   Users,
//   UserCheck,
//   UserX
// } from "lucide-react";

// import { listEmployees, deleteEmployee } from "../../services/employees";
// import useAuthStore from "../../store/authStore";


// export default function EmployeesList() {

//   const { user } = useAuthStore();

//   const [employees,setEmployees] = useState([]);
//   const [search,setSearch] = useState("");
//   const [loading,setLoading] = useState(true);


//   const loadEmployees = async()=>{

//     try{

//       setLoading(true);

//       const res = await listEmployees(user.supplier_id);

//       setEmployees(res.data || []);

//     }catch(error){

//       alert(
//         error?.response?.data?.message ||
//         "حدث خطأ أثناء تحميل الموظفين"
//       );

//     }finally{

//       setLoading(false);

//     }

//   };


//   useEffect(()=>{

//     if(user?.supplier_id)
//       loadEmployees();

//   },[user]);



//   const handleDelete = async(id)=>{

//     if(!confirm("هل تريد حذف الموظف؟"))
//       return;


//     try{

//       await deleteEmployee(id);

//       setEmployees(prev =>
//         prev.filter(emp=>emp.id !== id)
//       );


//     }catch(error){

//       alert("فشل حذف الموظف");

//     }

//   };



//   const filteredEmployees =
//     employees.filter(emp=>

//       `${emp.full_name}
//       ${emp.email}
//       ${emp.phone_number || ""}`

//       .toLowerCase()

//       .includes(search.toLowerCase())

//     );



// return (

// <div className="space-y-6" dir="rtl">


// {/* Header */}

// <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">


// <div>

// <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">

// <Users className="text-blue-600"/>

// إدارة الموظفين

// </h1>


// <p className="text-gray-500 mt-2">

// إدارة ومتابعة موظفي منشأتك

// </p>


// </div>



// <Link

// to="/employees/new"

// className="
// flex items-center gap-2
// bg-blue-600
// hover:bg-blue-700
// text-white
// px-5 py-3
// rounded-xl
// shadow
// transition
// "

// >

// <Plus size={22}/>

// إضافة موظف

// </Link>



// </div>





// {/* Statistics */}


// <div className="grid grid-cols-1 md:grid-cols-3 gap-5">


// <div className="
// bg-white
// rounded-2xl
// shadow-sm
// p-6
// border
// flex
// justify-between
// items-center
// ">


// <div>

// <p className="text-gray-500">

// إجمالي الموظفين

// </p>


// <h2 className="text-3xl font-bold mt-2">

// {employees.length}

// </h2>


// </div>


// <div className="bg-blue-100 p-3 rounded-xl">

// <Users className="text-blue-600"/>

// </div>


// </div>





// <div className="
// bg-white
// rounded-2xl
// shadow-sm
// p-6
// border
// flex
// justify-between
// items-center
// ">


// <div>

// <p className="text-gray-500">

// الموظفون النشطون

// </p>


// <h2 className="text-3xl font-bold mt-2">

// {
// employees.filter(
// e=>e.status==="active"
// ).length
// }

// </h2>


// </div>


// <div className="bg-green-100 p-3 rounded-xl">

// <UserCheck className="text-green-600"/>

// </div>


// </div>






// <div className="
// bg-white
// rounded-2xl
// shadow-sm
// p-6
// border
// flex
// justify-between
// items-center
// ">


// <div>

// <p className="text-gray-500">

// غير النشطين

// </p>


// <h2 className="text-3xl font-bold mt-2">

// {
// employees.filter(
// e=>e.status!=="active"
// ).length
// }

// </h2>


// </div>


// <div className="bg-red-100 p-3 rounded-xl">

// <UserX className="text-red-600"/>

// </div>


// </div>



// </div>






// {/* Search */}


// <div className="
// bg-white
// rounded-2xl
// shadow-sm
// border
// p-4
// flex
// items-center
// gap-3
// ">


// <Search className="text-gray-400"/>


// <input

// className="
// w-full
// outline-none
// text-gray-700
// "

// placeholder="البحث عن موظف..."

// value={search}

// onChange={(e)=>setSearch(e.target.value)}

// />


// </div>








// {/* Table */}


// <div className="
// bg-white
// rounded-2xl
// shadow-sm
// border
// overflow-hidden
// ">


// <table className="w-full text-right">


// <thead className="bg-gray-50">


// <tr>


// <th className="p-4">
// الاسم
// </th>


// <th className="p-4">
// الهاتف
// </th>


// <th className="p-4">
// البريد
// </th>


// <th className="p-4">
// الصلاحية
// </th>


// <th className="p-4">
// الحالة
// </th>


// <th className="p-4">
// الإجراءات
// </th>


// </tr>


// </thead>



// <tbody>


// {

// loading ? (

// <tr>

// <td colSpan="6" className="p-8 text-center">

// جاري التحميل...

// </td>

// </tr>


// )

// :

// filteredEmployees.length===0 ?


// (

// <tr>

// <td colSpan="6" className="p-8 text-center">

// لا يوجد موظفون

// </td>

// </tr>


// )


// :


// filteredEmployees.map(emp=>(


// <tr

// key={emp.id}

// className="
// border-t
// hover:bg-gray-50
// transition
// "

// >


// <td className="p-4 font-semibold">

// {emp.full_name}

// </td>



// <td className="p-4">

// {emp.phone_number || "-"}

// </td>



// <td className="p-4">

// {emp.email}

// </td>



// <td className="p-4">

// {emp.role}

// </td>



// <td className="p-4">


// <span

// className={`
// px-3
// py-1
// rounded-full
// text-sm

// ${
// emp.status==="active"

// ?
// "bg-green-100 text-green-700"

// :

// "bg-red-100 text-red-700"

// }

// `}

// >

// {emp.status==="active"?"نشط":"غير نشط"}

// </span>


// </td>





// <td className="p-4">


// <div className="flex gap-2">


// <Link

// to={`/employees/${emp.id}`}

// className="
// p-2
// rounded-lg
// bg-blue-100
// text-blue-600
// hover:bg-blue-200
// "

// >

// <Eye size={18}/>

// </Link>



// <Link

// to={`/employees/${emp.id}/edit`}

// className="
// p-2
// rounded-lg
// bg-yellow-100
// text-yellow-600
// hover:bg-yellow-200
// "

// >

// <Pencil size={18}/>

// </Link>



// <button

// onClick={()=>handleDelete(emp.id)}

// className="
// p-2
// rounded-lg
// bg-red-100
// text-red-600
// hover:bg-red-200
// "

// >

// <Trash2 size={18}/>

// </button>


// </div>


// </td>


// </tr>


// ))


// }



// </tbody>


// </table>


// </div>


// </div>


// );

// }