import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { ArrowLeft } from "lucide-react";

async function createPlan(formData: FormData) {
  "use server";
  if (!db) return;
  const name = formData.get("name") as string;
  const daysPerWeek = parseInt(formData.get("daysPerWeek") as string, 10);
  const description = (formData.get("description") as string) || null;
  if (!name?.trim() || isNaN(daysPerWeek)) return;
  await db.insert(plans).values({
    name: name.trim(),
    daysPerWeek,
    description: description?.trim() || null,
  });
  redirect("/admin/planes");
}

export default function NuevoPlanPage() {
  return (
    <div>
      <Link
        href="/admin/planes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a planes
      </Link>
      <h1 className="text-2xl font-bold mb-6">Nuevo plan</h1>
      <form action={createPlan} className="max-w-sm space-y-4">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="daysPerWeek">Días por semana (3 o 5)</Label>
          <Input
            id="daysPerWeek"
            name="daysPerWeek"
            type="number"
            min={1}
            max={7}
            defaultValue={3}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" name="description" className="mt-1" />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Crear</Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/planes">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
