import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Child } from "../engine/types";
import { DailyRing } from "./DailyRing";
import { art, colors as c } from "./theme";

type Props = {
  child: Child;
  due: number;
  practiced: number;
  mastered: number;
  totalWords: number;
  dailyCount: number;
  dailyMinutes: number;
  hasDraft: boolean;
  onPlay: () => void;
  onProfiles: () => void;
  onLibrary: () => void;
  onParent: () => void;
};

export function HomeScreen({
  child,
  due,
  practiced,
  mastered,
  totalWords,
  dailyCount,
  dailyMinutes,
  hasDraft,
  onPlay,
  onProfiles,
  onLibrary,
  onParent,
}: Props) {
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 1000 && fontScale < 1.5;
  const roomy = width >= 600 && fontScale < 1.5;
  const worldPercent = totalWords
    ? Math.min(100, Math.round((mastered / totalWords) * 100))
    : 0;
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={[s.page, roomy && s.pageRoomy]}>
          <View style={s.header}>
            <Text style={s.wordmark} accessibilityLabel="WordRush">
              Word<Text style={s.purple}>Rush</Text>
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`החלפת פרופיל, ${child.name}`}
              onPress={onProfiles}
              style={({ pressed }) => [s.profile, pressed && s.pressed]}
            >
              <Image source={art.avatars[child.avatar]} style={s.avatar} />
              <Text numberOfLines={1} style={s.profileName}>
                {child.name}
              </Text>
              <Text accessibilityElementsHidden style={s.profileChevron}>
                ⌄
              </Text>
            </Pressable>
          </View>

          <View style={s.greeting}>
            <Text
              accessibilityRole="header"
              style={[s.greetingTitle, roomy && s.greetingTitleWide]}
            >{`היי ${child.name}, מוכנים לשחק?`}</Text>
            <Text style={s.body}>עוד כמה מילים. עוד עולם שלם לגלות.</Text>
          </View>

          <View style={[s.main, wide && s.mainWide]}>
            <View style={[s.hero, wide && s.heroWide]}>
              <View style={[s.heroInner, roomy && s.heroInnerWide]}>
                <View style={s.heroCopy}>
                  <View style={s.chip}>
                    <Text style={s.chipText}>ההרפתקה הקטנה של היום</Text>
                  </View>
                  <Text
                    accessibilityRole="header"
                    style={[s.heroTitle, roomy && s.heroTitleWide]}
                  >
                    מילים קטנות,{"\n"}הרפתקה גדולה
                  </Text>
                  <Text style={s.heroSubtitle}>
                    לומדים אנגלית, צעד קטן בכל יום.{"\n"}ההרפתקה הבאה שלכם
                    מתחילה כאן.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={onPlay}
                    style={({ pressed }) => [s.play, pressed && s.playPressed]}
                  >
                    <Text style={s.playText}>
                      {hasDraft ? "ממשיכים לשחק" : "בואו נשחק"}
                    </Text>
                    <Text style={s.playArrow} aria-hidden>
                      ←
                    </Text>
                  </Pressable>
                  <Text style={s.hint}>סיבוב קצר · בקצב שלכם</Text>
                </View>
                <View
                  style={[s.heroArt, roomy && s.heroArtWide]}
                  pointerEvents="none"
                  aria-hidden
                >
                  <View style={s.halo} />
                  <Text style={s.sparkleOne}>✦</Text>
                  <Text style={s.sparkleTwo}>✧</Text>
                  <Image
                    source={art.mascot}
                    style={[s.mascot, roomy && s.mascotWide]}
                  />
                  <View style={s.artLabel}>
                    <Text style={s.artLabelText}>כל מילה היא צעד קדימה</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={[s.daily, wide && s.dailyWide]}>
              <View style={s.dailyHeading}>
                <Text accessibilityRole="header" style={s.sectionTitle}>
                  ההתקדמות של היום
                </Text>
                <Text style={s.eyebrow}>כל צעד קטן נחשב</Text>
              </View>
              <DailyRing count={dailyCount} minutes={dailyMinutes} />
              <View style={s.dailyNote}>
                <Text style={s.dailyNoteText}>
                  {dailyCount >= 10 || dailyMinutes >= 10
                    ? "כל הכבוד! ההרפתקה תחכה לכם גם מחר"
                    : dailyCount > 0
                      ? "כבר יצאתם לדרך. ממשיכים בקצב שלכם!"
                      : "מילה ראשונה, צעד ראשון. יוצאים לדרך?"}
                </Text>
              </View>
            </View>
          </View>

          <View style={[s.stats, fontScale >= 1.5 && s.statsStacked]}>
            {[
              {
                value: child.xp,
                label: "נקודות XP",
                mark: "✦",
                color: c.purple,
                bg: "#EEE9FD",
              },
              {
                value: practiced,
                label: "מילים שתרגלנו",
                mark: "א",
                color: c.green,
                bg: c.mint,
              },
              {
                value: due,
                label: "מילים לחזרה",
                mark: "↻",
                color: "#976322",
                bg: "#FFF3DA",
              },
            ].map((stat) => (
              <View key={stat.label} style={[s.stat, roomy && s.statWide]}>
                <View
                  style={[s.statIcon, { backgroundColor: stat.bg }]}
                  aria-hidden
                >
                  <Text style={[s.statIconText, { color: stat.color }]}>
                    {stat.mark}
                  </Text>
                </View>
                <View style={s.statCopy}>
                  <Text style={s.statNumber}>{stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[s.worldCard, roomy && s.worldCardWide]}>
            <View style={[s.worldArt, roomy && s.worldArtWide]} aria-hidden>
              <View style={s.worldHalo} />
              <Image
                source={art.world}
                style={[s.worldImage, roomy && s.worldImageWide]}
              />
            </View>
            <View style={s.worldCopy}>
              <Text style={s.worldKicker}>העולם הראשון · המסע שלכם</Text>
              <Text accessibilityRole="header" style={s.worldTitle}>
                מתחילים לגלות
              </Text>
              <Text style={s.worldDescription}>
                מילה אחרי מילה, העולם נפתח בפניכם.
              </Text>
              <View style={s.progressLabels}>
                <Text style={s.progressLabel}>
                  {mastered} מילים בשליטה מתוך {totalWords}
                </Text>
                <Text style={s.progressPercent}>{worldPercent}%</Text>
              </View>
              <View
                style={s.track}
                accessibilityRole="progressbar"
                accessibilityLabel="מילים בשליטה בעולם הראשון"
                accessibilityValue={{ min: 0, max: totalWords, now: mastered }}
              >
                <View style={[s.fill, { width: `${worldPercent}%` }]} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="ממשיכים במסע, כניסה למשחק"
                onPress={onPlay}
                style={({ pressed }) => [s.worldAction, pressed && s.pressed]}
              >
                <Text style={s.worldActionText}>ממשיכים במסע</Text>
                <Text style={s.worldActionText} aria-hidden>
                  ←
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={s.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={onLibrary}
              style={({ pressed }) => [s.libraryLink, pressed && s.pressed]}
            >
              <Text style={s.libraryText}>כל המילים שלי</Text>
              <Text style={s.libraryText} aria-hidden>
                ←
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onParent}
              style={({ pressed }) => [s.parentLink, pressed && s.pressed]}
            >
              <Text style={s.parentText}>אזור הורים</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.cream },
  scroll: { flexGrow: 1 },
  page: {
    width: "100%",
    maxWidth: 1320,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 32,
    gap: 20,
    direction: "rtl",
  },
  pageRoomy: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: c.line,
  },
  wordmark: {
    fontSize: 29,
    fontWeight: "800",
    color: c.ink,
    writingDirection: "ltr",
  },
  purple: { color: c.purple },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "55%",
    minHeight: 48,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 24,
    backgroundColor: c.white,
  },
  avatar: { width: 36, height: 40, resizeMode: "contain" },
  profileName: { color: c.ink, fontSize: 15, fontWeight: "700", flexShrink: 1 },
  profileChevron: { color: c.muted, fontSize: 19 },
  greeting: { gap: 8, paddingVertical: 6 },
  greetingTitle: {
    fontSize: 26,
    lineHeight: 36,
    color: c.ink,
    fontWeight: "800",
    textAlign: "right",
    writingDirection: "rtl",
  },
  greetingTitleWide: { fontSize: 34, lineHeight: 44 },
  body: { color: "#596984", fontSize: 16, lineHeight: 25, textAlign: "right" },
  main: { gap: 20 },
  mainWide: { flexDirection: "row", alignItems: "stretch" },
  hero: {
    backgroundColor: "#EEE9FD",
    borderWidth: 1,
    borderColor: "#E1D9F8",
    borderRadius: 28,
    padding: 24,
    overflow: "hidden",
  },
  heroWide: { flex: 1, justifyContent: "center", padding: 32 },
  heroInner: {
    flexDirection: "column-reverse",
    alignItems: "stretch",
    gap: 20,
  },
  heroInnerWide: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroCopy: { flex: 1, gap: 16 },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: c.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { color: "#6246BF", fontSize: 12, fontWeight: "700" },
  heroTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "800",
    color: c.ink,
    textAlign: "right",
  },
  heroTitleWide: { fontSize: 40, lineHeight: 49 },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 26,
    color: "#596581",
    textAlign: "right",
  },
  play: {
    backgroundColor: c.purple,
    borderRadius: 16,
    minHeight: 58,
    paddingHorizontal: 22,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    borderBottomWidth: 4,
    borderBottomColor: "#5940B5",
    marginTop: 6,
  },
  playText: { fontSize: 19, fontWeight: "800", color: c.white },
  playArrow: { fontSize: 25, color: c.white },
  playPressed: { opacity: 0.85, transform: [{ translateY: 2 }] },
  hint: { fontSize: 13, color: "#655C83", textAlign: "center" },
  heroArt: { alignItems: "center", justifyContent: "center", minHeight: 160 },
  heroArtWide: { width: "40%", minHeight: 280 },
  halo: {
    position: "absolute",
    width: "100%",
    maxWidth: 250,
    aspectRatio: 1,
    borderRadius: 150,
    backgroundColor: "#E0D6FA",
  },
  mascot: { width: 170, height: 150, resizeMode: "contain" },
  mascotWide: { width: "115%", height: 245 },
  sparkleOne: {
    position: "absolute",
    left: 8,
    top: 28,
    color: "#A28ADC",
    fontSize: 30,
  },
  sparkleTwo: {
    position: "absolute",
    right: 10,
    bottom: 50,
    color: "#9174D2",
    fontSize: 34,
  },
  artLabel: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8F5FF",
    transform: [{ rotate: "-4deg" }],
  },
  artLabelText: { color: "#655488", fontSize: 12, fontWeight: "700" },
  daily: {
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 28,
    padding: 24,
    gap: 24,
    justifyContent: "space-between",
  },
  dailyWide: { width: 300 },
  dailyHeading: { gap: 7 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: c.ink,
    textAlign: "center",
  },
  eyebrow: { fontSize: 13, color: "#596984", textAlign: "center" },
  dailyNote: { padding: 12, borderRadius: 14, backgroundColor: "#F7F5FD" },
  dailyNoteText: {
    color: "#655488",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },
  stats: { flexDirection: "row", gap: 10 },
  statsStacked: { flexDirection: "column" },
  stat: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 20,
    backgroundColor: c.white,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 10,
  },
  statWide: { flexDirection: "row", padding: 20, gap: 16 },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconText: { fontSize: 23, fontWeight: "700" },
  statCopy: { gap: 3, flexShrink: 1 },
  statNumber: {
    color: c.ink,
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
  },
  statLabel: {
    color: "#596984",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  worldCard: {
    borderRadius: 28,
    backgroundColor: "#EAF5E7",
    borderWidth: 1,
    borderColor: "#D9E9D4",
    padding: 24,
    gap: 16,
    overflow: "hidden",
  },
  worldCardWide: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 36,
    gap: 36,
  },
  worldArt: { alignItems: "center", justifyContent: "center" },
  worldArtWide: { width: 200 },
  worldHalo: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 90,
    backgroundColor: "#DCEED3",
  },
  worldImage: { width: 160, height: 150, resizeMode: "contain" },
  worldImageWide: { width: 200, height: 200 },
  worldCopy: { flex: 1, gap: 10 },
  worldKicker: {
    color: c.green,
    fontWeight: "700",
    fontSize: 12,
    textAlign: "right",
  },
  worldTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "800",
    color: c.ink,
    textAlign: "right",
  },
  worldDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: "#4C6B50",
    textAlign: "right",
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },
  progressLabel: {
    color: "#4C6B50",
    fontSize: 13,
    lineHeight: 21,
    flexShrink: 1,
    textAlign: "right",
  },
  progressPercent: { color: c.green, fontSize: 13, fontWeight: "800" },
  track: {
    height: 10,
    backgroundColor: "#D5E5CF",
    borderRadius: 8,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: c.green, borderRadius: 8 },
  worldAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 48,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFFB3",
    borderRadius: 12,
    marginTop: 4,
  },
  worldActionText: { color: c.green, fontSize: 15, fontWeight: "800" },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  libraryLink: {
    flexDirection: "row",
    gap: 24,
    backgroundColor: "#EEE9FD",
    borderRadius: 14,
    paddingHorizontal: 20,
    minHeight: 50,
    alignItems: "center",
  },
  libraryText: { color: "#6246BF", fontWeight: "700", fontSize: 15 },
  parentLink: {
    minHeight: 48,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  parentText: {
    color: "#596984",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  pressed: { opacity: 0.65 },
});
