#!/bin/bash

# Quick deployment fix for dashboard.aigrowise.com
# Run this script on your server to fix the missing client creation button

echo "🌱 Aigrowise - Fixing Missing Client Creation Button"
echo "==================================================="

# Find application directory
APP_DIRS=("/var/www/aigrowise" "/opt/aigrowise" "/root/aigrowise" "/home/aigrowise")
APP_DIR=""

for dir in "${APP_DIRS[@]}"; do
    if [ -f "$dir/package.json" ]; then
        APP_DIR="$dir"
        break
    fi
done

if [ -z "$APP_DIR" ]; then
    echo "❌ Cannot find application directory"
    exit 1
fi

echo "✅ Found application at: $APP_DIR"
cd "$APP_DIR"

# 1. Fix database connection
echo ""
echo "🗄️  Fixing database connection..."
npx prisma generate
npx prisma db push

# 2. Create admin user
echo ""
echo "👤 Creating admin user..."
cat > create-admin.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = 'admin@aigrowise.com';
    const adminPassword = 'Admin123!';
    
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created!');
    console.log('📧 Email: admin@aigrowise.com');
    console.log('🔐 Password: Admin123!');
    
  } catch (error) {
    console.error('❌ Failed to create admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
EOF

node create-admin.js

# 3. Ensure admin dashboard shows client creation
echo ""
echo "🎨 Ensuring admin dashboard has client creation UI..."

# Check if admin dashboard exists and has client creation UI
ADMIN_DASHBOARD="apps/nextjs/app/admin/admin-dashboard.tsx"
if [ -f "$ADMIN_DASHBOARD" ]; then
    if ! grep -q "Create New Client" "$ADMIN_DASHBOARD"; then
        echo "   ⚠️  Admin dashboard missing client creation UI - adding it..."
        
        # Backup original
        cp "$ADMIN_DASHBOARD" "$ADMIN_DASHBOARD.backup"
        
        # Add the client creation section after the header
        sed -i '/main className="max-w-7xl/a\
        {/* Quick Actions - PROMINENT CLIENT CREATION */}\
        <div className="mb-8">\
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">\
            <a \
              href="/admin/create-client"\
              className="bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-lg text-center transform transition-transform hover:scale-105 shadow-xl border-2 border-blue-500"\
            >\
              <div className="text-6xl mb-4">👤</div>\
              <div className="text-2xl font-bold mb-2">Create New Client</div>\
              <div className="text-blue-100 text-lg">Click here to add a client account</div>\
            </a>\
            \
            <a \
              href="/admin/clients"\
              className="bg-green-600 hover:bg-green-700 text-white p-8 rounded-lg text-center transform transition-transform hover:scale-105 shadow-xl border-2 border-green-500"\
            >\
              <div className="text-6xl mb-4">👥</div>\
              <div className="text-2xl font-bold mb-2">Manage Clients</div>\
              <div className="text-green-100 text-lg">View and manage all clients</div>\
            </a>\
          </div>\
        </div>' "$ADMIN_DASHBOARD"
        
        echo "   ✅ Added prominent client creation buttons to admin dashboard"
    else
        echo "   ✅ Admin dashboard already has client creation UI"
    fi
else
    echo "   ❌ Admin dashboard component not found"
fi

# 4. Restart application
echo ""
echo "🚀 Restarting application..."
npm run build
pm2 restart all
systemctl reload nginx

# 5. Test the fixes
echo ""
echo "🧪 Testing the fixes..."
sleep 3

# Test health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "   ✅ Application is responding"
else
    echo "   ❌ Application not responding (HTTP $HEALTH_STATUS)"
fi

# Clean up
rm -f create-admin.js

echo ""
echo "🎉 FIX COMPLETE!"
echo "================"
echo ""
echo "🌐 Visit: https://dashboard.aigrowise.com/admin"
echo "📧 Login: admin@aigrowise.com"
echo "🔐 Password: Admin123!"
echo ""
echo "You should now see:"
echo "  • Large 'Create New Client' button (blue card)"
echo "  • 'Manage Clients' button (green card)"
echo "  • Working client creation functionality"
echo ""
echo "If you still don't see the buttons, check PM2 logs:"
echo "  pm2 logs aigrowise-dashboard"