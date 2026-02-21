import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { getReviews, getReviewsRating, type ReviewResponse } from "@/lib/api";

const ReviewsSection = () => {
  const { data: reviews = [], isLoading: reviewsLoading, isError: reviewsError } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => getReviews(10),
    staleTime: 60 * 1000,
  });
  const { data: rating, isLoading: ratingLoading } = useQuery({
    queryKey: ["reviews", "rating"],
    queryFn: () => getReviewsRating(),
    staleTime: 60 * 1000,
  });

  const displayRating = rating?.average ?? 0;
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
            {!ratingLoading && (
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
                  {rating?.count != null && rating.count > 0 ? `from ${rating.count} reviews` : "on Google"}
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
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-kaya-gold text-kaya-gold" />
                  ))}
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
