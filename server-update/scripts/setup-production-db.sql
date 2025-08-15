-- Create production database and user for Aigrowise NDVI Hub
-- Run this as postgres superuser

-- Create user
CREATE USER aigrowise_user WITH PASSWORD 'aigrowise_pass';

-- Create database
CREATE DATABASE aigrowise_production OWNER aigrowise_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE aigrowise_production TO aigrowise_user;

-- Connect to the database
\c aigrowise_production

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO aigrowise_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aigrowise_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aigrowise_user;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aigrowise_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aigrowise_user;