@echo off
REM Batch script to push code to GitHub
REM Usage: push-to-github.bat [commit-message]

setlocal enabledelayedexpansion

set "COMMIT_MSG=%~1"
if "!COMMIT_MSG!"=="" set "COMMIT_MSG=Update project files"

echo === GrowMoreAMS - GitHub Push Script ===
echo.

REM Check if git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo Error: Git is not installed or not in PATH
    exit /b 1
)

REM Check if we're in a git repository
if not exist .git (
    echo Error: Not a git repository. Run 'git init' first.
    exit /b 1
)

REM Check remote configuration
echo Checking remote configuration...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Error: No remote 'origin' configured
    exit /b 1
)
for /f "tokens=*" %%i in ('git remote get-url origin') do set REMOTE_URL=%%i
echo Remote URL: !REMOTE_URL!

REM Check current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo Current branch: !CURRENT_BRANCH!
echo.

REM Check for uncommitted changes
echo Checking for changes...
git status --porcelain >nul 2>&1
if not errorlevel 1 (
    echo Found uncommitted changes:
    git status --short
    echo.
    
    REM Stage all changes
    echo Staging all changes...
    git add .
    if errorlevel 1 (
        echo Error: Failed to stage changes
        exit /b 1
    )
    
    REM Commit changes
    echo Committing changes with message: '!COMMIT_MSG!'
    git commit -m "!COMMIT_MSG!"
    if errorlevel 1 (
        echo Error: Failed to commit changes
        exit /b 1
    )
    
    echo Changes committed successfully!
) else (
    echo No uncommitted changes found.
)

REM Push to GitHub
echo.
echo Pushing to GitHub...
git push -u origin !CURRENT_BRANCH!
if errorlevel 1 (
    echo.
    echo Error: Failed to push to GitHub
    echo Please check your authentication and try again.
    exit /b 1
)

echo.
echo Successfully pushed to GitHub!
echo Repository: https://github.com/Deartaj92/GrowMoreAMS

