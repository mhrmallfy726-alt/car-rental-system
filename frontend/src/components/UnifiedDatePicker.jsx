import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export const formatDateValue = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateValue = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

export const getTodayDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export default function UnifiedDatePicker({ value, onChange, minDate, placeholder = 'اختر التاريخ', disabled = false, isClearable = true }) {
  return <DatePicker
    selected={parseDateValue(value)}
    onChange={(date) => onChange(formatDateValue(date))}
    minDate={minDate || getTodayDate()}
    dateFormat="dd/MM/yyyy"
    placeholderText={placeholder}
    className="modern-date-input"
    calendarClassName="modern-calendar"
    wrapperClassName="date-picker-full-width"
    showPopperArrow={false}
    isClearable={isClearable}
    disabled={disabled}
  />;
}
