# 🎓 TutorFinder — Full Stack Web Application

A full-featured tutor discovery and booking platform built with **Angular 17**, **Spring Boot 3**, and **MySQL**.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17 (Standalone Components), Angular Material, SCSS |
| Backend | Spring Boot 3.2, Spring Security, Spring Data JPA, WebSocket |
| Database | MySQL 8+ |
| Auth | JWT (JSON Web Tokens) |
| Real-time | STOMP over SockJS (WebSocket) |
| Maps | Browser Geolocation API + Google Maps ready |
| Build Tools | Maven (backend), Angular CLI (frontend) |

---

## 🏗️ Project Structure

```
tutorfinder/
├── backend/                          # Spring Boot Application
│   ├── src/main/java/com/tutorfinder/
│   │   ├── config/                   # Security, WebSocket, App config
│   │   ├── controller/               # REST Controllers
│   │   ├── dto/                      # Request/Response DTOs
│   │   ├── entity/                   # JPA Entities
│   │   ├── exception/                # Global Exception Handler
│   │   ├── repository/               # Spring Data JPA Repos
│   │   ├── security/jwt/             # JWT Filter & Utils
│   │   └── service/                  # Business Logic
│   └── src/main/resources/
│       ├── application.properties    # App configuration
│       └── schema.sql                # MySQL schema + seed data
│
├── frontend/                         # Angular 17 Application
│   └── src/app/
│       ├── core/
│       │   ├── guards/               # Auth guards
│       │   ├── interceptors/         # JWT interceptor
│       │   └── services/             # API, Auth, Tutor, Booking, Message services
│       ├── shared/
│       │   ├── components/navbar/    # Navigation component
│       │   └── models/               # TypeScript interfaces
│       └── features/
│           ├── home/                 # Landing page
│           ├── auth/login/           # Login
│           ├── auth/register/        # Registration
│           ├── student/search/       # Tutor search with filters
│           ├── student/dashboard/    # Student dashboard
│           ├── tutor/profile/        # Public tutor profile view
│           ├── tutor/dashboard/      # Tutor dashboard
│           ├── tutor/profile-setup/  # Profile completion form
│           ├── booking/              # Booking management
│           └── chat/                 # Real-time messaging
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8+
- Angular CLI: `npm install -g @angular/cli`

---

### 1. Database Setup

```sql
-- Create database
CREATE DATABASE tutorfinder;

-- Run the schema
mysql -u root -p tutorfinder < backend/src/main/resources/schema.sql
```

---

### 2. Backend Setup

```bash
cd backend

# Configure your database credentials
# Edit src/main/resources/application.properties:
# spring.datasource.username=root
# spring.datasource.password=your_password

# Run
./mvnw spring-boot:run
```

Backend starts on: **http://localhost:8080**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Add your Google Maps API key (optional but recommended)
# Edit src/environments/environment.ts
# googleMapsApiKey: 'YOUR_KEY_HERE'

# Start dev server
ng serve
```

Frontend starts on: **http://localhost:4200**

---

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register student or tutor |
| POST | `/api/auth/login` | Login and get JWT token |

### Tutors
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tutors/search` | Public | Search nearby tutors (Haversine) |
| GET | `/api/tutors/{id}` | Public | Get tutor profile |
| GET | `/api/tutors/me` | Tutor | Get own profile |
| PUT | `/api/tutors/me` | Tutor | Update profile |

### Bookings
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings` | Student | Create booking |
| GET | `/api/bookings` | Any | Get my bookings |
| PATCH | `/api/bookings/{id}/status` | Any | Update booking status |

### Messages
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/messages` | Any | Send message |
| GET | `/api/messages/conversation/{partnerId}` | Any | Get conversation |
| GET | `/api/messages/previews` | Any | Get conversation list |

### Other
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/subjects` | Get all subjects |

### WebSocket
- **Endpoint:** `ws://localhost:8080/ws`
- **Subscribe:** `/user/{userId}/queue/messages` for real-time messages

---

## 🗄️ Database Schema

Key tables:
- **users** — Shared auth table for students, tutors, admins
- **tutor_profiles** — Tutor details with `latitude/longitude` for geo-search
- **student_profiles** — Student details
- **subjects** / **tutor_subjects** — Subject catalog and tutor-subject mapping
- **bookings** — Session bookings with status lifecycle
- **messages** — Chat messages between users
- **reviews** — Post-session ratings and reviews
- **tutor_documents** — Verification documents

---

## 🌟 Key Features

### 📍 Geolocation Search
Uses the **Haversine formula** in a native MySQL query for efficient distance-based tutor search:
```sql
(6371 * acos(cos(radians(:lat)) * cos(radians(latitude)) *
cos(radians(longitude) - radians(:lng)) +
sin(radians(:lat)) * sin(radians(latitude))))
```
Filter by: subject, price range, teaching mode, radius (1-50km).

### 🔒 Security
- JWT-based stateless authentication
- Role-based access control (STUDENT, TUTOR, ADMIN)
- BCrypt password hashing
- CORS configured for Angular dev server

### 💬 Real-Time Chat
- STOMP over SockJS WebSocket
- Messages pushed instantly to recipient via `/user/{id}/queue/messages`
- Conversation history stored in MySQL

---

## ⚙️ Configuration

### application.properties key settings
```properties
# Change these for production
jwt.secret=<base64-encoded-256-bit-key>
jwt.expiration=86400000  # 24 hours in ms
spring.datasource.password=<your-mysql-password>
app.cors.allowed-origins=http://localhost:4200
```

### Angular environment.ts
```typescript
export const environment = {
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'http://localhost:8080/ws',
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
};
```

---

## 🔮 Future Enhancements (Phase 2)
- Google Maps integration on the search page
- Payment gateway (Stripe/Razorpay)
- Video calling (WebRTC)
- Admin dashboard
- Email notifications
- Tutor document verification workflow
- Mobile app (Angular + Capacitor)

---

## 📄 License
MIT License
