import { motion } from "framer-motion";
import { MapPin, Phone } from "lucide-react";
const CTASection = () => (
  <section className="relative py-24 overflow-hidden">
    <div className="absolute inset-0">
      <img src="https://uzamart.com/wp-content/uploads/2021/01/134134536_1125726031217756_2376349775520802951_o.jpg" alt="Cafe Kaya outdoor" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-kaya-brown/75" />
    </div>

    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative z-10 text-center px-4 max-w-3xl mx-auto"
    >
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-kaya-cream mb-4">
        Come Experience Cafe Kaya
      </h2>
      <p className="text-kaya-cream/80 text-lg mb-10 max-w-xl mx-auto">
        Your table awaits. Great coffee, beautiful art, and a warm welcome — all in the heart of Westlands.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="https://maps.google.com/?q=Cafe+Kaya+Westlands+Nairobi"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-kaya-gold text-accent-foreground px-8 py-3.5 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <MapPin className="w-4 h-4" />
          Get Directions
        </a>
        <a
          href="tel:+254710767717"
          className="inline-flex items-center justify-center gap-2 border-2 border-kaya-cream/40 text-kaya-cream px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-kaya-cream/10 transition-colors"
        >
          <Phone className="w-4 h-4" />
          Call Now
        </a>
        <a
          href="#menu"
          className="inline-flex items-center justify-center border-2 border-kaya-cream/40 text-kaya-cream px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-kaya-cream/10 transition-colors"
        >
          View Menu
        </a>
      </div>
    </motion.div>
  </section>
);

export default CTASection;
