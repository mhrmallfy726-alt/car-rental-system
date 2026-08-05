import AsyncSelect from "react-select/async";
const API_KEY = "05e3c652936142b6b39ae83374291f61";
export default function LocationSearch({ value, onChange }) {
    const loadOptions = async (inputValue) => {
        if (inputValue.length < 2) return [];
      
        try {
            const lang = /[\u0600-\u06FF]/.test(inputValue) ? "ar" : "en";

            const res = await fetch(
              `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(inputValue)}&limit=5&lang=${lang}&apiKey=${API_KEY}`
            );
      
          const data = await res.json();

          console.log(data);
          
          if (!data.features) {
            return [];
          }      
          return data.features.map((item) => ({
            label: item.properties.formatted,
            value: item.properties.formatted,
            latitude: item.properties.lat,
            longitude: item.properties.lon,
          }));
        } catch (err) {
          console.error(err);
          return [];
        }
      };

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      placeholder="ابحث عن مدينة أو حي..."
      value={
        value
          ? {
              label: value,
              value: value,
            }
          : null
      }
      onChange={(selected) => {
        if (!selected) return;

        onChange({
          name: selected.value,
          latitude: selected.latitude,
          longitude: selected.longitude,
        });
      }}
    />
  );
}