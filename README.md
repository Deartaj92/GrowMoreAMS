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

## License

Private - All rights reserved

