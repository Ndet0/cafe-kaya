import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { MapPin, Phone, Clock } from "lucide-react";
import { toast } from "sonner";
import { submitContact } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  message: z.string().min(1, "Message is required"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const LocationSection = () => {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });
  const mutation = useMutation({
    mutationFn: submitContact,
    onSuccess: () => {
      toast.success("Message sent! We'll get back to you soon.");
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send message.");
    },
  });

  return (
  <section id="contact" className="section-padding">
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <p className="text-accent font-semibold text-sm tracking-[0.2em] uppercase mb-3">Find Us</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
          Visit Cafe Kaya
        </h2>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl overflow-hidden shadow-lg h-[400px]"
        >
          <iframe
            title="Cafe Kaya Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.818!2d36.812!3d-1.264!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwMTUnNTAuNCJTIDM2wrA0OCc0My4yIkU!5e0!3m2!1sen!2ske!4v1700000000000!5m2!1sen!2ske"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col justify-center space-y-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">Address</h3>
              <p className="text-muted-foreground text-sm">
                Slip Road Off Waiyaki Way after Westlands Roundabout,<br />
                Nairobi City, Kenya
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">Phone</h3>
              <a href="tel:+254710767717" className="text-primary font-medium hover:underline">
                +254 710 767717
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">Opening Hours</h3>
              <div className="text-muted-foreground text-sm space-y-1">
                <p>Sunday: 9:00 AM – 9:30 PM</p>
                <p>Monday – Saturday: 9:00 AM – 10:00 PM</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="https://maps.google.com/?q=Cafe+Kaya+Westlands+Nairobi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <MapPin className="w-4 h-4" />
              Get Directions
            </a>
            <a
              href="tel:+254710767717"
              className="inline-flex items-center gap-2 border-2 border-primary text-primary px-6 py-3 rounded-full font-semibold text-sm hover:bg-primary/5 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pt-6 border-t border-border"
          >
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Send us a message</h3>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Your message..." rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Sending..." : "Send message"}
                </Button>
              </form>
            </Form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  </section>
  );
};

export default LocationSection;
