#!/bin/bash

# Script to remove .env files from git history
# WARNING: This rewrites git history. Make sure you have a backup!

echo "🚨 WARNING: This will rewrite git history!"
echo "Make sure you have a backup before proceeding."
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "📦 Creating backup branch..."
git branch backup-before-cleanup

echo ""
echo "🧹 Removing .env files from history using git filter-repo..."
echo ""

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo "❌ git-filter-repo is not installed."
    echo ""
    echo "Install it with:"
    echo "  Mac: brew install git-filter-repo"
    echo "  Linux: pip3 install git-filter-repo"
    echo ""
    echo "Or use the manual method below:"
    echo ""
    echo "Manual cleanup using git filter-branch:"
    echo "git filter-branch --force --index-filter \\"
    echo "  'git rm --cached --ignore-unmatch .env .env.production' \\"
    echo "  --prune-empty --tag-name-filter cat -- --all"
    echo ""
    exit 1
fi

# Remove .env files from entire history
git filter-repo --invert-paths --path .env --path .env.production --force

echo ""
echo "✅ Files removed from history!"
echo ""
echo "📤 Force push to remote:"
echo "git remote add origin https://github.com/YOUR_USERNAME/enso.git"
echo "git push origin --force --all"
echo "git push origin --force --tags"
echo ""
echo "⚠️ IMPORTANT: All collaborators must re-clone the repository!"
echo ""
echo "If something went wrong, restore from backup:"
echo "git checkout backup-before-cleanup"
