-- Fix users registered with the Lombok boolean builder bug (isActive was saved as false)
-- Run this ONCE on your existing database, then restart the backend.
USE tutorfinder;

UPDATE users SET is_active = 1 WHERE is_active = 0 OR is_active IS NULL;
UPDATE tutor_profiles SET is_available = 1 WHERE is_available = 0 OR is_available IS NULL;

-- Verify
SELECT id, email, role, is_active FROM users;

-- Fix certificate URLs that were stored as relative paths (e.g. /uploads/certificates/...)
-- Run this once. Safe to run multiple times — only changes rows that need fixing.
UPDATE tutor_documents
   SET file_url = CONCAT('http://localhost:8080', file_url)
 WHERE file_url LIKE '/uploads/%';

UPDATE users
   SET profile_picture = CONCAT('http://localhost:8080', profile_picture)
 WHERE profile_picture LIKE '/uploads/%';

-- Add slot_duration_minutes to tutor_availability if upgrading from old schema
ALTER TABLE tutor_availability
  ADD COLUMN IF NOT EXISTS slot_duration_minutes INT NOT NULL DEFAULT 60;
