# Internal Tech Issue & Feature Tracker

A collaborative backend platform for software teams to report bugs, create feature requests, and manage issue workflows.

## Live URL

https://ticket-issue2.vercel.app/

---

## Features

### Authentication
- User registration
- User login with JWT authentication
- Password hashing using bcrypt
- Role based access control

### Roles
#### Contributor
- Register and login
- Create issues
- View all issues
- Update own issues only when status is `open`

#### Maintainer
- All contributor permissions
- Update any issue
- Delete any issue

### Issue Management
- Create issue
- Get all issues
- Filter issues by type and status
- Sort issues by newest or oldest
- Get single issue
- Update issue
- Delete issue

---

## Tech Stack

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Raw SQL
- bcrypt
- jsonwebtoken

---

## Project Setup

### Clone repository

```bash
git clone https://github.com/Razaan-RR/Ticket_Issue
cd devpulse
```

### Install dependencies

```bash
npm install
```

### Create `.env`

```env
PORT=5000

DATABASE_URL=your_database_url

JWT_SECRET=your_secret_key

JWT_REFRESH_SECRET=your_refresh_secret
```

### Run project

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

Server runs on:

```txt
http://localhost:5000
```

---

## API Endpoints

### Authentication

Register:

```http
POST /api/auth/signup
```

Login:

```http
POST /api/auth/login
```

---

### Issues

Create Issue:

```http
POST /api/issues
```

Get All Issues:

```http
GET /api/issues
```

Filters:

```http
GET /api/issues?sort=newest

GET /api/issues?sort=oldest

GET /api/issues?type=bug

GET /api/issues?status=open
```

Get Single Issue:

```http
GET /api/issues/:id
```

Update Issue:

```http
PATCH /api/issues/:id
```

Delete Issue:

```http
DELETE /api/issues/:id
```

---

## Database Schema Summary

### users

| Field | Type |
|---|---|
| id | SERIAL |
| name | VARCHAR |
| email | VARCHAR |
| password_hash | TEXT |
| role | contributor / maintainer |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

### issues

| Field | Type |
|---|---|
| id | SERIAL |
| title | VARCHAR |
| description | TEXT |
| type | bug / feature_request |
| status | open / in_progress / resolved |
| reporter_id | INTEGER |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

## Author

Razaan Reza