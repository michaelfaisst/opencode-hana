import { useMemo, useState, useCallback } from "react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

export interface SelectedModel {
    providerID: string;
    modelID: string;
}

type ModelStatus = "alpha" | "beta" | "deprecated" | "active";

interface ModelOption {
    providerID: string;
    providerName: string;
    modelID: string;
    modelName: string;
    value: string;
    label: string;
    status: ModelStatus;
}

interface ModelSelectorProps {
    value?: SelectedModel;
    onChange: (model: SelectedModel) => void;
    disabled?: boolean;
    className?: string;
}

export function ModelSelector({
    value,
    onChange,
    disabled,
    className
}: ModelSelectorProps) {
    const { data, isLoading } = useProviders();
    const [inputValue, setInputValue] = useState("");

    // Build flat list of model options, filtering out unavailable models
    const allModels = useMemo<ModelOption[]>(() => {
        const providers = data?.providers ?? [];
        const models: ModelOption[] = [];

        for (const provider of providers) {
            for (const [modelId, model] of Object.entries(
                provider.models || {}
            )) {
                const typedModel = model as {
                    name?: string;
                    status?: ModelStatus;
                };
                const modelStatus = typedModel.status ?? "active";

                // Skip deprecated models
                if (modelStatus === "deprecated") {
                    continue;
                }

                const modelName = typedModel.name || modelId;
                models.push({
                    providerID: provider.id,
                    providerName: provider.name,
                    modelID: modelId,
                    modelName,
                    value: `${provider.id}::${modelId}`,
                    label: `${provider.name}: ${modelName}`,
                    status: modelStatus
                });
            }
        }

        return models;
    }, [data?.providers]);

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
            { providerName: string; models: ModelOption[] }
        > = {};
        const query = inputValue.toLowerCase().trim();

        for (const model of allModels) {
            // Filter by search query - match against label (provider name + model name)
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

    // Convert value to label for display in the trigger
    const itemToStringLabel = useCallback(
        (optionValue: string) => {
            return valueToLabelMap.get(optionValue) ?? optionValue;
        },
        [valueToLabelMap]
    );

    // Get selected model value
    const selectedValue = value ? `${value.providerID}::${value.modelID}` : "";

    const handleSelect = (newValue: string | null) => {
        if (!newValue) return;
        const [providerID, modelID] = newValue.split("::");
        if (providerID && modelID) {
            onChange({ providerID, modelID });
        }
    };

    // Clear the search input when the popup opens
    const handleOpenChange = (open: boolean) => {
        if (open) {
            setInputValue("");
        }
    };

    if (isLoading) {
        return (
            <Button
                variant="outline"
                size="sm"
                disabled
                className={cn("min-w-[280px]", className)}
            >
                <Bot className="h-4 w-4 mr-2" />
                Loading...
            </Button>
        );
    }

    if (!data?.providers || data.providers.length === 0) {
        return (
            <Button
                variant="outline"
                size="sm"
                disabled
                className={cn("min-w-[280px]", className)}
            >
                <Bot className="h-4 w-4 mr-2" />
                No providers
            </Button>
        );
    }

    return (
        <Combobox
            value={selectedValue}
            onValueChange={handleSelect}
            inputValue={inputValue}
            onInputValueChange={setInputValue}
            onOpenChange={handleOpenChange}
            disabled={disabled}
            itemToStringLabel={itemToStringLabel}
        >
            <ComboboxSelectTrigger
                className={cn(
                    "min-w-[280px] md:min-w-[320px] lg:min-w-[400px]",
                    className
                )}
            >
                <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
                <ComboboxValue>
                    {(val) =>
                        val
                            ? itemToStringLabel(val as string)
                            : "Select a model..."
                    }
                </ComboboxValue>
            </ComboboxSelectTrigger>
            <ComboboxContent className="w-[var(--anchor-width)]" side="top">
                <div className="p-1 border-b border-border">
                    <ComboboxPopupInput
                        placeholder="Search models..."
                        autoFocus
                    />
                </div>
                <ComboboxList>
                    {filteredGroupedModels.length === 0 && (
                        <ComboboxEmpty>No models found</ComboboxEmpty>
                    )}
                    {filteredGroupedModels.map(([providerID, group], index) => (
                        <ComboboxGroup key={providerID}>
                            <ComboboxLabel>{group.providerName}</ComboboxLabel>
                            {group.models.map((model) => (
                                <ComboboxItem
                                    key={model.value}
                                    value={model.value}
                                    className="flex items-center justify-between gap-2"
                                >
                                    <span>{model.modelName}</span>
                                    {model.status !== "active" && (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] px-1 py-0 h-4"
                                        >
                                            {model.status}
                                        </Badge>
                                    )}
                                </ComboboxItem>
                            ))}
                            {index < filteredGroupedModels.length - 1 && (
                                <ComboboxSeparator />
                            )}
                        </ComboboxGroup>
                    ))}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}
