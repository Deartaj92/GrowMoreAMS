# PowerShell script to push code to GitHub
# Usage: .\push-to-github.ps1 [commit-message]

param(
    [string]$CommitMessage = "Update project files"
)

Write-Host "=== GrowMoreAMS - GitHub Push Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if git is available
try {
    $gitVersion = git --version
    Write-Host "Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Git is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "Error: Not a git repository. Run 'git init' first." -ForegroundColor Red
    exit 1
}

# Check remote configuration
Write-Host "Checking remote configuration..." -ForegroundColor Yellow
$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-Host "Remote URL: $remoteUrl" -ForegroundColor Green
} else {
    Write-Host "Error: No remote 'origin' configured" -ForegroundColor Red
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Green
Write-Host ""

# Check for uncommitted changes
Write-Host "Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "Found uncommitted changes:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    
    # Stage all changes
    Write-Host "Staging all changes..." -ForegroundColor Yellow
    git add .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to stage changes" -ForegroundColor Red
        exit 1
    }
    
    # Commit changes
    Write-Host "Committing changes with message: '$CommitMessage'" -ForegroundColor Yellow
    git commit -m $CommitMessage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to commit changes" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Changes committed successfully!" -ForegroundColor Green
} else {
    Write-Host "No uncommitted changes found." -ForegroundColor Green
}

# Check if branch exists on remote
Write-Host ""
Write-Host "Checking remote branch..." -ForegroundColor Yellow
$remoteBranch = git ls-remote --heads origin $currentBranch 2>$null

# Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
if ($remoteBranch) {
    Write-Host "Branch exists on remote, pushing updates..." -ForegroundColor Yellow
    git push origin $currentBranch
} else {
    Write-Host "Branch doesn't exist on remote, pushing with upstream..." -ForegroundColor Yellow
    git push -u origin $currentBranch
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/Deartaj92/GrowMoreAMS" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Error: Failed to push to GitHub" -ForegroundColor Red
    Write-Host "Please check your authentication and try again." -ForegroundColor Yellow
    exit 1
}

