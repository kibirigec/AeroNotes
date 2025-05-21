#!/bin/bash

# Script to run a full database reset using the improved auto-delete schema on a remote Supabase project

echo "Starting remote database reset..."

# Check if we're in the right directory
if [ ! -d "supabase" ]; then
    echo "Error: Directory 'supabase' not found. Please run this script from the project root."
    exit 1
fi

# Make sure the user wants to continue
echo "WARNING: This will reset your REMOTE database and all data will be lost!"
echo "This is a DESTRUCTIVE operation on your PRODUCTION database if you're using one!"
read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 0
fi

# Try to link to the remote project if not already linked
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "No linked project found. Let's link to your remote Supabase project."
    echo "You'll need your Supabase project ref and access token."
    echo "You can find these in your Supabase dashboard under Project Settings > API."
    
    read -p "Enter your Supabase project ref: " projectRef
    read -p "Enter your Supabase access token: " accessToken
    
    echo "Linking to remote project..."
    npx supabase login "$accessToken"
    npx supabase link --project-ref "$projectRef"
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to link to remote project."
        exit 1
    fi
fi

# Apply our migrations to the remote database
echo "Applying the new schema with improved auto-delete functionality..."
npx supabase db push

# Check if the operation completed successfully
if [ $? -eq 0 ]; then
    echo "Database reset completed successfully!"
    echo "Your remote database now has the improved auto-delete implementation."
    echo ""
    echo "You may need to restart your application to use the new schema."
else
    echo "Error: There was a problem applying the new schema."
    echo "Please check the error messages above for more information."
fi 