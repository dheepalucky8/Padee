import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { BrandLogo } from "@/components/BrandLogo";
import { BOARDS, GRADES } from "@/lib/boards";
import { loadProfile, saveProfile } from "@/lib/profile";
import type { Board } from "@/lib/types";
import { Colors } from "@/constants/Colors";

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(5);
  const [board, setBoard] = useState<Board>("CBSE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    (async () => {
      const existing = await loadProfile();
      if (!existing) return;
      setName(existing.name);
      setGrade(existing.grade);
      setBoard(existing.board);
      setIsEditing(true);
    })();
  }, []);

  async function onSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Please enter the student’s name (at least 2 letters).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveProfile({ name: trimmed, grade, board });
      router.replace("/home");
    } catch {
      setError("Could not save the profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BrandLogo size={56} wordmarkSize={30} style={styles.logo} />
        <Text style={styles.eyebrow}>Student profile</Text>
        <Text style={styles.title}>
          {isEditing ? "Update your profile" : "Tell us about the student"}
        </Text>
        <Text style={styles.body}>
          We’ll use this to personalise worksheets for the right board and
          grade.
        </Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Ananya"
          placeholderTextColor={Colors.inkSoft}
          autoCapitalize="words"
          style={styles.input}
        />

        <Text style={styles.label}>Board</Text>
        <View style={styles.boardList}>
          {BOARDS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setBoard(item.id)}
              style={[
                styles.boardOption,
                board === item.id && styles.boardOptionSelected,
              ]}
            >
              <Text style={styles.boardTitle}>{item.label}</Text>
              <Text style={styles.boardBody}>{item.blurb}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Grade</Text>
        <View style={styles.gradeWrap}>
          {GRADES.map((g) => (
            <Pressable
              key={g}
              onPress={() => setGrade(g)}
              style={[styles.gradePill, grade === g && styles.gradePillSelected]}
            >
              <Text
                style={[
                  styles.gradeText,
                  grade === g && styles.gradeTextSelected,
                ]}
              >
                {g}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={() => void onSave()}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving
              ? "Saving…"
              : isEditing
                ? "Save changes"
                : "Create profile"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    padding: 22,
    paddingBottom: 40,
  },
  logo: {
    marginBottom: 18,
  },
  eyebrow: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: Colors.brand,
  },
  title: {
    marginTop: 8,
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 30,
    lineHeight: 36,
    color: Colors.brandDeep,
  },
  body: {
    marginTop: 8,
    marginBottom: 8,
    fontFamily: "Nunito_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: Colors.inkSoft,
  },
  label: {
    marginTop: 20,
    marginBottom: 10,
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.inkSoft,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Nunito_700Bold",
    fontSize: 17,
    color: Colors.ink,
  },
  boardList: {
    gap: 10,
  },
  boardOption: {
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
  },
  boardOptionSelected: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandSoft,
  },
  boardTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 20,
    color: Colors.brandDeep,
  },
  boardBody: {
    marginTop: 4,
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: Colors.inkSoft,
  },
  gradeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gradePill: {
    minWidth: 48,
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  gradePillSelected: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  gradeText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 15,
    color: Colors.inkSoft,
  },
  gradeTextSelected: {
    color: Colors.white,
  },
  error: {
    marginTop: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.accentDeep,
    backgroundColor: Colors.dangerBg,
    padding: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  saveBtn: {
    marginTop: 28,
    backgroundColor: Colors.accent,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.white,
    fontSize: 16,
  },
});
