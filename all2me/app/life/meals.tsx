import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Bar, Card, Chip, EmptyState, Field, Header, IconButton, PillButton, Row, Screen, Segmented, Spacer, Txt, press } from '../../src/components/ui';
import { IDEA_BY_ID, MEAL_IDEAS, type IdeaMeal, type MealIdea } from '../../src/data/mealIdeas';
import { pickMessage } from '../../src/data/lifeMessages';
import { dayKeyOf, weekdayOf } from '../../src/engine/dates';
import { mealLog } from '../../src/features/life/actions';
import { fastFoodFreeStreak, mealsTone, monthSpend, shoppingList, weekCounts, weekGrid } from '../../src/features/life/calc';
import { MealWeekGrid } from '../../src/features/life/charts';
import { defaultCurrency, fmtMoney } from '../../src/features/life/hooks';
import { notifyMeals } from '../../src/features/life/notify';
import { CURRENCIES, CURRENCY_SYMBOL, MEAL_KINDS, MEAL_KIND_EMOJI, MEAL_SLOTS, type MealKind, type MealSlot } from '../../src/features/life/types';
import { MessageCard, Sheet, Stat, Stepper, TimeStepper, ToggleRow } from '../../src/features/life/ui';
import { DAYS_SHORT, L, useLang, useT } from '../../src/i18n';
import { useMeals } from '../../src/store/slices/meals';
import { radius, useTheme, type PastelKey } from '../../src/theme';

type Tab = 'log' | 'plan' | 'shop';
const KIND_PASTEL: Record<MealKind, PastelKey> = { home: 'green', healthy: 'mint', fast: 'peach', skipped: 'blue' };
const slotByHour = (h: number): MealSlot => (h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 21 ? 'dinner' : 'snack');

export default function MealsScreen() {
  const t = useT();
  const hydrated = useMeals((s) => s.hydrated);
  const [tab, setTab] = useState<Tab>('log');
  const [settings, setSettings] = useState(false);
  const lang = useLang();
  const remind = useMeals((s) => s.remind);
  useEffect(() => {
    if (remind.dinner || remind.prep) void notifyMeals();
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Screen
      header={<Header title={t('life.meals.title')} large right={<IconButton icon="settings-outline" label={t('life.meals.settings.title')} onPress={() => setSettings(true)} />} />}
    >
      {!hydrated ? null : (
        <>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { id: 'log', label: t('life.meals.tab.log') },
              { id: 'plan', label: t('life.meals.tab.plan') },
              { id: 'shop', label: t('life.meals.tab.shop') },
            ]}
          />
          <Spacer h={14} />
          {tab === 'log' ? <LogTab /> : tab === 'plan' ? <PlanTab /> : <ShopTab goPlan={() => setTab('plan')} />}
          <Spacer h={16} />
          <Txt variant="caption" dim center>
            {t('common.medicalNote')}
          </Txt>
        </>
      )}
      <SettingsSheet visible={settings} onClose={() => setSettings(false)} />
    </Screen>
  );
}

