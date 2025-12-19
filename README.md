# OpenCode Hana

A mobile-friendly web UI to interact with the OpenCode server.

## Features

- **Session Management**: Create, rename, and delete chat sessions
- **Real-time Streaming**: Live streaming of AI responses with typing indicators
- **Diff Viewer**: View file changes with syntax-highlighted diffs
- **File Mentions**: Reference files directly in your messages
- **Image Support**: Attach and preview images in conversations
- **MCP Servers**: View and manage Model Context Protocol servers
- **Task Tracking**: Monitor AI task progress with todo lists
- **Context Usage**: Track token usage and context window consumption
- **Mobile-First Design**: Responsive layout optimized for mobile devices
- **Dark/Light Theme**: Toggle between themes or follow system preference

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
- **shadcn/ui** - UI components
- **Tailwind CSS v4** - Styling
- **TanStack Query** - Server state management
- **React Router** - Routing
- **OpenCode SDK** - OpenCode API client

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
