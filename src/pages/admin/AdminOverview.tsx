import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Image, MessageSquare, Star, UtensilsCrossed, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getContactMessages,
  getGallery,
  getMenu,
  getPendingReviews,
  type ContactMessageResponse,
} from "@/lib/api";

const formatDate = (dateValue: string | null | undefined) => {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleString();
};

const AdminOverview = () => {
  const { data: menuItems = [] } = useQuery({ queryKey: ["admin", "menu-items"], queryFn: () => getMenu() });
  const { data: galleryItems = [] } = useQuery({ queryKey: ["admin", "gallery-items"], queryFn: getGallery });
  const { data: messages = [] } = useQuery({ queryKey: ["admin", "messages"], queryFn: getContactMessages });
  const { data: pendingReviews = [] } = useQuery({
    queryKey: ["admin", "reviews", "pending"],
    queryFn: getPendingReviews,
  });

  const recentMessages = useMemo(
    () =>
      [...messages]
        .sort((a, b) => (new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()))
        .slice(0, 5),
    [messages]
  );

  const recentActivity = useMemo(() => {
    const messageActivities = messages.map((message) => ({
      id: message.id,
      label: `New contact from ${message.name}`,
      time: message.created_at,
      type: "message" as const,
    }));

    const reviewActivities = pendingReviews.map((review) => ({
      id: review.id,
      label: `Pending review by ${review.name}`,
      time: review.created_at,
      type: "review" as const,
    }));

    return [...messageActivities, ...reviewActivities]
      .sort((a, b) => new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime())
      .slice(0, 5);
  }, [messages, pendingReviews]);

  const newMessagesCount = messages.filter((message: ContactMessageResponse) => !message.read).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total menu items</CardDescription>
            <CardTitle className="text-2xl">{menuItems.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <UtensilsCrossed className="h-3.5 w-3.5" />
              Live menu inventory
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published gallery photos</CardDescription>
            <CardTitle className="text-2xl">{galleryItems.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Image className="h-3.5 w-3.5" />
              Homepage gallery assets
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New contact messages</CardDescription>
            <CardTitle className="text-2xl">{newMessagesCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5" />
              Awaiting response
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending review moderation</CardDescription>
            <CardTitle className="text-2xl">{pendingReviews.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Star className="h-3.5 w-3.5" />
              Needs approval
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent messages</CardTitle>
            <CardDescription>Last 5 customer messages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMessages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
            {recentMessages.map((message) => (
              <div key={message.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{message.subject || "No subject"}</p>
                  <Badge variant={message.read ? "outline" : "secondary"}>{message.read ? "Resolved" : "New"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{message.name} • {message.email}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent activity</CardTitle>
            <CardDescription>Latest moderation and inbox events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            {recentActivity.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-primary" />
                  <span>{activity.label}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(activity.time)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick actions</CardTitle>
            <CardDescription>Recommended implementation order for MVP rollout.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-md border p-3 flex items-center justify-between">
              <span>1. Add menu item workflow</span>
              <Badge>Step 1</Badge>
            </div>
            <div className="rounded-md border p-3 flex items-center justify-between">
              <span>2. Gallery upload and sort</span>
              <Badge>Step 2</Badge>
            </div>
            <div className="rounded-md border p-3 flex items-center justify-between">
              <span>3. Resolve contact messages</span>
              <Badge>Step 3</Badge>
            </div>
            <div className="rounded-md border p-3 flex items-center justify-between">
              <span>4. Moderate reviews queue</span>
              <Badge>Step 4</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data contract shape</CardTitle>
            <CardDescription>Unified payloads for scalable admin APIs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-md border p-3">
              <p className="font-medium">Collection responses</p>
              <p className="text-muted-foreground">{`{ data: T[], meta: { total, limit, offset } }`}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">Query conventions</p>
              <p className="text-muted-foreground">Filters: status, search, dateRange • Pagination: page/limit or offset/limit.</p>
            </div>
            <div className="rounded-md border p-3 flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              Optimistic mutations with module-level cache invalidation.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
