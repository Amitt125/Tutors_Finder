-- ============================================================
-- Create Admin User — password: 123456
-- Run this once against your tutorfinder database
-- ============================================================
USE tutorfinder;

INSERT INTO users (email, password, full_name, role, is_active, is_verified)
VALUES (
  'admin@tutorfinder.com',
  '$2a$10$slYQmyNdgzCmeV5Wc3VPoOJpzBdTQQdKFPX6T3AewBaMZHjJcCpXm',
  'Admin',
  'ADMIN',
  1,
  1
)
ON DUPLICATE KEY UPDATE
  password   = '$2a$10$slYQmyNdgzCmeV5Wc3VPoOJpzBdTQQdKFPX6T3AewBaMZHjJcCpXm',
  is_active  = 1,
  is_verified = 1;

-- Verify
SELECT id, email, full_name, role, is_active FROM users WHERE role = 'ADMIN';
