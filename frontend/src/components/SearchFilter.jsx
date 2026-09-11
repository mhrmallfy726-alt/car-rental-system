import LocationPicker from './LocationPicker';
import LocationSearch from './LocationSearch';
import UnifiedDatePicker, { parseDateValue } from './UnifiedDatePicker';
import { MapPin, Search } from "lucide-react";


export default function SearchFilter({
  searchParams,
  setSearchParams,
  handleSearch,
}) {

  const applyLocationChange = (location) => {
    setSearchParams((prev) => ({
      ...prev,
      // Prefer the normalized city because the database stores supplier
      // locations by city, while `name` may be a long formatted address.
      location: location?.city || location?.name || '',
      latitude: location?.latitude ?? '',
      longitude: location?.longitude ?? '',
      radius: 10,
    }));
  };

return (
  <>
    <form onSubmit={handleSearch} className="hero-search-container search-form fade-in">
<div className="search-grid">
  <div className="input-wrapper">
  <LocationPicker
  position={[
    Number(searchParams.latitude) || 15.3694,
    Number(searchParams.longitude) || 44.1910,
  ]}
  mode="pickup"
  onLocationChange={applyLocationChange}
/>
    <label>موقع الاستلام</label>
    <div style={{ position: 'relative' }}>
      <MapPin size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: '#999' }} />
      <LocationSearch
value={searchParams.location}
  onChange={applyLocationChange}
/>             </div>

  </div>

  <div className="input-wrapper">
    <label>تاريخ الاستلام</label>
    <UnifiedDatePicker value={searchParams.startDate} onChange={(value) => setSearchParams({ ...searchParams, startDate: value, ...(searchParams.endDate && parseDateValue(searchParams.endDate) < parseDateValue(value) ? { endDate: '' } : {}) })} placeholder="اختر تاريخ الاستلام" />
  </div>

  <div className="input-wrapper">
    <label>تاريخ التسليم</label>
    <UnifiedDatePicker value={searchParams.endDate} minDate={parseDateValue(searchParams.startDate)} onChange={(value) => setSearchParams({ ...searchParams, endDate: value })} placeholder="اختر تاريخ التسليم" />
  </div>

  <div className="input-wrapper">
    <label>خدمة السائق</label>
    <label className="driver-toggle">
      <input
        type="checkbox"
        checked={(searchParams.withDriver || 'false') === 'true'}
        onChange={(e) => setSearchParams({ ...searchParams, withDriver: e.target.checked ? 'true' : 'false' })}
        style={{ width: '20px', height: '20px', accentColor: '#178263', cursor: 'pointer' }}
      />
      مع سائق
    </label>
    <small className="driver-note">
      {(searchParams.withDriver || 'false') === 'true' ? 'سيارة مع سائق' : 'سيارة بدون سائق'}
    </small>
  </div>

  <div className="input-wrapper">
    <label>وقت الاستلام</label>
    <input
      type="time"
      className="custom-input time-input"
      required
      value={searchParams.pickupTime || '09:00'}
      onChange={e => setSearchParams({ ...searchParams, pickupTime: e.target.value })}
    />
  </div>

  <div className="input-wrapper">
    <label>وقت الإرجاع</label>
    <input
      type="time"
      className="custom-input time-input"
      required
      value={searchParams.returnTime || '18:00'}
      onChange={e => setSearchParams({ ...searchParams, returnTime: e.target.value })}
    />
  </div>
  <div className="input-wrapper">
<label>السعر من (USD)</label>
<input
type="number"
className="custom-input"
placeholder="0"
value={searchParams.minPrice}
onChange={e =>
setSearchParams({
...searchParams,
minPrice: e.target.value,
})
}
/>
</div>

<div className="input-wrapper">
<label>السعر إلى (USD)</label>
<input
type="number"
className="custom-input"
placeholder="500"
value={searchParams.maxPrice}
onChange={e =>
setSearchParams({
...searchParams,
maxPrice: e.target.value,
})
}
/>
</div>      


  <div className="input-wrapper search-submit-wrap">
    <button type="submit" className="btn btn-primary btn-full search-submit">
      <Search size={20} /> ابحث الآن
    </button>
  </div>
  
</div>
</form>
</>
  );
}
