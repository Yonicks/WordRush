import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState as NativeAppState,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer, useIsFocused } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Pronunciation } from "./src/audio/Pronunciation";
import { DailyRing } from "./src/ui/DailyRing";
import { pictures } from "./src/data/pictures";
import {
  createDraft,
  dailyActivity,
  recordActivity,
  skipDiscoveryWord,
} from "./src/engine/session";
import * as Haptics from "expo-haptics";
import { StoreProvider, useStore } from "./src/state/store";
import {
  completeSession,
  submitSessionAnswer,
  advanceSession,
  setWordKnown,
} from "./src/state/model";
import { effectiveMastery, mastery } from "./src/engine/learning";
import type { Word } from "./src/engine/types";
import seed from "./src/data/words.json";
import { categoryNames } from "./src/data/categories";
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
  const due = progress.filter(
    (p) =>
      !(child.knownWordIds ?? []).includes(p.wordId) &&
      p.nextReviewAt <= Date.now(),
  ).length;
  const daily = dailyActivity(state, child.id, Date.now());
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
      <DailyRing
        count={daily.wordIds.length}
        minutes={Math.floor(daily.activeMs / 60000)}
      />
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
            {words.length}
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
  const focused = useIsFocused();
  const child = state.children.find((c) => c.id === state.activeChildId)!;
  const draft =
    state.activeSession?.childId === child.id ? state.activeSession : null;
  const timer = useRef(Date.now());
  const [heard, setHeard] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [keepGoing, setKeepGoing] = useState(false);
  const ending = useRef(false);
  useEffect(() => {
    if (!draft)
      update((s) => {
        const previous = s.activeSession;
        const base = previous
          ? completeSession(s, {
              id: previous.id,
              childId: previous.childId,
              startedAt: previous.startedAt,
              completedAt: Date.now(),
              answers: previous.answers,
              activityByDay: previous.activityByDay,
              endedEarly: true,
            })
          : s;
        return {
          ...base,
          activeSession: createDraft(base, words, id(), Date.now()),
        };
      });
  }, []);
  const discovering = !!draft && draft.discoveryIndex < draft.newWordIds.length;
  const q = draft?.queue[draft.questionIndex];
  const wordId = discovering
    ? draft!.newWordIds[draft!.discoveryIndex]
    : q?.wordId;
  const word = words.find((w) => w.id === wordId);
  useEffect(() => {
    timer.current = Date.now();
    setHeard(false);
  }, [draft?.questionIndex, draft?.discoveryIndex, wordId]);
  useEffect(() => {
    if (!focused) return;
    let last = Date.now();
    let active = NativeAppState.currentState === "active";
    const tick = () => {
      const at = Date.now();
      const from = last;
      last = at;
      setNow(at);
      if (active)
        update((s) =>
          s.activeSession?.childId === child.id
            ? { ...s, activeSession: recordActivity(s.activeSession, from, at) }
            : s,
        );
    };
    const interval = setInterval(tick, 1000);
    const subscription = NativeAppState.addEventListener("change", (status) => {
      tick();
      active = status === "active";
      last = Date.now();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
      tick();
    };
  }, [focused, child.id]);
  if (!draft)
    return (
      <Page>
        <ActivityIndicator />
      </Page>
    );
  const daily = dailyActivity(state, child.id, now);
  const finish = (early: boolean) => {
    if (ending.current) return;
    ending.current = true;
    update((s) =>
      s.activeSession
        ? completeSession(s, {
            id: draft.id,
            childId: child.id,
            startedAt: draft.startedAt,
            completedAt: Date.now(),
            answers: s.activeSession.answers,
            activityByDay: s.activeSession.activityByDay,
            endedEarly: early,
          })
        : s,
    );
    navigation.replace("Results", { sessionId: draft.id });
  };
  if (!word || !q)
    return (
      <Page>
        <Heading
          title="כל הכבוד על הדרך!"
          caption="אין עוד מילים בסיבוב הזה. אפשר לנוח ולחזור בהמשך."
        />
        <Button label="לסיכום" onPress={() => finish(false)} />
      </Page>
    );
  const chosen = draft.chosenId;
  const options = q.optionIds.map((id) => words.find((w) => w.id === id)!);
  const picture =
    q.mode === "picture" && word.imageId && pictures[word.imageId];
  const hint = draft.hintUsed;
  const answer = (option: Word) => {
    update((s) =>
      submitSessionAnswer(s, option.id, Date.now() - timer.current, Date.now()),
    );
    void Haptics.notificationAsync(
      option.id === word.id
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {});
  };
  const discoverNext = () =>
    update((s) =>
      s.activeSession
        ? {
            ...s,
            activeSession: {
              ...s.activeSession,
              discoveryIndex: s.activeSession.discoveryIndex + 1,
            },
          }
        : s,
    );
  return (
    <Page>
      <View style={s.row}>
        <Text style={s.kicker}>
          {discovering
            ? "מגלים מילים חדשות"
            : q.retry
              ? "עוד הזדמנות, עם עזרה"
              : q.mode === "listening"
                ? "מקשיבים ומגלים"
                : picture
                  ? "מגלים בתמונות"
                  : q.skill === "recognition"
                    ? "מאנגלית לעברית"
                    : "מעברית לאנגלית"}
        </Text>
        <Text style={s.small}>
          {discovering
            ? `מילה ${draft.discoveryIndex + 1} מתוך ${draft.newWordIds.length}`
            : `שאלה ${draft.questionIndex + 1} מתוך ${draft.queue.length}`}
        </Text>
      </View>
      <View style={s.track}>
        <View
          style={[
            s.fill,
            {
              width: `${Math.min(100, ((draft.discoveryIndex + draft.questionIndex) / (draft.newWordIds.length + draft.queue.length)) * 100)}%`,
            },
          ]}
        />
      </View>
      <Text style={s.small}>
        {daily.wordIds.length}/10 מילים היום •{" "}
        {Math.floor(daily.activeMs / 60000)} דקות • אפשר לסיים בכל רגע
      </Text>
      {daily.complete && !keepGoing && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>עשיתם דרך יפה היום!</Text>
          <Text style={s.small}>אפשר לנוח עכשיו, או להמשיך בקצב שלכם.</Text>
          <Button label="לסיים להיום" onPress={() => finish(true)} />
          <Button
            secondary
            label="עוד קצת"
            onPress={() => setKeepGoing(true)}
          />
        </View>
      )}
      <Heading
        title={
          discovering
            ? "נעים להכיר!"
            : q.mode === "listening"
              ? "איזו מילה שמעתם?"
              : picture
                ? "איך אומרים את זה באנגלית?"
                : "מה המשמעות?"
        }
        caption="קחו את הזמן. לומדים גם מטעויות."
      />
      <View style={s.wordCard}>
        {(discovering || picture) && word.imageId && pictures[word.imageId] && (
          <Image
            source={pictures[word.imageId]}
            accessibilityLabel={
              discovering ? word.hebrew : "תמונה לזיהוי; אפשר לעבור לשאלה כתובה"
            }
            style={{ width: 130, height: 130, resizeMode: "contain" }}
          />
        )}
        {(discovering ||
          (q.mode === "text" && !picture) ||
          chosen !== null ||
          hint) && (
          <Text
            style={[
              s.word,
              (discovering || q.skill === "recognition") && s.englishText,
            ]}
          >
            {discovering || q.skill === "recognition"
              ? word.english
              : word.hebrew}
          </Text>
        )}
        {discovering && (
          <>
            <Text style={s.translation}>{word.hebrew}</Text>
            <Text style={s.example}>{word.example}</Text>
          </>
        )}
        {(discovering || q.mode === "listening" || chosen !== null || hint) && (
          <Pronunciation
            key={word.id}
            wordId={word.id}
            onHeard={() => setHeard(true)}
          />
        )}
        {!discovering && q.mode !== "text" && chosen === null && (
          <Button
            secondary
            label="לעבור לשאלה כתובה"
            onPress={() =>
              update((s) =>
                s.activeSession
                  ? {
                      ...s,
                      activeSession: {
                        ...s.activeSession,
                        queue: s.activeSession.queue.map((item, i) =>
                          i === s.activeSession!.questionIndex
                            ? { ...item, mode: "text" }
                            : item,
                        ),
                      },
                    }
                  : s,
              )
            }
          />
        )}
      </View>
      {discovering ? (
        <>
          <Button label="הכרנו! ממשיכים" onPress={discoverNext} />
          <Button
            secondary
            label="אני כבר מכיר/ה את המילה"
            onPress={() =>
              update((s) => ({
                ...setWordKnown(s, child.id, word.id, true),
                activeSession: s.activeSession
                  ? skipDiscoveryWord(s.activeSession)
                  : null,
              }))
            }
          />
        </>
      ) : (
        <>
          {chosen === null && q.retry && (
            <Text style={s.hint}>
              אפשר לבקש רמז. זו ההזדמנות האחרונה לשאלה הזאת היום.
            </Text>
          )}
          {hint && (
            <Text accessibilityLiveRegion="polite" style={s.translation}>
              {word.english} = {word.hebrew}
            </Text>
          )}
          <View style={s.options}>
            {options.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                disabled={
                  chosen !== null || (q.mode === "listening" && !heard && !hint)
                }
                onPress={() => answer(option)}
                style={[
                  s.option,
                  chosen !== null && option.id === word.id && s.correct,
                  chosen === option.id && option.id !== word.id && s.wrong,
                  {
                    opacity:
                      q.mode === "listening" && !heard && !hint ? 0.6 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    s.optionText,
                    (q.skill === "recall" || !!picture) && s.englishText,
                  ]}
                >
                  {q.skill === "recognition" && !picture
                    ? option.hebrew
                    : option.english}
                </Text>
              </Pressable>
            ))}
          </View>
          {chosen === null && (
            <Button
              secondary
              label="אפשר רמז?"
              onPress={() =>
                update((s) =>
                  s.activeSession
                    ? {
                        ...s,
                        activeSession: { ...s.activeSession, hintUsed: true },
                      }
                    : s,
                )
              }
            />
          )}
          {chosen !== null && (
            <View accessibilityLiveRegion="polite" style={s.feedback}>
              <Text style={s.sectionTitle}>
                {chosen === word.id
                  ? "כל הכבוד!"
                  : q.retry
                    ? "נתרגל שוב ביום אחר. כל ניסיון עוזר!"
                    : "לומדים גם מטעויות"}
              </Text>
              <Text style={s.translation}>
                {word.english} = {word.hebrew}
              </Text>
              <Button
                label={
                  draft.questionIndex + 1 === draft.queue.length
                    ? "לסיום הסיבוב"
                    : "ממשיכים"
                }
                onPress={() =>
                  draft.questionIndex + 1 === draft.queue.length
                    ? finish(false)
                    : update(advanceSession)
                }
              />
            </View>
          )}
        </>
      )}
      <Button secondary label="לסיים לעכשיו" onPress={() => finish(true)} />
    </Page>
  );
}
function Results({ navigation, route }: Props<"Results">) {
  const { state } = useStore();
  const session = state.sessions.find((s) => s.id === route.params.sessionId)!;
  const correct = session.answers.filter((a) => a.correct).length;
  const daily = dailyActivity(state, session.childId, Date.now());
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
          {new Set(session.answers.map((a) => a.wordId)).size} מילים תרגלנו
          בסיבוב
        </Text>
      </View>
      {session.endedEarly && (
        <Text style={s.hint}>
          גם סיבוב קצר מקדם אותנו. ההתקדמות שלכם נשמרה.
        </Text>
      )}
      <DailyRing
        count={daily.wordIds.length}
        minutes={Math.floor(daily.activeMs / 60000)}
      />
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
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState(0);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [shown, setShown] = useState(30);
  const [undo, setUndo] = useState<{ wordId: string; known: boolean } | null>(
    null,
  );
  useEffect(() => {
    setShown(30);
    setPreviewId(null);
  }, [query, filter, category, level]);
  const knownIds = new Set(child.knownWordIds ?? []);
  const visible = words.filter((word) => {
    const matches =
      `${word.english} ${word.hebrew} ${categoryNames[word.category]}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
    const known = knownIds.has(word.id);
    const learning = Boolean(child.progress[word.id]);
    return (
      matches &&
      (category === "all" || word.category === category) &&
      (!level || word.difficulty === level) &&
      (filter === "all" ||
        (filter === "known" && known) ||
        (filter === "learning" && learning && !known) ||
        (filter === "new" && !learning && !known))
    );
  });
  const setKnown = (wordId: string, known: boolean) => {
    setUndo({ wordId, known: knownIds.has(wordId) });
    update((current) => setWordKnown(current, child.id, wordId, known));
  };
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
      <Text style={s.sectionTitle}>קטגוריה</Text>
      <ScrollView
        horizontal
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
      >
        {[["all", "כל הקטגוריות"], ...Object.entries(categoryNames)].map(
          ([key, label]) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: category === key }}
              onPress={() => setCategory(key)}
              style={[s.filter, category === key && s.filterSelected]}
            >
              <Text style={s.filterText}>{label}</Text>
            </Pressable>
          ),
        )}
      </ScrollView>
      <Text style={s.sectionTitle}>רמה</Text>
      <View style={s.filterRow}>
        {[0, 1, 2, 3].map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: level === value }}
            onPress={() => setLevel(value)}
            style={[s.filter, level === value && s.filterSelected]}
          >
            <Text style={s.filterText}>
              {value === 0 ? "כל הרמות" : `רמה ${value}`}
            </Text>
          </Pressable>
        ))}
      </View>
      {undo && (
        <View accessibilityLiveRegion="polite" style={s.card}>
          <Text style={s.small}>הרשימה עודכנה</Text>
          <Button
            secondary
            label="ביטול השינוי האחרון"
            onPress={() => {
              update((current) =>
                setWordKnown(current, child.id, undo.wordId, undo.known),
              );
              setUndo(null);
            }}
          />
        </View>
      )}
      <Text style={s.small}>{visible.length} מילים מתאימות</Text>
      {visible.slice(0, shown).map((word) => {
        const known = knownIds.has(word.id);
        const learning = Boolean(child.progress[word.id]);
        return (
          <View key={word.id} style={[s.card, { padding: 14, gap: 8 }]}>
            <View style={s.libraryRow}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[s.libraryWord, s.englishText]}>
                  {word.english}
                </Text>
                <Text style={s.small}>
                  {word.hebrew} •{" "}
                  {known
                    ? "כבר מכירים"
                    : learning
                      ? effectiveMastery(child.progress[word.id], Date.now()) >=
                        80
                        ? "בשליטה"
                        : child.progress[word.id].nextReviewAt <= Date.now()
                          ? "זמן לחזרה"
                          : "בלמידה"
                      : "חדשה"}{" "}
                  • {categoryNames[word.category]} • רמה {word.difficulty}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  known
                    ? `להחזיר את ${word.english} ללמידה`
                    : `לסמן שאני מכיר את ${word.english}`
                }
                onPress={() => setKnown(word.id, !known)}
                style={[s.knownButton, known && s.knownButtonActive]}
              >
                <Text style={s.knownButtonText}>
                  {known ? "להחזיר" : "מכיר/ה"}
                </Text>
              </Pressable>
            </View>
            <Button
              secondary
              label={
                previewId === word.id ? "לסגור תצוגה" : "תמונה, משפט והגייה"
              }
              onPress={() =>
                setPreviewId(previewId === word.id ? null : word.id)
              }
            />
            {previewId === word.id && (
              <View style={{ gap: 12, alignItems: "center" }}>
                {word.imageId && (
                  <Image
                    source={pictures[word.imageId]}
                    accessibilityLabel={word.hebrew}
                    style={{ width: 110, height: 110, resizeMode: "contain" }}
                  />
                )}
                <Text style={s.example}>{word.example}</Text>
                <Pronunciation wordId={word.id} />
              </View>
            )}
          </View>
        );
      })}
      {shown < visible.length && (
        <Button
          secondary
          label="עוד מילים"
          onPress={() => setShown((n) => n + 30)}
        />
      )}
      {!visible.length && (
        <Text style={s.subtitle}>לא מצאנו מילים כאלה עדיין.</Text>
      )}
    </Page>
  );
}
function Parent() {
  const { state } = useStore();
  const child = state.children.find((c) => c.id === state.activeChildId)!;
  const progress = Object.values(child.progress);
  const sessions = state.sessions.filter((s) => s.childId === child.id);
  const answers = sessions.flatMap((s) => s.answers);
  const daily = dailyActivity(state, child.id, Date.now());
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
      <DailyRing
        count={daily.wordIds.length}
        minutes={Math.floor(daily.activeMs / 60000)}
      />
      <Text style={s.small}>
        {child.knownWordIds?.length ?? 0} מילים סומנו כמוכרות • סימון עצמי אינו
        מדד שליטה
      </Text>
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
    direction: "rtl",
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
    flexDirection: "row",
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
  profile: { flexDirection: "row", alignItems: "center", gap: 8 },
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
    flexDirection: "row",
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
  fill: { height: 8, backgroundColor: c.purple, alignSelf: "flex-end" },
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
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
    flexDirection: "row",
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
