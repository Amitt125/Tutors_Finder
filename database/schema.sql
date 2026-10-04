-- ============================================================
-- TutorFinder - MySQL 8.0 Database Schema  (v2 — fresh install)
-- ============================================================

CREATE DATABASE IF NOT EXISTS tutorfinder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tutorfinder;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    profile_picture VARCHAR(500),
    role            ENUM('STUDENT','TUTOR','ADMIN') NOT NULL DEFAULT 'STUDENT',
    is_active       BOOLEAN DEFAULT TRUE,
    is_verified     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100),
    icon     VARCHAR(100)
);

INSERT IGNORE INTO subjects (name, category) VALUES
('Mathematics','Science'),('Physics','Science'),('Chemistry','Science'),
('Biology','Science'),('English','Language'),('Hindi','Language'),
('History','Humanities'),('Geography','Humanities'),
('Computer Science','Technology'),('Economics','Commerce'),
('Accountancy','Commerce'),('Music','Arts'),('Drawing','Arts'),
('French','Language'),('German','Language');

-- ============================================================
-- TUTOR PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS tutor_profiles (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE,
    bio                 TEXT,
    education           VARCHAR(500),
    experience_years    INT DEFAULT 0,
    hourly_rate         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency            VARCHAR(10) DEFAULT 'INR',
    teaching_mode       ENUM('IN_PERSON','ONLINE','BOTH') DEFAULT 'BOTH',
    service_radius_km   INT DEFAULT 10,
    address             VARCHAR(500),
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(100),
    latitude            DECIMAL(10,8),
    longitude           DECIMAL(11,8),
    is_available        BOOLEAN DEFAULT TRUE,
    average_rating      DECIMAL(3,2) DEFAULT 0.00,
    total_reviews       INT DEFAULT 0,
    total_sessions      INT DEFAULT 0,
    verification_status ENUM('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_lat_lng   (latitude, longitude),
    INDEX idx_available (is_available),
    INDEX idx_rate      (hourly_rate)
);

-- ============================================================
-- TUTOR SUBJECTS (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS tutor_subjects (
    tutor_id   BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    PRIMARY KEY (tutor_id, subject_id),
    FOREIGN KEY (tutor_id)   REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)       ON DELETE CASCADE
);

-- ============================================================
-- TUTOR AVAILABILITY
-- ============================================================
CREATE TABLE IF NOT EXISTS tutor_availability (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    tutor_profile_id BIGINT NOT NULL,
    day_of_week      ENUM('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'),
    start_time       TIME NOT NULL,
    end_time         TIME NOT NULL,
    FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profiles(id) ON DELETE CASCADE
);

-- ============================================================
-- TUTOR DOCUMENTS  (qualification certificates)
-- certificate_name  — friendly label e.g. "B.Tech Computer Science"
-- ============================================================
CREATE TABLE IF NOT EXISTS tutor_documents (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    tutor_profile_id BIGINT NOT NULL,
    document_type    ENUM('ID_PROOF','DEGREE','CERTIFICATION','OTHER') DEFAULT 'CERTIFICATION',
    certificate_name VARCHAR(255),
    file_url         VARCHAR(500) NOT NULL,
    verified         BOOLEAN DEFAULT FALSE,
    uploaded_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profiles(id) ON DELETE CASCADE
);

-- ============================================================
-- STUDENT PROFILES
-- Columns match StudentProfile.java entity exactly
-- ============================================================
CREATE TABLE IF NOT EXISTS student_profiles (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT NOT NULL UNIQUE,
    grade_level      VARCHAR(50),
    school           VARCHAR(200),
    bio              TEXT,
    learning_goals   TEXT,
    latitude         DECIMAL(10,8),
    longitude        DECIMAL(11,8),
    location_address VARCHAR(500),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id          BIGINT NOT NULL,
    tutor_id            BIGINT NOT NULL,
    subject_id          BIGINT,
    session_date        DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    teaching_mode       ENUM('IN_PERSON','ONLINE'),
    hourly_rate         DECIMAL(10,2),
    total_amount        DECIMAL(10,2),
    status              ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED') DEFAULT 'PENDING',
    notes               TEXT,
    cancellation_reason VARCHAR(500),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (tutor_id)   REFERENCES users(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    INDEX idx_booking_student (student_id),
    INDEX idx_booking_tutor   (tutor_id)
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id       BIGINT NOT NULL UNIQUE,
    student_id       BIGINT NOT NULL,
    tutor_profile_id BIGINT NOT NULL,
    rating           TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment          TEXT,
    tutor_reply      TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id)       REFERENCES bookings(id),
    FOREIGN KEY (student_id)       REFERENCES users(id),
    FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profiles(id)
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id   BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id)   REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    INDEX idx_msg_sender   (sender_id),
    INDEX idx_msg_receiver (receiver_id)
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id          BIGINT NOT NULL,
    tutor_id            BIGINT NOT NULL,
    razorpay_order_id   VARCHAR(100) UNIQUE,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_signature  VARCHAR(255),
    amount              DECIMAL(10,2) NOT NULL,
    currency            CHAR(3) DEFAULT 'INR',
    description         VARCHAR(500),
    status              ENUM('CREATED','ATTEMPTED','CAPTURED','FAILED','REFUNDED') NOT NULL DEFAULT 'CREATED',
    refund_id           VARCHAR(100),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (tutor_id)   REFERENCES users(id),
    INDEX idx_pay_student (student_id),
    INDEX idx_pay_tutor   (tutor_id)
);

-- ============================================================
-- SAVED TUTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_tutors (
    student_id       BIGINT NOT NULL,
    tutor_profile_id BIGINT NOT NULL,
    saved_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, tutor_profile_id),
    FOREIGN KEY (student_id)       REFERENCES users(id),
    FOREIGN KEY (tutor_profile_id) REFERENCES tutor_profiles(id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    title      VARCHAR(255),
    message    TEXT,
    type       ENUM('BOOKING','MESSAGE','REVIEW','PAYMENT','SYSTEM'),
    is_read    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
