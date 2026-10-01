import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { StoreProvider, useStore } from "./src/state/store";
import { completeSession, recordAnswer, setWordKnown } from "./src/state/model";
import {
  effectiveMastery,
  mastery,
  optionsFor,
  questionSequence,
  selectWords,
} from "./src/engine/learning";
import type { Answer, Word } from "./src/engine/types";
import seed from "./src/data/words.json";
import { art, colors as c } from "./src/ui/theme";
const words: Word[] = seed;
type Routes = {
  Home: undefined;
  Play: undefined;
  Results: { sessionId: string };
  Parent: undefined;
  Library: undefined;
  Profiles: undefined;
};
const Stack = createNativeStackNavigator<Routes>();
type Props<T extends keyof Routes> = NativeStackScreenProps<Routes, T>;
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        (pressed || disabled) && { opacity: 0.55 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: c.purple }]}>
        {label}
      </Text>
    </Pressable>
  );
}
function Page({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.page}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
function Heading({ title, caption }: { title: string; caption?: string }) {
  return (
    <View style={s.heading}>
      <Text style={s.title}>{title}</Text>
      {caption && <Text style={s.subtitle}>{caption}</Text>}
    </View>
  );
}
function Home({ navigation }: Props<"Home">) {
  const { state } = useStore();
  const child = state.children.find((x) => x.id === state.activeChildId);
  if (!child) return <Profiles navigation={navigation} />;
  const progress = Object.values(child.progress);
  const due = progress.filter((p) => p.nextReviewAt <= Date.now()).length;
  const hasDraft = state.activeSession?.childId === child.id;
  return (
    <Page>
      <View style={s.headerRow}>
        <Text style={s.wordmark}>
          Word<Text style={{ color: c.purple }}>Rush</Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("Profiles")}
          style={s.profile}
        >
          <Image source={art.avatars[child.avatar]} style={s.avatar} />
          <Text style={s.small}>{child.name}</Text>
        </Pressable>
      </View>
      <View style={s.chip}>
        <Text style={s.chipText}>ההרפתקה הקטנה של היום</Text>
      </View>
      <Heading
        title={`היי ${child.name}, מוכנים לשחק?`}
        caption="עוד כמה מילים. עוד עולם שלם לגלות."
      />
      <View style={s.hero}>
        <View style={s.heroCircle} />
        <Image source={art.mascot} style={s.mascot} />
        <Text style={s.heroTitle}>מילים קטנות, הרפתקה גדולה</Text>
        <Text style={s.subtitle}>לומדים אנגלית, צעד קטן בכל יום</Text>
        <Button
          label={hasDraft ? "ממשיכים לשחק" : "בואו נשחק"}
          onPress={() => navigation.navigate("Play")}
        />
        <Text style={s.hint}>סיבוב קצר • בקצב שלכם</Text>
      </View>
      <View style={s.row}>
        <View style={s.stat}>
          <Text style={s.statNumber}>{child.xp}</Text>
          <Text style={s.small}>נקודות XP</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statNumber}>{progress.length}</Text>
          <Text style={s.small}>מילים שתרגלנו</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statNumber}>{due}</Text>
          <Text style={s.small}>מילים לחזרה</Text>
        </View>
      </View>
      <View style={s.worldCard}>
        <Image source={art.world} style={s.world} />
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>העולם הראשון</Text>
          <Text style={s.sectionTitle}>מתחילים לגלות</Text>
          <Text style={s.small}>
            {progress.filter((p) => mastery(p) >= 80).length} מילים בשליטה מתוך
            100
          </Text>
        </View>
      </View>
      <Button
        secondary
        label="כל המילים שלי"
        onPress={() => navigation.navigate("Library")}
      />
      <Button
        secondary
        label="אזור הורים"
        onPress={() => navigation.navigate("Parent")}
      />
    </Page>
  );
}
function Profiles({
  navigation,
}: {
  navigation: Pick<Props<"Profiles">["navigation"], "navigate">;
}) {
  const { state, update } = useStore();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(0);
  return (
    <Page>
      <Heading title="מי משחקים היום?" caption="לכל ילד וילדה הרפתקה משלהם" />
      {state.children.map((child) => (
        <Pressable
          key={child.id}
          accessibilityRole="button"
          style={s.profileChoice}
          onPress={() => {
            update((v) => ({ ...v, activeChildId: child.id }));
            navigation.navigate("Home");
          }}
        >
          <Image source={art.avatars[child.avatar]} style={s.avatarLarge} />
          <Text style={s.sectionTitle}>{child.name}</Text>
          <Text style={s.small}>{child.xp} XP</Text>
        </Pressable>
      ))}
      <View style={s.card}>
        <Text style={s.sectionTitle}>הרפתקה חדשה</Text>
        <TextInput
          accessibilityLabel="שם הילד או הילדה"
          placeholder="איך קוראים לך?"
          value={name}
          onChangeText={setName}
          maxLength={24}
          style={s.input}
        />
        <View style={s.row}>
          {art.avatars.map((source, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`דמות ${i + 1}`}
              accessibilityState={{ selected: avatar === i }}
              onPress={() => setAvatar(i)}
              style={[
                s.avatarOption,
                avatar === i && {
                  borderColor: c.purple,
                  backgroundColor: "#F0EBFF",
                },
              ]}
            >
              <Image source={source} style={s.avatarLarge} />
            </Pressable>
          ))}
        </View>
        <Button
          label="מתחילים!"
          disabled={!name.trim()}
          onPress={() => {
            const childId = id();
            update((v) => ({
              ...v,
              activeChildId: childId,
              children: [
                ...v.children,
                {
                  id: childId,
                  name: name.trim(),
                  avatar,
                  xp: 0,
                  progress: {},
                  knownWordIds: [],
                },
              ],
            }));
            navigation.navigate("Home");
          }}
        />
      </View>
    </Page>
  );
}
function Play({ navigation }: Props<"Play">) {
  const { state, update } = useStore();
  const [childId] = useState(state.activeChildId);
  const child = state.children.find((x) => x.id === childId)!;
  const draft =
    state.activeSession?.childId === child.id ? state.activeSession : null;
  const [selected] = useState(() =>
    draft
      ? draft.selectedWordIds
          .map((wordId) => words.find((w) => w.id === wordId))
          .filter((w): w is Word => Boolean(w))
      : selectWords(words, child.progress, Date.now(), 15, child.knownWordIds),
  );
  const [newWords] = useState(() =>
    draft
      ? (draft.newWordIds ?? [])
          .map((wordId) => words.find((w) => w.id === wordId))
          .filter((w): w is Word => Boolean(w))
      : selected.filter((w) => !child.progress[w.id]),
  );
  const [discovery, setDiscovery] = useState(draft?.discoveryIndex ?? 0);
  const [questions, setQuestions] = useState(() => questionSequence(selected));
  const [index, setIndex] = useState(draft?.questionIndex ?? 0);
  const [answers, setAnswers] = useState<Answer[]>(draft?.answers ?? []);
  const [chosen, setChosen] = useState<string | null>(null);
  const [sessionId] = useState(draft?.id ?? id);
  const [startedAt] = useState(draft?.startedAt ?? Date.now);
  const timer = useRef(Date.now());
  const locked = useRef(false);
  const [audioError, setAudioError] = useState("");
  const [slowSpeech, setSlowSpeech] = useState(false);
  const q = questions[index];
  const discovering = discovery < newWords.length;
  const word = discovering ? newWords[discovery] : q.word;
  const [options, setOptions] = useState(() => optionsFor(q.word, words));
  useEffect(() => {
    timer.current = Date.now();
    locked.current = false;
    setChosen(null);
    setOptions(optionsFor(q.word, words));
    setAudioError("");
    Speech.stop();
  }, [index, discovery]);
  useEffect(
    () => () => {
      Speech.stop();
    },
    [],
  );
  useEffect(() => {
    if (!draft)
      update((v) => ({
        ...v,
        activeSession: {
          id: sessionId,
          childId: child.id,
          startedAt,
          selectedWordIds: selected.map((w) => w.id),
          newWordIds: newWords.map((w) => w.id),
          questionIndex: 0,
          discoveryIndex: 0,
          answers: [],
        },
      }));
  }, []);
  const speak = (slow = slowSpeech) => {
    Speech.stop();
    Speech.speak(word.english, {
      language: "en-US",
      rate: slow ? 0.55 : 0.85,
      onError: () => setAudioError("הקול לא זמין כרגע במכשיר הזה"),
    });
  };
  const answer = (option: Word) => {
    if (locked.current) return;
    locked.current = true;
    const a: Answer = {
      wordId: q.word.id,
      skill: q.skill,
      correct: option.id === q.word.id,
      responseMs: Date.now() - timer.current,
      chosenId: option.id,
      at: Date.now(),
    };
    setChosen(option.id);
    const nextAnswers = [...answers, a];
    setAnswers(nextAnswers);
    update((v) => ({
      ...recordAnswer(v, child.id, a),
      activeSession: {
        id: sessionId,
        childId: child.id,
        startedAt,
        selectedWordIds: selected.map((w) => w.id),
        newWordIds: newWords.map((w) => w.id),
        questionIndex: index,
        discoveryIndex: discovery,
        answers: nextAnswers,
      },
    }));
    if (!a.correct)
      setQuestions((existing) => [
        ...existing,
        { word: q.word, skill: q.skill },
      ]);
    void Haptics.notificationAsync(
      a.correct
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {});
  };
  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      update((v) =>
        v.activeSession
          ? {
              ...v,
              activeSession: {
                ...v.activeSession,
                questionIndex: index + 1,
                answers,
              },
            }
          : v,
      );
    } else {
      update((v) =>
        completeSession(v, {
          id: sessionId,
          childId: child.id,
          startedAt,
          completedAt: Date.now(),
          answers,
        }),
      );
      navigation.replace("Results", { sessionId });
    }
  };
  return (
    <Page>
      <View style={s.row}>
        <Text style={s.kicker}>
          {discovering
            ? "מגלים מילים חדשות"
            : q.skill === "recognition"
              ? "מאנגלית לעברית"
              : "מעברית לאנגלית"}
        </Text>
        <Text style={s.small}>
          {discovering
            ? `מילה ${discovery + 1} מתוך ${newWords.length}`
            : `שאלה ${index + 1} מתוך ${questions.length}`}
        </Text>
      </View>
      <View style={s.track}>
        <View
          style={[
            s.fill,
            {
              width: `${(discovering ? discovery / (newWords.length + questions.length) : (newWords.length + index) / (newWords.length + questions.length)) * 100}%`,
            },
          ]}
        />
      </View>
      <Heading
        title={discovering ? "נעים להכיר!" : "מה המשמעות?"}
        caption={discovering ? "מילה חדשה למסע שלכם" : "קחו רגע, אתם יכולים"}
      />
      <View style={s.wordCard}>
        <Text style={s.word}>
          {discovering || q.skill === "recognition"
            ? word.english
            : word.hebrew}
        </Text>
        {discovering && (
          <>
            <Text style={s.translation}>{word.hebrew}</Text>
            <Text style={s.example}>{word.example}</Text>
            <Button
              secondary
              label={slowSpeech ? "לשמוע בקצב רגיל" : "לשמוע לאט"}
              onPress={() => {
                const nextSlow = !slowSpeech;
                setSlowSpeech(nextSlow);
                speak(nextSlow);
              }}
            />
            {audioError && <Text style={s.small}>{audioError}</Text>}
          </>
        )}
      </View>
      {discovering ? (
        <>
          <Button
            label="הכרנו! ממשיכים"
            onPress={() => {
              const nextDiscovery = discovery + 1;
              setDiscovery(nextDiscovery);
              update((v) =>
                v.activeSession
                  ? {
                      ...v,
                      activeSession: {
                        ...v.activeSession,
                        discoveryIndex: nextDiscovery,
                      },
                    }
                  : v,
              );
            }}
          />
          <Button
            secondary
            label="אני כבר מכיר/ה את המילה"
            onPress={() => {
              update((v) => setWordKnown(v, child.id, word.id, true));
              const nextDiscovery = discovery + 1;
              setDiscovery(nextDiscovery);
              update((v) =>
                v.activeSession
                  ? {
                      ...v,
                      activeSession: {
                        ...v.activeSession,
                        discoveryIndex: nextDiscovery,
                      },
                    }
                  : v,
              );
            }}
          />
        </>
      ) : (
        <>
          <View style={s.options}>
            {options.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                disabled={chosen !== null}
                onPress={() => answer(option)}
                style={[
                  s.option,
                  chosen !== null && option.id === word.id && s.correct,
                  chosen === option.id && option.id !== word.id && s.wrong,
                ]}
              >
                <Text
                  style={[s.optionText, q.skill === "recall" && s.englishText]}
                >
                  {q.skill === "recognition" ? option.hebrew : option.english}
                </Text>
                {chosen !== null && option.id === word.id && (
                  <Text style={s.small}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
          {chosen !== null && (
            <View accessibilityLiveRegion="polite" style={s.feedback}>
              <Text style={s.sectionTitle}>
                {chosen === word.id ? "כל הכבוד!" : "לומדים גם מטעויות"}
              </Text>
              <Text style={s.translation}>
                <Text style={s.englishText}>{word.english}</Text> ={" "}
                {word.hebrew}
              </Text>
              <Button
                label={
                  index + 1 === questions.length ? "לסיום הסיבוב" : "ממשיכים"
                }
                onPress={next}
              />
            </View>
          )}
        </>
      )}
    </Page>
  );
}
function Results({ navigation, route }: Props<"Results">) {
  const { state } = useStore();
  const session = state.sessions.find((s) => s.id === route.params.sessionId)!;
  const correct = session.answers.filter((a) => a.correct).length;
  return (
    <Page>
      <Image source={art.celebrate} style={s.resultArt} />
      <Heading
        title="עוד צעד גדול במסע!"
        caption="כל סיבוב עוזר למילים להישאר בזיכרון"
      />
      <View style={s.card}>
        <Text style={s.xp}>+{session.xp} XP</Text>
        <Text style={s.translation}>
          {correct} תשובות נכונות מתוך {session.answers.length}
        </Text>
        <Text style={s.small}>
          {new Set(session.answers.map((a) => a.wordId)).size} מילים תרגלנו היום
        </Text>
      </View>
      <Button label="בחזרה להרפתקה" onPress={() => navigation.popToTop()} />
    </Page>
  );
}
function Library() {
  const { state, update } = useStore();
  const child = state.children.find((c) => c.id === state.activeChildId)!;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "known" | "learning" | "new">(
    "all",
  );
  const knownIds = new Set(child.knownWordIds ?? []);
  const visible = words.filter((word) => {
    const matches = `${word.english} ${word.hebrew} ${word.category}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const known = knownIds.has(word.id);
    const learning = Boolean(child.progress[word.id]);
    return (
      matches &&
      (filter === "all" ||
        (filter === "known" && known) ||
        (filter === "learning" && learning && !known) ||
        (filter === "new" && !learning && !known))
    );
  });
  const setKnown = (wordId: string, known: boolean) =>
    update((current) => setWordKnown(current, child.id, wordId, known));
  return (
    <Page>
      <Heading
        title="כל המילים"
        caption={`${words.length} מילים במסע • אפשר לסמן מילה שמכירים כבר`}
      />
      <TextInput
        accessibilityLabel="חיפוש מילים"
        placeholder="חיפוש בעברית או באנגלית"
        value={query}
        onChangeText={setQuery}
        style={s.input}
      />
      <View style={s.filterRow}>
        {(
          [
            ["all", "הכול"],
            ["new", "חדשות"],
            ["learning", "לומדים"],
            ["known", "מכיר/ה"],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === value }}
            onPress={() => setFilter(value)}
            style={[s.filter, filter === value && s.filterSelected]}
          >
            <Text style={s.filterText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {visible.map((word) => {
        const known = knownIds.has(word.id);
        const learning = Boolean(child.progress[word.id]);
        return (
          <View key={word.id} style={s.libraryRow}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[s.libraryWord, s.englishText]}>{word.english}</Text>
              <Text style={s.small}>
                {word.hebrew} • {known ? "כבר מכירים" : learning ? "בלמידה" : "חדשה"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={known ? `להחזיר את ${word.english} ללמידה` : `לסמן שאני מכיר את ${word.english}`}
              onPress={() => setKnown(word.id, !known)}
              style={[s.knownButton, known && s.knownButtonActive]}
            >
              <Text style={s.knownButtonText}>{known ? "להחזיר" : "מכיר/ה"}</Text>
            </Pressable>
          </View>
        );
      })}
      {!visible.length && <Text style={s.subtitle}>לא מצאנו מילים כאלה עדיין.</Text>}
    </Page>
  );
}
function Parent() {
  const { state } = useStore();
  const child = state.children.find((c) => c.id === state.activeChildId)!;
  const progress = Object.values(child.progress);
  const sessions = state.sessions.filter((s) => s.childId === child.id);
  const answers = sessions.flatMap((s) => s.answers);
  return (
    <Page>
      <Heading
        title={`ההתקדמות של ${child.name}`}
        caption="תרגול קטן. התקדמות שאפשר לראות."
      />
      <View style={s.card}>
        <Text style={s.sectionTitle}>{sessions.length} סיבובים הושלמו</Text>
        <Text style={s.translation}>
          {answers.length
            ? Math.round(
                (answers.filter((a) => a.correct).length / answers.length) *
                  100,
              )
            : 0}
          % דיוק בסיבובים שהושלמו
        </Text>
        <Text style={s.small}>
          {progress.length} מילים בתרגול •{" "}
          {progress.filter((p) => mastery(p) >= 80).length} מילים בשליטה
        </Text>
      </View>
      <Text style={s.sectionTitle}>מילים שכדאי לחזק</Text>
      {!progress.length && (
        <Text style={s.subtitle}>אחרי המשחק הראשון תופיע כאן ההתקדמות.</Text>
      )}
      {progress
        .filter((p) => effectiveMastery(p, Date.now()) < 60)
        .sort((a, b) => mastery(a) - mastery(b))
        .slice(0, 10)
        .map((p) => (
          <View key={p.wordId} style={s.progressRow}>
            <Text style={s.translation}>
              {words.find((w) => w.id === p.wordId)?.english}
            </Text>
            <Text style={s.small}>
              זיהוי {p.recognition}% • שליפה {p.recall}%
            </Text>
          </View>
        ))}
      <Text style={s.hint}>
        ההתקדמות נשמרת במכשיר הזה. סנכרון בין מכשירים יתווסף בהמשך.
      </Text>
    </Page>
  );
}
function Shell() {
  const { ready, error, retry } = useStore();
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "he";
    }
  }, []);
  return (
    <>
      <StatusBar style="dark" />
      {error && (
        <SafeAreaView style={s.error}>
          <Text style={s.small}>{error}</Text>
          <Button secondary label="נסו שוב" onPress={retry} />
        </SafeAreaView>
      )}
      {ready ? (
        <NavigationContainer direction="rtl">
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: c.cream },
              headerTintColor: c.ink,
              headerShadowVisible: false,
              contentStyle: { backgroundColor: c.cream },
            }}
          >
            <Stack.Screen
              name="Home"
              component={Home}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Profiles"
              component={Profiles}
              options={{ title: "הפרופילים שלנו" }}
            />
            <Stack.Screen
              name="Play"
              component={Play}
              options={{ title: "זמן לשחק", gestureEnabled: false }}
            />
            <Stack.Screen
              name="Results"
              component={Results}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Parent"
              component={Parent}
              options={{ title: "אזור הורים" }}
            />
            <Stack.Screen
              name="Library"
              component={Library}
              options={{ title: "כל המילים" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      ) : (
        !error && (
          <View style={s.loading}>
            <ActivityIndicator color={c.purple} />
          </View>
        )
      )}
    </>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.cream },
  page: {
    padding: 24,
    gap: 22,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingBottom: 40,
  },
  loading: { flex: 1, justifyContent: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  wordmark: {
    fontSize: 29,
    fontWeight: "900",
    color: c.ink,
    letterSpacing: -1,
    writingDirection: "ltr",
  },
  profile: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  avatar: { width: 38, height: 38 },
  avatarLarge: { width: 70, height: 70 },
  chip: {
    backgroundColor: c.mint,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    alignSelf: "center",
  },
  chipText: { color: c.green, fontWeight: "700", fontSize: 12 },
  heading: { gap: 10 },
  title: {
    fontSize: 30,
    lineHeight: 39,
    fontWeight: "800",
    color: c.ink,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 25,
    color: c.muted,
    textAlign: "center",
  },
  hero: {
    backgroundColor: "#EEE9FD",
    borderRadius: 32,
    padding: 24,
    gap: 16,
    alignItems: "stretch",
    overflow: "hidden",
  },
  heroCircle: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#E1D8FB",
    top: -55,
    alignSelf: "center",
  },
  mascot: {
    width: 210,
    height: 180,
    alignSelf: "center",
    resizeMode: "contain",
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
    color: c.ink,
  },
  button: {
    backgroundColor: c.purple,
    borderRadius: 18,
    minHeight: 56,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: c.white, fontSize: 18, fontWeight: "800" },
  secondary: { backgroundColor: "#EEE9FC" },
  hint: { fontSize: 12, lineHeight: 20, color: c.muted, textAlign: "center" },
  stat: {
    flex: 1,
    backgroundColor: c.white,
    borderColor: c.line,
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    gap: 8,
  },
  statNumber: { fontSize: 25, fontWeight: "800", color: c.purple },
  small: { fontSize: 13, color: c.muted, lineHeight: 20, textAlign: "center" },
  worldCard: {
    backgroundColor: "#EAF5E7",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  world: { width: 100, height: 100, resizeMode: "contain" },
  kicker: {
    fontSize: 12,
    color: c.green,
    fontWeight: "800",
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: c.ink,
    textAlign: "center",
  },
  card: {
    backgroundColor: c.white,
    borderRadius: 24,
    padding: 24,
    gap: 20,
    borderWidth: 1,
    borderColor: c.line,
  },
  input: {
    backgroundColor: c.cream,
    borderRadius: 14,
    padding: 18,
    fontSize: 20,
    textAlign: "right",
    borderWidth: 1,
    borderColor: c.line,
    color: c.ink,
    writingDirection: "rtl",
  },
  avatarOption: {
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 20,
    padding: 4,
  },
  profileChoice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.white,
    borderRadius: 20,
    padding: 16,
  },
  track: {
    height: 8,
    backgroundColor: c.line,
    borderRadius: 8,
    overflow: "hidden",
  },
  fill: { height: 8, backgroundColor: c.purple },
  wordCard: {
    backgroundColor: c.white,
    borderRadius: 28,
    minHeight: 190,
    justifyContent: "center",
    padding: 24,
    gap: 22,
    borderWidth: 1,
    borderColor: c.line,
  },
  word: { fontSize: 44, fontWeight: "800", textAlign: "center", color: c.ink },
  translation: {
    fontSize: 21,
    textAlign: "center",
    color: c.ink,
    writingDirection: "rtl",
  },
  englishText: { writingDirection: "ltr" },
  numberText: { writingDirection: "ltr" },
  example: {
    fontSize: 17,
    textAlign: "center",
    color: c.muted,
    lineHeight: 26,
    writingDirection: "ltr",
  },
  options: { gap: 12 },
  option: {
    borderWidth: 2,
    borderColor: c.line,
    backgroundColor: c.white,
    borderRadius: 18,
    minHeight: 64,
    padding: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  optionText: { fontSize: 23, color: c.ink, fontWeight: "600" },
  correct: { backgroundColor: "#E5F6EB", borderColor: "#62B583" },
  wrong: { backgroundColor: "#FFF0E9", borderColor: "#DBA588" },
  feedback: { gap: 16, padding: 16 },
  resultArt: {
    width: 230,
    height: 230,
    resizeMode: "contain",
    alignSelf: "center",
  },
  xp: { fontSize: 48, color: c.purple, fontWeight: "900", textAlign: "center" },
  progressRow: {
    padding: 20,
    backgroundColor: c.white,
    borderRadius: 16,
    gap: 10,
  },
  filterRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  filter: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.white,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  filterSelected: { backgroundColor: "#EEE9FC", borderColor: c.purple },
  filterText: { color: c.ink, fontWeight: "700", fontSize: 13 },
  libraryRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: c.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.line,
  },
  libraryWord: { fontSize: 21, fontWeight: "800", color: c.ink },
  knownButton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#E8F8EF",
  },
  knownButtonActive: { backgroundColor: "#FFF1D7" },
  knownButtonText: { color: c.green, fontWeight: "800", fontSize: 12 },
  error: { backgroundColor: "#FFF0E9", padding: 12, gap: 8 },
});
