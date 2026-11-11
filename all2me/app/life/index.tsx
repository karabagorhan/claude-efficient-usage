import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Header, PastelCard, Screen, SectionHeader, Spacer, Txt } from '../../src/components/ui';
import { pickMessage, type MsgKind, type MsgTone } from '../../src/data/lifeMessages';
import { dayKeyOf } from '../../src/engine/dates';
import { choreCounts, choresTone, mealsTone, reductionLimit, smokeTone, weekCounts, weeklyChoreScore } from '../../src/features/life/calc';
import { MessageCard } from '../../src/features/life/ui';
import { useGrowthSummary } from '../../src/features/growth/summary';
import { useStudySummary } from '../../src/features/study/summary';
import { L, fmtDay, useLang, useT } from '../../src/i18n';
import { routes } from '../../src/lib/routes';
import { useChores } from '../../src/store/slices/chores';
import { useMeals } from '../../src/store/slices/meals';
import { useSmoke } from '../../src/store/slices/smoke';

export default function LifeHub() {
  const t = useT();
  const lang = useLang();
  const day = dayKeyOf();

  const plan = useSmoke((s) => s.plan);
  const smokeLogs = useSmoke((s) => s.logs);
  const mealEntries = useMeals((s) => s.entries);
  const goal = useMeals((s) => s.goal);
  const chores = useChores((s) => s.chores);
  const history = useChores((s) => s.history);
  const study = useStudySummary();
  const growth = useGrowthSummary();

  const smokeCount = useMemo(() => Object.values(smokeLogs).filter((l) => l.dayKey === day).length, [smokeLogs, day]);
  const limit = plan ? reductionLimit(plan, day) : 0;
  const counts = useMemo(() => weekCounts(Object.values(mealEntries), day), [mealEntries, day]);
  const choreList = useMemo(() => Object.values(chores), [chores]);
  const cc = useMemo(() => choreCounts(choreList, day), [choreList, day]);
  const score = useMemo(() => weeklyChoreScore(choreList, Object.values(history), day).score, [choreList, history, day]);

  // günün mesajı: gün anahtarına göre takipçiler arasında döner; ton o takipçinin ilerlemesinden gelir
  const options: Array<{ kind: MsgKind; tone: MsgTone }> = [];
  if (plan) options.push({ kind: 'smoke', tone: smokeTone(smokeCount, limit) });
  options.push({ kind: 'meals', tone: mealsTone(counts, goal) });
  options.push({ kind: 'chores', tone: choresTone(score, cc.overdue) });
  const seed = Number(day.replace(/-/g, '')) % options.length;
  const pick = options[seed];
  const msg = L(pickMessage(pick.kind, pick.tone, day), lang);

  const next = study.next[0];
  const choreLine = cc.overdue > 0 ? t('life.hub.chores.overdue', { n: cc.overdue, m: cc.today }) : t('life.hub.chores.today', { n: cc.today });

  return (
    <Screen header={<Header title={t('life.hub.title')} subtitle={fmtDay(day, lang)} large />}>
      <PastelCard emoji="📊" pastel="blue" overline={t('report.card.title')} title={t('report.link')} onPress={() => router.push(routes.report())} />
      <MessageCard text={msg} pastel="yellow" emoji="✨" />
      <Spacer h={16} />

      <PastelCard
        emoji="🚭"
        pastel="mint"
        overline={t('life.hub.smoke.title')}
        title={plan ? t('life.hub.smoke.today', { n: smokeCount, limit }) : t('life.hub.smoke.setup')}
        onPress={() => router.push(routes.life('smoke'))}
      />
      <PastelCard
        emoji="🍲"
        pastel="peach"
        overline={t('life.hub.meals.title')}
        title={t('life.hub.meals.week', { home: counts.home, fast: counts.fast })}
        onPress={() => router.push(routes.life('meals'))}
      />
      <PastelCard emoji="🧺" pastel="blue" overline={t('life.hub.chores.title')} title={choreLine} onPress={() => router.push(routes.life('chores'))} />

      <SectionHeader title={t('life.hub.more')} />
      <PastelCard
        emoji="🎓"
        pastel="purple"
        overline={t('life.hub.study.title')}
        title={
          study.overdue > 0
            ? t('life.hub.study.overdue', { n: study.overdue })
            : next
              ? t('life.hub.study.next', { title: next.title, date: fmtDay(next.due, lang, 'short') })
              : t('life.hub.study.none')
        }
        onPress={() => router.push(routes.study())}
      />
      <PastelCard
        emoji="🚀"
        pastel="pink"
        overline={t('life.hub.growth.title')}
        title={
          growth.todayTop.total > 0
            ? t('life.hub.growth.top', { done: growth.todayTop.done, total: growth.todayTop.total })
            : growth.activeGoals > 0
              ? t('life.hub.growth.goals', { n: growth.activeGoals, p: Math.round(growth.avgProgress * 100) })
              : t('life.hub.growth.none')
        }
        onPress={() => router.push(routes.growth())}
      />
      <Txt variant="caption" dim center style={{ marginTop: 8 }}>
        {t('life.hub.footer')}
      </Txt>
    </Screen>
  );
}
