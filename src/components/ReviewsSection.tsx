import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  { name: "Sarah M.", text: "The most beautiful café in Westlands! The organic coffee is incredible and the art on the walls is always changing. My favorite work spot.", rating: 5 },
  { name: "James K.", text: "Loved the plant-based menu options. The Buddha bowl is a must-try. Great vibes and friendly staff!", rating: 5 },
  { name: "Amina W.", text: "Perfect for a weekend brunch with the family. Kids love the outdoor area and we love the sustainable ethos.", rating: 4 },
  { name: "David O.", text: "Best cocktails in Nairobi paired with amazing art. Cafe Kaya is truly a gem in Westlands.", rating: 5 },
];

const ReviewsSection = () => (
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
          {[1, 2, 3, 4].map((s) => (
            <Star key={s} className="w-5 h-5 fill-kaya-gold text-kaya-gold" />
          ))}
          <Star className="w-5 h-5 fill-kaya-gold/40 text-kaya-gold" />
          <span className="ml-2 font-semibold text-foreground">4.4</span>
          <span className="text-muted-foreground text-sm ml-1">on Google</span>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reviews.map((r, i) => (
          <motion.div
            key={r.name}
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
    </div>
  </section>
);

export default ReviewsSection;
