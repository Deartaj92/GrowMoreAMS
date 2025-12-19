# Grow More AMS - Project Structure

## Overview
This document outlines the modular structure of the Grow More Academy Management System.

## Directory Structure

```
grow-more-ams/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with theme provider
│   ├── page.tsx                 # Home/Dashboard page
│   ├── students/                # Students feature pages
│   │   └── page.tsx
│   ├── globals.css              # Global styles with theme variables
│   └── manifest.ts              # PWA manifest
│
├── components/                   # Reusable UI components
│   ├── ui/                      # Base UI components
│   │   ├── button.tsx
│   │   ├── theme-toggle.tsx
│   │   └── offline-indicator.tsx
│   ├── layout/                  # Layout components
│   │   ├── main-layout.tsx
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   └── providers/               # Context providers
│       └── theme-provider.tsx
│
├── features/                     # Feature modules (domain-driven)
│   └── students/                # Student management feature
│       └── types.ts             # Feature-specific types
│
├── lib/                          # Utilities and configurations
│   ├── supabase/                # Supabase integration
│   │   ├── client.ts            # Supabase client setup
│   │   └── types.ts             # Database types
│   ├── offline/                 # Offline functionality
│   │   └── db.ts                # IndexedDB setup
│   └── utils.ts                 # Helper functions
│
├── hooks/                        # Custom React hooks
│   └── use-offline.ts           # Offline status hook
│
├── stores/                       # State management (Zustand)
│   └── theme-store.ts           # Theme state (alternative to context)
│
├── types/                        # Global TypeScript types
│   └── index.ts
│
├── public/                       # Static assets
│   ├── manifest.json            # PWA manifest
│   └── sw.js                    # Service worker
│
└── Configuration files
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.js
    └── .env.example
```

## Architecture Principles

### 1. Modular Structure
- **Features**: Domain-driven feature modules in `features/`
- **Components**: Reusable UI components in `components/`
- **Utilities**: Shared utilities in `lib/`

### 2. Theme System
- Light/Dark theme support via CSS variables
- Theme context provider for global theme management
- Persistent theme preference in localStorage

### 3. Offline Support
- PWA configuration (manifest.json)
- Service worker for caching
- IndexedDB setup for offline data storage
- Online/offline status detection

### 4. Supabase Integration
- Client setup ready in `lib/supabase/client.ts`
- Environment variables required:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Next Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase credentials

3. **Add PWA Icons**
   - Create `public/icon-192.png` (192x192)
   - Create `public/icon-512.png` (512x512)

4. **Implement Features**
   - Student CRUD operations
   - Offline sync functionality
   - Data validation
   - Error handling

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (optional, Context API used for theme)
- **Database**: Supabase
- **Icons**: Lucide React
- **Offline**: IndexedDB + Service Workers

