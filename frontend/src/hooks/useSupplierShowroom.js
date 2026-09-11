import { useEffect, useState } from 'react';
import { supplierContextAPI, getSelectedShowroom, setSelectedShowroom, clearSelectedShowroom } from '../services/supplierContext';

export function useSupplierShowroom() {
  const [showroom, setShowroom] = useState(getSelectedShowroom());
  const [options, setOptions] = useState([]);

  const load = async () => {
    const list = await supplierContextAPI.getOptions();
    setOptions(list);
    const current = getSelectedShowroom();
    if (current && list.some((item) => item.id === current.id)) return current;
    if (list.length > 0) {
      setSelectedShowroom(list[0]);
      setShowroom(list[0]);
      return list[0];
    }
    clearSelectedShowroom();
    setShowroom(null);
    return null;
  };

  useEffect(() => {
    load().catch(() => {});
    const onChanged = (event) => setShowroom(event.detail || null);
    window.addEventListener('supplierShowroomChanged', onChanged);
    return () => window.removeEventListener('supplierShowroomChanged', onChanged);
  }, []);

  const selectShowroom = async (locationId) => {
    const result = await supplierContextAPI.select(locationId);
    setSelectedShowroom(result.showroom);
    setShowroom(result.showroom);
    return result.showroom;
  };

  return { showroom, options, reload: load, selectShowroom };
}
