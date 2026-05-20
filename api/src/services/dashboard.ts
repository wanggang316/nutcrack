import { and, eq, gte, ne, sql } from "drizzle-orm";

import { getDb, schema } from "@nutcrack/db";

import { getRecentActivities } from "./activity-logs.js";

const NOT_DELETED = ne(schema.links.status, "deleted");

async function countLinks(where: ReturnType<typeof and>) {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.links)
    .where(where);
  return rows[0]?.count ?? 0;
}

export async function getDashboardData() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const db = getDb();

  const [
    totalLinks,
    pendingLinks,
    publishedLinks,
    archivedLinks,
    thisWeekCount,
    thisMonthCount,
    categoryCountRows,
    tagCountRows,
    recentActivities,
  ] = await Promise.all([
    countLinks(NOT_DELETED),
    countLinks(eq(schema.links.status, "pending")),
    countLinks(eq(schema.links.status, "published")),
    countLinks(eq(schema.links.status, "archived")),
    countLinks(
      and(NOT_DELETED, gte(schema.links.createdAt, startOfWeek.toISOString())),
    ),
    countLinks(
      and(NOT_DELETED, gte(schema.links.createdAt, startOfMonth.toISOString())),
    ),
    db.select({ count: sql<number>`count(*)` }).from(schema.categories),
    db
      .select({
        count: sql<number>`count(distinct ${schema.linkTags.tag})`,
      })
      .from(schema.linkTags)
      .innerJoin(schema.links, eq(schema.links.id, schema.linkTags.linkId))
      .where(NOT_DELETED),
    getRecentActivities(10),
  ]);

  return {
    total_links: totalLinks,
    pending_links: pendingLinks,
    published_links: publishedLinks,
    archived_links: archivedLinks,
    this_week_count: thisWeekCount,
    this_month_count: thisMonthCount,
    category_count: categoryCountRows[0]?.count ?? 0,
    tag_count: tagCountRows[0]?.count ?? 0,
    recent_activities: recentActivities,
  };
}