// ------------------------------------------------------------------ Kayıt sekmesi
function LogTab() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const entriesMap = useMeals((s) => s.entries);
  const goal = useMeals((s) => s.goal);
  const curSetting = useMeals((s) => s.currency);
  const currency = curSetting ?? defaultCurrency(lang);
  const day = dayKeyOf();
  const [slot, setSlot] = useState<MealSlot>(() => slotByHour(new Date().getHours()));
  const [extra, setExtra] = useState(false);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');

  const entries = useMemo(() => Object.values(entriesMap), [entriesMap]);
  const counts = weekCounts(entries, day);
  const streak = fastFoodFreeStreak(entries, day);
  const spend = monthSpend(entries, day, 'fast');
  const grid = useMemo(() => weekGrid(entries, day), [entries, day]);
  const todays = useMemo(() => entries.filter((e) => e.dayKey === day).sort((a, b) => (a.at < b.at ? 1 : -1)), [entries, day]);
  const tone = mealsTone(counts, goal);
  const msg = L(pickMessage('meals', tone, day), lang);

  const log = (kind: MealKind) => {
    press();
    const amt = Number(amount.replace(',', '.'));
    mealLog({ slot, kind, note: note.trim() || undefined, amount: Number.isFinite(amt) && amt > 0 ? amt : undefined });
    setNote('');
    setAmount('');
    setExtra(false);
  };

  return (
    <View>
      <MessageCard text={msg} pastel="peach" emoji="🍲" />
      <Spacer h={12} />

      {/* Haftalık hedef */}
      <Card>
        <Txt variant="h3">{t('life.meals.week.title')}</Txt>
        <Spacer h={10} />
        <Row between>
          <Txt variant="bodyBold">🏠 {t('life.meals.week.home')}</Txt>
          <Txt variant="bodyBold">{t('life.meals.week.ofMin', { n: counts.home, m: goal.homeMin })}</Txt>
        </Row>
        <Bar value={goal.homeMin > 0 ? counts.home / goal.homeMin : 1} color={th.success} height={10} />
        <Spacer h={12} />
        <Row between>
          <Txt variant="bodyBold">🍔 {t('life.meals.week.fast')}</Txt>
          <Txt variant="bodyBold" color={counts.fast > goal.fastMax ? th.coral : th.text}>
            {t('life.meals.week.ofMax', { n: counts.fast, m: goal.fastMax })}
          </Txt>
        </Row>
        <Bar value={goal.fastMax > 0 ? counts.fast / goal.fastMax : counts.fast > 0 ? 1 : 0} color={counts.fast > goal.fastMax ? th.coral : th.orange} height={10} />
      </Card>

      <Row gap={12} style={{ marginTop: 12, flexWrap: 'wrap' }}>
        <Stat emoji="🔥" value={t('life.meals.streakDays', { n: streak })} label={t('life.meals.streak')} pastel="green" />
        <Stat emoji="💸" value={fmtMoney(spend, currency, lang)} label={t('life.meals.monthSpend')} pastel="yellow" />
      </Row>

      {/* Hızlı kayıt */}
      <Txt variant="h2" style={{ marginTop: 22, marginBottom: 10 }}>
        {t('life.meals.log.title')}
      </Txt>
      <Row gap={8} style={{ flexWrap: 'wrap', marginBottom: 12 }}>
        {MEAL_SLOTS.map((s) => (
          <Chip key={s} label={t(`life.meals.slot.${s}`)} active={slot === s} onPress={() => setSlot(s)} />
        ))}
      </Row>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {MEAL_KINDS.map((k) => (
          <Pressable
            key={k}
            accessibilityRole="button"
            onPress={() => log(k)}
            style={({ pressed }) => ({
              width: '47.5%',
              flexGrow: 1,
              minHeight: 92,
              borderRadius: radius.lg,
              backgroundColor: th.pastel[KIND_PASTEL[k]],
              padding: 14,
              justifyContent: 'space-between',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Txt size={30}>{MEAL_KIND_EMOJI[k]}</Txt>
            <Txt variant="bodyBold" color={th.onPastel}>
              {t(`life.meals.kind.${k}`)}
            </Txt>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => setExtra((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
        <Ionicons name={extra ? 'chevron-down' : 'add-circle-outline'} size={18} color={th.textDim} />
        <Txt variant="small" dim>
          {t('life.meals.log.extra')}
        </Txt>
      </Pressable>
      {extra ? (
        <View style={{ marginTop: 8, gap: 8 }}>
          <Field label={t('life.meals.log.note')} value={note} onChangeText={setNote} placeholder={t('life.meals.log.notePh')} />
          <Field label={t('life.meals.log.amount', { c: CURRENCY_SYMBOL[currency] })} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        </View>
      ) : null}

      {/* Bugünün kayıtları */}
      <Card style={{ marginTop: 16 }}>
        <Txt variant="h3" style={{ marginBottom: 6 }}>
          {t('life.meals.today.title')}
        </Txt>
        {todays.length === 0 ? (
          <Txt dim>{t('life.meals.today.empty')}</Txt>
        ) : (
          todays.map((e, i) => (
            <Row key={e.id} between style={{ paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderColor: th.border }}>
              <Row gap={10} style={{ flex: 1 }}>
                <Txt size={22}>{MEAL_KIND_EMOJI[e.kind]}</Txt>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyBold" numberOfLines={1}>
                    {t(`life.meals.slot.${e.slot}`)} · {t(`life.meals.kind.${e.kind}`)}
                  </Txt>
                  {e.note || e.amount ? (
                    <Txt variant="small" dim numberOfLines={1}>
                      {[e.note, e.amount ? fmtMoney(e.amount, currency, lang) : ''].filter(Boolean).join(' · ')}
                    </Txt>
                  ) : null}
                </View>
              </Row>
              <IconButton icon="trash-outline" size={20} color={th.textDim} label={t('common.btn.delete')} onPress={() => useMeals.getState().remove(e.id)} />
            </Row>
          ))
        )}
      </Card>

      {/* Izgara */}
      <Card style={{ marginTop: 12 }}>
        <Txt variant="h3" style={{ marginBottom: 10 }}>
          {t('life.meals.grid.title')}
        </Txt>
        <MealWeekGrid
          grid={grid}
          todayKey={day}
          dayLabels={DAYS_SHORT[lang].map((d) => d.slice(0, 3))}
          slotLabels={{ breakfast: t('life.meals.slot.breakfast'), lunch: t('life.meals.slot.lunch'), dinner: t('life.meals.slot.dinner'), snack: t('life.meals.slot.snack') }}
        />
        <Row gap={12} style={{ flexWrap: 'wrap', marginTop: 12 }}>
          {MEAL_KINDS.map((k) => (
            <Txt key={k} variant="caption" dim>
              {MEAL_KIND_EMOJI[k]} {t(`life.meals.kind.${k}`)}
            </Txt>
          ))}
        </Row>
      </Card>
    </View>
  );
}

// ------------------------------------------------------------------ Menü sekmesi
const planKey = (wd: number, slot: 'lunch' | 'dinner') => `${wd}|${slot}`;
const ideaMeta = (i: MealIdea, t: (k: string, p?: Record<string, string | number>) => string) => t('life.meals.ideas.mins', { n: i.mins });

function PlanTab() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const plan = useMeals((s) => s.plan);
  const [pick, setPick] = useState<{ wd: number; slot: 'lunch' | 'dinner' } | null>(null);
  const [fMeal, setFMeal] = useState<'all' | IdeaMeal>('all');
  const [fTime, setFTime] = useState<'all' | '15' | '30'>('all');
  const todayWd = weekdayOf(dayKeyOf());
  const filled = Object.keys(plan).length;

  const fillRandom = () => {
    const used = new Set(Object.values(plan));
    const cells: Record<string, string> = {};
    for (let wd = 0; wd < 7; wd++) {
      for (const slot of ['lunch', 'dinner'] as const) {
        const key = planKey(wd, slot);
        if (plan[key]) continue;
        const pool = MEAL_IDEAS.filter((i) => i.meals.includes(slot) && i.mins <= 30);
        const fresh = pool.filter((i) => !used.has(i.id));
        const from = fresh.length ? fresh : pool;
        const idea = from[Math.floor(Math.random() * from.length)];
        cells[key] = idea.id;
        used.add(idea.id);
      }
    }
    useMeals.getState().fillPlan(cells);
  };

  const ideas = MEAL_IDEAS.filter((i) => (fMeal === 'all' || i.meals.includes(fMeal)) && (fTime === 'all' || i.mins <= Number(fTime)));
  const pickList = pick ? MEAL_IDEAS.filter((i) => i.meals.includes(pick.slot)).sort((a, b) => a.mins - b.mins) : [];

  return (
    <View>
      <Txt dim style={{ marginBottom: 10 }}>
        {t('life.meals.plan.hint')}
      </Txt>
      <Row gap={8} style={{ marginBottom: 12 }}>
        <PillButton small label={t('life.meals.plan.random')} icon="shuffle" onPress={fillRandom} style={{ flex: 1 }} />
        <PillButton small kind="outline" label={t('life.meals.plan.clear')} disabled={filled === 0} onPress={() => useMeals.getState().clearPlan()} />
      </Row>
      {Array.from({ length: 7 }, (_, wd) => (
        <Card key={wd} style={{ marginBottom: 8 }} padding={10}>
          <Row gap={8} style={{ alignItems: 'stretch' }}>
            <View style={{ width: 40, justifyContent: 'center' }}>
              <Txt variant="bodyBold" color={wd === todayWd ? th.coral : th.text}>
                {DAYS_SHORT[lang][wd].slice(0, 3)}
              </Txt>
            </View>
            {(['lunch', 'dinner'] as const).map((slot) => {
              const idea = IDEA_BY_ID[plan[planKey(wd, slot)] ?? ''];
              return (
                <Pressable
                  key={slot}
                  accessibilityRole="button"
                  onPress={() => setPick({ wd, slot })}
                  style={{
                    flex: 1,
                    minHeight: 64,
                    borderRadius: radius.md,
                    padding: 8,
                    backgroundColor: idea ? th.pastel[slot === 'lunch' ? 'yellow' : 'purple'] : 'transparent',
                    borderWidth: idea ? 0 : 1.5,
                    borderStyle: 'dashed',
                    borderColor: th.border,
                    justifyContent: 'center',
                  }}
                >
                  <Txt variant="caption" color={idea ? th.onPastel : undefined} dim={!idea}>
                    {t(`life.meals.slot.${slot}`)}
                  </Txt>
                  {idea ? (
                    <Txt variant="small" weight="700" color={th.onPastel} numberOfLines={2}>
                      {idea.emoji} {L(idea.name, lang)}
                    </Txt>
                  ) : (
                    <Txt variant="small" dim>
                      ＋ {t('life.meals.plan.add')}
                    </Txt>
                  )}
                </Pressable>
              );
            })}
          </Row>
        </Card>
      ))}

      {/* Fikirler */}
      <Txt variant="h2" style={{ marginTop: 18 }}>
        {t('life.meals.ideas.title')}
      </Txt>
      <Txt dim style={{ marginBottom: 10 }}>
        {t('life.meals.ideas.count', { n: ideas.length })}
      </Txt>
      <Row gap={8} style={{ flexWrap: 'wrap', marginBottom: 8 }}>
        {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
          <Chip key={m} label={m === 'all' ? t('life.meals.ideas.all') : t(`life.meals.slot.${m}`)} active={fMeal === m} onPress={() => setFMeal(m)} />
        ))}
      </Row>
      <Row gap={8} style={{ flexWrap: 'wrap', marginBottom: 12 }}>
        {(['all', '15', '30'] as const).map((m) => (
          <Chip key={m} label={m === 'all' ? t('life.meals.ideas.anyTime') : t('life.meals.ideas.upTo', { n: m })} active={fTime === m} onPress={() => setFTime(m)} color={th.coral} />
        ))}
      </Row>
      {ideas.map((i) => (
        <Card key={i.id} style={{ marginBottom: 8 }} padding={12}>
          <Row gap={12}>
            <Txt size={30}>{i.emoji}</Txt>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyBold">{L(i.name, lang)}</Txt>
              <Txt variant="small" dim numberOfLines={2}>
                {i.items.map((x) => L(x, lang)).join(', ')}
              </Txt>
            </View>
            <View style={{ backgroundColor: th.cardAlt, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Txt variant="caption" weight="700">
                {ideaMeta(i, t)}
              </Txt>
            </View>
          </Row>
        </Card>
      ))}

      <Sheet
        visible={pick !== null}
        title={pick ? `${DAYS_SHORT[lang][pick.wd]} · ${t(`life.meals.slot.${pick.slot}`)}` : ''}
        onClose={() => setPick(null)}
      >
        {pick && plan[planKey(pick.wd, pick.slot)] ? (
          <PillButton
            kind="outline"
            small
            label={t('life.meals.plan.remove')}
            onPress={() => {
              useMeals.getState().setPlanCell(planKey(pick.wd, pick.slot), null);
              setPick(null);
            }}
            style={{ marginBottom: 10 }}
          />
        ) : null}
        {pickList.map((i) => (
          <Pressable
            key={i.id}
            onPress={() => {
              if (pick) useMeals.getState().setPlanCell(planKey(pick.wd, pick.slot), i.id);
              setPick(null);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: th.border }}
          >
            <Txt size={26}>{i.emoji}</Txt>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyBold">{L(i.name, lang)}</Txt>
              <Txt variant="small" dim>
                {ideaMeta(i, t)}
              </Txt>
            </View>
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}

// ------------------------------------------------------------------ Alışveriş sekmesi
function ShopTab({ goPlan }: { goPlan: () => void }) {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const plan = useMeals((s) => s.plan);
  const checked = useMeals((s) => s.shopChecked);
  const list = useMemo(() => shoppingList(plan), [plan]);
  if (list.length === 0) {
    return <EmptyState emoji="🛒" title={t('life.meals.shop.emptyTitle')} body={t('life.meals.shop.emptyBody')} action={{ label: t('life.meals.shop.goPlan'), onPress: goPlan }} />;
  }
  const done = list.filter((x) => checked[x.key]).length;
  return (
    <View>
      <Row between style={{ marginBottom: 10 }}>
        <Txt variant="h3">{t('life.meals.shop.title')}</Txt>
        <Txt dim>{t('life.meals.shop.progress', { a: done, b: list.length })}</Txt>
      </Row>
      <Card padding={6}>
        {list.map((x, i) => {
          const on = !!checked[x.key];
          return (
            <Pressable
              key={x.key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => useMeals.getState().toggleShop(x.key)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderTopWidth: i ? 1 : 0, borderColor: th.border }}
            >
              <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: on ? th.success : th.border, backgroundColor: on ? th.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {on ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
              </View>
              <Txt variant="bodyBold" dim={on} style={{ flex: 1, textDecorationLine: on ? 'line-through' : 'none' }}>
                {L(x.name, lang)}
              </Txt>
              {x.count > 1 ? (
                <Txt variant="small" dim>
                  ×{x.count}
                </Txt>
              ) : null}
            </Pressable>
          );
        })}
      </Card>
      <Spacer h={12} />
      <PillButton kind="outline" label={t('life.meals.shop.reset')} disabled={done === 0} onPress={() => useMeals.getState().clearShop()} />
    </View>
  );
}

// ------------------------------------------------------------------ Ayarlar
function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const goal = useMeals((s) => s.goal);
  const remind = useMeals((s) => s.remind);
  const curSetting = useMeals((s) => s.currency);
  const currency = curSetting ?? defaultCurrency(lang);
  const set = (patch: Partial<typeof remind>) => {
    useMeals.getState().setRemind(patch);
    void notifyMeals();
  };
  return (
    <Sheet visible={visible} title={t('life.meals.settings.title')} onClose={onClose}>
      <Txt variant="h3">{t('life.meals.settings.goals')}</Txt>
      <Stepper label={t('life.meals.settings.fastMax')} value={goal.fastMax} min={0} max={21} onChange={(v) => useMeals.getState().setGoal({ fastMax: v })} />
      <Stepper label={t('life.meals.settings.homeMin')} value={goal.homeMin} min={0} max={28} onChange={(v) => useMeals.getState().setGoal({ homeMin: v })} />

      <Txt variant="h3" style={{ marginTop: 14 }}>
        {t('life.meals.settings.currency')}
      </Txt>
      <Row gap={8} style={{ flexWrap: 'wrap', marginTop: 8 }}>
        {CURRENCIES.map((c) => (
          <Chip key={c} label={`${CURRENCY_SYMBOL[c]} ${c}`} active={c === currency} onPress={() => useMeals.getState().setCurrency(c)} />
        ))}
      </Row>

      <Txt variant="h3" style={{ marginTop: 20 }}>
        {t('life.meals.settings.reminders')}
      </Txt>
      <ToggleRow label={t('life.meals.settings.dinner')} hint={t('life.meals.settings.dinnerHint')} value={remind.dinner} onChange={(v) => set({ dinner: v })} />
      <TimeStepper label={t('life.meals.settings.time')} value={remind.dinnerTime} disabled={!remind.dinner} onChange={(v) => set({ dinnerTime: v })} />
      <ToggleRow label={t('life.meals.settings.prep')} hint={t('life.meals.settings.prepHint')} value={remind.prep} onChange={(v) => set({ prep: v })} />
      {remind.prep ? (
        <>
          <Row gap={6} style={{ flexWrap: 'wrap', marginVertical: 6 }}>
            {DAYS_SHORT[lang].map((d, i) => (
              <Chip key={i} label={d.slice(0, 3)} active={remind.prepWeekday === i} onPress={() => set({ prepWeekday: i })} />
            ))}
          </Row>
          <TimeStepper label={t('life.meals.settings.time')} value={remind.prepTime} onChange={(v) => set({ prepTime: v })} />
        </>
      ) : null}
      <Txt variant="small" dim style={{ marginTop: 8 }}>
        {t('life.meals.settings.notifNote')}
      </Txt>
    </Sheet>
  );
}
