import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  BOARDS,
  DIFFICULTIES,
  DOCUMENT_TYPES,
  GRADES,
  QUESTION_COUNTS,
  SUBJECTS,
} from "@/lib/boards";
import {
  extractTextFromImageUri,
  isOcrSupported,
  SAMPLE_TEXTBOOK_TEXT,
} from "@/lib/ocr";
import { generatePaper } from "@/lib/questionGenerator";
import { buildPrintableHtml } from "@/lib/print";
import type {
  Board,
  CapturedPage,
  Difficulty,
  DocumentType,
  GeneratedPaper,
  WorksheetConfig,
} from "@/lib/types";
import { Colors } from "@/constants/Colors";

const STEPS = ["Setup", "Capture", "Generate", "Print"] as const;

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function difficultyLabel(value: Difficulty): string {
  if (value === "hard") return "Difficult";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function CreateScreen() {
  const [step, setStep] = useState(0);
  const [board, setBoard] = useState<Board>("CBSE");
  const [grade, setGrade] = useState(5);
  const [subject, setSubject] = useState<string>(SUBJECTS[2]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [documentType, setDocumentType] =
    useState<DocumentType>("worksheet");
  const [questionCount, setQuestionCount] = useState(10);
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState<CapturedPage[]>([]);
  const [combinedText, setCombinedText] = useState("");
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config: WorksheetConfig = useMemo(
    () => ({
      board,
      grade,
      subject,
      difficulty,
      documentType,
      title: title || undefined,
      questionCount,
    }),
    [board, grade, subject, difficulty, documentType, title, questionCount],
  );

  const ocrBusy = pages.some((p) => p.status === "processing");
  const hasText = combinedText.trim().length > 40;
  const ocrReady = isOcrSupported();

  function syncTextFromPages(nextPages: CapturedPage[]) {
    const doneText = nextPages
      .filter((p) => p.status === "done" && p.extractedText)
      .map((p) => p.extractedText)
      .join("\n\n");
    setCombinedText(doneText);
  }

  async function pickImages(fromCamera: boolean) {
    setError(null);
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(
        fromCamera
          ? "Camera permission is needed to photograph textbook pages."
          : "Photo library permission is needed to upload textbook pages.",
      );
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.85,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.85,
          allowsMultipleSelection: true,
          selectionLimit: 6,
          mediaTypes: ["images"],
        });

    if (result.canceled || !result.assets?.length) return;

    const newPages: CapturedPage[] = result.assets.map((asset) => ({
      id: uid(),
      uri: asset.uri,
      extractedText: "",
      status: "pending",
    }));

    setPages((prev) => [...prev, ...newPages]);

    for (const page of newPages) {
      setPages((prev) =>
        prev.map((p) =>
          p.id === page.id ? { ...p, status: "processing" } : p,
        ),
      );
      try {
        const text = await extractTextFromImageUri(page.uri);
        setPages((prev) => {
          const next = prev.map((p) =>
            p.id === page.id
              ? { ...p, status: "done" as const, extractedText: text }
              : p,
          );
          queueMicrotask(() => syncTextFromPages(next));
          return next;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not read this image.";
        setPages((prev) =>
          prev.map((p) =>
            p.id === page.id
              ? { ...p, status: "error", error: message }
              : p,
          ),
        );
        // Keep flow usable: leave text area for manual paste
        setError(message);
      }
    }
  }

  function removePage(id: string) {
    const next = pages.filter((p) => p.id !== id);
    setPages(next);
    syncTextFromPages(next);
  }

  function useDemoText() {
    setCombinedText(SAMPLE_TEXTBOOK_TEXT);
    setError(null);
    setStep(2);
  }

  function handleGenerate() {
    setBusy(true);
    setError(null);
    try {
      const result = generatePaper(combinedText, config);
      setPaper(result);
      setShowAnswers(false);
      setStep(3);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while framing questions.",
      );
    } finally {
      setBusy(false);
    }
  }

  function goNext() {
    setError(null);
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!hasText) {
        setError(
          "Add textbook photos (or use the demo lesson) so Padee can read the content.",
        );
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) handleGenerate();
  }

  async function sharePdf() {
    if (!paper) return;
    setBusy(true);
    try {
      const html = buildPrintableHtml(paper, showAnswers);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Padee worksheet",
          UTI: "com.adobe.pdf",
        });
      } else {
        await Print.printAsync({ html });
      }
    } catch (err) {
      Alert.alert(
        "Could not create PDF",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function printPaper() {
    if (!paper) return;
    setBusy(true);
    try {
      const html = buildPrintableHtml(paper, showAnswers);
      await Print.printAsync({ html });
    } catch (err) {
      Alert.alert(
        "Print failed",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepsRow}>
          {STEPS.map((label, index) => (
            <View
              key={label}
              style={[
                styles.stepChip,
                index === step && styles.stepChipActive,
                index < step && styles.stepChipDone,
              ]}
            >
              <Text
                style={[
                  styles.stepChipText,
                  index === step && styles.stepChipTextOn,
                  index < step && styles.stepChipTextDone,
                ]}
              >
                {index + 1}. {label}
              </Text>
            </View>
          ))}
        </View>

        {step === 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>School setup</Text>
            <Text style={styles.cardBody}>
              Choose the board, grade, subject, and how hard the practice should
              feel.
            </Text>

            <Text style={styles.label}>Board</Text>
            <View style={styles.choiceGrid}>
              {BOARDS.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setBoard(item.id)}
                  style={[
                    styles.choice,
                    board === item.id && styles.choiceSelected,
                  ]}
                >
                  <Text style={styles.choiceTitle}>{item.label}</Text>
                  <Text style={styles.choiceBody}>{item.blurb}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Grade</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.row}>
                {GRADES.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setGrade(g)}
                    style={[
                      styles.pill,
                      grade === g && styles.pillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        grade === g && styles.pillTextSelected,
                      ]}
                    >
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.row}>
                {SUBJECTS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setSubject(s)}
                    style={[
                      styles.pill,
                      subject === s && styles.pillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        subject === s && styles.pillTextSelected,
                      ]}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>Difficulty</Text>
            {DIFFICULTIES.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setDifficulty(item.id)}
                style={[
                  styles.choice,
                  difficulty === item.id && styles.choiceAccent,
                ]}
              >
                <Text style={styles.choiceTitle}>{item.label}</Text>
                <Text style={styles.choiceBody}>{item.description}</Text>
              </Pressable>
            ))}

            <Text style={styles.label}>Output format</Text>
            {DOCUMENT_TYPES.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setDocumentType(item.id)}
                style={[
                  styles.choice,
                  documentType === item.id && styles.choiceSelected,
                ]}
              >
                <Text style={styles.choiceTitle}>{item.label}</Text>
                <Text style={styles.choiceBody}>{item.description}</Text>
              </Pressable>
            ))}

            <Text style={styles.label}>Number of questions</Text>
            <View style={styles.rowWrap}>
              {QUESTION_COUNTS.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setQuestionCount(n)}
                  style={[
                    styles.pill,
                    questionCount === n && styles.pillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      questionCount === n && styles.pillTextSelected,
                    ]}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Custom title (optional)</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={`${subject} practice sheet`}
              placeholderTextColor={Colors.inkSoft}
              style={styles.input}
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Capture textbook pages</Text>
            <Text style={styles.cardBody}>
              Photograph clear, flat pages.
              {ocrReady
                ? " Padee can read the text on-device."
                : " In Expo Go, use Try demo lesson or paste the lesson text below (OCR needs a development build)."}
            </Text>

            <Pressable
              style={styles.primaryBtn}
              onPress={() => void pickImages(true)}
            >
              <Text style={styles.primaryBtnText}>Use camera</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => void pickImages(false)}
            >
              <Text style={styles.secondaryBtnText}>Upload from gallery</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={useDemoText}>
              <Text style={styles.secondaryBtnText}>Try demo lesson</Text>
            </Pressable>

            {pages.length > 0 && (
              <View style={styles.pageList}>
                {pages.map((page) => (
                  <View key={page.id} style={styles.pageItem}>
                    <Image source={{ uri: page.uri }} style={styles.thumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pageStatus}>
                        {page.status === "processing" && "Reading page…"}
                        {page.status === "done" && "Text ready"}
                        {page.status === "pending" && "Waiting…"}
                        {page.status === "error" && (page.error || "Failed")}
                      </Text>
                      <Pressable onPress={() => removePage(page.id)}>
                        <Text style={styles.removeLink}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.label}>Extracted lesson text</Text>
            <TextInput
              value={combinedText}
              onChangeText={setCombinedText}
              multiline
              textAlignVertical="top"
              placeholder="Text from textbook photos appears here. You can edit or paste lesson text."
              placeholderTextColor={Colors.inkSoft}
              style={[styles.input, styles.textArea]}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Frame the questions</Text>
            <Text style={styles.cardBody}>
              Review your setup, then generate a {difficultyLabel(difficulty)}{" "}
              {documentType === "question-paper"
                ? "question paper"
                : "worksheet"}
              .
            </Text>

            {[
              ["Board", board],
              ["Grade", `Grade ${grade}`],
              ["Subject", subject],
              ["Level", difficultyLabel(difficulty)],
              [
                "Format",
                documentType === "question-paper"
                  ? "Question Paper"
                  : "Worksheet",
              ],
              ["Questions", String(questionCount)],
            ].map(([label, value]) => (
              <View key={label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={styles.summaryValue}>{value}</Text>
              </View>
            ))}

            <Text style={styles.label}>Lesson preview</Text>
            <Text style={styles.previewText} numberOfLines={8}>
              {combinedText}
            </Text>
          </View>
        )}

        {step === 3 && paper && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ready to print</Text>
            <Text style={styles.cardBody}>
              {paper.questions.length} questions · {paper.totalMarks} marks
              total
            </Text>

            <View style={styles.paperPreview}>
              <Text style={styles.paperMeta}>
                {paper.config.board} · Grade {paper.config.grade}
              </Text>
              <Text style={styles.paperTitle}>
                {paper.config.title?.trim() ||
                  `${paper.config.subject} ${
                    paper.config.documentType === "question-paper"
                      ? "Question Paper"
                      : "Worksheet"
                  }`}
              </Text>
              <Text style={styles.paperSub}>
                Level: {difficultyLabel(paper.config.difficulty)}
                {paper.config.documentType === "question-paper"
                  ? ` · Max marks ${paper.totalMarks}`
                  : ""}
              </Text>
              <Text style={styles.paperSource}>{paper.sourceSummary}</Text>

              {paper.questions.slice(0, 4).map((q, index) => (
                <View key={q.id} style={styles.qBlock}>
                  <Text style={styles.qText}>
                    <Text style={styles.qNum}>{index + 1}. </Text>
                    {q.prompt}
                  </Text>
                  {q.options?.map((opt, i) => (
                    <Text key={opt} style={styles.option}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </Text>
                  ))}
                </View>
              ))}
              {paper.questions.length > 4 && (
                <Text style={styles.moreHint}>
                  + {paper.questions.length - 4} more questions in the printable
                  PDF
                </Text>
              )}
            </View>

            <Pressable
              style={styles.secondaryBtn}
              onPress={() => setShowAnswers((v) => !v)}
            >
              <Text style={styles.secondaryBtnText}>
                {showAnswers ? "Hide answers in PDF" : "Include answer key in PDF"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => void sharePdf()}
              disabled={busy}
            >
              <Text style={styles.primaryBtnText}>
                {busy ? "Preparing…" : "Share printable PDF"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => void printPaper()}
              disabled={busy}
            >
              <Text style={styles.secondaryBtnText}>Print</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                setPaper(null);
                setStep(2);
              }}
            >
              <Text style={styles.secondaryBtnText}>Regenerate</Text>
            </Pressable>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      {step < 3 && (
        <View style={styles.footerBar}>
          <Pressable
            style={[styles.footerBtn, styles.footerBack]}
            onPress={() => {
              setError(null);
              setStep((s) => Math.max(0, s - 1));
            }}
            disabled={step === 0}
          >
            <Text style={styles.footerBackText}>Back</Text>
          </Pressable>
          <Pressable
            style={[styles.footerBtn, styles.footerNext]}
            onPress={goNext}
            disabled={busy || (step === 1 && ocrBusy)}
          >
            {busy || (step === 1 && ocrBusy) ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.footerNextText}>
                {step === 2 ? "Generate paper" : "Continue"}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: 16, paddingBottom: 120 },
  stepsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  stepChip: {
    backgroundColor: Colors.white,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  stepChipActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  stepChipDone: { backgroundColor: Colors.brandSoft, borderColor: Colors.brandSoft },
  stepChipText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11,
    color: Colors.inkSoft,
    textTransform: "uppercase",
  },
  stepChipTextOn: { color: Colors.white },
  stepChipTextDone: { color: Colors.brandDeep },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  cardTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 24,
    color: Colors.ink,
  },
  cardBody: {
    marginTop: 6,
    marginBottom: 10,
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.inkSoft,
  },
  label: {
    marginTop: 14,
    marginBottom: 8,
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.inkSoft,
  },
  choiceGrid: { gap: 8 },
  choice: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    backgroundColor: Colors.white,
  },
  choiceSelected: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandSoft,
  },
  choiceAccent: {
    borderColor: Colors.accent,
    backgroundColor: Colors.dangerBg,
  },
  choiceTitle: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 18,
    color: Colors.brandDeep,
  },
  choiceBody: {
    marginTop: 4,
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: Colors.inkSoft,
  },
  row: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.white,
  },
  pillSelected: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  pillText: {
    fontFamily: "Nunito_700Bold",
    color: Colors.inkSoft,
    fontSize: 14,
  },
  pillTextSelected: { color: Colors.white },
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 15,
    color: Colors.ink,
    backgroundColor: Colors.white,
  },
  textArea: { minHeight: 180, fontFamily: "Nunito_400Regular", lineHeight: 22 },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.white,
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  secondaryBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.brandDeep,
    fontSize: 15,
  },
  pageList: { marginTop: 8, gap: 10 },
  pageItem: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: Colors.paperDeep,
    borderRadius: 14,
    padding: 8,
  },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: "#ddd" },
  pageStatus: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: Colors.ink,
  },
  removeLink: {
    marginTop: 4,
    fontFamily: "Nunito_700Bold",
    color: Colors.accentDeep,
    fontSize: 13,
  },
  summaryRow: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.inkSoft,
  },
  summaryValue: {
    marginTop: 4,
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 18,
    color: Colors.brandDeep,
  },
  previewText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    lineHeight: 21,
    color: Colors.inkSoft,
    backgroundColor: Colors.paperDeep,
    borderRadius: 14,
    padding: 12,
  },
  paperPreview: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  paperMeta: {
    textAlign: "center",
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: Colors.ink,
  },
  paperTitle: {
    textAlign: "center",
    marginTop: 6,
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 22,
    color: Colors.ink,
  },
  paperSub: {
    textAlign: "center",
    marginTop: 4,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: Colors.inkSoft,
  },
  paperSource: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: Colors.inkSoft,
  },
  qBlock: { marginBottom: 12 },
  qText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.ink,
  },
  qNum: { fontFamily: "Nunito_800ExtraBold" },
  option: {
    marginTop: 4,
    marginLeft: 8,
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: Colors.inkSoft,
  },
  moreHint: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: Colors.brand,
  },
  error: {
    marginTop: 12,
    backgroundColor: Colors.dangerBg,
    color: Colors.accentDeep,
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    padding: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  footerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: "rgba(243,250,247,0.96)",
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  footerBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  footerBack: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  footerBackText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.inkSoft,
  },
  footerNext: { backgroundColor: Colors.accent },
  footerNextText: {
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.white,
  },
});
