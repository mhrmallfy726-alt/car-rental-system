import React, { useState, useEffect } from "react";
import {
  createEmployee,
  getEmployee,
  updateEmployee,
} from "../../services/employees";

import { useNavigate, useParams } from "react-router-dom";

import {
  User,
  Phone,
  Mail,
  Lock,
  Shield,
  CheckCircle,
  Save,
  ArrowLeft,
} from "lucide-react";

export default function EmployeeForm({ editMode }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    password: "",
    role: "employee",
    status: "Active",
    supplier_email: "",
  });

  useEffect(() => {
    if (editMode && id) {
      fetchEmployee();
    }
  }, [editMode, id]);

  const fetchEmployee = async () => {
    try {
      const res = await getEmployee(id);
      const emp = res.data;

      setFormData({
        full_name: emp.full_name || "",
        phone_number: emp.phone_number || "",
        email: emp.email || "",
        password: "",
        role: emp.role || "staff",
        status: emp.status || "Active",

        // إذا كان الـ API يرجع البريد
        supplier_email: emp.supplier_email || "",
      });
    } catch (error) {
      console.log(error);
      alert("فشل جلب بيانات الموظف");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      if (editMode) {
        await createEmployee(formData);
        alert("تم إنشاء الموظف بنجاح");
      } else {
        await updateEmployee(id, formData);
        alert("تم تحديث الموظف بنجاح");

      }
      navigate("./employees");
    }
     catch (err) {
      alert(err?.response?.data?.message || "حدث خطأ أثناء الحفظ");
      } finally {
      setLoading(false);
    }
  };

  return (<div
    className="dashboard"
    style={{
      minHeight: "100vh",
      background: "#f8f9fa",
      padding: "30px 24px",
    }}
  >
    <h1
      style={{
        fontSize: "1.8rem",
        marginBottom: "24px",
        fontWeight: "bold",
      }}
    >
      {editMode ? "تعديل الموظف" : "إضافة موظف جديد"}
    </h1>
  
    <div
      className="card"
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "10%",
        maxWidth: "900px",
        margin: "0 auto",
        boxShadow: "0 1px 3px rgba(0,0,0,.1)",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          display:"flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* mm */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "600",
              }}
            >
              الاسم الكامل
            </label>
  
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ced4da",
                borderRadius: "6px",
              }}
            />
          </div>
  
          <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>رقم الهاتف</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder="05xxxxxxxx" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  dir="ltr" 
                  required 
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
          </div>
        </div>
  
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "600",
              }}
            >
              البريد الإلكتروني
            </label>
  
            <input
                type="email" 
                name="email" 
                placeholder="example@mail.com" 
                value={formData.email} 
                onChange={handleChange} 
                dir="ltr" 
                required 
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none'
              }}
            />
          </div>
  
          {!editMode && (
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "600",
                }}
              >
                كلمة المرور
              </label>
  
              <input
                   type="password" 
                   name="password" 
                   placeholder="••••••••" 
                   value={formData.password} 
                   onChange={handleChange} 
                   dir="ltr" 
                   required 
                   style={{
                     width: '100%',
                     padding: '10px 40px 10px 12px',
                     border: '1px solid #ced4da',
                     borderRadius: '8px',
                     fontSize: '0.9rem',
                     outline: 'none'
                }}
              />
            </div>
           
          )}
        </div>
  
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "600",
              }}
            >
              الصلاحية
            </label>
  
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ced4da",
                borderRadius: "6px",
              }}
            >
              <option value="staff">موظف</option>
              <option value="manager">مدير</option>
              <option value="admin">مشرف</option>
            </select>
          </div>
  
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "600",
              }}
            >
              الحالة
            </label>
  
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ced4da",
                borderRadius: "6px",
              }}
            >
              <option value="Active">نشط</option>
              <option value="Inactive">غير نشط</option>
            </select>
          </div>
        </div>
  
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
            }}
          >
            البريد الإلكتروني للمورد
          </label>
  
          <input
            type="email"
            name="supplier_email"
            value={formData.supplier_email}
            onChange={handleChange}
            placeholder="supplier@email.com"
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ced4da",
              borderRadius: "6px",
            }}
          />
        </div>
        <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          marginTop: "10px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: "#6c757d",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ArrowLeft size={18} />
          رجوع
        </button>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#0a58ca",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "bold",
          }}
        >
          <Save size={18} />
          {loading
            ? "جاري الحفظ..."
            : editMode
            ? "حفظ التعديلات"
            : "إضافة الموظف"}
        </button>
      </div>
    </form>
  </div>

  <style>{`
        @media (max-width: 768px) {
          .dashboard {
            flex-direction: column;
          }
          .sidebar {
            width: 100% !important;
            height: auto !important;
            position: relative !important;
            border-left: none !important;
            border-bottom: 1px solid #e9ecef;
            padding: 12px 0 !important;
          }
          .sidebar > div {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
          }
          .sidebar-item {
            flex: 1 0 auto;
            justify-content: center;
          }
          .dashboard-content {
            padding: 20px 16px !important;
          }
          .card {
            padding: 20px !important;
          }
          [style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
        .form-input:focus {
          outline: none;
          border-color: #86b7fe;
          box-shadow: 0 0 0 2px rgba(13,110,253,0.25);
        }
      `}</style>
</div>
);
}