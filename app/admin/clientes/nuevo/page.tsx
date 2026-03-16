import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ArrowLeft } from "lucide-react";

async function createCliente(formData: FormData) {
  "use server";
  if (!db) return;
  const email = formData.get("email") as string;
  const fullName = (formData.get("fullName") as string) || null;
  if (!email?.trim()) return;
  await db.insert(users).values({
    email: email.trim(),
    fullName: fullName?.trim() || null,
  });
  redirect("/admin/clientes");
}

export default function NuevoClientePage() {
  return (
    <div>
      <Link
        href="/admin/clientes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </Link>
      <h1 className="text-2xl font-bold mb-6">Nuevo cliente</h1>
      <form action={createCliente} className="max-w-sm space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input id="fullName" name="fullName" className="mt-1" />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Crear</Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/clientes">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
