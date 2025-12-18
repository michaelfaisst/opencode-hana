import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { FileMentionPopover } from "./file-mention-popover";
import { CommandPopover } from "./command-popover";
import { ImageLightbox } from "./image-lightbox";
import { ImagePreviewGrid } from "./message-input/image-preview-grid";
import { InputControlsRow } from "./message-input/input-controls-row";
import { useFileSearch } from "@/hooks/use-file-search";
import { useInputHistory } from "@/hooks/use-input-history";
import { filterCommands, type Command } from "@/hooks/use-commands";
import { useSessionStore, useAppSettingsStore, type AgentMode } from "@/stores";
import type { ImageAttachment } from "@/hooks/use-messages";

interface MessageInputProps {
  onSendMessage: (message: string, images?: ImageAttachment[]) => void;
  onAbort?: () => void;
  onToggleMode?: () => void;
  onCommand?: (command: Command) => void;
  disabled?: boolean;
  isBusy?: boolean;
  placeholder?: string;
  agentMode?: AgentMode;
  /** Auto-focus the input field on mount */
  autoFocus?: boolean;
}

interface MentionState {
  isActive: boolean;
  startIndex: number;
  query: string;
}

interface CommandState {
  isActive: boolean;
  query: string;
}

export const MessageInput = memo(function MessageInput({
  onSendMessage,
  onAbort,
  onToggleMode,
  onCommand,
  disabled,
  isBusy,
  placeholder = "Type a message... (@ files, / commands)",
  agentMode = "build",
  autoFocus = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<ImageAttachment | null>(
    null
  );
  const [mentionState, setMentionState] = useState<MentionState>({
    isActive: false,
    startIndex: -1,
    query: "",
  });
  const [commandState, setCommandState] = useState<CommandState>({
    isActive: false,
    query: "",
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get the session's directory from the store
  const directory = useSessionStore((state) => state.directory);
  const { selectedModel, setSelectedModel } = useAppSettingsStore();

  const {
    files,
    isLoading: isSearching,
    searchFiles,
    clearFiles,
  } = useFileSearch({ directory: directory ?? undefined });

  // Input history for arrow key navigation
  const {
    addToHistory,
    navigateUp,
    navigateDown,
    resetNavigation,
    isNavigating,
    historyLength,
  } = useInputHistory();

  // Filter commands based on query
  const filteredCommands = commandState.isActive
    ? filterCommands(commandState.query)
    : [];

  // Compute effective selected index, clamped to valid range
  // This avoids needing to reset state when lists change
  const effectiveSelectedIndex = useMemo(() => {
    if (commandState.isActive && filteredCommands.length > 0) {
      return Math.min(selectedIndex, filteredCommands.length - 1);
    }
    if (mentionState.isActive && files.length > 0) {
      return Math.min(selectedIndex, files.length - 1);
    }
    return 0;
  }, [selectedIndex, commandState.isActive, mentionState.isActive, filteredCommands.length, files.length]);

  // Auto-focus textarea on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus) {
      // Use a small delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Search files when mention query changes
  useEffect(() => {
    if (mentionState.isActive) {
      searchFiles(mentionState.query);
    } else {
      clearFiles();
    }
  }, [mentionState.isActive, mentionState.query, searchFiles, clearFiles]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart;
      setMessage(newValue);

      // Reset history navigation when user types
      if (isNavigating) {
        resetNavigation();
      }

      // Check for / command at the start
      if (newValue.startsWith("/")) {
        const query = newValue.slice(1).split(" ")[0]; // Get text after / until first space
        const hasSpace = newValue.indexOf(" ") !== -1;

        if (!hasSpace) {
          setCommandState({
            isActive: true,
            query: query,
          });
          // Close mention if command is active
          if (mentionState.isActive) {
            setMentionState({ isActive: false, startIndex: -1, query: "" });
          }
          return;
        }
      }

      // Close command state if not starting with /
      if (commandState.isActive) {
        setCommandState({ isActive: false, query: "" });
      }

      // Check for @ mention
      const textBeforeCursor = newValue.slice(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        // Check if there's a space between @ and cursor (which would end the mention)
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        const hasSpace = textAfterAt.includes(" ");

        if (!hasSpace) {
          // We're in a mention
          setMentionState({
            isActive: true,
            startIndex: lastAtIndex,
            query: textAfterAt,
          });
          return;
        }
      }

      // Not in a mention
      if (mentionState.isActive) {
        setMentionState({
          isActive: false,
          startIndex: -1,
          query: "",
        });
      }
    },
    [
      mentionState.isActive,
      commandState.isActive,
      isNavigating,
      resetNavigation,
    ]
  );

  const handleSelectFile = useCallback(
    (file: string) => {
      // Replace the @query with @file
      const beforeMention = message.slice(0, mentionState.startIndex);
      const afterMention = message.slice(
        mentionState.startIndex + mentionState.query.length + 1
      );

      const newMessage = `${beforeMention}@${file} ${afterMention}`;
      setMessage(newMessage);

      // Close the popover
      setMentionState({
        isActive: false,
        startIndex: -1,
        query: "",
      });

      // Focus textarea and set cursor position
      const newCursorPos = mentionState.startIndex + file.length + 2;
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [message, mentionState]
  );

  const handleSelectCommand = useCallback(
    (command: Command) => {
      // Clear the input and close popover
      setMessage("");
      setCommandState({ isActive: false, query: "" });

      // Execute the command
      if (onCommand) {
        onCommand(command);
      }

      // Refocus the textarea unless the command opens a dialog
      if (!command.opensDialog) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }
    },
    [onCommand]
  );

  const closeMention = useCallback(() => {
    setMentionState({
      isActive: false,
      startIndex: -1,
      query: "",
    });
  }, []);

  const closeCommand = useCallback(() => {
    setCommandState({ isActive: false, query: "" });
  }, []);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageItems: DataTransferItem[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        imageItems.push(items[i]);
      }
    }

    if (imageItems.length === 0) return;

    // Prevent default paste behavior for images
    e.preventDefault();

    for (const item of imageItems) {
      const file = item.getAsFile();
      if (!file) continue;

      // Convert to data URL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newImage: ImageAttachment = {
          id: crypto.randomUUID(),
          file,
          dataUrl,
          mime: file.type,
        };
        setImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handleSubmit = () => {
    // Block if no content or explicitly disabled
    if ((!message.trim() && images.length === 0) || disabled) return;

    // Add to input history before sending
    if (message.trim()) {
      addToHistory(message.trim());
    }

    onSendMessage(message.trim(), images.length > 0 ? images : undefined);
    setMessage("");
    setImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Escape to abort when busy
    if (
      e.key === "Escape" &&
      !mentionState.isActive &&
      !commandState.isActive
    ) {
      if (isBusy && onAbort) {
        e.preventDefault();
        onAbort();
        return;
      }
    }

    // Handle Tab to toggle mode (only when not in mention/command and not busy)
    if (
      e.key === "Tab" &&
      !mentionState.isActive &&
      !commandState.isActive &&
      onToggleMode
    ) {
      e.preventDefault();
      onToggleMode();
      return;
    }

    // Handle command navigation
    if (commandState.isActive && filteredCommands.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
          return;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(
            (prev) =>
              (prev - 1 + filteredCommands.length) % filteredCommands.length
          );
          return;
        case "Enter":
          e.preventDefault();
          handleSelectCommand(filteredCommands[effectiveSelectedIndex]);
          return;
        case "Escape":
          e.preventDefault();
          closeCommand();
          return;
        case "Tab":
          e.preventDefault();
          handleSelectCommand(filteredCommands[effectiveSelectedIndex]);
          return;
      }
    }

    // Handle Escape to close command popover even when no commands match
    if (commandState.isActive && e.key === "Escape") {
      e.preventDefault();
      closeCommand();
      return;
    }

    // Handle mention navigation
    if (mentionState.isActive && files.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % files.length);
          return;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + files.length) % files.length);
          return;
        case "Enter":
          e.preventDefault();
          handleSelectFile(files[effectiveSelectedIndex]);
          return;
        case "Escape":
          e.preventDefault();
          closeMention();
          return;
        case "Tab":
          e.preventDefault();
          handleSelectFile(files[effectiveSelectedIndex]);
          return;
      }
    }

    // Handle Escape to close popover even when no files
    if (mentionState.isActive && e.key === "Escape") {
      e.preventDefault();
      closeMention();
      return;
    }

    // Handle input history navigation with arrow keys (only when input is empty or already navigating)
    if (!mentionState.isActive && !commandState.isActive && historyLength > 0) {
      if (e.key === "ArrowUp" && (!message.trim() || isNavigating)) {
        e.preventDefault();
        const historyMessage = navigateUp(message);
        if (historyMessage !== undefined) {
          setMessage(historyMessage);
        }
        return;
      }

      if (e.key === "ArrowDown" && isNavigating) {
        e.preventDefault();
        const historyMessage = navigateDown();
        if (historyMessage !== undefined) {
          setMessage(historyMessage);
        }
        return;
      }
    }

    // Normal enter behavior
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContent = message.trim() || images.length > 0;

  return (
    <div className="bg-background p-4">
      {/* Image previews */}
      <ImagePreviewGrid
        images={images}
        onRemove={removeImage}
        onImageClick={setLightboxImage}
      />

      {/* Image Lightbox */}
      <ImageLightbox
        open={!!lightboxImage}
        onOpenChange={(open) => !open && setLightboxImage(null)}
        src={lightboxImage?.dataUrl || ""}
        alt={lightboxImage?.file.name}
      />

      <div className="relative flex gap-2 items-start">
        <div className="relative flex-1">
          {/* File mention popover */}
          <FileMentionPopover
            isOpen={mentionState.isActive}
            files={files}
            isLoading={isSearching}
            selectedIndex={effectiveSelectedIndex}
            onSelect={handleSelectFile}
            onClose={closeMention}
          />
          {/* Command popover */}
          <CommandPopover
            isOpen={commandState.isActive}
            commands={filteredCommands}
            selectedIndex={effectiveSelectedIndex}
            onSelect={handleSelectCommand}
            onClose={closeCommand}
          />
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[44px] max-h-[200px] resize-none"
            rows={1}
          />
        </div>
        {isBusy ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  onClick={handleSubmit}
                  disabled={!hasContent || disabled}
                  size="icon"
                  className="shrink-0 h-[44px] w-[44px]"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              }
            />
            <TooltipContent>Message will be queued</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!hasContent || disabled}
            size="icon"
            className="shrink-0 h-[44px] w-[44px]"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        )}
      </div>

      {/* Controls row: mode toggle, model selector, and hints */}
      <InputControlsRow
        agentMode={agentMode}
        isBusy={isBusy ?? false}
        selectedModel={selectedModel ?? undefined}
        onToggleMode={onToggleMode}
        onModelChange={setSelectedModel}
      />
    </div>
  );
});
