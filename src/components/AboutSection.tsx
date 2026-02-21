import { motion } from "framer-motion";
import { Leaf, Palette, Users, Heart } from "lucide-react";


const values = [
  { icon: Leaf, label: "Eco-Friendly", desc: "Sustainable sourcing & zero-waste practices" },
  { icon: Palette, label: "Art-Inspired", desc: "Local art & creative expression everywhere" },
  { icon: Users, label: "Community", desc: "A gathering space for all" },
  { icon: Heart, label: "Welcoming", desc: "Warm, relaxed & inclusive atmosphere" },
];

const AboutSection = () => (
  <section id="about" className="section-padding">
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img src="https://malistraveldiaries.wordpress.com/wp-content/uploads/2021/01/20210115_143917.jpg?w=768" alt="Inside Cafe Kaya" className="w-full h-[500px] object-cover" />
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-2xl -z-10" />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <p className="text-accent font-semibold text-sm tracking-[0.2em] uppercase mb-3">Our Story</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            More Than a Café,<br />A Creative Sanctuary
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            Nestled in the heart of Westlands, Cafe Kaya is where organic coffee meets artistic expression. 
            We've created a space where sustainability isn't just a word — it's woven into every cup, every dish, 
            and every corner of our eco-friendly haven. Come for the coffee, stay for the community.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {values.map((v) => (
              <div key={v.label} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                <v.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{v.label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default AboutSection;
