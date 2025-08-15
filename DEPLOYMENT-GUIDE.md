# 🚀 Dashboard.aigrowise.com Deployment Guide

## **Quick Fix for Login Issues**

Your dashboard is accessible but login isn't working. This guide will fix it in 10 minutes.

## **📋 What You Need**

- SSH access to your production server
- Your production database credentials (host, username, password, database name)
- 5-10 minutes of your time

## **🔧 Step-by-Step Fix**

### **Step 1: SSH into Your Server**
```bash
ssh your-username@your-server-ip
```

### **Step 2: Navigate to App Directory**
```bash
cd /opt/aigrowise
```

### **Step 3: Copy the Deployment Script**
Copy the `deploy-dashboard.sh` file to your server.

### **Step 4: Make Script Executable**
```bash
chmod +x deploy-dashboard.sh
```

### **Step 5: Run the Deployment**
```bash
./deploy-dashboard.sh
```

The script will:
- Ask for your database credentials
- Create the proper `.env` file
- Generate secure authentication secrets
- Deploy the application
- Create an admin user account
- Test everything works

## **🎯 What This Fixes**

- ✅ **Missing environment variables** - Creates proper `.env` file
- ✅ **Authentication secrets** - Generates secure `NEXTAUTH_SECRET`
- ✅ **Database connection** - Configures proper `DATABASE_URL`
- ✅ **User accounts** - Creates admin user for login
- ✅ **Application restart** - Ensures all changes take effect

## **🔑 After Deployment**

You'll get login credentials:
- **Email:** admin@aigrowise.com
- **Password:** [generated automatically]

## **🧪 Test the Fix**

1. Go to https://dashboard.aigrowise.com
2. Click "Login"
3. Use the admin credentials provided
4. You should now be logged in successfully!

## **🚨 If Something Goes Wrong**

Check the logs:
```bash
sudo docker-compose logs app
```

Restart the application:
```bash
sudo docker-compose restart
```

## **📞 Need Help?**

The deployment script will guide you through each step and show you exactly what's happening. If you encounter any errors, the script will tell you exactly what went wrong and how to fix it.

---

**Time to complete:** 5-10 minutes  
**Difficulty:** Easy (just follow the prompts)  
**Result:** Working login system at dashboard.aigrowise.com
