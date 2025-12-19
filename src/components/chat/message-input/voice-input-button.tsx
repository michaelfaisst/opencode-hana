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

export function VoiceInputButton({
  apiKey,
  language,
  onTranscript,
  onRecordingStart,
  disabled = false,
}: VoiceInputButtonProps) {
  const { isRecording, isConnecting, isStopping, startRecording, stopRecording } = useVoiceInput({
    apiKey,
    language,
    onTranscript,
  });

  const handleClick = async () => {
    if (isRecording) {
      stopRecording();
    } else if (!isStopping) {
      onRecordingStart?.();
      await startRecording();
    }
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
        {getTooltipMessage()}
      </TooltipContent>
    </Tooltip>
  );
}
