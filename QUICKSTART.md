# Quick Start Guide - Plumbing CRM

Get the Plumbing CRM up and running in 5 minutes!

## Prerequisites

- Node.js (v14+) - [Download](https://nodejs.org/)
- MongoDB (v4.4+) - [Download](https://www.mongodb.com/try/download/community)
- Git - [Download](https://git-scm.com/)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd plumbing-crm
```

### 2. Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and update JWT_SECRET (important!)
# You can generate a secure key with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Start MongoDB (if not already running)
# On Mac/Linux: sudo systemctl start mongod
# On Windows: net start MongoDB

# Start backend server
npm start
```

Backend will run on `http://localhost:5000`

### 3. Setup Frontend

```bash
# Open a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start frontend dev server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Access the Application

1. Open browser and go to `http://localhost:5173`
2. Click "Register" to create your first account
3. Choose "ADMIN" role for full access
4. Login and start using the CRM!

## Verification Checklist

- [ ] Backend server is running on port 5000
- [ ] MongoDB is connected successfully
- [ ] Frontend is accessible on port 5173
- [ ] Can register a new user
- [ ] Can login successfully
- [ ] Dashboard loads with statistics
- [ ] Can create an invoice
- [ ] Can view products
- [ ] Can add customers

## Common Issues

### Backend won't start

**MongoDB Connection Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB service
```bash
# Mac/Linux
sudo systemctl start mongod

# Windows
net start MongoDB

# Check if running
mongo --eval "db.version()"
```

**JWT_SECRET Missing:**
```
Error: JWT_SECRET not configured
```
**Solution:** Add JWT_SECRET to backend/.env
```bash
JWT_SECRET=your-secret-key-here
```

### Frontend build fails

**Node modules not found:**
```
Error: Cannot find module 'vite'
```
**Solution:** Install dependencies
```bash
cd frontend
npm install
```

### Port Already in Use

**Backend (Port 5000):**
```bash
# Find and kill process using port 5000
# Mac/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Frontend (Port 5173):**
```bash
# Similar to above, replace 5000 with 5173
```

## Next Steps

### Learn the Application
- Read [USER_GUIDE.md](USER_GUIDE.md) for detailed usage instructions
- Check [API.md](API.md) for API documentation
- Review [README.md](README.md) for comprehensive information

### Deploy to Production
- Follow [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions
- Use Render for backend (free tier available)
- Use Vercel for frontend (free tier available)

### Customize
- Update business name in `frontend/src/pages/CreateInvoice.jsx`
- Modify products in `backend/data/products.json`
- Adjust styling in `frontend/src/index.css`

## Testing the Application

### Test Customer Creation
```bash
# Create a customer
curl -X POST http://localhost:5000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Customer","mobile":"9876543210"}'
```

### Test Invoice Creation
```bash
# First, register and get a token
TOKEN="your-token-here"

# Create an invoice
curl -X POST http://localhost:5000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customerName": "Test Customer",
    "customerMobile": "9876543210",
    "items": [{
      "productName": "Test Product",
      "sizeMM": 15,
      "qty": 10,
      "price": 100,
      "discount": 0,
      "baseAmount": 1000,
      "amount": 1000
    }],
    "subTotal": 1000,
    "total": 1000
  }'
```

## Development Workflow

### Backend Development

```bash
cd backend

# Make changes to files

# Restart server (Ctrl+C then npm start)
# Or use nodemon for auto-restart:
npm install -g nodemon
nodemon server.js
```

### Frontend Development

```bash
cd frontend

# Vite auto-reloads on file changes
# Just make changes and save
npm run dev
```

### Testing Changes

1. Make code changes
2. Test in browser
3. Check console for errors
4. Verify functionality
5. Commit changes

## Environment Variables Reference

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/plumbing_crm
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000
```

## Default Credentials

No default credentials exist. You must register the first user through the application interface.

**Recommended First User:**
- Role: ADMIN (for full access)
- Email: Your real email
- Password: Strong password (min 6 characters)

## Support

For issues or questions:
1. Check documentation files
2. Review error messages
3. Check browser console (F12)
4. Review backend logs
5. Open an issue on GitHub

## Quick Commands Reference

```bash
# Backend
cd backend
npm install          # Install dependencies
npm start            # Start server

# Frontend  
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
mongo                # Open MongoDB shell
show dbs             # List databases
use plumbing_crm     # Select database
db.customers.find()  # View customers
db.invoices.find()   # View invoices
```

## Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to a strong random string
- [ ] Update MONGODB_URI to production database
- [ ] Update FRONTEND_URL to production domain
- [ ] Update VITE_API_BASE_URL to production backend
- [ ] Enable HTTPS on both frontend and backend
- [ ] Set NODE_ENV=production
- [ ] Test all functionality
- [ ] Setup database backups
- [ ] Configure monitoring

---

**Congratulations!** 🎉 You should now have a fully functional Plumbing CRM running locally.

For detailed usage instructions, see [USER_GUIDE.md](USER_GUIDE.md).
For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).
