# OpenCode Web - Agent Guidelines

## General Guidelines

- Don't do things that no one asked for.
- Always ask for clarification if the request is ambiguous.
- Provide concise and relevant responses.
- Avoid unnecessary information or tangents.
- Never create any commits or push code without explicit user instruction.
- Always follow the user's coding style and conventions.
- Always check similar existing code for style and patterns.
- When in doubt, ask the user for their preferences.
- Don't commit code if you are not explicitly instructed to do so.
- When you're asked to commit code, use conventional commit messages.

## Development Philosophy

- Write clean, maintainable, and scalable code
- Follow SOLID principles
- Prefer functional and declarative programming patterns over imperative
- Emphasize type safety and static analysis
- Practice component-driven development

# Code Implementation Guidelines

### Planning Phase

- Begin with step-by-step planning
- Write detailed pseudocode before implementation
- Document component architecture and data flow
- Consider edge cases and error scenarios
- Code Style Standards
- Eliminate unused variables
- Add space after keywords
- Always use strict equality (===) instead of loose equality (==)
- Space infix operators
- Add space after commas
- Keep else statements on the same line as closing curly braces
- Use curly braces for multi-line if statements
- Always handle error parameters in callbacks

## Commands

- **Dev server**: `bun run dev`
- **Build**: `bun run build` (runs tsc + vite build)
- **Lint**: `bun run lint`
- **Type check**: `tsc -b`

## Code Style

- **Imports**: Use `@/*` path alias for src imports (e.g., `@/components/common`)
- **Import order**: External packages first, then `@/` imports, then relative imports
- **Components**: Functional components with TypeScript interfaces for props
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for files
- **Types**: Define interfaces above components; use explicit types, avoid `any`
- **Exports**: Named exports preferred; use barrel files (`index.ts`) for component directories

## Stack

- React 19, TypeScript (strict mode), Vite, TailwindCSS v4, React Router v7
- UI: Base UI components with CVA for variants, `cn()` for class merging
- Data: TanStack Query for server state, OpenCode SDK (`@opencode-ai/sdk`)

## Error Handling

- Use TypeScript strict mode; handle potential undefined/null values
- API errors handled via TanStack Query's error states

## UI Components

- Always use shadcn/ui components for consistency
- Use CVA for component variants; avoid hardcoding styles
- Use `cn()` utility for conditional class names
