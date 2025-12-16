import { ListTodo } from "lucide-react";

export function SidebarEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center">
        <ListTodo className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No active tasks</p>
      </div>
    </div>
  );
}
