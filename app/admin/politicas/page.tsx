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
import { studioPolicies } from "@/lib/db/schema";
import { CirclePlus } from "lucide-react";

export default async function AdminPoliticasPage() {
  const list = db ? await db.select().from(studioPolicies) : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Políticas del estudio</h1>
        <Button asChild size="sm">
          <Link href="/admin/politicas/nueva" className="inline-flex gap-2">
            <CirclePlus className="h-4 w-4" />
            Nueva política
          </Link>
        </Button>
      </div>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clave</TableHead>
              <TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                  No hay políticas.
                </TableCell>
              </TableRow>
            ) : (
              list.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.key}</TableCell>
                  <TableCell className="text-muted-foreground">{p.value ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
