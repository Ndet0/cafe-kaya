import { motion } from "framer-motion";
import { MapPin, ChevronDown } from "lucide-react";
const HeroSection = () => (
  <section id="home" className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
    {/* Background */}
    <div className="absolute inset-0">
      <img src="https://mindtrip.ai/cdn-cgi/image/format=webp,w=720/https://tcdn.mindtrip.ai/images/105011/1g83u69.png" alt="Cafe Kaya interior" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-kaya-brown/70 via-kaya-brown/50 to-kaya-brown/80" />
    </div>

    {/* Content */}
    <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-kaya-gold font-body text-sm tracking-[0.3em] uppercase mb-4"
      >
        Westlands, Nairobi
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="font-display text-5xl sm:text-6xl lg:text-8xl font-bold text-kaya-cream mb-6 leading-tight"
      >
        Cafe Kaya
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="font-display text-lg sm:text-xl text-kaya-cream/90 italic mb-10 max-w-2xl mx-auto"
      >
        Organic Coffee. Creative Atmosphere. Sustainable Living.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <a
          href="#menu"
          className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          View Menu
        </a>
        <a
          href="https://maps.google.com/?q=Cafe+Kaya+Westlands+Nairobi"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 border-2 border-kaya-cream/40 text-kaya-cream px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-kaya-cream/10 transition-colors"
        >
          <MapPin className="w-4 h-4" />
          Get Directions
        </a>
      </motion.div>
    </div>

    {/* Scroll indicator */}
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
      <a href="#about">
        <ChevronDown className="w-6 h-6 text-kaya-cream/70 animate-scroll-hint" />
      </a>
    </div>
  </section>
);

export default HeroSection;
