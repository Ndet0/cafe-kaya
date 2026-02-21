import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getGallery, type GalleryImageResponse } from "@/lib/api";

const GallerySection = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: images = [], isLoading, isError } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => getGallery(),
    staleTime: 60 * 1000,
  });

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

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="min-h-[200px] bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        )}
        {isError && (
          <p className="text-center text-muted-foreground py-8">
            Gallery is loading. Please check back in a moment.
          </p>
        )}
        {!isLoading && !isError && images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {images.map((img: GalleryImageResponse, i: number) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`${img.span || ""} relative group cursor-pointer overflow-hidden rounded-xl`}
                onClick={() => setSelected(img.image_url)}
              >
                <img
                  src={img.image_url}
                  alt={img.alt || "Gallery"}
                  className="w-full h-full min-h-[200px] object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-kaya-brown/0 group-hover:bg-kaya-brown/30 transition-colors duration-300 flex items-end p-4">
                  <span className="text-kaya-cream font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    {img.alt || "Image"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {!isLoading && !isError && images.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No gallery images yet.</p>
        )}
      </div>

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
