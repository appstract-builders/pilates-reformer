import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  BookOpen,
  FileText,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/planes", label: "Planes", icon: FileText },
  { href: "/admin/slots", label: "Horarios", icon: Calendar },
  { href: "/admin/reservas", label: "Reservas", icon: BookOpen },
  { href: "/admin/pagos", label: "Pagos", icon: CreditCard },
  { href: "/admin/politicas", label: "Políticas", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-border bg-muted/30 flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/" className="font-semibold text-foreground">
            Pilates Admin
          </Link>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                size="sm"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
