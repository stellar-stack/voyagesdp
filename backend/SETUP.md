# Voyage Backend — Setup Guide

This is your step-by-step guide to get the project running, including how to install
every tool the backend needs and how to get the optional API keys.

---

## Prerequisites

You need three things installed on your machine:

| Tool | Why | Link |
|------|-----|------|
| Python 3.11+ | Runs Django | https://www.python.org/downloads/ |
| Docker Desktop | Runs PostgreSQL + Redis | https://www.docker.com/products/docker-desktop/ |
| Git | Version control | Already installed on most machines |

---

## Step 1 — Install Docker Desktop (Windows)

1. Go to: https://www.docker.com/products/docker-desktop/
2. Click **"Download for Windows"**
3. Run the installer — accept all defaults
4. After install, **restart your computer**
5. Open Docker Desktop from the Start menu — wait for it to show "Engine running" (green icon)

> **Why Docker?** It runs PostgreSQL (the production database) and Redis (for caching and
> real-time WebSockets) in isolated containers. You don't need to install them separately.

---

## Step 2 — Get your OpenAI API Key (free, for AI moderation)

The AI moderation system uses OpenAI's **Moderation API** which is completely free —
no credit card charges per call, you just need an account.

1. Go to: https://platform.openai.com/
2. Sign up (it's free — you don't need to add a credit card for the Moderation API)
3. Go to **API Keys** in your dashboard: https://platform.openai.com/api-keys
4. Click **"Create new secret key"** → give it a name → copy the key
5. You'll paste this into your `.env` file in the next step

> **What happens without a key?** The system falls back to a local keyword-based filter
> (using `better-profanity`). It works but is less accurate than the AI model.

---

## Step 3 — Configure Your Environment

```bash
# In the backend directory:
cd s:\furqan\voyage\backend

# Copy the example env file
copy .env.example .env
```

Now open `.env` in any text editor and fill in:

```env
# Required — generate a random one at: https://djecrety.ir/
SECRET_KEY=your-long-random-secret-key

DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Set to True to use PostgreSQL (recommended, Docker handles this)
USE_POSTGRES=True
DB_NAME=voyage
DB_USER=voyage_user
DB_PASSWORD=voyage_pass
DB_HOST=localhost
DB_PORT=5432

# Redis (Docker handles this too)
REDIS_URL=redis://localhost:6379/0

# Your OpenAI key from Step 2
OPENAI_API_KEY=sk-...your-key-here...

# Leave blank during development (emails print to the terminal)
EMAIL_HOST_USER=
```

---

## Step 4 — Start the Project

### Option A: With Docker (recommended — runs everything automatically)

```bash
cd s:\furqan\voyage\backend

# Build and start all services (PostgreSQL + Redis + Django)
docker-compose up --build
```

Wait about 30–60 seconds. You'll see "Django version... Starting development server".
The API is now running at: **http://localhost:8000**

On subsequent starts (no code changes):
```bash
docker-compose up
```

To stop everything:
```bash
docker-compose down
```

To stop and delete all data (fresh start):
```bash
docker-compose down -v
```

---

### Option B: Without Docker (SQLite, no Redis)

If you can't use Docker, you can run with SQLite and no WebSockets:

```bash
cd s:\furqan\voyage\backend

# 1. Create a virtual environment
python -m venv venv
venv\Scripts\activate         # Windows
# source venv/bin/activate    # Mac/Linux

# 2. Install all packages
pip install -r requirements.txt

# 3. Set up your .env (keep USE_POSTGRES=False, leave REDIS_URL as-is)

# 4. Run migrations
python manage.py makemigrations
python manage.py migrate

# 5. Start the server
python manage.py runserver
```

> Note: Without Redis, caching and real-time WebSockets won't work, but all
> REST API endpoints will function normally.

---

## Step 5 — Create Your Admin Account

After starting the server, create a superuser (admin account):

### With Docker:
```bash
docker-compose exec web python manage.py createsuperuser
```

### Without Docker:
```bash
python manage.py createsuperuser
```

Enter a username, email, and password. Then:
- Go to http://localhost:8000/admin/ to access the Django admin panel
- Or use the API to log in at http://localhost:8000/api/v1/auth/token/

---

## Step 6 — Run Migrations (first time only)

If you add new migrations after changing models:

### With Docker:
```bash
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate
```

### Without Docker:
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## API Documentation

Once the server is running, visit:

| URL | Description |
|-----|-------------|
| http://localhost:8000/api/docs/ | Swagger UI (interactive) |
| http://localhost:8000/api/redoc/ | ReDoc (clean documentation) |
| http://localhost:8000/admin/ | Django admin panel |

---

## Running Tests

```bash
# With Docker:
docker-compose exec web pytest tests/ -v

# Without Docker (activate venv first):
pytest tests/ -v
```

---

## WebSocket Connections (Real-time)

Once the server is running with Redis:

| WebSocket URL | Purpose |
|---|---|
| `ws://localhost:8000/ws/notifications/` | Real-time notifications |
| `ws://localhost:8000/ws/messages/{conversation_id}/` | Direct messages |

