# 🚀 VendorFlow Easy Deployment Guide

## Quick Deploy Updates

You now have **super simple** scripts to deploy your code updates without any hassle!

## 📁 Available Scripts

### 1. `./deploy-updates.sh` - Deploy New Code
**Use this when you want to deploy updated code**

```bash
./deploy-updates.sh
```

**Options:**
- **Option 1**: Full application update (backend + frontend + ml-service)
- **Option 2**: Backend only 
- **Option 3**: Frontend only
- **Option 4**: ML Service only
- **Option 5**: Configuration files only (.env, docker-compose, nginx)

### 2. `./rollback.sh` - Emergency Rollback
**Use this if something goes wrong and you need to quickly revert**

```bash
./rollback.sh
```

## 🔄 Typical Workflow

### When You Make Code Changes:

1. **Make your changes locally** in your code
2. **Test locally** (optional but recommended)
3. **Run the deployment script:**
   ```bash
   cd /home/hassan/Desktop/VendorFlow-Deploy
   ./deploy-updates.sh
   ```
4. **Choose what to update** (usually option 1 for full update)
5. **Wait for completion** (usually 2-5 minutes)
6. **Test your live site** at http://vendorflow.uk

### If Something Goes Wrong:

1. **Run the rollback script:**
   ```bash
   ./rollback.sh
   ```
2. **Your site will be restored** to the previous working version
3. **Fix the issue locally** and try deploying again

## 🎯 Examples

### Deploy Frontend Changes Only
```bash
./deploy-updates.sh
# Choose option 3
```

### Deploy Backend API Changes Only  
```bash
./deploy-updates.sh
# Choose option 2
```

### Deploy Everything After Major Changes
```bash
./deploy-updates.sh
# Choose option 1
```

### Emergency Rollback
```bash
./rollback.sh
# Confirm with 'y'
```

## ✅ What These Scripts Do For You

### `deploy-updates.sh`:
- ✅ Copies your latest code to the server
- ✅ Rebuilds only the services you choose
- ✅ Restarts services safely
- ✅ Tests the deployment
- ✅ Shows you the status

### `rollback.sh`:
- ✅ Quickly reverts to the last working version
- ✅ Restarts all services
- ✅ Tests that everything is working
- ✅ Gives you next steps

## 🌐 Your Live URLs

After any successful deployment, your app is available at:
- **Primary**: http://vendorflow.uk
- **Secondary**: http://vendor-flow.co.uk  
- **Direct IP**: http://51.20.189.198

## 🚨 Troubleshooting

### If deployment fails:
1. Run `./rollback.sh` to restore service
2. Check the error messages
3. Fix the issue locally
4. Try deploying again

### If rollback fails:
1. SSH to the server manually:
   ```bash
   ssh -i /home/hassan/Desktop/ssh/vendorflow-latest.pem ubuntu@51.20.189.198
   ```
2. Navigate to project: `cd /opt/vendorflow-new`
3. Restart services: `sudo docker-compose down && sudo docker-compose up -d`

## 💡 Pro Tips

1. **Always test locally first** before deploying
2. **Use specific updates** (backend only, frontend only) for faster deployments
3. **Keep the rollback script handy** - it's your safety net
4. **The scripts are smart** - they only rebuild what you choose to update
5. **DNS is already configured** - your domains will work immediately

## 🎉 That's It!

You now have **zero-hassle deployments**. Just run `./deploy-updates.sh` whenever you want to update your live site! 