# MineVote - Minecraft Server Promotion Platform

A modern React-based platform for promoting Minecraft servers through community voting.

## Features

- 🎮 Server listing and promotion
- 🗳️ Community voting system
- 📊 Server statistics and leaderboards
- 🔐 User authentication
- 📱 Responsive design
- 🎨 Modern UI with glassmorphism effects
- 🔗 Discord and website integration
- 📋 Detailed server information pages

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Backend**: Supabase
- **Build Tool**: Vite

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run development server: `npm run dev`
5. Build for production: `npm run build`

## Deployment

This project is configured for deployment on Netlify with:
- Automatic builds from Git
- Environment variable support
- SPA routing configuration
- Node.js 18 runtime

## Environment Variables

Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```