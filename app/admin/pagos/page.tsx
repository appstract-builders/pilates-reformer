import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { payments, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function AdminPagosPage() {
  const list =
    db
      ? await db
          .select({
            id: payments.id,
            amountCents: payments.amountCents,
            status: payments.status,
            createdAt: payments.createdAt,
            userEmail: users.email,
          })
          .from(payments)
          .leftJoin(users, eq(payments.userId, users.id))
          .orderBy(desc(payments.createdAt))
          .limit(100)
      : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pagos</h1>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No hay pagos.
                </TableCell>
              </TableRow>
            ) : (
              list.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.userEmail ?? "—"}</TableCell>
                  <TableCell>${((p.amountCents ?? 0) / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === "completed"
                          ? "default"
                          : p.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString("es")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
