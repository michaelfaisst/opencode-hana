import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Send, X, Image as ImageIcon, Lightbulb, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileMentionPopover } from "./file-mention-popover";
import { CommandPopover } from "./command-popover";
import { ImageLightbox } from "./image-lightbox";
import { useFileSearch } from "@/hooks/use-file-search";
import { filterCommands, type Command } from "@/hooks/use-commands";
import { ModelSelector, type SelectedModel } from "@/components/common";
import type { ImageAttachment } from "@/hooks/use-messages";
import type { AgentMode } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (message: string, images?: ImageAttachment[]) => void;
  onAbort?: () => void;
  onToggleMode?: () => void;
  onCommand?: (command: Command) => void;
  disabled?: boolean;
  isBusy?: boolean;
  placeholder?: string;
  agentMode?: AgentMode;
  selectedModel?: SelectedModel;
  onModelChange?: (model: SelectedModel) => void;
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
  selectedModel,
  onModelChange,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<ImageAttachment | null>(null);
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

  const { files, isLoading: isSearching, searchFiles, clearFiles } = useFileSearch();

  // Filter commands based on query
  const filteredCommands = commandState.isActive ? filterCommands(commandState.query) : [];

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

  // Reset selected index when files or commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [files, filteredCommands.length]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart;
      setMessage(newValue);

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
    [mentionState.isActive, commandState.isActive]
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

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
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
    },
    []
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handleSubmit = () => {
    // Block if no content or explicitly disabled
    if ((!message.trim() && images.length === 0) || disabled) return;
    onSendMessage(message.trim(), images.length > 0 ? images : undefined);
    setMessage("");
    setImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Escape to abort when busy
    if (e.key === "Escape" && !mentionState.isActive && !commandState.isActive) {
      if (isBusy && onAbort) {
        e.preventDefault();
        onAbort();
        return;
      }
    }

    // Handle Tab to toggle mode (only when not in mention/command and not busy)
    if (e.key === "Tab" && !mentionState.isActive && !commandState.isActive && onToggleMode) {
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
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          return;
        case "Enter":
          e.preventDefault();
          handleSelectCommand(filteredCommands[selectedIndex]);
          return;
        case "Escape":
          e.preventDefault();
          closeCommand();
          return;
        case "Tab":
          e.preventDefault();
          handleSelectCommand(filteredCommands[selectedIndex]);
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
          handleSelectFile(files[selectedIndex]);
          return;
        case "Escape":
          e.preventDefault();
          closeMention();
          return;
        case "Tab":
          e.preventDefault();
          handleSelectFile(files[selectedIndex]);
          return;
      }
    }

    // Handle Escape to close popover even when no files
    if (mentionState.isActive && e.key === "Escape") {
      e.preventDefault();
      closeMention();
      return;
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
      {images.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group rounded-md overflow-hidden border bg-muted"
            >
              <button
                type="button"
                onClick={() => setLightboxImage(image)}
                className="block cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <img
                  src={image.dataUrl}
                  alt={image.file.name}
                  className="h-20 w-20 object-cover"
                />
              </button>
              <button
                onClick={() => removeImage(image.id)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-1 py-0.5 pointer-events-none">
                <span className="text-[10px] text-muted-foreground truncate block">
                  {image.file.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

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
            selectedIndex={selectedIndex}
            onSelect={handleSelectFile}
            onClose={closeMention}
          />
          {/* Command popover */}
          <CommandPopover
            isOpen={commandState.isActive}
            commands={filteredCommands}
            selectedIndex={selectedIndex}
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
        <Button
          onClick={handleSubmit}
          disabled={!hasContent || disabled}
          size="icon"
          className="shrink-0 h-[44px] w-[44px]"
          title={isBusy ? "Message will be queued" : undefined}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      
      {/* Controls row: mode toggle, model selector, and hints */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2">
          {/* Mode toggle button */}
          {onToggleMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleMode}
              disabled={isBusy}
              className={cn(
                "gap-1.5 text-xs",
                agentMode === "plan" ? "border-amber-500/50" : "border-blue-500/50"
              )}
              title={`Current mode: ${agentMode}. Press Tab to switch.`}
            >
              {agentMode === "plan" ? (
                <>
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span>Plan</span>
                </>
              ) : (
                <>
                  <Hammer className="h-3.5 w-3.5 text-blue-500" />
                  <span>Build</span>
                </>
              )}
            </Button>
          )}
          
          {/* Model selector */}
          {selectedModel && onModelChange && (
            <ModelSelector
              value={selectedModel}
              onChange={onModelChange}
              disabled={isBusy}
              className="flex-1 sm:flex-none"
            />
          )}
        </div>
        
        {/* Hints */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground sm:ml-auto">
          <span>/ commands</span>
          <span className="text-muted-foreground/50">·</span>
          <span>@ files</span>
          <span className="text-muted-foreground/50">·</span>
          <span>Tab mode</span>
          {isBusy && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span>Esc cancel</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-primary">queues</span>
            </>
          )}
          <span className="text-muted-foreground/50">·</span>
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            paste
          </span>
        </div>
      </div>
    </div>
  );
});
