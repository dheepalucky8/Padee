import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BrandLogo } from "@/components/BrandLogo";
import { KidAvatar } from "@/components/KidAvatar";
import { BOARDS, GRADES } from "@/lib/boards";
import {
  deleteKid,
  loadFamily,
  loadKidById,
  upsertKid,
} from "@/lib/profile";
import type { Board } from "@/lib/types";
import { Colors } from "@/constants/Colors";

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kidId?: string; mode?: string }>();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(5);
  const [board, setBoard] = useState<Board>("CBSE");
  const [colorIndex, setColorIndex] = useState(0);
  const [kidId, setKidId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (params.mode === "new") {
        const family = await loadFamily();
        setColorIndex(family.kids.length % 8);
        setIsEditing(false);
        setReady(true);
        return;
      }

      const id = typeof params.kidId === "string" ? params.kidId : undefined;
      if (id) {
        const existing = await loadKidById(id);
        if (existing) {
          setKidId(existing.id);
          setName(existing.name);
          setGrade(existing.grade);
          setBoard(existing.board);
          setColorIndex(existing.colorIndex);
          setIsEditing(true);
          setReady(true);
          return;
        }
      }

      // Default: edit active kid if present, otherwise blank new form
      const family = await loadFamily();
      const existing =
        family.kids.find((k) => k.id === family.activeKidId) ??
        family.kids[0] ??
        null;
      if (existing && params.mode !== "new") {
        setKidId(existing.id);
        setName(existing.name);
        setGrade(existing.grade);
        setBoard(existing.board);
        setColorIndex(existing.colorIndex);
        setIsEditing(true);
      } else {
        setColorIndex(family.kids.length % 8);
        setIsEditing(false);
      }
      setReady(true);
    })();
  }, [params.kidId, params.mode]);

  async function onSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Please enter the child’s name (at least 2 letters).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsertKid({
        id: kidId,
        name: trimmed,
        grade,
        board,
      });
      router.replace("/home");
    } catch {
      setError("Could not save the profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    if (!kidId) return;
    Alert.alert(
      "Remove child profile?",
      `This removes ${name || "this child"} from the family dashboard.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await deleteKid(kidId);
              router.replace("/home");
            })();
          },
        },
      ],
    );
  }

  if (!ready) {
    return <View style={styles.screen} />;
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
        <View style={styles.preview}>
          <KidAvatar
            kid={{ name: name || "P", colorIndex }}
            size={72}
          />
        </View>
        <Text style={styles.eyebrow}>Child profile</Text>
        <Text style={styles.title}>
          {isEditing ? "Update child profile" : "Add a child"}
        </Text>
        <Text style={styles.body}>
          Each child gets their own board and grade on the family dashboard.
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
              android_ripple={{ color: "rgba(15,107,92,0.1)" }}
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
              android_ripple={{ color: "rgba(15,107,92,0.12)" }}
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
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          onPress={() => void onSave()}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving
              ? "Saving…"
              : isEditing
                ? "Save changes"
                : "Add to dashboard"}
          </Text>
        </Pressable>

        {isEditing && kidId ? (
          <Pressable style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.deleteBtnText}>Remove child</Text>
          </Pressable>
        ) : null}
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
    marginBottom: 12,
  },
  preview: {
    marginBottom: 12,
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
    ...Platform.select({
      android: { elevation: 1 },
      default: {},
    }),
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
    overflow: "hidden",
    ...Platform.select({
      android: { elevation: 1 },
      default: {},
    }),
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: "hidden",
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
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    overflow: "hidden",
    ...Platform.select({
      android: { elevation: 3 },
      default: {},
    }),
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.white,
    fontSize: 16,
  },
  deleteBtn: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 12,
  },
  deleteBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.accentDeep,
    fontSize: 14,
  },
});
