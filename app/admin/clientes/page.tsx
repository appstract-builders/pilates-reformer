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
import { users } from "@/lib/db/schema";
import { CirclePlus } from "lucide-react";

export default async function AdminClientesPage() {
  const list = db ? await db.select().from(users).limit(100) : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button asChild size="sm">
          <Link href="/admin/clientes/nuevo" className="inline-flex gap-2">
            <CirclePlus className="h-4 w-4" />
            Nuevo cliente
          </Link>
        </Button>
      </div>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No hay clientes. Configura DATABASE_URL o SUPABASE_DATABASE_URL.
                </TableCell>
              </TableRow>
            ) : (
              list.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>{u.fullName ?? "—"}</TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString("es")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
