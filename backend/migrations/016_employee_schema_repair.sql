BEGIN;

-- Create the employee table on a new database before repairing legacy installations.
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  phone_number VARCHAR(40),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'employee',
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  is_accepting_orders BOOLEAN NOT NULL DEFAULT TRUE,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatibility repair for employee tables created before the employee workspace was introduced.
ALTER TABLE employees ADD COLUMN IF NOT EXISTS supplier_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'active';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role VARCHAR(30) NOT NULL DEFAULT 'staff';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone_number VARCHAR(40);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_accepting_orders BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_employees_supplier_id ON employees(supplier_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(LOWER(email));

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS employees_permissions (
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (employee_id, permission_id)
);

INSERT INTO permissions (name, description) VALUES
  ('view_cars', 'عرض سيارات المورد'),
  ('manage_cars', 'إضافة وتعديل سيارات المورد'),
  ('view_reservations', 'عرض حجوزات المورد'),
  ('manage_reservations', 'إدارة حالات حجوزات المورد'),
  ('view_customers', 'عرض بيانات العملاء المرتبطين بالحجوزات'),
  ('manage_advertisements', 'إدارة طلبات وإعلانات المورد'),
  ('view_finance', 'عرض التقارير المالية المسموح بها'),
  ('manage_team', 'إدارة فريق عمل المورد')
ON CONFLICT (name) DO NOTHING;

COMMIT;
