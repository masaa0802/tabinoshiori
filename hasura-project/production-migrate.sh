#!/bin/bash

# Production migration script
# This script applies the local schema to production environment

echo "Travel Planner - Production Database Migration"
echo "=============================================="

# Check if required environment variables are set
if [ -z "$PROD_HASURA_ENDPOINT" ]; then
    echo "Error: PROD_HASURA_ENDPOINT environment variable is not set"
    echo "Please set it to your production Hasura GraphQL endpoint"
    echo "Example: export PROD_HASURA_ENDPOINT=\"https://your-hasura-app.hasura.app\""
    exit 1
fi

if [ -z "$PROD_ADMIN_SECRET" ]; then
    echo "Error: PROD_ADMIN_SECRET environment variable is not set"
    echo "Please set it to your production admin secret"
    echo "Example: export PROD_ADMIN_SECRET=\"your-production-admin-secret\""
    exit 1
fi

echo "Production Endpoint: $PROD_HASURA_ENDPOINT"
echo "Admin Secret: ****** (hidden)"
echo ""

# Check current migration status
echo "Checking current migration status..."
hasura migrate status --endpoint "$PROD_HASURA_ENDPOINT" --admin-secret "$PROD_ADMIN_SECRET"

echo ""
read -p "Do you want to apply migrations to production? (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo "Applying migrations to production..."
    hasura migrate apply --endpoint "$PROD_HASURA_ENDPOINT" --admin-secret "$PROD_ADMIN_SECRET"

    echo "Applying metadata to production..."
    hasura metadata apply --endpoint "$PROD_HASURA_ENDPOINT" --admin-secret "$PROD_ADMIN_SECRET"

    echo "Migration completed successfully!"

    echo ""
    echo "Verifying final migration status..."
    hasura migrate status --endpoint "$PROD_HASURA_ENDPOINT" --admin-secret "$PROD_ADMIN_SECRET"
else
    echo "Migration cancelled."
fi