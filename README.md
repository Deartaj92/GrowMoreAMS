# Grow More AMS (Academy Management System)

A modern Academy Management System built with Next.js, TypeScript, and Tailwind CSS. Supports both online and offline functionality with a beautiful light/dark theme.

## Features

- 🎨 Modern UI with light/dark theme support
- 📱 Progressive Web App (PWA) for offline functionality
- 🏗️ Modular architecture for scalability
- 🔐 Supabase integration (to be configured)
- 📊 Student data management

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── layout/           # Layout components
├── features/              # Feature modules
│   └── students/         # Student management feature
├── lib/                   # Utilities and configurations
│   ├── supabase/        # Supabase client setup
│   └── utils/           # Helper functions
├── hooks/                 # Custom React hooks
├── stores/                # State management (Zustand)
└── types/                 # TypeScript type definitions
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase
- **Icons**: Lucide React

## Deployment

### GitHub Setup

1. **Create a new repository on GitHub**
   - Go to [GitHub](https://github.com/new)
   - Create a new repository (do not initialize with README, .gitignore, or license)
   - Copy the repository URL

2. **Push your code to GitHub**

   **Option A: Using npm script (Recommended - Cross-platform)**
   ```bash
   # With custom commit message
   npm run push "Your commit message"
   
   # With default commit message
   npm run push
   ```
   
   **Option B: Using the provided push scripts**
   
   Windows PowerShell:
   ```powershell
   .\push-to-github.ps1 "Your commit message"
   ```
   
   Windows Command Prompt:
   ```cmd
   push-to-github.bat "Your commit message"
   ```
   
   **Option C: Manual push**
   ```bash
   # If you haven't already, initialize git (skip if already done)
   git init
   
   # Add all files
   git add .
   
   # Commit your changes
   git commit -m "Initial commit"
   
   # Add the remote repository (if not already set)
   git remote add origin https://github.com/Deartaj92/GrowMoreAMS.git
   
   # Push to GitHub
   git branch -M main
   git push -u origin main
   ```
   
   > **Note:** Options A and B will automatically check git configuration, stage all changes, commit with your message (or default), and push to the remote repository.

### Netlify Deployment

1. **Install Netlify CLI (optional, for local testing)**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy via Netlify Dashboard**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository
   - Netlify will auto-detect the build settings from `netlify.toml`
   - Configure environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - Click "Deploy site"

3. **Build Settings (Auto-detected from netlify.toml)**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18

4. **Environment Variables**
   Make sure to add these in Netlify Dashboard → Site settings → Environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Deploy via CLI (Alternative)**
   ```bash
   # Login to Netlify
   netlify login
   
   # Initialize and deploy
   netlify init
   netlify deploy --prod
   ```

### Post-Deployment

- Your site will be available at `https://your-site-name.netlify.app`
- Netlify will automatically deploy on every push to the main branch
- Check the Netlify dashboard for build logs and deployment status

## License

Private - All rights reserved