The WebSocket connections authenticate using the same JWT cookie that the REST API uses.
Your frontend just connects to the WebSocket URL — no extra token setup needed.

---

## Complete API Reference

All endpoints are now under `/api/v1/`. Key endpoints:

### Authentication
```
POST   /api/v1/auth/register/                  Register
GET    /api/v1/auth/verify-email/?token=...    Verify email
POST   /api/v1/auth/token/                     Login
POST   /api/v1/auth/token/refresh/             Refresh JWT
POST   /api/v1/auth/logout/                    Logout
```

### Users
```
GET    /api/v1/auth/users/me/                  My profile
PUT    /api/v1/auth/users/me/update/           Update profile
GET    /api/v1/auth/users/{username}/          Any user profile
GET    /api/v1/auth/users/search/?q=...        Search users
POST   /api/v1/auth/users/follow/              Follow/unfollow
GET    /api/v1/auth/users/{username}/followers/
GET    /api/v1/auth/users/{username}/following/
```

### Posts
```
POST   /api/v1/posts/create/                   Create post
GET    /api/v1/posts/feed/                     Feed (paginated, cached)
GET    /api/v1/posts/community/{id}/           Community feed
POST   /api/v1/posts/react/                    React to post (LIKE/LOVE/LAUGH/ANGRY/SAD/WOW)
POST   /api/v1/posts/share/                    Share post
POST   /api/v1/posts/comment/                  Add comment (or reply with parent_id)
GET    /api/v1/posts/{id}/comments/            Get comments (with nested replies)
PUT    /api/v1/posts/{id}/edit/                Edit post
DELETE /api/v1/posts/{id}/delete/              Delete post
POST   /api/v1/posts/{id}/bookmark/            Bookmark/unbookmark
GET    /api/v1/posts/bookmarks/                My bookmarks
```

### Communities
```
POST   /api/v1/communities/create/             Create community
GET    /api/v1/communities/                    List all communities
GET    /api/v1/communities/{id}/               Community detail
PUT    /api/v1/communities/{id}/update/        Update community
POST   /api/v1/communities/join/               Join/leave community
GET    /api/v1/communities/{id}/members/       Community members
GET    /api/v1/communities/me/                 My communities
POST   /api/v1/communities/{id}/moderators/add/
DELETE /api/v1/communities/{id}/moderators/{user_id}/remove/
```

### Moderation
```
POST   /api/v1/moderation/reports/create/     Report a post
GET    /api/v1/moderation/reports/            List reports (admin)
PUT    /api/v1/moderation/reports/{id}/resolve/ Resolve/dismiss report (admin)
DELETE /api/v1/moderation/posts/{id}/delete/  Admin delete post
POST   /api/v1/moderation/users/{id}/suspend/ Suspend user (admin)
GET    /api/v1/moderation/notifications/      My notifications
POST   /api/v1/moderation/notifications/{id}/read/
POST   /api/v1/moderation/notifications/read-all/
GET    /api/v1/moderation/ai-violations/      AI violation logs (admin)
POST   /api/v1/moderation/ai-violations/{id}/false-positive/  Mark false positive
```

### Admin User Management
```
POST   /api/v1/auth/admin/users/{id}/suspend/           Suspend user
POST   /api/v1/auth/admin/users/{id}/violations/clear/  Clear violations
POST   /api/v1/auth/admin/users/{id}/promote/           Promote to MODERATOR
```

### Messaging
```
GET    /api/v1/messages/                       My conversations
POST   /api/v1/messages/send/                 Start/send message
GET    /api/v1/messages/{conversation_id}/messages/  Get messages
DELETE /api/v1/messages/messages/{id}/delete/  Delete (unsend) a message
```

---

## AI Moderation — How It Works

Every time a user creates a post or comment, the content is automatically sent to the
AI moderation service:

1. **OpenAI Moderation API** checks the text against categories:
   hate, harassment, self-harm, sexual, violence, etc.

2. If OpenAI is unavailable, **better-profanity** (local keyword filter) runs instead.

3. If content is **flagged**:
   - The content is immediately soft-deleted
   - The user's `violation_count` is incremented
   - The user gets an in-app notification explaining what happened

4. **Escalation based on violation count:**

   | Violations | Punishment |
   |---|---|
   | 1–2 | Warning only |
   | 3 | 7-day account suspension |
   | 5 | 30-day account suspension |
   | 7+ | Permanent ban |

5. **Admins can:**
   - View all AI violation logs at `/api/v1/moderation/ai-violations/`
   - Mark a violation as a false positive (reverses 1 violation count)
   - Manually clear all violations for a user
   - Reinstate permanently banned users

---

## Troubleshooting

**"ModuleNotFoundError: No module named 'decouple'"**
→ Run `pip install -r requirements.txt` inside your virtual environment.

**"FATAL: database 'voyage' does not exist"**
→ Docker didn't start yet. Run `docker-compose up` first.

**"Connection refused" on Redis**
→ Docker isn't running. Open Docker Desktop and wait for the green "Engine running" status.

**"Invalid token" on WebSocket**
→ Make sure you're logged in via the REST API first so the cookie is set.

**"Table doesn't exist" error**
→ Run `python manage.py migrate` (or the docker-compose exec version).
