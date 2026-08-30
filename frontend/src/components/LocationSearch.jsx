import AsyncSelect from 'react-select/async';
import { useMemo } from 'react';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

export default function LocationSearch({ value, onChange }) {
  const selectedValue = useMemo(() => {
    if (!value) return null;

    if (typeof value === 'object') {
      return {
        label: value.name || value.label || value.value || '',
        value: value.name || value.value || '',
        latitude: value.latitude,
        longitude: value.longitude,
      };
    }

    return { label: value, value };
  }, [value]);

  const loadOptions = async (inputValue) => {
    const text = inputValue.trim();

    if (text.length < 2 || !GEOAPIFY_KEY) return [];

    try {
      const lang = /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';
      const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
      url.searchParams.set('text', text);
      url.searchParams.set('limit', '8');
      url.searchParams.set('lang', lang);
      url.searchParams.set('apiKey', GEOAPIFY_KEY);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Geoapify autocomplete failed: ${response.status}`);
      }

      const data = await response.json();

      return (data.features || [])
        .filter((feature) => {
          const properties = feature.properties || {};
          return Number.isFinite(Number(properties.lat)) && Number.isFinite(Number(properties.lon));
        })
        .map((feature) => {
          const properties = feature.properties;
          const label = properties.formatted || properties.name || text;
          return {
            label,
            value: label,
            latitude: Number(properties.lat),
            longitude: Number(properties.lon),
          };
        });
    } catch (error) {
      console.error('Geoapify location search error:', error);
      return [];
    }
  };

  return (
    <div className="location-search" dir="rtl">
      <AsyncSelect
        cacheOptions
        loadOptions={loadOptions}
        defaultOptions={false}
        value={selectedValue}
        isClearable
        noOptionsMessage={({ inputValue }) =>
          inputValue.trim().length < 2
            ? 'اكتب اسم المدينة أو الحي'
            : GEOAPIFY_KEY
              ? 'لا توجد نتائج مطابقة'
              : 'أضف VITE_GEOAPIFY_API_KEY إلى ملف .env'
        }
        loadingMessage={() => 'جاري البحث عن المواقع...'}
        placeholder="ابحث عن مدينة أو حي..."
        onChange={(selected) => {
          if (!selected) {
            onChange?.(null);
            return;
          }

          onChange?.({
            name: selected.label,
            latitude: selected.latitude,
            longitude: selected.longitude,
          });
        }}
        styles={{
          menu: (base) => ({ ...base, zIndex: 3000 }),
          menuPortal: (base) => ({ ...base, zIndex: 3000 }),
        }}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      />
    </div>
  );
}
