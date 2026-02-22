import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, UtensilsCrossed, Image, MessageSquare, Star, Settings, Menu, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { label: "Overview", to: "/admin/overview", icon: LayoutDashboard },
  { label: "Menu", to: "/admin/menu", icon: UtensilsCrossed },
  { label: "Gallery", to: "/admin/gallery", icon: Image },
  { label: "Messages", to: "/admin/messages", icon: MessageSquare },
  { label: "Reviews", to: "/admin/reviews", icon: Star },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

const Admin = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-10 px-4 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden inline-flex items-center justify-center rounded-lg border bg-background p-2 text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Admin dashboard</h1>
              <p className="text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside
              className={cn(
                "rounded-xl border bg-background p-3 h-fit lg:sticky lg:top-24",
                "lg:block",
                sidebarOpen ? "block" : "hidden"
              )}
            >
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground"
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </aside>

            <section className="rounded-xl border bg-background p-4 sm:p-6">
              <Outlet />
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

export default Admin;
