import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { bookings, users, scheduleSlots } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function AdminReservasPage() {
  const list =
    db
      ? await db
          .select({
            id: bookings.id,
            slotDate: bookings.slotDate,
            createdAt: bookings.createdAt,
            userEmail: users.email,
            startTime: scheduleSlots.startTime,
            endTime: scheduleSlots.endTime,
            label: scheduleSlots.label,
          })
          .from(bookings)
          .leftJoin(users, eq(bookings.userId, users.id))
          .leftJoin(scheduleSlots, eq(bookings.slotId, scheduleSlots.id))
          .orderBy(desc(bookings.slotDate))
          .limit(100)
      : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reservas</h1>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Creada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No hay reservas.
                </TableCell>
              </TableRow>
            ) : (
              list.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{String(r.slotDate)}</TableCell>
                  <TableCell>{r.userEmail ?? "—"}</TableCell>
                  <TableCell>
                    {r.startTime}–{r.endTime} {r.label ? `(${r.label})` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString("es")}
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
