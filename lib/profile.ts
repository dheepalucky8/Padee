import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Board } from "./types";

const PROFILE_KEY = "padee.studentProfile.v1";

export interface StudentProfile {
  name: string;
  grade: number;
  board: Board;
  createdAt: string;
  updatedAt: string;
}

export async function loadProfile(): Promise<StudentProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentProfile;
    if (!parsed?.name || !parsed?.grade || !parsed?.board) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveProfile(
  input: Pick<StudentProfile, "name" | "grade" | "board">,
): Promise<StudentProfile> {
  const existing = await loadProfile();
  const now = new Date().toISOString();
  const profile: StudentProfile = {
    name: input.name.trim(),
    grade: input.grade,
    board: input.board,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
