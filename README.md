# OpenCode Web

A mobile-friendly web UI to interact with OpenCode server.

## Features

- **Session Management**: View, create, and delete chat sessions
- **Chat Interface**: Send messages and receive AI responses
- **Mobile-First Design**: Responsive layout with bottom navigation
- **Dark/Light Theme**: Toggle between themes
- **Real-time Updates**: Live streaming of AI responses (coming soon)

## Prerequisites

1. **OpenCode Server**: Make sure you have OpenCode running:
   ```bash
   opencode serve --port 4096
   ```

2. **Bun**: This project uses [Bun](https://bun.sh) as the runtime.

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

The app will be available at http://localhost:5173

## Configuration

Create a `.env` file (or copy from `.env.example`):

```env
VITE_OPENCODE_SERVER_URL=http://localhost:4096
```

## Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# The app will be available at http://localhost:3000
```

## Tech Stack

- **Vite** - Build tool
- **React 19** - UI framework
- **TypeScript** - Type safety
- **shadcn/ui** - UI components (lyra style, indigo theme)
- **Tailwind CSS v4** - Styling
- **TanStack Query** - Server state management
- **react-router-dom** - Routing
- **@opencode-ai/sdk** - OpenCode API client

## Project Structure

```
src/
├── routes/           # Page components
├── components/
│   ├── ui/           # shadcn components
│   ├── layout/       # Layout components
│   ├── chat/         # Chat-related components
│   ├── sessions/     # Session-related components
│   └── common/       # Shared components
├── hooks/            # Custom React hooks
├── providers/        # Context providers
└── lib/              # Utilities and SDK client
```

## License

MIT
