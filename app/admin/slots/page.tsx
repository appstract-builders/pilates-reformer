import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { scheduleSlots } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { CirclePlus } from "lucide-react";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function AdminSlotsPage() {
  const list = db
    ? await db
        .select()
        .from(scheduleSlots)
        .orderBy(asc(scheduleSlots.dayOfWeek), asc(scheduleSlots.startTime))
    : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Horarios (slots)</h1>
        <Button asChild size="sm">
          <Link href="/admin/slots/nuevo" className="inline-flex gap-2">
            <CirclePlus className="h-4 w-4" />
            Nuevo slot
          </Link>
        </Button>
      </div>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Día</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead>Cupo</TableHead>
              <TableHead>Etiqueta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay horarios definidos.
                </TableCell>
              </TableRow>
            ) : (
              list.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{DAYS[s.dayOfWeek] ?? s.dayOfWeek}</TableCell>
                  <TableCell>{s.startTime}</TableCell>
                  <TableCell>{s.endTime}</TableCell>
                  <TableCell>{s.capacity}</TableCell>
                  <TableCell className="text-muted-foreground">{s.label ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
