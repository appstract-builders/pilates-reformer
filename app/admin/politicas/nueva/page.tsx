import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { studioPolicies } from "@/lib/db/schema";
import { ArrowLeft } from "lucide-react";

async function createPolitica(formData: FormData) {
  "use server";
  if (!db) return;
  const key = formData.get("key") as string;
  const value = (formData.get("value") as string) || null;
  if (!key?.trim()) return;
  await db.insert(studioPolicies).values({
    key: key.trim(),
    value: value?.trim() || null,
  });
  redirect("/admin/politicas");
}

export default function NuevaPoliticaPage() {
  return (
    <div>
      <Link
        href="/admin/politicas"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a políticas
      </Link>
      <h1 className="text-2xl font-bold mb-6">Nueva política</h1>
      <form action={createPolitica} className="max-w-sm space-y-4">
        <div>
          <Label htmlFor="key">Clave</Label>
          <Input id="key" name="key" required className="mt-1" placeholder="ej. cancelacion_horas" />
        </div>
        <div>
          <Label htmlFor="value">Valor</Label>
          <Textarea id="value" name="value" className="mt-1" placeholder="ej. 24" />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Crear</Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/politicas">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
