import { MapPin, Phone, Instagram, Facebook, Twitter } from "lucide-react";
import { useContactDisplay } from "@/lib/contactDisplay";

const Footer = () => {
  const contact = useContactDisplay();

  return (
  <footer className="bg-kaya-brown text-kaya-cream">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid md:grid-cols-3 gap-12">
        {/* Brand */}
        <div>
          <h3 className="font-display text-2xl font-bold mb-4">Cafe Kaya</h3>
          <p className="text-kaya-cream/60 text-sm leading-relaxed">
            Organic coffee, creative atmosphere, and sustainable living in the heart of Westlands, Nairobi.
          </p>
          <div className="flex gap-4 mt-6">
            <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-kaya-cream/50 hover:text-kaya-gold transition-colors"><Instagram className="w-5 h-5" /></a>
            {contact.facebookUrl && (
              <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-kaya-cream/50 hover:text-kaya-gold transition-colors"><Facebook className="w-5 h-5" /></a>
            )}
            {contact.twitterUrl && (
              <a href={contact.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-kaya-cream/50 hover:text-kaya-gold transition-colors"><Twitter className="w-5 h-5" /></a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
          <nav className="space-y-2.5 text-sm">
            {["Home", "About", "Gallery", "Menu", "Experience", "Contact"].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="block text-kaya-cream/60 hover:text-kaya-gold transition-colors">
                {l}
              </a>
            ))}
          </nav>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-display text-lg font-semibold mb-4">Contact</h4>
          <div className="space-y-3 text-sm text-kaya-cream/60">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-kaya-gold" />
              <span className="whitespace-pre-line">{contact.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0 text-kaya-gold" />
              <a href={contact.phoneHref} className="hover:text-kaya-gold transition-colors">{contact.phone}</a>
            </div>
            <div className="mt-4 text-xs space-y-1">
              {contact.hoursLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-kaya-cream/10 mt-12 pt-8 text-center text-xs text-kaya-cream/40">
        © {new Date().getFullYear()} Cafe Kaya. All rights reserved.
      </div>
    </div>
    </footer>
  );
};

export default Footer;
