# The English Channel BD — Frontend

A modern web frontend for **The English Channel BD**, built with **Next.js, React, TypeScript, and Tailwind CSS**. The project combines a public learning/book experience with shopping, authentication, user profiles, reading, courses, and staff-oriented areas.

## Overview

The frontend uses the Next.js App Router under `src/app` and organizes reusable UI, context/state, actions, libraries, assets, and shared types under `src/`. The current route structure includes public content and user-facing application flows such as books, courses, shop, cart, checkout, gallery, profile, reading, authentication, and staff/admin-oriented areas.

## Tech Stack

| Technology | Purpose |
| --- | --- |
| [Next.js](https://nextjs.org/) 16 | Application framework and routing |
| [React](https://react.dev/) 19 | UI development |
| [TypeScript](https://www.typescriptlang.org/) | Static typing |
| [Tailwind CSS](https://tailwindcss.com/) 4 | Styling and responsive UI |
| [Lucide React](https://lucide.dev/) | Icons |
| [Motion](https://motion.dev/) | UI animation |
| React Markdown | Markdown rendering |
| `pdfjs-dist` | PDF viewing/processing |
| `jspdf` / `html2canvas` | PDF/document export utilities |
| Google GenAI | AI-powered functionality |
| Sonner | Toast notifications |

The project uses Next.js 16.2.7 and React 19.2.7.

## Main Areas

### Learning & Content

- Book discovery and book detail flows
- Reading-oriented routes
- Course area
- Gallery
- Public information pages

### E-Commerce

- Shop
- Product/book browsing
- Cart
- Checkout

### User Experience

- Authentication
- User profile
- Shared application layout and context/state
- Notifications and interactive UI feedback

### Staff / Administration

- Staff-oriented route structure
- Authentication-protected application areas
- Dedicated API-facing route structure

## Project Structure

```text
TheEnglishChannelBD_Frontend/
├── src/
│   ├── actions/             # Server/client actions
│   ├── app/                 # Next.js App Router
│   │   ├── about/           # About page
│   │   ├── api/             # API route handlers
│   │   ├── auth/            # Authentication routes
│   │   ├── book/            # Book pages
│   │   ├── cart/            # Cart
│   │   ├── checkout/        # Checkout
│   │   ├── courses/         # Courses
│   │   ├── gallery/         # Gallery
│   │   ├── profile/         # User profile
│   │   ├── read/            # Reading area
│   │   ├── shop/            # Shop
│   │   ├── staff/           # Staff area
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── assets/              # Application assets
│   ├── components/          # Reusable React components
│   ├── context/             # Shared React context/state
│   ├── lib/                 # Frontend libraries/helpers
│   └── types.ts             # Shared TypeScript types
│
├── public/                  # Public static assets
├── .env.example             # Environment variables template
├── next.config.js
├── postcss.config.mjs
├── eslint.config.mjs
├── package.json
└── README.md
```

## Environment Variables

The project includes environment configuration for **Google Gemini AI** and the application URL.

```env
GEMINI_API_KEY=your-gemini-api-key
APP_URL=http://localhost:3000
```

Keep real secrets outside Git and use your deployment platform's environment-variable system for production values.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Sharar12/TheEnglishChannelBD_Frontend.git
cd TheEnglishChannelBD_Frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create your local environment file from `.env.example` and provide the required values.

### 4. Start the development server

```bash
npm run dev
```

The configured development command runs Next.js on port `3000` using Webpack.

Open:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev      # Start development server on port 3000 with Webpack
npm run build    # Create the production build
npm run start    # Start the production server
npm run lint     # Run linting
```

## Production Deployment

Build the project with:

```bash
npm run build
```

Then run:

```bash
npm run start
```

The application can be deployed to a Next.js-compatible hosting platform. Configure all production environment variables before deployment.

## Frontend Scope

This repository contains the **frontend/web application**. It is responsible for pages, UI components, client-side interactions, navigation, frontend state/context, document viewing/export helpers, and frontend-facing API routes.

Any external database, persistent backend service, payment processing, or server-side business logic should be treated as a separate system boundary.

## Security Notes

- Never commit real API keys or credentials.
- Do not expose private server credentials to browser-only code.
- Keep production URLs and secrets in deployment environment variables.
- Validate authorization again on the backend for protected operations.

## License

This project is distributed under the license included in the repository.
