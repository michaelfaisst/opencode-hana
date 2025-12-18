import { Header } from "@/components/layout/header";
import { useTheme } from "@/providers";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxEmpty,
  ComboboxSeparator,
} from "@/components/ui/combobox";
import { useProviders } from "@/hooks";
import { useAppSettingsStore, useNotificationStore, NOTIFICATION_SOUNDS } from "@/stores";
import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowLeft, Github, Volume2, Bell } from "lucide-react";
import { 
  requestNotificationPermission, 
  getBrowserNotificationPermission,
  previewSound,
} from "@/lib/notifications";

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const {
    defaultModel,
    replaceSessionOnNew,
    setDefaultModel,
    setReplaceSessionOnNew,
  } = useAppSettingsStore();
  const {
    notificationsEnabled,
    browserNotificationsEnabled,
    soundEnabled,
    selectedSound,
    browserPermission,
    setNotificationsEnabled,
    setBrowserNotificationsEnabled,
    setSoundEnabled,
    setSelectedSound,
    setBrowserPermission,
  } = useNotificationStore();
  const { data: providersData, isLoading: isLoadingProviders } = useProviders();
  const serverUrl = import.meta.env.VITE_OPENCODE_SERVER_URL || "http://localhost:4096";
  const [inputValue, setInputValue] = useState("");

  // Sync browser permission state on mount
  useEffect(() => {
    setBrowserPermission(getBrowserNotificationPermission());
  }, [setBrowserPermission]);

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
      for (const [modelId, model] of Object.entries(provider.models || {})) {
        const modelName = (model as { name?: string })?.name || modelId;
        models.push({
          providerID: provider.id,
          providerName: provider.name,
          modelID: modelId,
          modelName,
          value: `${provider.id}::${modelId}`,
          label: `${provider.name}: ${modelName}`,
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
    const groups: Record<string, { providerName: string; models: typeof allModels }> = {};
    const query = inputValue.toLowerCase().trim();
    
    for (const model of allModels) {
      if (query && !model.label.toLowerCase().includes(query)) {
        continue;
      }
      
      if (!groups[model.providerID]) {
        groups[model.providerID] = {
          providerName: model.providerName,
          models: [],
        };
      }
      groups[model.providerID].models.push(model);
    }

    return Object.entries(groups);
  }, [allModels, inputValue]);

  const currentModelValue = defaultModel
    ? `${defaultModel.providerID}::${defaultModel.modelID}`
    : "";

  const currentModelLabel = useMemo(() => {
    if (!defaultModel) {
      return "";
    }
    const model = allModels.find((m) => m.value === currentModelValue);
    return model ? model.label : currentModelValue;
  }, [defaultModel, allModels, currentModelValue]);

  // Convert value to label for display in the input
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
            <CardTitle className="text-base">Server Connection</CardTitle>
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
                Set via VITE_OPENCODE_SERVER_URL environment variable
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default Model</CardTitle>
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
                  disabled={isLoadingProviders}
                  itemToStringLabel={itemToStringLabel}
                >
                  <ComboboxInput
                    id="default-model"
                    className="flex-1"
                    placeholder={isLoadingProviders ? "Loading..." : (currentModelLabel || "Search models...")}
                    disabled={isLoadingProviders}
                  />
                  <ComboboxContent className="w-[var(--anchor-width)]">
                    <ComboboxList>
                      {filteredGroupedModels.length === 0 && (
                        <ComboboxEmpty>No models found</ComboboxEmpty>
                      )}
                      {filteredGroupedModels.map(([providerID, group], index) => (
                        <ComboboxGroup key={providerID}>
                          <ComboboxLabel>{group.providerName}</ComboboxLabel>
                          {group.models.map((model) => (
                            <ComboboxItem key={model.value} value={model.value}>
                              {model.modelName}
                            </ComboboxItem>
                          ))}
                          {index < filteredGroupedModels.length - 1 && <ComboboxSeparator />}
                        </ComboboxGroup>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {defaultModel && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearDefaultModel}
                    title="Clear default model"
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={(value) => value && setTheme(value as "light" | "dark" | "system")}>
                <SelectTrigger id="theme" className="max-w-sm">
                  <SelectValue>
                    {theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session Behavior</CardTitle>
            <CardDescription>
              Configure how sessions are managed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 max-w-lg">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="replace-session">Replace session on new</Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, creating a new session will delete the current one and create a fresh session with the same directory and title.
                </p>
              </div>
              <Switch
                id="replace-session"
                checked={replaceSessionOnNew}
                onCheckedChange={setReplaceSessionOnNew}
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
              Get notified when the assistant finishes responding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Master toggle */}
            <div className="flex items-center gap-4 max-w-lg">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="notifications-enabled">Enable notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Show notifications when assistant completes a response
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
                    <Label htmlFor="browser-notifications">Browser notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      {browserPermission === "granted" 
                        ? "Show system notifications when tab is in background"
                        : browserPermission === "denied"
                        ? "Permission denied - enable in browser settings"
                        : "Requires permission to show system notifications"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {browserPermission === "default" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRequestPermission}
                      >
                        Request Permission
                      </Button>
                    )}
                    <Switch
                      id="browser-notifications"
                      checked={browserNotificationsEnabled && browserPermission === "granted"}
                      onCheckedChange={setBrowserNotificationsEnabled}
                      disabled={browserPermission !== "granted"}
                    />
                  </div>
                </div>

                {/* Sound notifications */}
                <div className="flex items-center gap-4 max-w-lg">
                  <div className="flex-1 space-y-0.5">
                    <Label htmlFor="sound-enabled">Sound notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Play a sound when assistant completes
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
                  <div className="space-y-2">
                    <Label>Notification sound</Label>
                    <div className="flex gap-2 max-w-sm">
                      <Select 
                        value={selectedSound} 
                        onValueChange={(value) => value && setSelectedSound(value as typeof selectedSound)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue>
                            {NOTIFICATION_SOUNDS.find((s) => s.id === selectedSound)?.label}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIFICATION_SOUNDS.map((sound) => (
                            <SelectItem key={sound.id} value={sound.id}>
                              {sound.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => previewSound(selectedSound)}
                        title="Preview sound"
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
            <CardDescription>
              OpenCode Hana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>A mobile-friendly web interface for the OpenCode server.</p>
              <p>
                Built with React, Vite, shadcn/ui, and the OpenCode SDK.
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
