#!/bin/bash

# Database Setup Script for Aigrowise Dashboard
# Run this after successful deployment to set up the database

set -e  # Exit on any error

echo "🗄️  Setting up production database for Aigrowise Dashboard..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please run the deployment script first."
    exit 1
fi

# Load environment variables
print_status "Loading environment variables..."
source .env

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set."
            exit 1
        fi
    done
    
    print_status "All required environment variables are set."
}

# Push database schema
push_schema() {
    print_status "Pushing database schema..."
    
    if sudo docker-compose exec -T app npx prisma db push --accept-data-loss; then
        print_status "✅ Database schema updated successfully!"
    else
        print_error "❌ Failed to update database schema."
        exit 1
    fi
}

# Generate admin user password
generate_admin_password() {
    print_status "Generating admin user password..."
    
    # Generate a secure password
    ADMIN_PASSWORD=$(openssl rand -base64 12 | tr -d "=+/" | cut -c1-16)
    
    # Hash the password using bcrypt
    HASHED_PASSWORD=$(sudo docker-compose exec -T app node -e "
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('$ADMIN_PASSWORD', 10);
        console.log(hash);
    ")
    
    echo "Admin Password: $ADMIN_PASSWORD"
    echo "Hashed Password: $HASHED_PASSWORD"
    
    # Store for later use
    export ADMIN_PASSWORD HASHED_PASSWORD
}

# Create admin user
create_admin_user() {
    print_status "Creating admin user..."
    
    # Create admin user using Prisma
    sudo docker-compose exec -T app node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function createAdmin() {
            try {
                const user = await prisma.user.upsert({
                    where: { email: 'admin@aigrowise.com' },
                    update: {},
                    create: {
                        email: 'admin@aigrowise.com',
                        name: 'Admin User',
                        passwordHash: '$HASHED_PASSWORD',
                        role: 'ADMIN'
                    }
                });
                console.log('Admin user created/updated:', user.email);
            } catch (error) {
                console.error('Error creating admin user:', error);
                process.exit(1);
            } finally {
                await prisma.\$disconnect();
            }
        }
        
        createAdmin();
    "
    
    if [ $? -eq 0 ]; then
        print_status "✅ Admin user created successfully!"
        print_status "Email: admin@aigrowise.com"
        print_status "Password: $ADMIN_PASSWORD"
        print_status "Role: ADMIN"
    else
        print_error "❌ Failed to create admin user."
        exit 1
    fi
}

# Test database connection
test_connection() {
    print_status "Testing database connection..."
    
    if sudo docker-compose exec -T app npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        print_status "✅ Database connection test successful!"
    else
        print_warning "⚠️  Database connection test failed. This might be normal."
    fi
}

# Show database status
show_status() {
    print_status "Database setup completed!"
    print_status "You can now log in with:"
    print_status "Email: admin@aigrowise.com"
    print_status "Password: $ADMIN_PASSWORD"
    print_status ""
    print_status "Next steps:"
    print_status "1. Test login at https://dashboard.aigrowise.com"
    print_status "2. Change the admin password after first login"
    print_status "3. Create additional user accounts as needed"
}

# Main setup flow
main() {
    print_status "Starting database setup..."
    
    # Check environment variables
    check_env_vars
    
    # Push schema
    push_schema
    
    # Generate admin password
    generate_admin_password
    
    # Create admin user
    create_admin_user
    
    # Test connection
    test_connection
    
    # Show status
    show_status
}

# Run main function
main "$@"
