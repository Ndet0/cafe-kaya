import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Gallery", href: "#gallery" },
  { label: "Menu", href: "#menu" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const transparent = isHome && !scrolled && !mobileOpen;

  const linkColor = transparent
    ? "text-white/90 hover:text-white"
    : "text-foreground/80 hover:text-primary";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled || mobileOpen
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {isHome ? (
            <a href="#home" className={`font-display text-2xl font-bold tracking-tight ${transparent ? "text-white" : "text-primary"}`}>
              Cafe Kaya
            </a>
          ) : (
            <Link to="/" className={`font-display text-2xl font-bold tracking-tight ${transparent ? "text-white" : "text-primary"}`}>
              Cafe Kaya
            </Link>
          )}

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
              isHome ? (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium ${linkColor} transition-colors duration-200`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  to={"/" + link.href}
                  className={`text-sm font-medium ${linkColor} transition-colors duration-200`}
                >
                  {link.label}
                </Link>
              )
            )}
            {user ? (
              <>
                <Link
                  to="/admin"
                  className={`text-sm font-medium ${linkColor} transition-colors duration-200`}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => { logout(); navigate("/"); }}
                  className={`text-sm font-medium ${linkColor} transition-colors duration-200`}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={`text-sm font-medium ${linkColor} transition-colors duration-200`}
              >
                Login
              </Link>
            )}
            <a
              href="tel:+254710767717"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden ${transparent ? "text-white" : "text-foreground"} p-2`}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          mobileOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) =>
              isHome ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-base font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  to={"/" + link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-base font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
            {user ? (
              <>
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block text-base font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                    navigate("/");
                  }}
                  className="block text-base font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-base font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                Login
              </Link>
            )}
            <a
              href="tel:+254710767717"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
