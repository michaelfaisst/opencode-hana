/**
 * Mock data fixtures for tests
 */

export const mockProjects = [
    {
        id: "project-1",
        worktree: "/Users/test/projects/project-one",
        vcs: "git" as const,
        time: {
            created: 1700000000000,
            updated: 1700001000000
        }
    },
    {
        id: "project-2",
        worktree: "/Users/test/projects/project-two",
        vcs: "git" as const,
        time: {
            created: 1699000000000,
            updated: 1699001000000
        }
    },
    {
        id: "global",
        worktree: "/",
        time: {
            created: 1698000000000
        }
    }
];

export const mockSessions = [
    {
        id: "session-1",
        title: "Test Session 1",
        time: {
            created: 1700000000000,
            updated: 1700002000000
        }
    },
    {
        id: "session-2",
        title: "Test Session 2",
        time: {
            created: 1699000000000,
            updated: 1699002000000
        }
    }
];

export const mockMessages = [
    {
        id: "msg-1",
        info: {
            role: "user" as const
        },
        parts: [
            {
                type: "text" as const,
                text: "Hello, can you help me?"
            }
        ],
        time: {
            created: 1700000000000
        }
    },
    {
        id: "msg-2",
        info: {
            role: "assistant" as const
        },
        parts: [
            {
                type: "text" as const,
                text: "Of course! How can I help you today?"
            }
        ],
        time: {
            created: 1700000001000
        }
    }
];

export const mockProviders = [
    {
        id: "anthropic",
        name: "Anthropic",
        models: [
            { id: "claude-3-opus", name: "Claude 3 Opus" },
            { id: "claude-3-sonnet", name: "Claude 3 Sonnet" }
        ]
    },
    {
        id: "openai",
        name: "OpenAI",
        models: [
            { id: "gpt-4", name: "GPT-4" },
            { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" }
        ]
    }
];

export const mockConfig = {
    provider: "anthropic",
    model: "claude-3-sonnet"
};
