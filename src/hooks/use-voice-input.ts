import { useState, useRef, useCallback, useEffect } from "react";
import { createLiveConnection, LiveTranscriptionEvents } from "@/lib/deepgram";
import type { ListenLiveClient } from "@/lib/deepgram";

export interface UseVoiceInputOptions {
  apiKey: string;
  language?: string;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
}

export interface UseVoiceInputReturn {
  isRecording: boolean;
  isConnecting: boolean;
  isStopping: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  error: Error | null;
}

/**
 * Custom hook for managing voice recording and Deepgram transcription
 * using the official Deepgram SDK
 */
export function useVoiceInput(options: UseVoiceInputOptions): UseVoiceInputReturn {
  const { apiKey, language = "en-US", onTranscript, onError } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connectionRef = useRef<ListenLiveClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWaitingForFinalRef = useRef(false);

  // Refs to store callbacks to avoid stale closures
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  /**
   * Clean up all resources
   */
  const cleanup = useCallback(() => {
    // Clear any pending timeout
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    isWaitingForFinalRef.current = false;

    // Stop MediaRecorder
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }

    // Stop all tracks in MediaStream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Close Deepgram connection
    if (connectionRef.current) {
      connectionRef.current.requestClose();
      connectionRef.current = null;
    }

    setIsRecording(false);
    setIsConnecting(false);
    setIsStopping(false);
  }, []);

  /**
   * Handle errors
   */
  const handleError = useCallback(
    (err: Error) => {
      setError(err);
      onErrorRef.current?.(err);
      cleanup();
    },
    [cleanup]
  );

  /**
   * Get a supported MIME type for MediaRecorder
   */
  const getSupportedMimeType = useCallback((): string => {
    const mimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return "";
  }, []);

  /**
   * Start voice recording and transcription
   */
  const startRecording = useCallback(async () => {
    setError(null);

    if (isRecording || isConnecting || isStopping) {
      return;
    }

    setIsConnecting(true);

    try {
      // Request microphone permission
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      } catch {
        handleError(
          new Error(
            "Microphone permission denied. Please allow microphone access to use voice input."
          )
        );
        return;
      }

      // Create Deepgram connection using SDK
      const connection = createLiveConnection(apiKey, {
        language,
        model: "nova-2",
        smart_format: true,
        interim_results: true,
        utterance_end_ms: 1000,
        vad_events: true,
        endpointing: 300,
      });

      connectionRef.current = connection;

      // Set up event handlers
      connection.on(LiveTranscriptionEvents.Open, () => {
        // Check if stream is still active (user might have stopped before connection opened)
        if (!mediaStreamRef.current || !mediaStreamRef.current.active) {
          connection.requestClose();
          cleanup();
          return;
        }

        setIsConnecting(false);
        setIsRecording(true);

        // Start MediaRecorder
        const mimeType = getSupportedMimeType();
        try {
          const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
            mimeType: mimeType || undefined,
          });
          mediaRecorderRef.current = mediaRecorder;

          // Send audio chunks to Deepgram
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && connectionRef.current) {
              connectionRef.current.send(event.data);
            }
          };

          mediaRecorder.onerror = () => {
            handleError(new Error("MediaRecorder error occurred"));
          };

          // Start recording with 250ms timeslice for low latency
          mediaRecorder.start(250);
        } catch {
          handleError(new Error("Failed to start MediaRecorder. Please try again."));
        }
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript;

        if (transcript) {
          const isFinal = data.is_final ?? false;
          onTranscriptRef.current(transcript, isFinal);
        }

        // If waiting for final and got speech_final, close the connection
        if (isWaitingForFinalRef.current && data.speech_final) {
          // Clear the timeout since we got the final response
          if (stopTimeoutRef.current) {
            clearTimeout(stopTimeoutRef.current);
            stopTimeoutRef.current = null;
          }
          // Now close the connection - this will trigger the Close event and cleanup
          if (connectionRef.current) {
            connectionRef.current.requestClose();
          }
        }
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        // Connection closed - cleanup everything
        cleanup();
      });

      connection.on(LiveTranscriptionEvents.Error, (err) => {
        handleError(
          new Error(
            err instanceof Error ? err.message : "Deepgram connection error. Check your API key."
          )
        );
      });
    } catch (err) {
      handleError(err instanceof Error ? err : new Error("Failed to start voice recording"));
    }
  }, [
    apiKey,
    language,
    isRecording,
    isConnecting,
    isStopping,
    getSupportedMimeType,
    handleError,
    cleanup,
  ]);

  /**
   * Stop voice recording and wait for final transcription
   */
  const stopRecording = useCallback(() => {
    if (!isRecording && !isConnecting) {
      return;
    }

    if (isStopping) {
      return;
    }

    setIsStopping(true);
    setIsRecording(false);
    isWaitingForFinalRef.current = true;

    const finalizeAndClose = () => {
      // Release microphone
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      // Don't close the connection yet - wait for Deepgram to send final transcription
      // The connection will be closed when we receive speech_final or timeout
      if (connectionRef.current) {
        // Timeout fallback in case we don't get a final response
        stopTimeoutRef.current = setTimeout(() => {
          if (isWaitingForFinalRef.current) {
            cleanup();
          }
        }, 3000);
      } else {
        cleanup();
      }
    };

    // Stop MediaRecorder - this triggers final dataavailable event
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      // Wait for the final audio chunk to be sent before closing
      mediaRecorderRef.current.onstop = () => {
        // Small delay to ensure the last chunk is sent over WebSocket
        setTimeout(finalizeAndClose, 100);
      };
      mediaRecorderRef.current.stop();
    } else {
      finalizeAndClose();
    }
  }, [isRecording, isConnecting, isStopping, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isRecording,
    isConnecting,
    isStopping,
    startRecording,
    stopRecording,
    error,
  };
}
