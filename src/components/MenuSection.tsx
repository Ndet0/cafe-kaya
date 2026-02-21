import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getMenu, type MenuItemResponse } from "@/lib/api";
import { resolveImageSrc } from "@/lib/utils";

const placeholderImg = "/placeholder.svg";

const MenuSection = () => {
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});
  const { data: menuItems = [], isLoading, isError } = useQuery({
    queryKey: ["menu"],
    queryFn: () => getMenu(),
    staleTime: 60 * 1000,
  });

  return (
    <section id="menu" className="section-padding">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-accent font-semibold text-sm tracking-[0.2em] uppercase mb-3">Our Menu</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Crafted With Care
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every item is made with organic, locally-sourced ingredients — good for you, good for the planet.
          </p>
        </motion.div>

        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        )}
        {isError && (
          <p className="text-center text-muted-foreground py-8">
            Menu is loading. Please check back in a moment.
          </p>
        )}
        {!isLoading && !isError && menuItems.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item: MenuItemResponse, i: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 border border-border"
              >
                <div className="h-52 overflow-hidden">
                  <img
                    src={failedImages[item.id] ? placeholderImg : resolveImageSrc(item.image_url, placeholderImg)}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
                  />
                </div>
                <div className="p-5">
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                    {item.category_name ?? "Menu"}
                  </span>
                  <h3 className="font-display text-xl font-semibold text-foreground mt-1">{item.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1.5">
                    {item.description ?? ""}
                  </p>
                  {item.price != null && item.price !== "" && (
                    <p className="text-primary font-semibold mt-2">KES {item.price}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {!isLoading && !isError && menuItems.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No menu items yet.</p>
        )}

        <div className="text-center mt-12">
          <a
            href="#contact"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            View Full Menu
          </a>
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
