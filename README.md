# 인류 진화와 질병 - Notion-style Note Platform

A modern, Notion-inspired note-taking platform built with Next.js, TypeScript, and Supabase.

## Features

- **User Authentication**: Email/password signup and login with unique nicknames
- **Rich Document Editor**: Create and edit documents with text and image blocks
- **Real-time Auto-save**: Automatic saving with debounced updates and conflict resolution
- **Document Sharing**: Share documents with other users by nickname, with view/edit permissions
- **Public Documents**: Make documents publicly accessible
- **Search Functionality**: Search your documents by title and content
- **User Discovery**: Find other users and browse their public documents
- **Image Upload**: Upload and manage images within documents with drag-and-drop positioning
- **Version Control**: Document versioning with conflict detection
- **Responsive Design**: Clean, Notion-inspired UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with JWT
- **Storage**: Supabase Storage for images
- **UI Icons**: Lucide React
- **Utilities**: use-debounce, uuid

## Database Schema

The application uses the following main tables:
- `users`: User profiles with unique nicknames
- `documents`: Document storage with JSONB content and versioning
- `document_shares`: Sharing permissions between users
- `images`: Image metadata and positioning data

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

### Database Setup

1. Create a new Supabase project
2. Run the SQL commands in `database-schema.sql` to set up the database schema
3. Enable Row Level Security (RLS) policies as defined in the schema

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```

### Deployment

The application can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- Any Node.js hosting platform

For Vercel deployment:
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## API Routes

- `GET/POST /api/documents` - List/create documents
- `GET/PATCH/DELETE /api/documents/[id]` - Document operations
- `POST/DELETE /api/documents/[id]/share` - Sharing management
- `GET /api/users/search` - User search
- `GET /api/users/[nickname]/documents` - User's public documents
- `GET /api/search` - Document search

## Security Features

- JWT-based authentication
- Row Level Security (RLS) in database
- Document access control
- Version conflict detection
- Input validation and sanitization

## Performance Optimizations

- Debounced auto-save (1 second delay)
- Optimistic UI updates
- Efficient database queries with indexes
- Lazy loading and code splitting
- Compressed image storage

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details