import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, FileText, Calendar, BookOpen, CreditCard, Settings } from "lucide-react";

const cards = [
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/planes", label: "Planes", icon: FileText },
  { href: "/admin/slots", label: "Horarios", icon: Calendar },
  { href: "/admin/reservas", label: "Reservas", icon: BookOpen },
  { href: "/admin/pagos", label: "Pagos", icon: CreditCard },
  { href: "/admin/politicas", label: "Políticas", icon: Settings },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Panel de administración</h1>
      <p className="text-muted-foreground mb-8">
        Gestiona clientes, planes, horarios, reservas y pagos.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <div className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors">
              <card.icon className="h-8 w-8 text-primary mb-2" />
              <h2 className="font-semibold">{card.label}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
