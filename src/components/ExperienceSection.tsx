import { motion } from "framer-motion";
import { Palette, BookOpen, Coffee, Laptop, Baby, Leaf } from "lucide-react";

const features = [
  { icon: Palette, title: "Art-Filled Space", desc: "Rotating exhibitions from local Nairobi artists" },
  { icon: BookOpen, title: "Games & Books", desc: "Board games, puzzles, and a curated book library" },
  { icon: Coffee, title: "Relaxing Vibe", desc: "Warm lighting, ambient music, cozy corners" },
  { icon: Laptop, title: "Freelancer Friendly", desc: "Free Wi-Fi, power outlets, and quiet zones" },
  { icon: Baby, title: "Family Welcome", desc: "Kid-friendly menu and outdoor play area" },
  { icon: Leaf, title: "Sustainable", desc: "Compostable packaging, zero single-use plastics" },
];

const ExperienceSection = () => (
  <section id="experience" className="section-padding bg-primary text-primary-foreground">
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <p className="text-kaya-gold font-semibold text-sm tracking-[0.2em] uppercase mb-3">The Experience</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          Not Just Coffee
        </h2>
        <p className="text-primary-foreground/70 max-w-xl mx-auto">
          Cafe Kaya is a destination — a place to create, connect, and recharge.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-primary-foreground/15 transition-colors duration-300"
          >
            <f.icon className="w-8 h-8 text-kaya-gold mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-primary-foreground/70 text-sm">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ExperienceSection;
