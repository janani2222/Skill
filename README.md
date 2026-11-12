# SkillBridge – Student Skill Discovery & Project Collaboration Platform
## Phase 1 (MERN Stack Implementation)

**Tagline:** *Connect. Collaborate. Grow Together.*

SkillBridge is an institutional-grade student collaboration platform designed to empower collegiate innovators to showcase technical capabilities, discover talented peer innovators across engineering departments, and assemble high-impact project teams for academic capstones, hackathons, and research initiatives.

---

## 🏛️ Design System & Inspiration

The platform design strictly follows the classical university aesthetic:
- **Primary Navy:** `#10243B`
- **Secondary Navy:** `#182F4B`
- **Antique Gold:** `#B99545`
- **Light Gold:** `#D1B36A`
- **Background Cream:** `#F8F7F3`
- **White:** `#FFFFFF`
- **Main Text:** `#172638`
- **Secondary Text:** `#667085`
- **Typography:** *Playfair Display* (Main Headings & Titles) and *Lato* (Body, Navigation, Actions)

---

## 📁 Project Architecture

```
college project/
├── package.json                   # Root package runner
├── README.md                      # Comprehensive documentation
├── server/                        # Express + Node.js Backend
│   ├── config/
│   │   └── db.js                  # Local MongoDB connection (mongodb://127.0.0.1:27017/skillbridge_db)
│   ├── controllers/
│   │   ├── authController.js      # Student register, login, logout, getMe
│   │   ├── studentController.js   # Profile management, skills add/remove, avatar upload, activities
│   │   └── dashboardController.js # Dashboard metrics & platform-wide statistics
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT authentication verification
│   │   ├── errorMiddleware.js     # Centralized error handler
│   │   └── uploadMiddleware.js    # Multer image upload handling
│   ├── models/
│   │   ├── User.js                # Student user schema with bcrypt hashing
│   │   ├── StudentProfile.js      # Portfolio schema with dynamic completion %
│   │   ├── Skill.js               # Technical skill collection
│   │   └── Activity.js            # Audit activity timeline
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth routes
│   │   ├── studentRoutes.js       # /api/students routes
│   │   └── dashboardRoutes.js     # /api/dashboard, /api/statistics, /api/skills
│   ├── uploads/                   # Local storage for student profile avatars
│   ├── .env                       # Environment configuration
│   ├── package.json
│   └── server.js                  # Express entry point
└── client/                        # Vite + React Frontend
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx         # Classical university header with shield logo
    │   │   ├── Footer.jsx         # Collegiate footer with "Stay Connected" & quick links
    │   │   ├── Sidebar.jsx        # Dark navy dashboard sidebar with gold active indicators
    │   │   ├── TopNav.jsx         # Top search & student profile pill
    │   │   ├── FeatureCard.jsx    # Reusable university feature card
    │   │   ├── StatCard.jsx       # Reusable statistic widget
    │   │   └── ProtectedRoute.jsx # Route authentication guard
    │   ├── context/
    │   │   └── AuthContext.jsx    # React Context for auth state & session sync
    │   ├── pages/
    │   │   ├── LandingPage.jsx    # University-style landing page (Matches reference screenshot)
    │   │   ├── RegisterPage.jsx   # Split-screen student registration
    │   │   ├── LoginPage.jsx      # Split-screen student login
    │   │   ├── DashboardPage.jsx  # Student dashboard with metrics, completion bar & activity
    │   │   └── ProfilePage.jsx    # Portfolio page with skills management, avatar upload & edit modal
    │   ├── services/
    │   │   ├── api.js             # Axios instance with credentials
    │   │   ├── authService.js     # Auth API handlers
    │   │   └── studentService.js  # Profile, skills, and stats API handlers
    │   ├── styles/
    │   │   ├── global.css         # CSS variables, typography, reset, buttons
    │   │   ├── landing.css        # Landing page styling matching university reference
    │   │   ├── auth.css           # Split-screen authentication layouts
    │   │   ├── dashboard.css      # Dashboard & sidebar styling
    │   │   └── profile.css        # Portfolio header, tags, and modal styling
    │   ├── App.jsx                # Route declarations
    │   └── main.jsx               # React entry point
    ├── index.html                 # Playfair Display & Lato Google Fonts
    ├── package.json
    └── vite.config.js             # Vite configuration with /api & /uploads proxy
```

---

