-- ============================================================
-- TutorFinder Migration v2
-- Run this ONLY if you already have an existing database.
-- For fresh installs, use schema.sql instead.
-- ============================================================

USE tutorfinder;

-- 1. Add certificate_name column to tutor_documents (if missing)
ALTER TABLE tutor_documents
    ADD COLUMN IF NOT EXISTS certificate_name VARCHAR(255) AFTER document_type;

-- 2. Fix student_profiles — add missing columns to match entity
ALTER TABLE student_profiles
    ADD COLUMN IF NOT EXISTS school           VARCHAR(200)  AFTER grade_level,
    ADD COLUMN IF NOT EXISTS bio              TEXT          AFTER school,
    ADD COLUMN IF NOT EXISTS location_address VARCHAR(500)  AFTER longitude;

-- 3. Rename address -> location_address if old column exists
-- (Run this only if you see "address" instead of "location_address")
-- ALTER TABLE student_profiles CHANGE COLUMN address location_address VARCHAR(500);

-- Verify
SELECT 'tutor_documents columns:' as info;
DESCRIBE tutor_documents;
SELECT 'student_profiles columns:' as info;
DESCRIBE student_profiles;
