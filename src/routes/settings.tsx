import { Header } from "@/components/layout/header";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Combobox,
    ComboboxSelectTrigger,
    ComboboxPopupInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxGroup,
    ComboboxLabel,
    ComboboxEmpty,
    ComboboxSeparator,
    ComboboxValue
} from "@/components/ui/combobox";
import { useProviders } from "@/hooks";
import {
    useAppSettingsStore,
    useNotificationStore,
    PRESET_NOTIFICATION_SOUNDS,
    isCustomSound
} from "@/stores";
import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    X,
    ArrowLeft,
    Github,
    Volume2,
    Bell,
    Mic,
    Eye,
    EyeOff,
    User
} from "lucide-react";
import {
    requestNotificationPermission,
    getBrowserNotificationPermission,
    previewSound
} from "@/lib/notifications";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    AvatarUpload,
    SoundUpload,
    CustomSoundsList
} from "@/components/settings";

export function SettingsPage() {
    const navigate = useNavigate();
    const {
        defaultModel,
        replaceSessionOnNew,
        showMessageTimestamps,
        showSessionTimestamps,
        setDefaultModel,
        setReplaceSessionOnNew,
        setShowMessageTimestamps,
        setShowSessionTimestamps,
        voiceInput,
        setVoiceInputEnabled,
        setVoiceInputApiKey,
        setVoiceInputLanguage,
        assistantPersona,
        setAssistantNameSource,
        setAssistantCustomName,
        setAssistantAvatar,
        setAssistantSystemPrompt
    } = useAppSettingsStore();
    const {
        notificationsEnabled,
        browserNotificationsEnabled,
        soundEnabled,
        selectedSound,
        browserPermission,
        customSounds,
        customSoundsLoaded,
        setNotificationsEnabled,
        setBrowserNotificationsEnabled,
        setSoundEnabled,
        setSelectedSound,
        setBrowserPermission,
        loadCustomSounds
    } = useNotificationStore();
    const { data: providersData, isLoading: isLoadingProviders } =
        useProviders();
    const serverUrl =
        import.meta.env.VITE_OPENCODE_SERVER_URL || "http://localhost:4096";
    const [inputValue, setInputValue] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);

    // Sync browser permission state and load custom sounds on mount
    useEffect(() => {
        setBrowserPermission(getBrowserNotificationPermission());
        loadCustomSounds();
    }, [setBrowserPermission, loadCustomSounds]);

    // Handle requesting browser notification permission
    const handleRequestPermission = useCallback(async () => {
        const permission = await requestNotificationPermission();
        setBrowserPermission(permission);
    }, [setBrowserPermission]);

    // Build a flat list of all models for the selector
    const allModels = useMemo(() => {
        const models: Array<{
            providerID: string;
            providerName: string;
            modelID: string;
            modelName: string;
            value: string;
            label: string;
        }> = [];

        if (!providersData?.providers) return models;

        for (const provider of providersData.providers) {
            for (const [modelId, model] of Object.entries(
                provider.models || {}
            )) {
                const modelName = (model as { name?: string })?.name || modelId;
                models.push({
                    providerID: provider.id,
                    providerName: provider.name,
                    modelID: modelId,
                    modelName,
                    value: `${provider.id}::${modelId}`,
                    label: `${provider.name}: ${modelName}`
                });
            }
        }

        return models;
    }, [providersData]);

    // Create a map for quick lookup of labels by value
    const valueToLabelMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const model of allModels) {
            map.set(model.value, model.label);
        }
        return map;
    }, [allModels]);

    // Group models by provider and filter based on search input
    const filteredGroupedModels = useMemo(() => {
        const groups: Record<
            string,
            { providerName: string; models: typeof allModels }
        > = {};
        const query = inputValue.toLowerCase().trim();

        for (const model of allModels) {
            if (query && !model.label.toLowerCase().includes(query)) {
                continue;
            }

            if (!groups[model.providerID]) {
                groups[model.providerID] = {
                    providerName: model.providerName,
                    models: []
                };
            }
            groups[model.providerID].models.push(model);
        }

        return Object.entries(groups);
    }, [allModels, inputValue]);

    const currentModelValue = defaultModel
        ? `${defaultModel.providerID}::${defaultModel.modelID}`
        : "";

    // Convert value to label for display in the trigger
    const itemToStringLabel = useCallback(
        (optionValue: string) => {
            return valueToLabelMap.get(optionValue) ?? optionValue;
        },
        [valueToLabelMap]
    );

    const handleModelChange = (value: string | null) => {
        if (!value) {
            setDefaultModel(null);
            return;
        }
        const [providerID, modelID] = value.split("::");
        setDefaultModel({ providerID, modelID });
    };

    // Clear search when popup opens
    const handleModelOpenChange = (open: boolean) => {
        if (open) {
            setInputValue("");
        }
    };

    const clearDefaultModel = () => {
        setDefaultModel(null);
        setInputValue("");
    };

    const handleGoBack = () => {
        // Go back if there's history, otherwise go to sessions
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate("/sessions");
        }
    };

    return (
        <div className="flex flex-col h-full">
            <Header
                title="Settings"
                leftContent={
                    <button
                        onClick={handleGoBack}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-none hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Go back</span>
                    </button>
                }
            />
            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Server Connection
                            </CardTitle>
                            <CardDescription>
                                Configure the OpenCode server URL
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="server-url">Server URL</Label>
                                <Input
                                    id="server-url"
                                    value={serverUrl}
                                    disabled
                                    className="max-w-sm font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Set via VITE_OPENCODE_SERVER_URL environment
                                    variable
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Personalization
                            </CardTitle>
                            <CardDescription>
                                Customize how the assistant appears in chat
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar upload */}
                            <div className="space-y-2">
                                <Label>Avatar</Label>
                                <AvatarUpload
                                    avatarBase64={assistantPersona.avatarBase64}
                                    onAvatarChange={setAssistantAvatar}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Upload a custom avatar for the assistant
                                </p>
                            </div>

                            {/* Name source selection */}
                            <div className="space-y-3">
                                <Label>Assistant Name</Label>
                                <RadioGroup
                                    value={assistantPersona.nameSource}
                                    onValueChange={(value) =>
                                        setAssistantNameSource(
                                            value as
                                                | "default"
                                                | "model"
                                                | "custom"
                                        )
                                    }
                                    className="space-y-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem
                                            value="default"
                                            id="name-default"
                                        />
                                        <Label
                                            htmlFor="name-default"
                                            className="font-normal cursor-pointer"
                                        >
                                            Use "Assistant"
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem
                                            value="model"
                                            id="name-model"
                                        />
                                        <Label
                                            htmlFor="name-model"
                                            className="font-normal cursor-pointer"
                                        >
                                            Use model name
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem
                                            value="custom"
                                            id="name-custom"
                                        />
                                        <Label
                                            htmlFor="name-custom"
                                            className="font-normal cursor-pointer"
                                        >
                                            Custom name
                                        </Label>
                                    </div>
                                </RadioGroup>
                                {assistantPersona.nameSource === "custom" && (
                                    <Input
                                        value={assistantPersona.customName}
                                        onChange={(e) =>
                                            setAssistantCustomName(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter a custom name..."
                                        className="max-w-sm"
                                    />
                                )}
                            </div>

                            {/* Custom system prompt */}
                            <div className="space-y-2">
                                <Label htmlFor="system-prompt">
                                    Custom Instructions
                                </Label>
                                <Textarea
                                    id="system-prompt"
                                    value={assistantPersona.customSystemPrompt}
                                    onChange={(e) =>
                                        setAssistantSystemPrompt(e.target.value)
                                    }
                                    placeholder="e.g., Respond like a helpful anime character. Use casual, friendly language..."
                                    className="min-h-[100px] resize-y"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Add custom instructions to change how the
                                    assistant behaves and responds. Leave empty
                                    for default behavior.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Default Model
                            </CardTitle>
                            <CardDescription>
                                Choose the default model for new conversations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="default-model">Model</Label>
                                <div className="flex gap-2 max-w-sm">
                                    <Combobox
                                        value={currentModelValue}
                                        onValueChange={handleModelChange}
                                        inputValue={inputValue}
                                        onInputValueChange={setInputValue}
                                        onOpenChange={handleModelOpenChange}
                                        disabled={isLoadingProviders}
                                        itemToStringLabel={itemToStringLabel}
                                    >
                                        <ComboboxSelectTrigger
                                            id="default-model"
                                            className="flex-1"
                                            disabled={isLoadingProviders}
                                        >
                                            <ComboboxValue>
                                                {(val) =>
                                                    isLoadingProviders
                                                        ? "Loading..."
                                                        : val
                                                          ? itemToStringLabel(
                                                                val as string
                                                            )
                                                          : "Select a model..."
                                                }
                                            </ComboboxValue>
                                        </ComboboxSelectTrigger>
                                        <ComboboxContent className="w-[var(--anchor-width)]">
                                            <div className="p-1 border-b border-border">
                                                <ComboboxPopupInput
                                                    placeholder="Search models..."
                                                    autoFocus
                                                />
                                            </div>
                                            <ComboboxList>
                                                {filteredGroupedModels.length ===
                                                    0 && (
                                                    <ComboboxEmpty>
                                                        No models found
                                                    </ComboboxEmpty>
                                                )}
                                                {filteredGroupedModels.map(
                                                    (
                                                        [providerID, group],
                                                        index
                                                    ) => (
                                                        <ComboboxGroup
                                                            key={providerID}
                                                        >
                                                            <ComboboxLabel>
                                                                {
                                                                    group.providerName
                                                                }
                                                            </ComboboxLabel>
                                                            {group.models.map(
                                                                (model) => (
                                                                    <ComboboxItem
                                                                        key={
                                                                            model.value
                                                                        }
                                                                        value={
                                                                            model.value
                                                                        }
                                                                    >
                                                                        {
                                                                            model.modelName
                                                                        }
                                                                    </ComboboxItem>
                                                                )
                                                            )}
                                                            {index <
                                                                filteredGroupedModels.length -
                                                                    1 && (
                                                                <ComboboxSeparator />
                                                            )}
                                                        </ComboboxGroup>
                                                    )
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                    {defaultModel && (
                                        <Tooltip>
                                            <TooltipTrigger
                                                render={
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={
                                                            clearDefaultModel
                                                        }
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                            <TooltipContent>
                                                Clear default model
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {defaultModel
                                        ? "This model will be selected by default when starting new chats."
                                        : "When not set, the first available model will be used."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Session Behavior
                            </CardTitle>
                            <CardDescription>
                                Configure how sessions are managed
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 max-w-lg">
                                <div className="flex-1 space-y-0.5">
                                    <Label htmlFor="replace-session">
                                        Replace session on new
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        When enabled, creating a new session
                                        will delete the current one and create a
                                        fresh session with the same directory
                                        and title.
                                    </p>
                                </div>
                                <Switch
                                    id="replace-session"
                                    checked={replaceSessionOnNew}
                                    onCheckedChange={setReplaceSessionOnNew}
                                />
                            </div>
                            <div className="flex items-center gap-4 max-w-lg">
                                <div className="flex-1 space-y-0.5">
                                    <Label htmlFor="show-timestamps">
                                        Show message timestamps
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Display the time each message was sent
                                    </p>
                                </div>
                                <Switch
                                    id="show-timestamps"
                                    checked={showMessageTimestamps}
                                    onCheckedChange={setShowMessageTimestamps}
                                />
                            </div>
                            <div className="flex items-center gap-4 max-w-lg">
                                <div className="flex-1 space-y-0.5">
                                    <Label htmlFor="show-session-timestamps">
                                        Show session timestamps
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Display created and updated times in the
                                        sessions sidebar
                                    </p>
                                </div>
                                <Switch
                                    id="show-session-timestamps"
                                    checked={showSessionTimestamps}
                                    onCheckedChange={setShowSessionTimestamps}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                Notifications
                            </CardTitle>
                            <CardDescription>
                                Get notified when the assistant finishes
                                responding
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Master toggle */}
                            <div className="flex items-center gap-4 max-w-lg">
                                <div className="flex-1 space-y-0.5">
                                    <Label htmlFor="notifications-enabled">
                                        Enable notifications
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Show notifications when assistant
                                        completes a response
                                    </p>
                                </div>
                                <Switch
                                    id="notifications-enabled"
                                    checked={notificationsEnabled}
                                    onCheckedChange={setNotificationsEnabled}
                                />
                            </div>

                            {notificationsEnabled && (
                                <>
                                    {/* Browser notifications */}
                                    <div className="flex items-center gap-4 max-w-lg">
                                        <div className="flex-1 space-y-0.5">
                                            <Label htmlFor="browser-notifications">
                                                Browser notifications
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {browserPermission === "granted"
                                                    ? "Show system notifications when tab is in background"
                                                    : browserPermission ===
                                                        "denied"
                                                      ? "Permission denied - enable in browser settings"
                                                      : "Requires permission to show system notifications"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {browserPermission ===
                                                "default" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={
                                                        handleRequestPermission
                                                    }
                                                >
                                                    Request Permission
                                                </Button>
                                            )}
                                            <Switch
                                                id="browser-notifications"
                                                checked={
                                                    browserNotificationsEnabled &&
                                                    browserPermission ===
                                                        "granted"
                                                }
                                                onCheckedChange={
                                                    setBrowserNotificationsEnabled
                                                }
                                                disabled={
                                                    browserPermission !==
                                                    "granted"
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Sound notifications */}
                                    <div className="flex items-center gap-4 max-w-lg">
                                        <div className="flex-1 space-y-0.5">
                                            <Label htmlFor="sound-enabled">
                                                Sound notifications
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Play a sound when assistant
                                                completes
                                            </p>
                                        </div>
                                        <Switch
                                            id="sound-enabled"
                                            checked={soundEnabled}
                                            onCheckedChange={setSoundEnabled}
                                        />
                                    </div>

                                    {/* Sound selector */}
                                    {soundEnabled && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>
                                                    Notification sound
                                                </Label>
                                                <div className="flex gap-2 max-w-sm">
                                                    <Select
                                                        value={
                                                            isCustomSound(
                                                                selectedSound
                                                            )
                                                                ? selectedSound
                                                                : selectedSound
                                                        }
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            value &&
                                                            setSelectedSound(
                                                                value as typeof selectedSound
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="flex-1">
                                                            <SelectValue>
                                                                {isCustomSound(
                                                                    selectedSound
                                                                )
                                                                    ? (customSounds.find(
                                                                          (s) =>
                                                                              `custom:${s.id}` ===
                                                                              selectedSound
                                                                      )?.name ??
                                                                      "Custom sound")
                                                                    : PRESET_NOTIFICATION_SOUNDS.find(
                                                                          (s) =>
                                                                              s.id ===
                                                                              selectedSound
                                                                      )?.label}
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {/* Preset sounds */}
                                                            {PRESET_NOTIFICATION_SOUNDS.map(
                                                                (sound) => (
                                                                    <SelectItem
                                                                        key={
                                                                            sound.id
                                                                        }
                                                                        value={
                                                                            sound.id
                                                                        }
                                                                    >
                                                                        {
                                                                            sound.label
                                                                        }
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                            {/* Custom sounds */}
                                                            {customSoundsLoaded &&
                                                                customSounds.length >
                                                                    0 && (
                                                                    <>
                                                                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t border-border mt-1 pt-2">
                                                                            Custom
                                                                        </div>
                                                                        {customSounds.map(
                                                                            (
                                                                                sound
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        sound.id
                                                                                    }
                                                                                    value={`custom:${sound.id}`}
                                                                                >
                                                                                    {
                                                                                        sound.name
                                                                                    }
                                                                                </SelectItem>
                                                                            )
                                                                        )}
                                                                    </>
                                                                )}
                                                        </SelectContent>
                                                    </Select>
                                                    <Tooltip>
                                                        <TooltipTrigger
                                                            render={
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        previewSound(
                                                                            selectedSound
                                                                        )
                                                                    }
                                                                >
                                                                    <Volume2 className="h-4 w-4" />
                                                                </Button>
                                                            }
                                                        />
                                                        <TooltipContent>
                                                            Preview sound
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>

                                            {/* Custom sounds management */}
                                            <CustomSoundsList
                                                sounds={customSounds}
                                                selectedSound={selectedSound}
                                                onSelect={setSelectedSound}
                                            />

                                            {/* Upload new custom sound */}
                                            <SoundUpload />
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Mic className="h-4 w-4" />
                                Voice Input
                            </CardTitle>
                            <CardDescription>
                                Configure voice-to-text input using Deepgram
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Enable voice input toggle */}
                            <div className="flex items-center gap-4 max-w-lg">
                                <div className="flex-1 space-y-0.5">
                                    <Label htmlFor="voice-input-enabled">
                                        Enable voice input
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {voiceInput.apiKey
                                            ? "Use your microphone to input text"
                                            : "Requires Deepgram API key"}
                                    </p>
                                </div>
                                <Switch
                                    id="voice-input-enabled"
                                    checked={voiceInput.enabled}
                                    onCheckedChange={setVoiceInputEnabled}
                                    disabled={!voiceInput.apiKey}
                                />
                            </div>

                            {/* Deepgram API Key input */}
                            <div className="space-y-2">
                                <Label htmlFor="deepgram-api-key">
                                    Deepgram API Key
                                </Label>
                                <div className="flex gap-2 max-w-sm">
                                    <Input
                                        id="deepgram-api-key"
                                        type={showApiKey ? "text" : "password"}
                                        value={voiceInput.apiKey ?? ""}
                                        onChange={(e) =>
                                            setVoiceInputApiKey(
                                                e.target.value || null
                                            )
                                        }
                                        placeholder="Enter your Deepgram API key"
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() =>
                                            setShowApiKey(!showApiKey)
                                        }
                                    >
                                        {showApiKey ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Get your API key from console.deepgram.com
                                </p>
                            </div>

                            {/* Language selector */}
                            {voiceInput.enabled && voiceInput.apiKey && (
                                <div className="space-y-2">
                                    <Label htmlFor="voice-language">
                                        Language
                                    </Label>
                                    <Select
                                        value={voiceInput.language}
                                        onValueChange={(value) =>
                                            value &&
                                            setVoiceInputLanguage(value)
                                        }
                                    >
                                        <SelectTrigger className="max-w-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en-US">
                                                English (US)
                                            </SelectItem>
                                            <SelectItem value="en-GB">
                                                English (UK)
                                            </SelectItem>
                                            <SelectItem value="en-AU">
                                                English (AU)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">About</CardTitle>
                            <CardDescription>OpenCode Hana</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <p>
                                    A mobile-friendly web interface for the
                                    OpenCode server.
                                </p>
                                <p>
                                    Built with React, Vite, shadcn/ui, and the
                                    OpenCode SDK.
                                </p>
                                <a
                                    href="https://github.com/michaelfaisst/opencode-hana"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-foreground hover:underline"
                                >
                                    <Github className="h-4 w-4" />
                                    View on GitHub
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
