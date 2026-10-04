-- ============================================================
-- Fix bookings table — remove old columns that conflict with
-- the Booking entity which uses tutor_id → users(id)
-- Run once on your existing database
-- ============================================================
USE tutorfinder;

-- Step 1: Drop the old FK constraint on tutor_profile_id (if it exists)
ALTER TABLE bookings DROP FOREIGN KEY IF EXISTS bookings_ibfk_2;

-- Step 2: Drop old columns that don't exist in the entity
ALTER TABLE bookings
    DROP COLUMN IF EXISTS tutor_profile_id,
    DROP COLUMN IF EXISTS duration_minutes;

-- Step 3: Make sure created_at and updated_at have proper defaults
ALTER TABLE bookings
    MODIFY COLUMN created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MODIFY COLUMN updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Step 4: Make sure tutor_id FK points to users(id) not tutor_profiles(id)
-- Drop any wrong FK first, then add the correct one
ALTER TABLE bookings DROP FOREIGN KEY IF EXISTS bookings_ibfk_tutor;
ALTER TABLE bookings
    ADD CONSTRAINT fk_booking_tutor
    FOREIGN KEY (tutor_id) REFERENCES users(id);

-- Verify final structure
DESCRIBE bookings;
