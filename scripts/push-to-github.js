#!/usr/bin/env node

/**
 * Cross-platform script to push code to GitHub
 * Usage: node scripts/push-to-github.js [commit-message]
 */

const { execSync } = require('child_process');
const path = require('path');

// Get commit message from command line arguments or use default
const commitMessage = process.argv[2] || 'Update project files';

console.log('=== GrowMoreAMS - GitHub Push Script ===\n');

// Check if git is available
try {
  const gitVersion = execSync('git --version', { encoding: 'utf-8' }).trim();
  console.log(`✓ Git found: ${gitVersion}`);
} catch (error) {
  console.error('✗ Error: Git is not installed or not in PATH');
  process.exit(1);
}

// Check if we're in a git repository
try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore' });
} catch (error) {
  console.error('✗ Error: Not a git repository. Run "git init" first.');
  process.exit(1);
}

// Check remote configuration
try {
  const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
  console.log(`✓ Remote URL: ${remoteUrl}`);
} catch (error) {
  console.error('✗ Error: No remote "origin" configured');
  process.exit(1);
}

// Get current branch
let currentBranch;
try {
  currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  console.log(`✓ Current branch: ${currentBranch}\n`);
} catch (error) {
  console.error('✗ Error: Could not determine current branch');
  process.exit(1);
}

// Check for uncommitted changes
try {
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  
  if (status.trim()) {
    console.log('Found uncommitted changes:');
    execSync('git status --short', { stdio: 'inherit' });
    console.log('\nStaging all changes...');
    
    execSync('git add .', { stdio: 'inherit' });
    
    console.log(`Committing changes with message: "${commitMessage}"`);
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    console.log('✓ Changes committed successfully!\n');
  } else {
    console.log('✓ No uncommitted changes found.\n');
  }
} catch (error) {
  console.error('✗ Error during staging/committing:', error.message);
  process.exit(1);
}

// Push to GitHub
try {
  console.log('Pushing to GitHub...');
  
  // Check if branch exists on remote
  try {
    execSync(`git ls-remote --heads origin ${currentBranch}`, { stdio: 'ignore' });
    // Branch exists, just push
    execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });
  } catch (error) {
    // Branch doesn't exist, push with upstream
    execSync(`git push -u origin ${currentBranch}`, { stdio: 'inherit' });
  }
  
  console.log('\n✓ Successfully pushed to GitHub!');
  console.log('Repository: https://github.com/Deartaj92/GrowMoreAMS');
} catch (error) {
  console.error('\n✗ Error: Failed to push to GitHub');
  console.error('Please check your authentication and try again.');
  process.exit(1);
}


