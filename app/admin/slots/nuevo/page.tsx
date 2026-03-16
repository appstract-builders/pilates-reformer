import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { scheduleSlots } from "@/lib/db/schema";
import { ArrowLeft } from "lucide-react";

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

async function createSlot(formData: FormData) {
  "use server";
  if (!db) return;
  const dayOfWeek = parseInt(formData.get("dayOfWeek") as string, 10);
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const capacity = parseInt(formData.get("capacity") as string, 10) || 1;
  const label = (formData.get("label") as string) || null;
  if (isNaN(dayOfWeek) || !startTime || !endTime) return;
  await db.insert(scheduleSlots).values({
    dayOfWeek,
    startTime,
    endTime,
    capacity,
    label: label?.trim() || null,
  });
  redirect("/admin/slots");
}

export default function NuevoSlotPage() {
  return (
    <div>
      <Link
        href="/admin/slots"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a horarios
      </Link>
      <h1 className="text-2xl font-bold mb-6">Nuevo horario (slot)</h1>
      <form action={createSlot} className="max-w-sm space-y-4">
        <div>
          <Label htmlFor="dayOfWeek">Día</Label>
          <select
            id="dayOfWeek"
            name="dayOfWeek"
            required
            className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="startTime">Hora inicio (ej. 08:00)</Label>
          <Input id="startTime" name="startTime" type="time" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="endTime">Hora fin (ej. 09:00)</Label>
          <Input id="endTime" name="endTime" type="time" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="capacity">Cupo</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            defaultValue={1}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="label">Etiqueta (opcional)</Label>
          <Input id="label" name="label" className="mt-1" placeholder="ej. Reformer 1:1" />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Crear</Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/slots">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
