import {
  FileCode,
  Pencil,
  Plus,
  Trash2,
  Circle,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CollapsibleSection } from "./collapsible-section";
import type { ChangedFilesProps, ChangedFile } from "./types";

export function SidebarChangedFiles({ files }: ChangedFilesProps) {
  const badge = files.length > 0 ? (
    <span className="text-xs text-muted-foreground">{files.length}</span>
  ) : null;

  return (
    <CollapsibleSection
      title="Changed Files"
      icon={<FileCode className="h-4 w-4" />}
      badge={badge}
      defaultOpen={true}
      storageKey="changed-files"
    >
      {files.length > 0 ? (
        <div className="max-h-40 overflow-y-auto">
          <div className="px-2 pb-2 space-y-0.5">
            {files.map((file) => (
              <ChangedFileRow key={file.path} file={file} />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground">No files changed yet</p>
        </div>
      )}
    </CollapsibleSection>
  );
}

interface ChangedFileRowProps {
  file: ChangedFile;
}

function ChangedFileRow({ file }: ChangedFileRowProps) {
  const operationIcon = {
    edit: <Pencil className="h-3 w-3 text-yellow-500" />,
    write: <Plus className="h-3 w-3 text-green-500" />,
    delete: <Trash2 className="h-3 w-3 text-red-500" />,
  }[file.operation];

  const statusIndicator = {
    pending: <Circle className="h-2 w-2 text-muted-foreground" />,
    running: <Loader2 className="h-2 w-2 text-primary animate-spin" />,
    completed: <CheckCircle2 className="h-2 w-2 text-green-500" />,
    error: <XCircle className="h-2 w-2 text-destructive" />,
  }[file.status];

  // Extract just the filename from the path
  const fileName = file.path.split("/").pop() || file.path;
  // Get the directory path
  const dirPath = file.path.split("/").slice(0, -1).join("/");

  // Show changes only if there are any
  const hasChanges = file.additions > 0 || file.deletions > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-sm hover:bg-accent/50 transition-colors",
        file.status === "error" && "bg-destructive/10"
      )}
    >
      <div className="shrink-0">{operationIcon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium truncate">{fileName}</span>
          <span className="shrink-0">{statusIndicator}</span>
        </div>
        <div className="flex items-center gap-2">
          {dirPath && (
            <p className="text-[10px] text-muted-foreground truncate">
              {dirPath}
            </p>
          )}
          {hasChanges && (
            <div className="flex items-center gap-1.5 shrink-0">
              {file.additions > 0 && (
                <span className="text-[10px] font-mono text-green-500">
                  +{file.additions}
                </span>
              )}
              {file.deletions > 0 && (
                <span className="text-[10px] font-mono text-red-500">
                  -{file.deletions}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
