import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { SessionList, CreateSessionDialog } from "@/components/sessions";
import { useSessions, useCreateSession, useDeleteSession } from "@/hooks";

export function SessionsPage() {
  const navigate = useNavigate();
  const { data: sessions = [], isLoading } = useSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();

  const handleCreateSession = async ({ title, directory }: { title?: string; directory: string }) => {
    const session = await createSession.mutateAsync({ title, directory });
    if (session) {
      navigate(`/sessions/${session.id}`);
    }
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession.mutateAsync(id);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Sessions">
        <CreateSessionDialog
          onCreateSession={handleCreateSession}
          isLoading={createSession.isPending}
        />
      </Header>
      <div className="flex-1 overflow-y-auto">
        <SessionList
          sessions={sessions}
          isLoading={isLoading}
          onDeleteSession={handleDeleteSession}
        />
      </div>
    </div>
  );
}
