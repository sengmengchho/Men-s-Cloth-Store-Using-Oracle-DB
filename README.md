#  Men's Clothing Store

A full-stack e-commerce platform for men's clothing, built with **Oracle**, **Django**, and **React**.

Customers can browse products, register, and place orders. Sale staff can manage orders and search customers. Admins can manage everything including products, users, sales logs, and database backups.

---

##  Features

| Role | What they can do |
|---|---|
|  **Customer** | Register, login, browse products, add to cart with size & color variants, place orders, view order history |
|  **Sale Staff** | Process orders, update order status, search customers, view sales reports |
|  **Admin** | Manage products, manage users, view sales logs, export database backups, upload product images |

### Highlights
-  Role-based access control (3 Oracle roles)
-  JWT authentication
-  Product variants (size × color × stock)
-  Automatic stock management via Oracle triggers
-  Audit log via Oracle triggers
-  Product image uploads
-  Database backup as SQL or JSON
-  Two intentional design languages: ZANDO retail + Mr Porter luxury

---

##  Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router, Axios |
| **Backend** | Django 5, Django REST Framework, Simple JWT |
| **Database** | Oracle 21c XE (PDB: `xepdb1`) |
| **Database Driver** | python-oracledb |
| **Authentication** | JWT (JSON Web Tokens) |

---

##  Project Structure

```
men-cloth-store/
├── backend/                        # Django REST API
│   ├── mens_store/                 # Project settings
│   │   ├── settings.py             # Main configuration
│   │   ├── urls.py                 # Root URL routes
│   │   └── wsgi.py
│   ├── store/                      # Main application
│   │   ├── models.py               # Database models
│   │   ├── views.py                # API endpoints
│   │   ├── serializers.py          # JSON serializers
│   │   ├── urls.py                 # API routes
│   │   ├── utils.py                # Helper functions (Oracle connection)
│   │   └── permissions.py          # Role-based permissions
│   ├── media/                      # Uploaded product images
│   ├── requirements.txt            # Python dependencies
│   ├── manage.py
│   └── .env.example                # Environment variable template
│
├── frontend/                       # React + Vite client
│   ├── src/
│   │   ├── api/                    # API client (axios)
│   │   ├── components/             # Shared components (Navbar)
│   │   ├── pages/                  # Route pages
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Customer/           # Customer pages
│   │   │   ├── sale/               # Sale staff pages
│   │   │   └── admin/              # Admin pages
│   │   ├── utils/                  # Helper functions
│   │   ├── App.jsx                 # Main routing
│   │   └── main.jsx                # Entry point
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── Cloth Store.sql                 # Database schema (legacy)
├── System-Clothes.sql              # Full database script (use this one)
├── requirements.txt                # Root Python deps
├── .gitignore
└── README.md
```

---

##  Prerequisites

Before starting, make sure you have these installed:

| Tool | Version | Download |
|---|---|---|
| **Python** | 3.10 or higher | https://python.org |
| **Node.js** | 18 or higher | https://nodejs.org |
| **Oracle Database XE** | 21c | https://oracle.com/database/technologies/xe-downloads.html |
| **Oracle SQL Developer** | Latest | https://oracle.com/database/sqldeveloper |
| **Git** | Latest | https://git-scm.com |

Verify installation:
```bash
python --version    # Should show Python 3.10+
node --version      # Should show v18+
npm --version       # Should show 9+
git --version       # Should show 2.30+
```

---

##  Setup Guide (Step-by-Step)

Follow these 5 steps in order. Estimated time: **1-2 hours** for first-time setup.

---

