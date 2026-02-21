import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getPendingReviews, getReviewsRating, updateReviewStatus } from "@/lib/api";

const AdminReviewsPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pendingReviews = [] } = useQuery({
    queryKey: ["admin", "reviews", "pending"],
    queryFn: getPendingReviews,
  });

  const { data: rating } = useQuery({ queryKey: ["reviews", "rating"], queryFn: getReviewsRating });

  const updateMutation = useMutation({
    mutationFn: ({ reviewId, status }: { reviewId: string; status: "approved" | "rejected" }) =>
      updateReviewStatus(reviewId, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "rating"] });
      toast({ title: vars.status === "approved" ? "Review approved" : "Review rejected" });
    },
    onError: (error) => {
      toast({ title: "Could not update review", description: error instanceof Error ? error.message : "Try again", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending moderation</CardDescription>
            <CardTitle className="text-2xl">{pendingReviews.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Awaiting approval queue.</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published rating</CardDescription>
            <CardTitle className="text-2xl">{rating?.average ?? 0} / 5</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Across {rating?.count ?? 0} approved review(s).</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending reviews</CardTitle>
          <CardDescription>Approve to publish on the homepage testimonials section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingReviews.length === 0 && <p className="text-sm text-muted-foreground">No pending reviews.</p>}

          {pendingReviews.map((review) => (
            <div key={review.id} className="rounded-md border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{review.name}</p>
                <Badge variant="outline" className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  {review.rating}
                </Badge>
              </div>

              <p className="text-sm mt-2">{review.text}</p>

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {review.created_at ? new Date(review.created_at).toLocaleString() : "Unknown date"}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => updateMutation.mutate({ reviewId: review.id, status: "approved" })}
                    disabled={updateMutation.isPending}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({ reviewId: review.id, status: "rejected" })}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReviewsPage;
