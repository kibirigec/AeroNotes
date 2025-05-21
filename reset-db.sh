#!/bin/bash

# Script to run a full database reset using the improved auto-delete schema

echo "Starting database reset..."

# Check if we're in local development mode
if [ ! -d "supabase" ]; then
    echo "Error: Directory 'supabase' not found. Please run this script from the project root."
    exit 1
fi

# Make sure the user wants to continue
echo "WARNING: This will reset your database and all data will be lost!"
read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 0
fi

# Stop any running Supabase instance
echo "Stopping any running Supabase instances..."
npx supabase stop || true

# Start a fresh Supabase instance
echo "Starting a fresh Supabase instance..."
npx supabase start

# Reset the database to a clean state
echo "Resetting the database..."
npx supabase db reset

# Apply our new schema
echo "Applying the new schema with improved auto-delete functionality..."
npx supabase db push

# Check if the operation completed successfully
if [ $? -eq 0 ]; then
    echo "Database reset completed successfully!"
    echo "Your database is now running with the improved auto-delete implementation."
    echo ""
    echo "Access the Supabase Studio at: http://localhost:54323"
    echo "API URL: http://localhost:54321"
    echo ""
    echo "You may need to restart your application to use the new schema."
else
    echo "Error: There was a problem applying the new schema."
    echo "Please check the error messages above for more information."
fi 