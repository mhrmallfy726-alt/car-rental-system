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
    if (list.length === 1) {
      setSelectedShowroom(list[0]);
      setShowroom(list[0]);
      return list[0];
    }
    clearSelectedShowroom();
    setShowroom(null);
    return null;
  };

  useEffect(() => { load().catch(() => {}); }, []);

  return { showroom, options, reload: load };
}