### Step 1: Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/doeunbunheng/men-cloth-store.git
cd men-cloth-store
```

---

### Step 2: Set Up the Database (Oracle)

#### 2.1 Connect to Oracle

Open **SQL Developer** and connect as `SYSTEM` user to your Oracle XE instance.

#### 2.2 Switch to the pluggable database

```sql
ALTER SESSION SET CONTAINER = xepdb1;
```

#### 2.3 Run the database script

1. Open `System-Clothes.sql` in SQL Developer
2. Run the entire file (`F5`)
3. This will create:
   - 7 tables (products, users, customers, orders, order_items, sales_log, product_variants)
   - 4 views
   - 6 triggers
   - 2 stored procedures
   - 3 roles (admin, sale, customer)
   - Sample data (5 products + admin user)

#### 2.4 Verify the setup

```sql
SELECT COUNT(*) FROM products;          -- should return 5
SELECT COUNT(*) FROM users;             -- should return 1+ (admin)
SELECT table_name FROM user_tables;     -- should list all 7 tables
```

If everything looks good, the database is ready. 

---

### Step 3: Set Up the Backend (Django)

#### 3.1 Create a Python virtual environment

```bash
cd backend
python -m venv venv
```

Activate it:

**Windows (PowerShell):**
```bash
venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```bash
venv\Scripts\activate.bat
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal prompt.

#### 3.2 Install dependencies

```bash
pip install -r requirements.txt
```

This installs Django, DRF, python-oracledb, and other packages.

#### 3.3 Configure environment variables

Copy the example file:

**Windows:**
```bash
copy .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

Open the new `.env` file in a text editor and fill in your values:

```env
# Django
SECRET_KEY=your-50-character-random-string-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Oracle Database
DB_NAME=localhost:1521/xepdb1
DB_USER=SYSTEM
DB_PASSWORD=YourOraclePassword

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**To generate a SECRET_KEY**, run this command:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the output and paste it as your `SECRET_KEY`.

#### 3.4 Apply Django migrations

```bash
python manage.py migrate
```

This sets up Django's internal tables (auth, sessions, admin).

#### 3.5 Create a Django superuser (optional)

For accessing Django admin panel:

```bash
python manage.py createsuperuser
```

Follow the prompts to create your admin account.

#### 3.6 Start the backend server

```bash
python manage.py runserver 8000
```

You should see:

```
Watching for file changes with StatReloader
System check identified no issues (0 silenced).
Django version 5.0.6, using settings 'mens_store.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

#### 3.7 Test the API

Open this URL in your browser:

```
http://localhost:8000/api/products/
```

You should see a JSON response with 5 products. ✅

**Keep this terminal open.** The backend must stay running.

---

### Step 4: Set Up the Frontend (React)

#### 4.1 Open a NEW terminal

