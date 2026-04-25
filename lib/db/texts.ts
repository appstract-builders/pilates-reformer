import { sqliteClient } from "@/lib/db";

type HydratedTextRow = {
  component: string;
  label: string;
  descripcion: string | null;
};

export function getHydratedTexts(projectId = 1) {
  const rows = sqliteClient
    .prepare(
      `
        SELECT component.nombre AS component, datahydrate.label, datahydrate.descripcion
        FROM imin.datahydrate
        INNER JOIN imin.component AS component
          ON component.id = datahydrate.component
        WHERE datahydrate.idproyecto = ?
      `,
    )
    .all(projectId) as HydratedTextRow[];

  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[`${row.component}.${row.label}`] = row.descripcion ?? "";
    return acc;
  }, {});
}
