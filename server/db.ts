import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  type InsertRegistration,
  type InsertUser,
  registrations,
  users,
} from "../drizzle/schema";
import type { RegistrationStatus } from "@shared/registration";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach(field => {
    const value = user[field];
    if (value === undefined) return;
    values[field] = value ?? null;
    updateSet[field] = value ?? null;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function createRegistration(input: InsertRegistration) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(registrations).values(input);
  const result = await db
    .select()
    .from(registrations)
    .where(eq(registrations.referenceCode, input.referenceCode))
    .limit(1);
  if (!result[0]) throw new Error("Registration could not be created");
  return result[0];
}

export async function getRegistrationByReference(referenceCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db
    .select()
    .from(registrations)
    .where(eq(registrations.referenceCode, referenceCode))
    .limit(1);
  return result[0];
}

export async function reportRegistrationPayment(referenceCode: string, payerName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(registrations)
    .set({ payerName, paymentReportedAt: new Date() })
    .where(eq(registrations.referenceCode, referenceCode));
  return getRegistrationByReference(referenceCode);
}

export async function listRegistrations() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(registrations).orderBy(desc(registrations.createdAt));
}

export async function updateRegistrationStatus(id: number, status: RegistrationStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(registrations).set({ status }).where(eq(registrations.id, id));
  const result = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
  return result[0];
}
