import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { BrandLogo } from "@/components/BrandLogo";
import { LinearGradient } from "@/components/LinearGradientFallback";
import { Colors } from "@/constants/Colors";
import { MARKS_TOTALS, QUESTION_FORMATS } from "@/lib/boards";
import { loadProfile, type StudentProfile } from "@/lib/profile";
import type { Difficulty, DocumentType, MarksTotal } from "@/lib/types";

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const saved = await loadProfile();
        if (!active) return;
        if (!saved) {
          router.replace("/profile");
          return;
        }
        setProfile(saved);
      })();
      return () => {
        active = false;
      };
    }, [router]),
  );

  function openCreate(opts?: {
    type?: DocumentType;
    difficulty?: Difficulty;
    marks?: MarksTotal;
  }) {
    const params = new URLSearchParams();
    if (opts?.type) params.set("type", opts.type);
    if (opts?.difficulty) params.set("difficulty", opts.difficulty);
    if (opts?.marks) params.set("marks", String(opts.marks));
    const qs = params.toString();
    router.push(qs ? `/create?${qs}` : "/create");
  }

  if (!profile) {
    return <View style={styles.screen} />;
  }

  const initial = profile.name.trim().charAt(0).toUpperCase() || "P";

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View>
            <BrandLogo size={44} wordmarkSize={28} />
            <Text style={styles.hello}>Hi, {profile.name}</Text>
          </View>
          <Pressable
            style={styles.avatar}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </Pressable>
        </View>

        <LinearGradient
          colors={[Colors.brand, Colors.brandDeep]}
          style={styles.heroCard}
        >
          <Text style={styles.heroEyebrow}>Your study desk</Text>
          <Text style={styles.heroTitle}>
            {profile.board} · Grade {profile.grade}
          </Text>
          <Text style={styles.heroBody}>
            Snap a textbook page and get fill-ups, choose, match, one-word,
            2-mark and give-reason questions — Easy to Difficult.
          </Text>
        </LinearGradient>

        <Text style={styles.sectionLabel}>Quick actions</Text>
        <View style={styles.actionGrid}>
          <Pressable
            style={[styles.actionTile, styles.actionPrimary]}
            onPress={() => openCreate({ type: "worksheet", marks: 25 })}
          >
            <Text style={styles.actionKickerLight}>Practice</Text>
            <Text style={styles.actionTitleLight}>Worksheet</Text>
            <Text style={styles.actionBodyLight}>
              All formats · out of marks
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionTile, styles.actionSecondary]}
            onPress={() => openCreate({ type: "question-paper", marks: 50 })}
          >
            <Text style={styles.actionKicker}>Exam</Text>
            <Text style={styles.actionTitle}>Question paper</Text>
            <Text style={styles.actionBody}>Sections with marks</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Difficulty</Text>
        <View style={styles.difficultyRow}>
          {(
            [
              ["easy", "Easy"],
              ["medium", "Medium"],
              ["hard", "Difficult"],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              style={styles.diffChip}
              onPress={() =>
                openCreate({ type: "worksheet", difficulty: id, marks: 25 })
              }
            >
              <Text style={styles.diffChipText}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Out of marks</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.marksRow}>
            {MARKS_TOTALS.map((marks) => (
              <Pressable
                key={marks}
                style={styles.marksChip}
                onPress={() =>
                  openCreate({
                    type: "question-paper",
                    marks,
                    difficulty: "medium",
                  })
                }
              >
                <Text style={styles.marksValue}>{marks}</Text>
                <Text style={styles.marksHint}>marks</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.sectionLabel}>Question formats in every paper</Text>
        <View style={styles.formatGrid}>
          {QUESTION_FORMATS.map((format) => (
            <View key={format.id} style={styles.formatTile}>
              <Text style={styles.formatLabel}>{format.label}</Text>
              <Text style={styles.formatMarks}>{format.marks} mark{format.marks > 1 ? "s" : ""}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerActions}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.secondaryBtnText}>Edit profile</Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/")}>
            <Text style={styles.linkText}>Back to welcome</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  hello: {
    marginTop: 8,
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: Colors.inkSoft,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 20,
    color: Colors.white,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 22,
  },
  heroEyebrow: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.7)",
  },
  heroTitle: {
    marginTop: 8,
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 26,
    color: Colors.white,
  },
  heroBody: {
    marginTop: 8,
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.88)",
  },
  sectionLabel: {
    marginBottom: 10,
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.inkSoft,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 22,
  },
  actionTile: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    minHeight: 118,
  },
  actionPrimary: {
    backgroundColor: Colors.accent,
  },
  actionSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  actionKickerLight: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.75)",
    marginBottom: 8,
  },
  actionKicker: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.brand,
    marginBottom: 8,
  },
  actionTitleLight: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 18,
    color: Colors.white,
  },
  actionBodyLight: {
    marginTop: 4,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  actionTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 18,
    color: Colors.brandDeep,
  },
  actionBody: {
    marginTop: 4,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: Colors.inkSoft,
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
  },
  diffChip: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 12,
    alignItems: "center",
  },
  diffChipText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13,
    color: Colors.brandDeep,
  },
  marksRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
    marginBottom: 22,
  },
  marksChip: {
    width: 72,
    borderRadius: 16,
    backgroundColor: Colors.brandSoft,
    paddingVertical: 12,
    alignItems: "center",
  },
  marksValue: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 22,
    color: Colors.brandDeep,
  },
  marksHint: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11,
    color: Colors.inkSoft,
  },
  formatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  formatTile: {
    width: "31%",
    flexGrow: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  formatLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13,
    color: Colors.ink,
  },
  formatMarks: {
    marginTop: 4,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: Colors.inkSoft,
  },
  footerActions: {
    gap: 14,
    alignItems: "flex-start",
  },
  secondaryBtn: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  secondaryBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.brandDeep,
    fontSize: 14,
  },
  linkText: {
    fontFamily: "Nunito_700Bold",
    color: Colors.inkSoft,
    fontSize: 14,
  },
});
