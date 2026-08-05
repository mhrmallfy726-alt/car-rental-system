import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Building2,
  Clock
} from "lucide-react";
import { adminAPI } from "../../services/api";
// const res = await adminAPI.getSupplierRequests();

export default function SupplierRequests() {
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const [requests, setRequests] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const API_URL = "http://localhost:5000";

  const loadRequests = async () => {

    try {

      setLoading(true);

      const res = await adminAPI.getSupplierRequests();
      setRequests(res.data.requests || []);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadRequests();

  }, []);

  const handleApprove = async (id) => {

    try {

        await adminAPI.approveSupplier(id);

      setOpenModal(false);

      loadRequests();

    } catch (err) {

      console.error(err);

    }

  };

  const handleReject = async (id, reason) => {

    try {

        await adminAPI.rejectSupplier(id, reason);

      setOpenModal(false);

      loadRequests();

    } catch (err) {

      console.error(err);

    }

  };

  const filteredRequests = requests.filter((item) => {
    console.log(selectedRequest);
    return (

      item.company_name?.toLowerCase().includes(search.toLowerCase()) ||

      item.name?.toLowerCase().includes(search.toLowerCase()) ||

      item.email?.toLowerCase().includes(search.toLowerCase())

    );

  });
  return (
    <>
      <div
        style={{
          padding: "30px",
          background: "#f7f8fc",
          minHeight: "100vh",
        }}
      >
        {/* Header */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Building2 size={28} />
              طلبات انضمام الموردين
            </h2>

            <p style={{ color: "#777", marginTop: "6px" }}>
              مراجعة واعتماد الموردين الجدد
            </p>
          </div>

          <button
            onClick={loadRequests}
            style={{
              border: "none",
              background: "#2563eb",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <RefreshCw size={18} />
            تحديث
          </button>
        </div>

        {/* Search */}

        <div
          style={{
            background: "#fff",
            padding: "15px",
            borderRadius: "12px",
            marginBottom: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Search size={20} color="#888" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم الشركة أو البريد..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "15px",
              }}
            />
          </div>
        </div>

        {/* Table */}

        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 15px rgba(0,0,0,.05)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead
              style={{
                background: "#f3f4f6",
              }}
            >
              <tr>
                <th style={th}>الشركة</th>
                <th style={th}>المالك</th>
                <th style={th}>الهاتف</th>
                <th style={th}>الحالة</th>
                <th style={th}>الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                    }}
                  >
                    جاري التحميل...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#888",
                    }}
                  >
                    لا توجد طلبات
                  </td>
                </tr>
              ) : (
                filteredRequests.map((item) => (
                  <tr key={item.id}>
                    <td style={td}>{item.company_name}</td>

                    <td style={td}>{item.name}</td>

                    <td style={td}>{item.phone}</td>

                    <td style={td}>
                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          background: "#fff7ed",
                          color: "#d97706",
                          fontSize: "13px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Clock size={15} />
                        قيد المراجعة
                      </span>
                    </td>

                    <td style={td}>
                      <button
                        onClick={() => {
                          setSelectedRequest(item);
                          setOpenModal(true);
                        }}
                        style={{
                          border: "none",
                          background: "#2563eb",
                          color: "#fff",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          display: "flex",
                          gap: "6px",
                          alignItems: "center",
                        }}
                      >
                        <Eye size={16} />
                        مراجعة
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
                {/* نافذة مراجعة الطلب */}

                {openModal && selectedRequest && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        width: "900px",
        maxWidth: "95%",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#fff",
        borderRadius: "15px",
        padding: "25px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h2>بيانات المورد</h2>

        <button
          onClick={() => {
            setOpenModal(false);
            setSelectedRequest(null);
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        <div>
          <strong>اسم الشركة</strong>

          <p>{selectedRequest.company_name}</p>
        </div>

        <div>
          <strong>اسم المالك</strong>

          <p>{selectedRequest.name}</p>
        </div>

        <div>
          <strong>البريد الإلكتروني</strong>

          <p>{selectedRequest.email}</p>
        </div>

        <div>
          <strong>رقم الهاتف</strong>

          <p>{selectedRequest.phone}</p>
        </div>

        <div>
          <strong>المدينة</strong>

          <p>{selectedRequest.city}</p>
        </div>

        <div>
          <strong>الحالة</strong>

          <p>{selectedRequest.verification_status}</p>
        </div>
      </div>

      <hr style={{ margin: "25px 0" }} />

      <h3>الشعار</h3>

      <img
  src={`${API_URL}/uploads/${selectedRequest.avatar}`}
  alt="شعار الشركة"
  onClick={() =>
    setPreviewImage(`${API_URL}/uploads/${selectedRequest.avatar}`)
  }
  style={{
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "10px",
    cursor: "pointer",
    border: "1px solid #ddd",
  }}
/>

      <hr style={{ margin: "25px 0" }} />

      <h3>السجل التجاري</h3>

     
      <a
  href={`${API_URL}/uploads/${selectedRequest.commercial_register}`}
  target="_blank"
  rel="noopener noreferrer"
>
  📄 عرض السجل التجاري
</a>
      <hr style={{ margin: "25px 0" }} />

      <h3>هوية المالك</h3>

      <img
  src={`${API_URL}/uploads/${selectedRequest.avatar}`}
  alt="شعار الشركة"
  onClick={() =>
    setPreviewImage(`${API_URL}/uploads/${selectedRequest.avatar}`)
  }
  style={{
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "10px",
    cursor: "pointer",
    border: "1px solid #ddd",
  }}
/>
      <hr style={{ margin: "30px 0" }} />

      <textarea
        id="rejectReason"
        placeholder="اكتب سبب الرفض..."
        style={{
          width: "100%",
          height: "120px",
          padding: "10px",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "15px",
        }}
      >
        <button
          onClick={() => handleApprove(selectedRequest.id)}
          style={{
            background: "#16a34a",
            color: "#fff",
            border: "none",
            padding: "12px 25px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          اعتماد المورد
        </button>

        <button
          onClick={() => {
            const reason =
              document.getElementById("rejectReason").value;

            handleReject(selectedRequest.id, reason);
          }}
          style={{
            background: "#dc2626",
            color: "#fff",
            border: "none",
            padding: "12px 25px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          رفض الطلب
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </>
  );
}

/* ===========================
   تنسيقات الجدول
=========================== */

const th = {
  padding: "15px",
  textAlign: "right",
  fontWeight: 600,
  color: "#374151",
  borderBottom: "1px solid #e5e7eb",
};

const td = {
  padding: "15px",
  borderBottom: "1px solid #f1f5f9",
  color: "#444",
};

// {previewImage && (
//   <div
//     onClick={() => setPreviewImage(null)}
//     style={{
//       position: "fixed",
//       inset: 0,
//       background: "rgba(0,0,0,0.8)",
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "center",
//       zIndex: 10000,
//     }}
//   >
//     <img
//       src={previewImage}
//       alt="Preview"
//       onClick={(e) => e.stopPropagation()}
//       style={{
//         maxWidth: "90%",
//         maxHeight: "90%",
//         borderRadius: "10px",
//       }}
//     />
//   </div>
// )}