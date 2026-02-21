import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getContactMessages, markContactMessageRead } from "@/lib/api";

const AdminMessagesPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "new" | "resolved">("all");

  const { data: messages = [] } = useQuery({ queryKey: ["admin", "messages"], queryFn: getContactMessages });

  const resolveMutation = useMutation({
    mutationFn: markContactMessageRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "messages"] });
      toast({ title: "Message marked as resolved" });
    },
    onError: (error) => {
      toast({ title: "Could not update message", description: error instanceof Error ? error.message : "Try again", variant: "destructive" });
    },
  });

  const filteredMessages = useMemo(() => {
    if (filter === "new") return messages.filter((message) => !message.read);
    if (filter === "resolved") return messages.filter((message) => message.read);
    return messages;
  }, [filter, messages]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inbox workflow</CardTitle>
          <CardDescription>Track messages through New → Resolved status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as "all" | "new" | "resolved") }>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Messages</CardTitle>
          <CardDescription>{filteredMessages.length} item(s) in current filter.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredMessages.length === 0 && <p className="text-sm text-muted-foreground">No messages found.</p>}

          {filteredMessages.map((message) => (
            <div key={message.id} className="rounded-md border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{message.subject || "No subject"}</p>
                  <p className="text-xs text-muted-foreground">{message.name} • {message.email}</p>
                </div>
                <Badge variant={message.read ? "outline" : "secondary"}>{message.read ? "Resolved" : "New"}</Badge>
              </div>

              <p className="text-sm mt-3 whitespace-pre-wrap">{message.message}</p>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {message.created_at ? new Date(message.created_at).toLocaleString() : "Unknown date"}
                </p>

                {!message.read ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => resolveMutation.mutate(message.id)}
                    disabled={resolveMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark resolved
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <MailOpen className="h-3.5 w-3.5" />
                    Already resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMessagesPage;
