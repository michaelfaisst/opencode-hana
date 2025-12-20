import { User, Bot } from "lucide-react";
import { MarkdownContent } from "@/components/common/markdown-content";
import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";
import { ReasoningDisplay } from "./reasoning-display";
import { FileDisplay } from "./file-display";
import { ToolInvocationDisplay } from "./tool-invocation-display";
import { useAppSettingsStore } from "@/stores";
import { useProviders } from "@/hooks";
import type {
    Part,
    TextPart,
    ToolPart,
    FilePart,
    ReasoningPart
} from "./types";

interface MessageItemProps {
    role: "user" | "assistant";
    parts: Part[];
    isStreaming?: boolean;
}

export const MessageItem = memo(function MessageItem({
    role,
    parts,
    isStreaming
}: MessageItemProps) {
    const isUser = role === "user";
    const { assistantPersona, selectedModel } = useAppSettingsStore();
    const { data: providersData } = useProviders();

    // Compute the assistant display name based on persona settings
    const assistantName = useMemo(() => {
        switch (assistantPersona.nameSource) {
            case "model": {
                if (!selectedModel || !providersData?.providers) {
                    return "Assistant";
                }
                const provider = providersData.providers.find(
                    (p) => p.id === selectedModel.providerID
                );
                if (!provider?.models) return "Assistant";
                const model = provider.models[selectedModel.modelID] as
                    | { name?: string }
                    | undefined;
                return model?.name || selectedModel.modelID || "Assistant";
            }
            case "custom":
                return assistantPersona.customName || "Assistant";
            case "default":
            default:
                return "Assistant";
        }
    }, [assistantPersona, selectedModel, providersData]);

    // Combine text parts (excluding synthetic/ignored ones)
    const textContent = parts
        .filter(
            (part): part is TextPart =>
                part.type === "text" &&
                !!(part as TextPart).text &&
                !(part as TextPart).synthetic &&
                !(part as TextPart).ignored
        )
        .map((part) => part.text)
        .join("\n");

    // Get tool invocations
    const toolParts = parts.filter(
        (part): part is ToolPart => part.type === "tool"
    );

    // Get file parts
    const fileParts = parts.filter(
        (part): part is FilePart => part.type === "file"
    );

    // Get reasoning parts
    const reasoningParts = parts.filter(
        (part): part is ReasoningPart => part.type === "reasoning"
    );

    // Don't render messages with no visible content (e.g., empty messages from /compact)
    const hasVisibleContent =
        textContent ||
        toolParts.length > 0 ||
        fileParts.length > 0 ||
        reasoningParts.length > 0 ||
        isStreaming;
    if (!hasVisibleContent) {
        return null;
    }

    return (
        <div
            className={cn(
                "flex gap-3 px-4 py-3 animate-message-appear",
                isUser ? "bg-muted/50" : "bg-background"
            )}
        >
            <div
                className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden",
                    isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                )}
            >
                {isUser ? (
                    <User className="h-4 w-4" />
                ) : assistantPersona.avatarBase64 ? (
                    <img
                        src={assistantPersona.avatarBase64}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <Bot className="h-4 w-4" />
                )}
            </div>
            <div className="flex-1 space-y-2 overflow-hidden">
                <div className="text-xs font-medium text-muted-foreground">
                    {isUser ? "You" : assistantName}
                </div>

                {/* Reasoning content (collapsible) */}
                {reasoningParts.length > 0 && (
                    <ReasoningDisplay parts={reasoningParts} />
                )}

                {/* Main text content */}
                {textContent && (
                    <div className="text-sm">
                        <MarkdownContent content={textContent} />
                    </div>
                )}

                {/* File attachments */}
                {fileParts.length > 0 && (
                    <div className="space-y-1">
                        {fileParts.map((part, index) => (
                            <FileDisplay key={index} part={part} />
                        ))}
                    </div>
                )}

                {/* Tool invocations */}
                {toolParts.length > 0 && (
                    <div className="space-y-2">
                        {toolParts.map((part, index) => (
                            <ToolInvocationDisplay
                                key={part.callID || index}
                                part={part}
                            />
                        ))}
                    </div>
                )}

                {isStreaming && (
                    <div className="flex items-center gap-1">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                        <span className="text-xs text-muted-foreground">
                            Thinking...
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
});
