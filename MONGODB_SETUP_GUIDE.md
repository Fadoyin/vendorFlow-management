# 🚀 MongoDB Setup Guide for Vendor Management Platform

## Quick Setup Options

### Option 1: MongoDB Atlas (Cloud - Recommended) ⭐
**Time: 5 minutes | Cost: FREE | No installation needed**

1. **Go to MongoDB Atlas**
   - Visit: https://cloud.mongodb.com
   - Click "Try Free"

2. **Create Account**
   - Sign up with your email
   - Choose "Free" plan

3. **Create Cluster**
   - Select "FREE" tier (M0)
   - Choose your preferred cloud provider (AWS/Google Cloud/Azure)
   - Select region closest to you
   - Click "Create"

4. **Set Up Database Access**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Username: `vendor-admin`
   - Password: Create a strong password
   - Role: "Read and write to any database"
   - Click "Add User"

5. **Set Up Network Access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

6. **Get Connection String**
   - Go back to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

7. **Update Your .env File**
   ```bash
   # Replace the MONGODB_URI in your .env file with:
   MONGODB_URI=mongodb+srv://vendor-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/vendor-management?retryWrites=true&w=majority
   ```

### Option 2: Local MongoDB Installation
**Time: 15 minutes | Cost: FREE | Requires local installation**

1. **Download MongoDB Community Server**
   - Go to: https://www.mongodb.com/try/download/community
   - Select Windows x64
   - Download the MSI installer

2. **Install MongoDB**
   - Run the downloaded MSI file
   - Choose "Complete" installation
   - Install MongoDB Compass (GUI tool) when prompted

3. **Start MongoDB Service**
   - MongoDB should start automatically as a Windows service
   - Verify by opening Command Prompt and running: `mongod --version`

4. **Your .env file is already configured for local MongoDB**
   ```bash
   MONGODB_URI=mongodb://localhost:27017/vendor-management
   ```

## 🔧 Testing the Connection

Once you've set up either option:

1. **Start your backend:**
   ```bash
   cd apps/backend
   npm run start:dev
   ```

2. **Check the console output:**
   - Look for: "Successfully connected to MongoDB" ✅
   - If you see errors, check your connection string

3. **Test the API:**
   - Open: http://localhost:3001/api/health
   - Should return a healthy status

## 🚨 Troubleshooting

### Common Issues:

1. **Connection Refused**
   - Check if MongoDB is running
   - Verify connection string format
   - Check firewall settings

2. **Authentication Failed**
   - Verify username/password in connection string
   - Check if user has proper permissions

3. **Network Error**
   - Ensure IP address is whitelisted (Atlas)
   - Check internet connection

### Connection String Format:

**MongoDB Atlas:**
```
mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database-name?retryWrites=true&w=majority
```

**Local MongoDB:**
```
mongodb://localhost:27017/database-name
```

## 📱 Next Steps After Connection

1. **Database will be created automatically** when you first use it
2. **Collections will be created** based on your schemas
3. **Test with sample data** using the seed script:
   ```bash
   cd apps/backend
   npm run seed
   ```

## 💡 Pro Tips

- **MongoDB Atlas** is perfect for development and production
- **Free tier** includes 512MB storage (enough for development)
- **Connection pooling** is handled automatically
- **Backups** are included for free
- **Scaling** is easy when you need it

## 🆘 Need Help?

- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- MongoDB Community Server: https://docs.mongodb.com/manual/
- NestJS MongoDB: https://docs.nestjs.com/techniques/mongodb

---

**🎯 Ready to connect MongoDB! Choose your option and follow the steps above.**