(Don't close the backend terminal — open a second one.)

#### 4.2 Navigate to frontend folder

```bash
cd frontend
```

#### 4.3 Install dependencies

```bash
npm install
```

This downloads React, Vite, axios, and all other packages (takes 1-2 minutes).

#### 4.4 Configure environment variables

Create a file named `.env` in the `frontend/` folder:

```env
VITE_API_URL=http://localhost:8000/api
```

#### 4.5 Start the frontend dev server

```bash
npm run dev
```

You should see:

```
  VITE v5.x.x  ready in 543 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

#### 4.6 Open the app in your browser

Go to:

```
http://localhost:3000
```

You should see the **ZANDO-style white navbar** with "MEN'S." logo and the products page. 

---

### Step 5: Try the App!

#### 5.1 Register a new customer

1. Click **Register** in the top right
2. Fill in the form (username, password, full name, email, phone, address)
3. Submit → you'll be redirected to login

#### 5.2 Login as your new customer

1. Enter your username and password
2. You'll be redirected to the products page

#### 5.3 Place an order

1. Click on a product
2. Select size and color in the variant modal
3. Add to cart
4. Open the cart sidebar (top right)
5. Click "Place Order"
6. Check the Oracle `sales_log` table — your order is auto-logged by a trigger 

#### 5.4 Login as Admin

The system has a default admin account (see your `System-Clothes.sql` file for credentials).

1. Logout
2. Login as the admin user
3. You'll see additional links: Dashboard, Users, Products, Backup
4. Explore the admin features

---

##  API Endpoints

The backend exposes these endpoints under `/api/`:

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login/` | Login with username + password, returns JWT token |
| `POST` | `/api/register/` | Register a new customer account |
| `GET` | `/api/me/` | Get current logged-in user info |

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products/` | List all products |
| `GET` | `/api/products/<id>/` | Get a single product |
| `GET` | `/api/products/<id>/variants/` | List variants of a product |
| `GET` | `/api/variants/<id>/` | Get a single variant |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders/` | List orders (filtered by user role) |
| `POST` | `/api/orders/` | Create a new order |
| `PATCH` | `/api/orders/<id>/status/` | Update order status (Sale/Admin only) |
| `GET` | `/api/orders/<id>/items/` | Get items in an order |

### Admin Tools
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/` | List all users (Admin only) |
| `GET` | `/api/sales-log/` | View sales audit log (Admin only) |
| `POST` | `/api/backup/` | Export database backup |
| `GET` | `/api/customers/search/` | Search customers by name/phone |

All endpoints require JWT authentication except `/api/login/` and `/api/register/`. Pass the token in the header:

```
Authorization: Bearer <your-jwt-token>
```

---

##  Security Notes

1. **Never commit `.env` files** — they contain real passwords
2. **Each developer creates their own `.env`** from `.env.example`
3. **Passwords are hashed** with Django PBKDF2 before storing
4. **JWT tokens expire** after 4 hours (configurable in `settings.py`)
5. **Database access** uses parameterized queries (SQL injection protected)
6. **CORS** is locked to specific origins (no `*` in production)

---

##  Troubleshooting

### Backend issues

| Error | Cause | Fix |
|---|---|---|
| `ORA-12541: TNS:no listener` | Oracle service not running | Start Oracle service from Services (Windows) or `systemctl start oracle-xe` (Linux) |
| `ORA-01017: invalid username/password` | Wrong DB credentials | Check `DB_USER` and `DB_PASSWORD` in `.env` |
| `decouple.UndefinedValueError` | Missing env variable | Make sure `.env` exists in `backend/` and has all required keys |
| `ImportError: No module named 'oracledb'` | Missing dependency | Run `pip install -r requirements.txt` |
| `Port 8000 already in use` | Another process running | Run `python manage.py runserver 8001` (different port) |

### Frontend issues

| Error | Cause | Fix |
|---|---|---|
| `npm: command not found` | Node.js not installed | Install Node.js from nodejs.org |
| `Failed to fetch` | Backend not running | Check the backend terminal is still running |
| `CORS error` | Frontend URL not in CORS_ALLOWED_ORIGINS | Add `http://localhost:3000` to backend `.env` |
| `Port 3000 already in use` | Another app using port 3000 | Edit `vite.config.js` to use a different port |

### Database issues

| Error | Cause | Fix |
|---|---|---|
| `ORA-04091: table is mutating` | Trigger issue | Check the compound triggers are installed correctly |
| `Permission denied` | Wrong Oracle role | Make sure user has the right role assigned |
| Tables missing | Schema not loaded | Re-run `System-Clothes.sql` |

---

##  Team Workflow

This project uses a **feature-branch workflow** with GitHub.

### Daily workflow

1. **Pull latest changes** before starting:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create your feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes**, then commit:
   ```bash
   git add .
   git commit -m "Add new feature description"
   ```

4. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** on GitHub:
   - Go to https://github.com/doeunbunheng/men-cloth-store/pulls
   - Click "New pull request"
   - Select your branch
   - Add a description
   - Submit

6. **Team reviews and merges** into main

### Important rules

-  **Never push directly to `main`** — always use a feature branch
-  **Never commit `.env` files** — they contain passwords
-  **Never commit `venv/`, `node_modules/`, or `*.dmp` files**
-  **Always pull before pushing** to avoid conflicts
-  **Write clear commit messages** explaining what you changed
-  **Test locally** before pushing

---

##  Team Members

| Name | Student ID | Role |
|---|---|---|
| Chheng Sothean | — | Project Lead |
| Chiv Mengchou | e20221028 | Database Design |
| Chho Sengmeng | e20220296 | Security & Roles |
| Choub Botumraksa | e20221709 | Triggers & Procedures |
| Din Reaksa | e20221070 | Backend (Django) |
| Doeun Bunheng | e20221528 | Frontend (React) |
| Mon Sreylin | e20221701 | QA & Demo |

---

##  License

This project was built for educational purposes as part of the Database Design and Administration course.

---

##  Need Help?

-  Check the [Troubleshooting](#-troubleshooting) section above
-  Open an issue on GitHub: https://github.com/doeunbunheng/men-cloth-store/issues
-  Contact the team lead

---

##  What You'll Learn

By working on this project, you'll gain hands-on experience with:

-  Full-stack web development
-  RESTful API design with Django
-  Modern frontend development with React + Vite
-  Oracle Database with PL/SQL (triggers, procedures, views)
-  Role-based access control (RBAC)
-  JWT authentication flow
-  Git collaboration with feature branches
-  Environment variable management
-  Professional UI design principles

---

**Made with  by the Men's Clothing Store team — Cambodia, 2026**