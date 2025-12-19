# Database Setup Instructions

## Step 1: Create Environment File

Since `.env.local` is protected, please create it manually with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mhgqfbinzxaxurzjczvv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oZ3FmYmluenhheHVyempjenZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTk1MjUsImV4cCI6MjA4MTY3NTUyNX0.ycF-yo03_Bl35qkAltFH-b5nDTmfb22mRvRgjRj5OLo
```

## Step 2: Set Up Database Schema

1. Go to your Supabase Dashboard: https://mhgqfbinzxaxurzjczvv.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `lib/supabase/schema.sql`
4. Click **Run** to execute the SQL

Alternatively, you can use the migration file at `lib/supabase/migrations/001_create_students_table.sql`

## Step 3: Verify Table Creation

After running the SQL, verify that:
- The `students` table exists in the `public` schema
- Row Level Security (RLS) is enabled
- The policy allows operations (adjust if needed for production)

## Step 4: Test Connection

Run the development server:
```bash
npm run dev
```

The Supabase client is already configured in `lib/supabase/client.ts` and will automatically use the environment variables.

## Database Schema

### Students Table
The `students` table includes:
- `id` (SERIAL, primary key - auto-incrementing integer)
- `name` (required)
- `email` (optional)
- `phone` (optional)
- `enrollment_date` (optional)
- `status` (active/inactive/graduated, default: active)
- `created_at` (auto-generated)
- `updated_at` (auto-updated on changes)

### Programs Table
The `programs` table includes:
- `id` (SERIAL, primary key - auto-incrementing integer)
- `code` (required, unique) - Program code (e.g., BSCS, MBA)
- `name` (required) - Full program name
- `description` (optional) - Program description
- `duration` (optional) - Duration value
- `duration_unit` (optional) - Unit: years or months
- `status` (active/inactive, default: active)
- `created_at` (auto-generated)
- `updated_at` (auto-updated on changes)

## Security Notes

The current RLS policy allows all operations. For production, you should:
1. Restrict access based on user authentication
2. Implement proper role-based access control
3. Add validation rules as needed

