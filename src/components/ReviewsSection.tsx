import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { getReviews, type ReviewResponse } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ReviewsSection = () => {
  const {
    data,
    isLoading: reviewsLoading,
    isError: reviewsError,
  } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => getReviews(10),
    staleTime: 12 * 60 * 60 * 1000,
    retry: 2,
  });

  const reviews = data?.reviews ?? [];
  const displayRating = data?.rating ?? 0;
  const totalReviews = data?.total_reviews ?? 0;
  const fullStars = Math.floor(displayRating);
  const hasHalf = displayRating - fullStars >= 0.5;

  return (
    <section className="section-padding bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-accent font-semibold text-sm tracking-[0.2em] uppercase mb-3">Reviews</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2">
            What Our Guests Say
          </h2>
          <div className="flex items-center justify-center gap-1 mt-3">
            {!reviewsLoading && (
              <>
                {Array.from({ length: fullStars }).map((_, s) => (
                  <Star key={s} className="w-5 h-5 fill-kaya-gold text-kaya-gold" />
                ))}
                {hasHalf && <Star className="w-5 h-5 fill-kaya-gold/40 text-kaya-gold" />}
                {!hasHalf && fullStars < 5 && (
                  <Star className="w-5 h-5 fill-kaya-gold/40 text-kaya-gold" />
                )}
                <span className="ml-2 font-semibold text-foreground">
                  {displayRating > 0 ? displayRating.toFixed(1) : "—"}
                </span>
                <span className="text-muted-foreground text-sm ml-1">
                  {totalReviews > 0 ? `from ${totalReviews} reviews` : "on Google"}
                </span>
              </>
            )}
          </div>
        </motion.div>

        {reviewsLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        )}
        {reviewsError && (
          <p className="text-center text-muted-foreground py-8">
            Reviews are loading. Please check back in a moment.
          </p>
        )}
        {!reviewsLoading && !reviewsError && reviews.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((r: ReviewResponse, i: number) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border"
              >
                <div className="flex items-center gap-2 mb-3">
                  {r.profile_photo_url ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={r.profile_photo_url} alt={r.name} />
                      <AvatarFallback>{r.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ) : null}
                  <div className="flex gap-0.5 flex-1">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-kaya-gold text-kaya-gold" />
                    ))}
                  </div>
                  {r.source === "google" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Google
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">"{r.text}"</p>
                <p className="font-semibold text-foreground text-sm">{r.name}</p>
              </motion.div>
            ))}
          </div>
        )}
        {!reviewsLoading && !reviewsError && reviews.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No reviews yet.</p>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
