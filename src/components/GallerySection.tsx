import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import heroImg from "@/assets/hero-cafe.jpg";
import galleryCoffee from "@/assets/gallery-coffee.jpg";
import galleryFood from "@/assets/gallery-food.jpg";
import galleryOutdoor from "@/assets/gallery-outdoor.jpg";
import galleryArt from "@/assets/gallery-art.jpg";
import galleryTea from "@/assets/gallery-tea.jpg";

const images = [
  { src: heroImg, alt: "Café Interior", span: "col-span-2 row-span-2" },
  { src: galleryCoffee, alt: "Artisan Coffee", span: "" },
  { src: galleryFood, alt: "Healthy Food", span: "" },
  { src: galleryOutdoor, alt: "Outdoor Seating", span: "col-span-2" },
  { src: galleryArt, alt: "Art & Décor", span: "" },
  { src: galleryTea, alt: "Specialty Tea", span: "" },
];

const GallerySection = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section id="gallery" className="section-padding bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-accent font-semibold text-sm tracking-[0.2em] uppercase mb-3">Gallery</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            A Glimpse Inside
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {images.map((img, i) => (
            <motion.div
              key={img.alt}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`${img.span} relative group cursor-pointer overflow-hidden rounded-xl`}
              onClick={() => setSelected(img.src)}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full min-h-[200px] object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-kaya-brown/0 group-hover:bg-kaya-brown/30 transition-colors duration-300 flex items-end p-4">
                <span className="text-kaya-cream font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                  {img.alt}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-kaya-brown/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <button
              className="absolute top-6 right-6 text-kaya-cream/80 hover:text-kaya-cream"
              onClick={() => setSelected(null)}
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selected}
              alt="Gallery fullscreen"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default GallerySection;
