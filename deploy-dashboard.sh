#!/bin/bash

# Dashboard.aigrowise.com Production Deployment
# This script will fix your login issues immediately

set -e

echo "🚀 Deploying to dashboard.aigrowise.com..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this from /opt/aigrowise directory"
    exit 1
fi

# Function to get database info
get_database_info() {
    echo "Please provide your production database details:"
    echo ""
    
    read -p "Database Host: " DB_HOST
    read -p "Database Port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    read -p "Database Name: " DB_NAME
    read -p "Database User: " DB_USER
    read -s -p "Database Password: " DB_PASSWORD
    echo ""
    
    # Validate inputs
    if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
        print_error "All database fields are required!"
        exit 1
    fi
}

# Create production .env file
create_env_file() {
    print_status "Creating production environment file..."
    
    # Generate secure secret
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    # Backup existing .env if it exists
    if [ -f ".env" ]; then
        print_warning "Backing up existing .env to .env.backup"
        cp .env .env.backup
    fi
    
    # Create new .env
    cat > .env << EOF
# Production Environment for dashboard.aigrowise.com
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# NextAuth Configuration
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="https://dashboard.aigrowise.com"

# Database Details (for reference)
POSTGRES_HOST="${DB_HOST}"
POSTGRES_PORT="${DB_PORT}"
POSTGRES_DB="${DB_NAME}"
POSTGRES_USER="${DB_USER}"
POSTGRES_PASSWORD="${DB_PASSWORD}"
EOF

    print_status ".env file created successfully!"
    print_status "NEXTAUTH_SECRET generated: ${NEXTAUTH_SECRET:0:20}..."
}

# Deploy the application
deploy_app() {
    print_status "Deploying application..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    sudo docker-compose down || true
    
    # Build and start
    print_status "Building and starting new containers..."
    sudo docker-compose up -d --build
    
    # Wait for startup
    print_status "Waiting for application to start..."
    sleep 30
    
    # Test if running
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "✅ Application is running!"
        print_status "🌐 Dashboard accessible at: https://dashboard.aigrowise.com"
    else
        print_error "❌ Application failed to start"
        print_status "Check logs with: sudo docker-compose logs app"
        exit 1
    fi
}

# Test database connection
test_database() {
    print_status "Testing database connection..."
    
    if sudo docker-compose exec -T app npx prisma db push --accept-data-loss > /dev/null 2>&1; then
        print_status "✅ Database connection successful!"
    else
        print_warning "⚠️  Database connection test failed"
        print_status "This might be normal if schema is already up to date"
    fi
}

# Create admin user
create_admin_user() {
    print_status "Creating admin user account..."
    
    # Generate admin password
    ADMIN_PASSWORD=$(openssl rand -base64 12 | tr -d "=+/" | cut -c1-16)
    
    print_status "Creating admin user with email: admin@aigrowise.com"
    print_status "Password: ${ADMIN_PASSWORD}"
    
    # Create user in database
    sudo docker-compose exec -T app node -e "
        const { PrismaClient } = require('@prisma/client');
        const bcrypt = require('bcryptjs');
        const prisma = new PrismaClient();
        
        async function createAdmin() {
            try {
                const hashedPassword = bcrypt.hashSync('${ADMIN_PASSWORD}', 10);
                const user = await prisma.user.upsert({
                    where: { email: 'admin@aigrowise.com' },
                    update: { passwordHash: hashedPassword },
                    create: {
                        email: 'admin@aigrowise.com',
                        name: 'Admin User',
                        passwordHash: hashedPassword,
                        role: 'ADMIN'
                    }
                });
                console.log('✅ Admin user ready:', user.email);
            } catch (error) {
                console.error('❌ Error creating admin:', error.message);
                process.exit(1);
            } finally {
                await prisma.\$disconnect();
            }
        }
        
        createAdmin();
    "
    
    if [ $? -eq 0 ]; then
        print_status "✅ Admin user created successfully!"
        echo ""
        echo "🎉 LOGIN CREDENTIALS:"
        echo "Email: admin@aigrowise.com"
        echo "Password: ${ADMIN_PASSWORD}"
        echo ""
        echo "⚠️  IMPORTANT: Save this password and change it after first login!"
        echo ""
    else
        print_error "❌ Failed to create admin user"
        exit 1
    fi
}

# Show final status
show_status() {
    print_status "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "1. Test login at https://dashboard.aigrowise.com"
    echo "2. Use admin@aigrowise.com with the password above"
    echo "3. Change the admin password after first login"
    echo "4. Create additional user accounts as needed"
    echo ""
    echo "🔧 TROUBLESHOOTING:"
    echo "• Check logs: sudo docker-compose logs app"
    echo "• Restart: sudo docker-compose restart"
    echo "• Status: sudo docker-compose ps"
    echo ""
}

# Main execution
main() {
    print_status "Starting dashboard.aigrowise.com deployment..."
    
    # Get database info
    get_database_info
    
    # Create environment file
    create_env_file
    
    # Deploy application
    deploy_app
    
    # Test database
    test_database
    
    # Create admin user
    create_admin_user
    
    # Show final status
    show_status
}

# Run main function
main "$@"
