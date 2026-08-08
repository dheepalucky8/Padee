import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { BrandLogo } from "@/components/BrandLogo";
import { KidAvatar } from "@/components/KidAvatar";
import { Colors } from "@/constants/Colors";
import {
  loadFamily,
  setActiveKid,
  type KidProfile,
} from "@/lib/profile";
import type { Difficulty, DocumentType, MarksTotal } from "@/lib/types";

const GAP = 12;
const H_PAD = 20;

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<KidProfile | null>(null);

  const tileWidth = useMemo(() => {
    return (width - H_PAD * 2 - GAP) / 2;
  }, [width]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const family = await loadFamily();
        if (!active) return;
        setKids(family.kids);
        setReady(true);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  function openCreate(
    kid: KidProfile,
    opts?: {
      type?: DocumentType;
      difficulty?: Difficulty;
      marks?: MarksTotal;
    },
  ) {
    const params = new URLSearchParams();
    params.set("kidId", kid.id);
    if (opts?.type) params.set("type", opts.type);
    if (opts?.difficulty) params.set("difficulty", opts.difficulty);
    if (opts?.marks) params.set("marks", String(opts.marks));
    setSelected(null);
    router.push(`/create?${params.toString()}`);
  }

  async function onSelectKid(kid: KidProfile) {
    await setActiveKid(kid.id);
    setSelected(kid);
  }

  type GridItem =
    | { kind: "kid"; kid: KidProfile }
    | { kind: "add"; id: "add" };

  const data: GridItem[] = useMemo(
    () => [
      ...kids.map((kid) => ({ kind: "kid" as const, kid })),
      { kind: "add" as const, id: "add" },
    ],
    [kids],
  );

  if (!ready) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={data}
        keyExtractor={(item) =>
          item.kind === "kid" ? item.kid.id : item.id
        }
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <BrandLogo size={44} wordmarkSize={28} />
            <Text style={styles.title}>Family dashboard</Text>
            <Text style={styles.subtitle}>
              {kids.length
                ? "Choose a child to create worksheets and question papers."
                : "Add a child profile to get started."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.kind === "add") {
            return (
              <Pressable
                style={[styles.tile, styles.addTile, { width: tileWidth }]}
                android_ripple={{ color: "rgba(15,107,92,0.12)" }}
                onPress={() => router.push("/profile?mode=new")}
              >
                <View style={styles.addIcon}>
                  <Text style={styles.addIconText}>+</Text>
                </View>
                <Text style={styles.addTitle}>Add child</Text>
                <Text style={styles.addBody}>New profile</Text>
              </Pressable>
            );
          }

          const { kid } = item;
          return (
            <Pressable
              style={[styles.tile, styles.kidTile, { width: tileWidth }]}
              android_ripple={{ color: "rgba(255,255,255,0.18)" }}
              onPress={() => void onSelectKid(kid)}
              onLongPress={() =>
                router.push(`/profile?kidId=${encodeURIComponent(kid.id)}`)
              }
            >
              <KidAvatar kid={kid} size={64} />
              <Text style={styles.kidName} numberOfLines={1}>
                {kid.name}
              </Text>
              <Text style={styles.kidMeta} numberOfLines={1}>
                {kid.board}
              </Text>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeBadgeText}>Grade {kid.grade}</Text>
              </View>
            </Pressable>
          );
        }}
      />

      <Modal
        visible={Boolean(selected)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.modalScrim} onPress={() => setSelected(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {selected ? (
              <>
                <View style={styles.sheetHeader}>
                  <KidAvatar kid={selected} size={52} />
                  <View style={styles.sheetCopy}>
                    <Text style={styles.sheetName}>{selected.name}</Text>
                    <Text style={styles.sheetMeta}>
                      {selected.board} · Grade {selected.grade}
                    </Text>
                  </View>
                </View>

                <Text style={styles.sheetSection}>Start learning</Text>
                <Pressable
                  style={[styles.actionBtn, styles.actionPrimary]}
                  android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                  onPress={() =>
                    openCreate(selected, { type: "worksheet", marks: 25 })
                  }
                >
                  <Text style={styles.actionPrimaryTitle}>Worksheet</Text>
                  <Text style={styles.actionPrimaryBody}>
                    Practice · all formats
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.actionSecondary]}
                  android_ripple={{ color: "rgba(15,107,92,0.1)" }}
                  onPress={() =>
                    openCreate(selected, {
                      type: "question-paper",
                      marks: 50,
                      difficulty: "medium",
                    })
                  }
                >
                  <Text style={styles.actionSecondaryTitle}>Question paper</Text>
                  <Text style={styles.actionSecondaryBody}>
                    Exam style · out of marks
                  </Text>
                </Pressable>

                <View style={styles.sheetFooter}>
                  <Pressable
                    onPress={() => {
                      const id = selected.id;
                      setSelected(null);
                      router.push(`/profile?kidId=${encodeURIComponent(id)}`);
                    }}
                  >
                    <Text style={styles.linkText}>Edit profile</Text>
                  </Pressable>
                  <Pressable onPress={() => setSelected(null)}>
                    <Text style={styles.linkMuted}>Close</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    marginTop: 14,
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 28,
    color: Colors.brandDeep,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.inkSoft,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  tile: {
    borderRadius: 20,
    padding: 16,
    minHeight: 176,
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      default: {},
    }),
  },
  kidTile: {
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.line,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  kidName: {
    marginTop: 8,
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 18,
    color: Colors.brandDeep,
    textAlign: "center",
    width: "100%",
  },
  kidMeta: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: Colors.inkSoft,
  },
  gradeBadge: {
    marginTop: 4,
    backgroundColor: Colors.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gradeBadgeText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    color: Colors.brandDeep,
  },
  addTile: {
    backgroundColor: Colors.brandSoft,
    borderWidth: 1.5,
    borderColor: Colors.brand,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    elevation: 0,
  },
  addIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  addIconText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 28,
    color: Colors.brand,
    marginTop: -2,
  },
  addTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 18,
    color: Colors.brandDeep,
  },
  addBody: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: Colors.inkSoft,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(10, 40, 34, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    ...Platform.select({
      android: { elevation: 16 },
      default: {},
    }),
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  sheetCopy: {
    flex: 1,
  },
  sheetName: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 22,
    color: Colors.brandDeep,
  },
  sheetMeta: {
    marginTop: 2,
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: Colors.inkSoft,
  },
  sheetSection: {
    marginBottom: 10,
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.inkSoft,
  },
  actionBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    overflow: "hidden",
  },
  actionPrimary: {
    backgroundColor: Colors.accent,
  },
  actionPrimaryTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 18,
    color: Colors.white,
  },
  actionPrimaryBody: {
    marginTop: 2,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
  },
  actionSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  actionSecondaryTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 18,
    color: Colors.brandDeep,
  },
  actionSecondaryBody: {
    marginTop: 2,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: Colors.inkSoft,
  },
  sheetFooter: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 14,
    color: Colors.brand,
  },
  linkMuted: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: Colors.inkSoft,
  },
});
