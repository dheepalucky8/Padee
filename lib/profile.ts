import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Board } from "./types";

const LEGACY_PROFILE_KEY = "padee.studentProfile.v1";
const FAMILY_KEY = "padee.familyProfiles.v1";

export const KID_AVATAR_COLORS = [
  "#0F6B5C",
  "#E85D3B",
  "#2F6FED",
  "#C48A16",
  "#7A4E9A",
  "#1F8A70",
  "#D35400",
  "#3D5A80",
] as const;

export interface KidProfile {
  id: string;
  name: string;
  grade: number;
  board: Board;
  colorIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyProfiles {
  kids: KidProfile[];
  activeKidId: string | null;
}

/** @deprecated Use KidProfile — kept for call sites during migration */
export type StudentProfile = KidProfile;

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeKid(raw: Partial<KidProfile>, index = 0): KidProfile | null {
  if (!raw?.name || !raw?.grade || !raw?.board) return null;
  return {
    id: raw.id || uid(),
    name: String(raw.name).trim(),
    grade: Number(raw.grade),
    board: raw.board,
    colorIndex:
      typeof raw.colorIndex === "number"
        ? raw.colorIndex % KID_AVATAR_COLORS.length
        : index % KID_AVATAR_COLORS.length,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

async function migrateLegacyIfNeeded(): Promise<FamilyProfiles | null> {
  const legacyRaw = await AsyncStorage.getItem(LEGACY_PROFILE_KEY);
  if (!legacyRaw) return null;
  try {
    const legacy = JSON.parse(legacyRaw) as Partial<KidProfile>;
    const kid = normalizeKid(legacy, 0);
    if (!kid) return null;
    const family: FamilyProfiles = {
      kids: [kid],
      activeKidId: kid.id,
    };
    await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(family));
    await AsyncStorage.removeItem(LEGACY_PROFILE_KEY);
    return family;
  } catch {
    return null;
  }
}

export async function loadFamily(): Promise<FamilyProfiles> {
  try {
    const raw = await AsyncStorage.getItem(FAMILY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FamilyProfiles;
      const kids = (parsed.kids || [])
        .map((kid, index) => normalizeKid(kid, index))
        .filter((kid): kid is KidProfile => Boolean(kid));
      const activeKidId =
        kids.find((k) => k.id === parsed.activeKidId)?.id ??
        kids[0]?.id ??
        null;
      return { kids, activeKidId };
    }
  } catch {
    // fall through to legacy migration
  }

  const migrated = await migrateLegacyIfNeeded();
  if (migrated) return migrated;
  return { kids: [], activeKidId: null };
}

export async function saveFamily(family: FamilyProfiles): Promise<void> {
  await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(family));
}

export async function loadKids(): Promise<KidProfile[]> {
  const family = await loadFamily();
  return family.kids;
}

/** Active kid, or first kid, or null */
export async function loadProfile(): Promise<KidProfile | null> {
  const family = await loadFamily();
  if (!family.kids.length) return null;
  return (
    family.kids.find((k) => k.id === family.activeKidId) ??
    family.kids[0] ??
    null
  );
}

export async function loadKidById(id: string): Promise<KidProfile | null> {
  const family = await loadFamily();
  return family.kids.find((k) => k.id === id) ?? null;
}

export async function setActiveKid(id: string): Promise<KidProfile | null> {
  const family = await loadFamily();
  const kid = family.kids.find((k) => k.id === id);
  if (!kid) return null;
  await saveFamily({ ...family, activeKidId: id });
  return kid;
}

export async function upsertKid(
  input: Pick<KidProfile, "name" | "grade" | "board"> & { id?: string },
): Promise<KidProfile> {
  const family = await loadFamily();
  const now = new Date().toISOString();
  const trimmed = input.name.trim();

  if (input.id) {
    const index = family.kids.findIndex((k) => k.id === input.id);
    if (index >= 0) {
      const updated: KidProfile = {
        ...family.kids[index],
        name: trimmed,
        grade: input.grade,
        board: input.board,
        updatedAt: now,
      };
      const kids = [...family.kids];
      kids[index] = updated;
      await saveFamily({
        kids,
        activeKidId: family.activeKidId ?? updated.id,
      });
      return updated;
    }
  }

  const kid: KidProfile = {
    id: uid(),
    name: trimmed,
    grade: input.grade,
    board: input.board,
    colorIndex: family.kids.length % KID_AVATAR_COLORS.length,
    createdAt: now,
    updatedAt: now,
  };
  await saveFamily({
    kids: [...family.kids, kid],
    activeKidId: kid.id,
  });
  return kid;
}

/** @deprecated Prefer upsertKid — overwrites/creates single active profile */
export async function saveProfile(
  input: Pick<KidProfile, "name" | "grade" | "board">,
): Promise<KidProfile> {
  const active = await loadProfile();
  return upsertKid({ ...input, id: active?.id });
}

export async function deleteKid(id: string): Promise<void> {
  const family = await loadFamily();
  const kids = family.kids.filter((k) => k.id !== id);
  const activeKidId =
    family.activeKidId === id ? kids[0]?.id ?? null : family.activeKidId;
  await saveFamily({ kids, activeKidId });
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.multiRemove([FAMILY_KEY, LEGACY_PROFILE_KEY]);
}

export function kidInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "P";
}

export function kidColor(kid: Pick<KidProfile, "colorIndex">): string {
  return KID_AVATAR_COLORS[kid.colorIndex % KID_AVATAR_COLORS.length];
}