## 🚀 Step-by-Step Setup and Execution Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **MongoDB** running locally on default port `27017`
- **MongoDB Compass** (optional, to visually browse `skillbridge_db`)

### 2. Verify / Start Local MongoDB
SkillBridge connects to:
```
mongodb://127.0.0.1:27017/skillbridge_db
```
- If MongoDB is installed as a Windows Service, it starts automatically.
- To check or start MongoDB via terminal:
  ```powershell
  # Check if mongod service is running
  net start MongoDB
  ```
  Or launch `mongod` from your MongoDB `bin` folder.
- Open **MongoDB Compass**, connect to `mongodb://127.0.0.1:27017` to inspect collections (`users`, `studentprofiles`, `skills`, `activities`).

### 3. Running the Backend Server
Open a terminal in the project directory:
```bash
cd server
npm start
```
*The server will start on `http://localhost:5000` and automatically connect to `skillbridge_db`.*

### 4. Running the Frontend Client
Open a second terminal in the project directory:
```bash
cd client
npm run dev
```
*The Vite development server will start on `http://localhost:5173`.*

---

## 🌐 Navigating Phase 1 Pages

1. **Landing Page (`/`):**
   - Classical university design matching reference screenshot.
   - Large hero campus photo with students collaborating on laptops.
   - Overlapping white feature cards: *Create Your Profile*, *Discover Students*, *Build Projects*, *Grow Together*.
   - Navy section: *Explore Our Programs* with dynamic statistics from MongoDB.
   - Two columns: *Latest Campus News* & *Upcoming Events*.
   - "Stay Connected" newsletter form & deep navy footer.

2. **Student Registration Page (`/register`):**
   - Split-screen layout: campus photo on left, white card on right.
   - Form fields: Full Name, College Email, Password, Confirm Password, Department dropdown (CSE, AIDS, IT, ECE, EEE, MECH, CIVIL, Other), Year of Study (First to Fourth Year), Terms checkbox.
   - Password hashing with bcrypt, input validation, duplicate email prevention.

3. **Student Login Page (`/login`):**
   - Split-screen layout matching registration.
   - Authenticates via JWT, stores session token in HTTP-only cookie and localStorage backup.
   - Protected routes automatically redirect unauthenticated users to `/login`.

4. **Student Dashboard (`/dashboard`):**
   - Dark navy sidebar with shield logo, active gold indicator, student details.
   - Personalized welcome banner: "Hello, [Student Name]!".
   - Dynamic profile completion progress bar and percentage.
   - 4 Statistics cards: *Technical Skills Listed*, *Projects Joined (0 for Phase 1)*, *Profile Completion*, *Account Status*.
   - Student academic details, skill tags, academic interests, portfolio links.
   - Recent activity feed from MongoDB (account creation, profile edits, skill additions).

5. **Student Profile Page (`/profile`):**
   - Portfolio header with avatar upload via Multer (stored in `server/uploads/`).
   - About Me personal bio section.
   - Education card: Institution, Degree, Department, Year, Graduation Year, Location.
   - Technical Skills management: Add new skills with category, quick-add suggestion chips, delete skills with instant updates, duplicate prevention.
   - Academic interests tags management.
   - Social & Portfolio links (GitHub, LinkedIn, Personal Website).
   - "Edit Profile" modal with Save Changes (updates MongoDB) and Cancel (discards changes).

---

## 📡 Backend API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register student, hash password, create profile & activity | Public |
| `POST` | `/api/auth/login` | Authenticate student, verify bcrypt password, issue JWT | Public |
| `POST` | `/api/auth/logout` | Clear session cookie | Private |
| `GET` | `/api/auth/me` | Fetch currently logged in student session & profile | Private |

### Student Profile (`/api/students`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/students/me` | Get student profile with populated skills & user info | Private |
| `PUT` | `/api/students/me` | Update student details, bio, links, and recalculate % | Private |
| `POST` | `/api/students/me/profile-image` | Upload profile image via Multer | Private |
| `POST` | `/api/students/me/skills` | Add technical skill to student profile | Private |
| `DELETE`| `/api/students/me/skills/:skillId` | Remove skill from student profile | Private |
| `GET` | `/api/students/me/activities` | Get student's recent activity history | Private |

### Platform & Dashboard (`/api`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/dashboard` | Get student dashboard stats, completion %, and feed | Private |
| `GET` | `/api/statistics` | Get public platform statistics for Landing Page | Public |
| `GET` | `/api/skills` | Get all skills / seed default skills | Public |

