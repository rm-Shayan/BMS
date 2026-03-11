# API Endpoints Documentation

This document provides details for all available API endpoints in the Bootcamp Backend.

## Base URL
`https://your-vercel-domain.vercel.app/api/v1`

---

## 🔐 Auth Endpoints

### Admin Auth
- **POST** `/auth/admin/login` - Admin login
- **POST** `/auth/admin/register` - Create new admin account (restricted)

### Student Auth
- **POST** `/auth/student/login` - Student login
- **POST** `/auth/student/register` - Student registration

### Mentor Auth
- **POST** `/auth/mentor/login` - Mentor login
- **POST** `/auth/mentor/register` - Mentor registration

---

## 👨‍💼 Admin Endpoints
*Requires Admin Role*

### User Management
- **GET** `/admin/me` - Get current admin profile
- **POST** `/admin/logout` - Logout admin
- **GET** `/admin/all` - Get all users (students/mentors)
- **POST** `/admin/create-student` - Create a new student (supports file upload)
- **POST** `/admin/create-mentor` - Create a new mentor (supports file upload)
- **PUT** `/admin/update` - Update user profile
- **GET** `/admin/search` - Search for users
- **PUT** `/admin/status/:id` - Update user status (active/inactive)
- **PATCH** `/admin/dropout/:id` - Mark student as dropout
- **PATCH** `/admin/block/:id` - Block/Unblock user
- **DELETE** `/admin/delete/:id` - Delete a user

### Bootcamp & Content
- **GET** `/admin/bootcamps` - List all bootcamps
- **POST** `/admin/bootcamps` - Create a new bootcamp
- **GET** `/admin/bootcamp/dashboard` - Admin dashboard statistics
- **GET** `/admin/bootcamp/announcements` - Manage announcements
- **GET** `/admin/bootcamp/assignments` - Manage assignments across bootcamps
- **GET** `/admin/bootcamp/domains` - Manage learning domains

---

## 🎓 Student (Intern) Endpoints
*Requires Student Role*

- **GET** `/student/me` - Get student profile
- **GET** `/student/bootcamp/dashboard` - Student dashboard with progress
- **POST** `/student/bootcamp/daily-progress/add` - Add daily progress update
- **GET** `/student/bootcamp/daily-progress` - Get student's daily progress logs
- **POST** `/student/bootcamp/submissions/submit` - Submit an assignment
- **GET** `/student/bootcamp/submissions/my-submissions` - Get student's submissions (paginated)

---

## 🧑‍🏫 Mentor Endpoints
*Requires Mentor Role*

- **GET** `/mentor/me` - Get mentor profile
- **GET** `/mentor/bootcamp/dashboard` - Mentor dashboard (assigned bootcamp)
- **GET** `/mentor/bootcamp/domains` - View bootcamp domains
- **GET** `/mentor/bootcamp/assignments` - View/Create assignments for bootcamp
- **POST** `/mentor/bootcamp/assignments/create-assignment` - Create new assignment
- **GET** `/mentor/bootcamp/submissions/all` - View all student submissions (paginated; query: `page`, `limit`, optional `status`, `studentId`)
- **GET** `/mentor/bootcamp/submissions/all/:assignmentId` - View submissions for a given assignment
- **PATCH** `/mentor/bootcamp/submissions/review/:id` - Review a submission (`status`: `accepted`|`rejected`|`reviewed`, optional `feedback`, `score`)

---

## ⚙️ System / Cron
- **GET** `/cron/send-emails` - Trigger pending welcome emails (Requires `Authorization: Bearer <CRON_SECRET>` in production)
