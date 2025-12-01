#!/bin/bash

# AWS S3 Setup Helper Script
# This script helps you set up AWS S3 configuration for the project

echo "========================================="
echo "  AWS S3 Configuration Setup Helper"
echo "========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    echo ""
    
    # Check if .env.example exists
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
    else
        touch .env
        echo "✅ Created empty .env file"
    fi
    echo ""
fi

echo "📝 Please provide your AWS S3 configuration:"
echo ""

# Prompt for AWS Region
read -p "AWS Region (e.g., us-east-1): " AWS_REGION
if [ -z "$AWS_REGION" ]; then
    AWS_REGION="us-east-1"
    echo "   Using default: us-east-1"
fi

# Prompt for Access Key ID
read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "   ❌ Access Key ID is required!"
    exit 1
fi

# Prompt for Secret Access Key
read -sp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""
if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "   ❌ Secret Access Key is required!"
    exit 1
fi

# Prompt for Bucket Name
read -p "S3 Bucket Name: " AWS_S3_BUCKET_NAME
if [ -z "$AWS_S3_BUCKET_NAME" ]; then
    echo "   ❌ Bucket name is required!"
    exit 1
fi

echo ""
echo "📋 Configuration Summary:"
echo "   Region: $AWS_REGION"
echo "   Access Key ID: ${AWS_ACCESS_KEY_ID:0:10}..."
echo "   Secret Access Key: ********"
echo "   Bucket Name: $AWS_S3_BUCKET_NAME"
echo ""

read -p "Do you want to save these settings to .env? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ Setup cancelled."
    exit 0
fi

# Update or add AWS settings in .env
echo ""
echo "💾 Saving configuration to .env..."

# Function to update or add env variable
update_env() {
    local key=$1
    local value=$2
    
    if grep -q "^${key}=" .env; then
        # Update existing
        sed -i.bak "s|^${key}=.*|${key}=${value}|" .env
    else
        # Add new
        echo "${key}=${value}" >> .env
    fi
}

update_env "AWS_REGION" "$AWS_REGION"
update_env "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
update_env "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
update_env "AWS_S3_BUCKET_NAME" "$AWS_S3_BUCKET_NAME"

# Remove backup file if created
rm -f .env.bak

echo "✅ Configuration saved successfully!"
echo ""
echo "========================================="
echo "  Next Steps:"
echo "========================================="
echo ""
echo "1. ✅ Configure your S3 bucket CORS policy"
echo "2. ✅ Set bucket policy for public read access"
echo "3. ✅ Test the configuration:"
echo "   $ yarn dev"
echo ""
echo "4. 📚 For detailed setup instructions, see:"
echo "   AWS_S3_SETUP.md"
echo ""
echo "5. 🚀 To migrate existing files to S3:"
echo "   $ yarn ts-node src/scripts/migrate-to-s3.ts"
echo ""
echo "========================================="
echo "  Configuration Complete! 🎉"
echo "========================================="
