import { useEffect, useState } from 'react';
import { supplierContextAPI, setSelectedShowroom } from '../../services/supplierContext';

export default function ShowroomSelector({ onSelected }) {
  const [showrooms, setShowrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    supplierContextAPI.getOptions()
      .then(setShowrooms)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const choose = async (showroom) => {
    try {
      const result = await supplierContextAPI.select(showroom.id);
      setSelectedShowroom(result.showroom);
      onSelected?.(result.showroom);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div dir="rtl">جاري تحميل المعارض...</div>;
  if (error) return <div dir="rtl">{error}</div>;
  if (!showrooms.length) return <div dir="rtl">لا توجد معارض مرتبطة بحسابك حتى الآن.</div>;

  return (
    <div dir="rtl" className="supplier-showroom-selector">
      <h2>اختر المعرض</h2>
      <p>لديك أكثر من معرض. اختر المعرض الذي تريد الدخول إليه.</p>
      <div className="supplier-showroom-list">
        {showrooms.map((showroom) => (
          <button key={showroom.id} type="button" onClick={() => choose(showroom)}>
            <strong>{showroom.showroom_name || `معرض ${showroom.city}`}</strong>
            <span>{showroom.city}{showroom.address ? ` — ${showroom.address}` : ''}</span>
            <small>{showroom.car_count} سيارة</small>
          </button>
        ))}
      </div>
    </div>
  );
}
