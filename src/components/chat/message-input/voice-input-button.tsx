import { forwardRef, useImperativeHandle } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/hooks/use-voice-input";

interface VoiceInputButtonProps {
  apiKey: string;
  language?: string;
  onTranscript: (text: string, isFinal: boolean) => void;
  onRecordingStart?: () => void;
  disabled?: boolean;
}

export interface VoiceInputButtonRef {
  toggle: () => void;
}

export const VoiceInputButton = forwardRef<VoiceInputButtonRef, VoiceInputButtonProps>(
  function VoiceInputButton({
    apiKey,
    language,
    onTranscript,
    onRecordingStart,
    disabled = false,
  }, ref) {
    const { isRecording, isConnecting, isStopping, startRecording, stopRecording } = useVoiceInput({
      apiKey,
      language,
      onTranscript,
    });

    const handleToggle = async () => {
      if (isRecording) {
        stopRecording();
      } else if (!isStopping && !isConnecting) {
        onRecordingStart?.();
        await startRecording();
      }
    };

    // Expose toggle function to parent
    useImperativeHandle(ref, () => ({
      toggle: handleToggle,
    }), [isRecording, isStopping, isConnecting]);

    const handleClick = () => {
      handleToggle();
    };

    const getTooltipMessage = () => {
      if (isConnecting) return "Connecting...";
      if (isStopping) return "Processing...";
      if (isRecording) return "Stop recording";
      return "Start voice input";
    };

    const getIcon = () => {
      if (isConnecting || isStopping) {
        return <Loader2 className="h-5 w-5 animate-spin" />;
      }
      if (isRecording) {
        return <MicOff className="h-5 w-5" />;
      }
      return <Mic className="h-5 w-5" />;
    };

    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              onClick={handleClick}
              disabled={disabled || isConnecting || isStopping}
              className={cn(
                "shrink-0 h-[44px] w-[44px]",
                isRecording && "bg-rose-500 hover:bg-rose-600 text-white border-rose-500 animate-pulse"
              )}
            >
              {getIcon()}
            </Button>
          }
        />
        <TooltipContent side="top">
          {getTooltipMessage()} (Alt+Shift)
        </TooltipContent>
      </Tooltip>
    );
  }
);
