import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { getDb, schema } from "@nutcrack/db";

import { generateSlug } from "../lib/utils.js";

function rowToCategory(row: schema.Category) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    sort_order: row.sortOrder,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Error && err.message.includes("UNIQUE constraint failed")
  );
}

export async function getCategories() {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.categories)
    .orderBy(asc(schema.categories.sortOrder));
  return rows.map(rowToCategory);
}

export async function createCategory(input: {
  name: string;
  description?: string;
  icon?: string;
}) {
  const slug = generateSlug(input.name);
  const db = getDb();
  try {
    const inserted = await db
      .insert(schema.categories)
      .values({
        id: randomUUID(),
        name: input.name,
        slug,
        description: input.description ?? null,
        icon: input.icon ?? null,
      })
      .returning();
    return rowToCategory(inserted[0]);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new Error("CONFLICT:Category name already exists");
    }
    throw err;
  }
}

export async function updateCategory(
  id: string,
  input: {
    name?: string;
    description?: string;
    icon?: string;
    sort_order?: number;
  },
) {
  const updates: Partial<schema.NewCategory> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    updates.name = input.name;
    updates.slug = generateSlug(input.name);
  }
  if (input.description !== undefined) updates.description = input.description;
  if (input.icon !== undefined) updates.icon = input.icon;
  if (input.sort_order !== undefined) updates.sortOrder = input.sort_order;

  const db = getDb();
  try {
    const result = await db
      .update(schema.categories)
      .set(updates)
      .where(eq(schema.categories.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error(`NOT_FOUND:Category '${id}' not found`);
    }
    return rowToCategory(result[0]);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new Error("CONFLICT:Category name already exists");
    }
    throw err;
  }
}

export async function deleteCategory(id: string) {
  const db = getDb();
  // Detach links from this category and remove the category atomically.
  db.transaction((tx) => {
    tx.update(schema.links)
      .set({ categoryId: null })
      .where(eq(schema.links.categoryId, id))
      .run();
    const deleted = tx
      .delete(schema.categories)
      .where(eq(schema.categories.id, id))
      .returning({ id: schema.categories.id })
      .all();
    if (deleted.length === 0) {
      throw new Error(`NOT_FOUND:Category '${id}' not found`);
    }
  });
}
