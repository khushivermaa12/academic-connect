-- Academic Connect
-- Connect to academic_connect as ac_user 

CREATE SEQUENCE IF NOT EXISTS seq_users START 1;
CREATE SEQUENCE IF NOT EXISTS seq_slots START 1;
CREATE SEQUENCE IF NOT EXISTS seq_appointments START 1;
--Sequence create kara teeno table ke lie
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student','teacher','admin')) DEFAULT 'student',
  password_hash TEXT NOT NULL,
  photo_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()--user table me created at column add kara
);
--user table create kara
CREATE TABLE IF NOT EXISTS slots (
  slot_id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
--slot table create kara
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id TEXT PRIMARY KEY,
  slot_id TEXT NOT NULL REFERENCES slots(slot_id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
--apointment table create kara
-- triggers to auto-assign ids jaise 'u or fir number'
CREATE OR REPLACE FUNCTION users_before_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := 'U' || nextval('seq_users')::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- trigger for users table
DROP TRIGGER IF EXISTS trg_users_bi ON users;
CREATE TRIGGER trg_users_bi BEFORE INSERT ON users
FOR EACH ROW EXECUTE FUNCTION users_before_insert();

CREATE OR REPLACE FUNCTION slots_before_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.slot_id IS NULL THEN
    NEW.slot_id := 'SL' || nextval('seq_slots')::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- trigger for slots table
DROP TRIGGER IF EXISTS trg_slots_bi ON slots;
CREATE TRIGGER trg_slots_bi BEFORE INSERT ON slots
FOR EACH ROW EXECUTE FUNCTION slots_before_insert();

CREATE OR REPLACE FUNCTION appointments_before_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.appointment_id IS NULL THEN
    NEW.appointment_id := 'A' || nextval('seq_appointments')::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointments_bi ON appointments;
CREATE TRIGGER trg_appointments_bi BEFORE INSERT ON appointments
FOR EACH ROW EXECUTE FUNCTION appointments_before_insert();

-- prevent double-booking (one non-cancelled appointment per slot) ye main h
CREATE UNIQUE INDEX IF NOT EXISTS ux_appointments_slot_unq ON appointments(slot_id) WHERE status <> 'cancelled';

-- view for complete details of appointments
CREATE OR REPLACE VIEW view_appointment_details AS
SELECT a.appointment_id,
       a.status,
       a.created_at,
       s.slot_date,
       s.slot_time,
       s.duration_minutes,
       t.user_id AS teacher_id,
       t.name   AS teacher_name,
       st.user_id AS student_id,
       st.name  AS student_name,
       a.reason
FROM appointments a
JOIN slots s ON a.slot_id = s.slot_id
JOIN users t ON a.teacher_id = t.user_id
JOIN users st ON a.student_id = st.user_id;

-- stored procedure for booking
CREATE OR REPLACE FUNCTION proc_book_appointment(
  in_slot_id TEXT,
  in_student_id TEXT,
  in_reason TEXT
) RETURNS TEXT AS $$
DECLARE
  v_teacher_id TEXT;
  v_exists INT;
  v_new_aid TEXT;
BEGIN
  SELECT teacher_id INTO v_teacher_id FROM slots WHERE slot_id = in_slot_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'slot not found';
  END IF;

  SELECT COUNT(1) INTO v_exists FROM appointments WHERE slot_id = in_slot_id AND status <> 'cancelled';
  IF v_exists > 0 THEN
    RAISE EXCEPTION 'Slot already booked';
  END IF;

  INSERT INTO appointments(slot_id, teacher_id, student_id, reason)
  VALUES (in_slot_id, v_teacher_id, in_student_id, in_reason)
  RETURNING appointment_id INTO v_new_aid;

  RETURN v_new_aid;
END;
$$ LANGUAGE plpgsql;

-- sample 
INSERT INTO users (user_id, name, email, role, password_hash) VALUES
('U1000','Tyagi','tyagi@academic-connect.com','admin','password-hash-placeholder')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (user_id, name, email, role, password_hash) VALUES
('U1001','ghanshala','ghanshala@academic-connect.com','teacher','password-hash-placeholder')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (user_id, name, email, role, password_hash) VALUES
('U1002','dhruv','dhruv@academic-connect.com','student','password-hash-placeholder')
ON CONFLICT (user_id) DO NOTHING;

-- sample slot
INSERT INTO slots (slot_id, teacher_id, slot_date, slot_time, duration_minutes)
VALUES ('SL100', 'U1001', '2025-10-20', '10:00 AM', 30)
ON CONFLICT (slot_id) DO NOTHING;

