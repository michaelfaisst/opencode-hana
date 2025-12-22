import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
    return (
        <div className="p-2 border-b border-border">
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search sessions..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8 pl-7 pr-7 text-sm"
                />
                {value && (
                    <button
                        onClick={() => onChange("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
