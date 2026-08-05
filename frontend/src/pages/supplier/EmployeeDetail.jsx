import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getEmployee, getEmployeePermissions, listPermissions, updateEmployeePermissions } from '../../services/employees';
//import {Plus, Edit, Trash2} from 'lucide-react';
//import React, {useState} from 'react';

export default function EmployeeDetail() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [perms, setPerms] = useState([]);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    (async () => {
      const e = await getEmployee(id);
      setEmployee(e.data);
      const p = await getEmployeePermissions(id);
      const current = new Set(p.data.map(x => x.id));
      setSelected(current);
      const all = await listPermissions();
      setPerms(all.data);
    });
  }, [id]);

  const toggle = (pid) => {
    const s = new Set(selected);
    if (s.has(pid)) s.delete(pid); 
    else s.add(pid);
    setSelected(s);
  };

  const save = async () => {
    const permission_ids = Array.from(selected);
    try {
      await updateEmployeePermissions(id, permission_ids);
      alert('تم تحديث الصلاحيات');
    } catch (err) {
      alert(err?.response?.data?.message || 'خطأ عند تحديث الصلاحيات');
    }
  };


  if (!employee) return <div>جاري التحميل...</div>;
  return (
    <div>
      <h2>تفاصيل الموظف: {employee.full_name}</h2>
      <p>البريد: {employee.email}</p>
      <p>الهاتف: {employee.phone_number}</p>
      <p>الدور: {employee.role}</p>

      <h3>الصلاحيات</h3>
      <div>
        {perms.map(p => (
          <label key={p.id} style={{ display: 'block' }}>
            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} /> {p.name} - {p.description}
          </label>
        ))}
      </div>
      <button onClick={save}>حفظ الصلاحيات</button>
    </div>
  );
 };
