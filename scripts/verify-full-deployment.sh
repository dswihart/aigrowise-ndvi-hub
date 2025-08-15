#!/bin/bash

# Complete Production Deployment Verification Script
# Verifies all components of the Aigrowise NDVI Hub deployment

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0

echo -e "${BLUE}🔍 Aigrowise NDVI Hub - Complete Deployment Verification${NC}"
echo "================================================================="
echo ""

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $test_name... "
    
    if eval "$test_command" &>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# System Dependencies Tests
echo -e "${YELLOW}📋 System Dependencies${NC}"
echo "-------------------------"
run_test "Node.js installation" "command -v node"
run_test "NPM installation" "command -v npm"
run_test "PostgreSQL installation" "command -v psql"
run_test "PM2 installation" "command -v pm2"
run_test "Nginx installation" "command -v nginx"
echo ""

# Database Tests
echo -e "${YELLOW}🗄️  Database Connectivity${NC}"
echo "----------------------------"
run_test "PostgreSQL service" "systemctl is-active --quiet postgresql"
run_test "Database exists" "sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw aigrowise_production"
run_test "Database user exists" "sudo -u postgres psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='aigrowise_user'\" | grep -q 1"
echo ""

# Application Tests
echo -e "${YELLOW}🚀 Application Status${NC}"
echo "-----------------------"
run_test "PM2 process running" "pm2 list | grep -q aigrowise-ndvi-hub"
run_test "App responding on port 3000" "curl -f http://localhost:3000/api/health"
run_test "Environment file exists" "[ -f /var/www/aigrowise/env.production ]"
run_test "Node modules installed" "[ -d /var/www/aigrowise/node_modules ]"
echo ""

# Web Server Tests
echo -e "${YELLOW}🌐 Web Server (Nginx)${NC}"
echo "-----------------------"
run_test "Nginx service running" "systemctl is-active --quiet nginx"
run_test "Nginx config valid" "nginx -t"
run_test "HTTP port 80 accessible" "curl -f http://dashboard.aigrowise.com"
if command -v certbot &> /dev/null; then
    run_test "HTTPS certificate valid" "curl -f https://dashboard.aigrowise.com"
else
    echo "HTTPS certificate validation - ${YELLOW}⚠️  SKIP (certbot not installed)${NC}"
fi
echo ""

# DigitalOcean Spaces Tests
echo -e "${YELLOW}☁️  DigitalOcean Spaces${NC}"
echo "-------------------------"
ENV_FILE="/var/www/aigrowise/env.production"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
    
    if [ "$DO_SPACES_ACCESS_KEY" != "your-do-spaces-access-key" ] && [ -n "$DO_SPACES_ACCESS_KEY" ]; then
        run_test "Spaces credentials configured" "[ -n \"$DO_SPACES_ACCESS_KEY\" ] && [ -n \"$DO_SPACES_SECRET_KEY\" ]"
        run_test "Spaces connection test" "cd /var/www/aigrowise && node scripts/test-spaces-connection.js"
    else
        echo "Spaces credentials - ${YELLOW}⚠️  NOT CONFIGURED (using placeholders)${NC}"
        echo "Spaces connection test - ${YELLOW}⚠️  SKIP (credentials not configured)${NC}"
    fi
else
    echo "Environment file - ${RED}❌ NOT FOUND${NC}"
    echo "Spaces credentials - ${YELLOW}⚠️  SKIP (no env file)${NC}"
fi
echo ""

# Security Tests
echo -e "${YELLOW}🔒 Security Configuration${NC}"
echo "----------------------------"
run_test "UFW firewall active" "ufw status | grep -q \"Status: active\""
run_test "SSH port allowed" "ufw status | grep -q \"22\""
run_test "HTTP port allowed" "ufw status | grep -q \"80\""
run_test "HTTPS port allowed" "ufw status | grep -q \"443\""
echo ""

# Performance Tests
echo -e "${YELLOW}⚡ Performance Checks${NC}"
echo "------------------------"
run_test "Disk space available" "[ $(df / | tail -1 | awk '{print $4}') -gt 1000000 ]"  # > 1GB free
run_test "Memory available" "[ $(free -m | grep '^Mem:' | awk '{print $7}') -gt 500 ]"  # > 500MB free
run_test "App response time < 2s" "timeout 2 curl -f http://localhost:3000/api/health"
echo ""

# API Endpoints Tests
echo -e "${YELLOW}🔌 API Endpoints${NC}"
echo "--------------------"
run_test "Health endpoint" "curl -f http://localhost:3000/api/health"
run_test "Auth endpoint exists" "curl -s -o /dev/null -w \"%{http_code}\" http://localhost:3000/api/auth/signin | grep -q \"200\|405\""
run_test "Admin API protected" "curl -s -o /dev/null -w \"%{http_code}\" http://localhost:3000/api/admin/clients | grep -q \"401\|403\""
echo ""

# Final Summary
echo "================================================================="
echo -e "${BLUE}📊 Verification Summary${NC}"
echo "================================================================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Your deployment is ready for production.${NC}"
    EXIT_CODE=0
elif [ $PASSED_TESTS -ge $((TOTAL_TESTS * 80 / 100)) ]; then
    echo -e "${YELLOW}⚠️  MOSTLY READY: Most tests passed, minor issues detected.${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}❌ DEPLOYMENT ISSUES: Multiple failures detected.${NC}"
    EXIT_CODE=1
fi

echo ""
echo "🔧 Common Next Steps:"
echo "  • Configure DigitalOcean Spaces if not done: ./scripts/update-spaces-credentials.sh"
echo "  • Check PM2 logs for errors: pm2 logs aigrowise-ndvi-hub"
echo "  • Verify SSL certificate: certbot certificates"
echo "  • Test admin login: https://dashboard.aigrowise.com/admin"
echo "  • Monitor system: htop, df -h, free -h"
echo ""

exit $EXIT_CODE