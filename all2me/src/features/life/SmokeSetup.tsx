import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Card, Chip, Field, PillButton, Row, Spacer, Txt } from '../../components/ui';
import { dayKeyOf } from '../../engine/dates';
import { fmtDay, useLang, useT } from '../../i18n';
import { useTheme } from '../../theme';
import { planEndDay, reductionSteps } from './calc';
import { defaultCurrency } from './hooks';
import { CURRENCIES, CURRENCY_SYMBOL, type Currency, type SmokePlan, type SmokePricing } from './types';
import { Stepper } from './ui';

const toNum = (s: string): number => {
  const n = Number(s.replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** Sigara azaltma kurulumu: başlangıç, hedef, fiyat, azaltma hızı + önizlemeli takvim. */
export function SmokeSetup({
  initialPlan,
  initialPricing,
  isEdit,
  onSave,
}: {
  initialPlan: SmokePlan | null;
  initialPricing: SmokePricing | null;
  isEdit: boolean;
  onSave: (plan: SmokePlan, pricing: SmokePricing) => void;
}) {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const [start, setStart] = useState(initialPlan?.startPerDay ?? 15);
  const [goal, setGoal] = useState(initialPlan?.goalPerDay ?? 5);
  const [every, setEvery] = useState(initialPlan?.everyDays ?? 7);
  const [currency, setCurrency] = useState<Currency>(isEdit && initialPricing ? initialPricing.currency : defaultCurrency(lang));
  const [price, setPrice] = useState(String(isEdit && initialPricing ? initialPricing.packPrice : currency === 'TRY' ? 100 : 8));
  const [packSize, setPackSize] = useState(initialPricing?.packSize ?? 20);
  const startDay = initialPlan?.startDay ?? dayKeyOf();

  const effGoal = Math.min(goal, start);
  const plan: SmokePlan = { startPerDay: start, goalPerDay: effGoal, everyDays: every, startDay };
  const steps = useMemo(() => reductionSteps(plan), [start, effGoal, every, startDay]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = steps.length > 7 ? [...steps.slice(0, 4), null, ...steps.slice(-2)] : steps;
  const perDay = toNum(price) / Math.max(1, packSize);

  return (
    <View>
      <Card bg={th.pastel.mint} style={{ marginBottom: 16 }}>
        <Txt variant="bodyBold" color={th.onPastel}>
          {t('life.smoke.setup.intro')}
        </Txt>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Stepper label={t('life.smoke.setup.start')} hint={t('life.smoke.setup.startHint')} value={start} min={1} max={80} onChange={(v) => { setStart(v); if (goal > v) setGoal(v); }} />
        <Stepper label={t('life.smoke.setup.goal')} hint={t('life.smoke.setup.goalHint')} value={effGoal} min={0} max={start} onChange={setGoal} />
        <Stepper label={t('life.smoke.setup.every')} hint={t('life.smoke.setup.everyHint', { n: every })} value={every} min={1} max={30} onChange={setEvery} />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Txt variant="bodyBold">{t('life.smoke.setup.currency')}</Txt>
        <Row gap={8} style={{ marginTop: 8, flexWrap: 'wrap' }}>
          {CURRENCIES.map((c) => (
            <Chip key={c} label={`${CURRENCY_SYMBOL[c]} ${c}`} active={c === currency} onPress={() => setCurrency(c)} />
          ))}
        </Row>
        <Spacer h={10} />
        <Field label={t('life.smoke.setup.packPrice')} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <Stepper label={t('life.smoke.setup.packSize')} value={packSize} min={1} max={60} onChange={setPackSize} />
        <Txt variant="small" dim>
          {t('life.smoke.setup.perCig', { v: `${CURRENCY_SYMBOL[currency]}${perDay.toFixed(2)}` })}
        </Txt>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Txt variant="h3">{t('life.smoke.setup.preview')}</Txt>
        <Txt variant="small" dim style={{ marginBottom: 8 }}>
          {t('life.smoke.setup.previewHint', { date: fmtDay(planEndDay(plan), lang, 'short'), goal: effGoal })}
        </Txt>
        {shown.map((s, i) =>
          s === null ? (
            <Txt key={`gap${i}`} dim style={{ paddingVertical: 2 }}>
              ⋮
            </Txt>
          ) : (
            <Row key={s.from} between style={{ paddingVertical: 5, borderTopWidth: i ? 1 : 0, borderColor: th.border }}>
              <Txt variant="bodyBold">{t('life.smoke.setup.stepLimit', { n: s.limit })}</Txt>
              <Txt dim>{s.to ? t('life.smoke.setup.stepRange', { a: fmtDay(s.from, lang, 'short'), b: fmtDay(s.to, lang, 'short') }) : t('life.smoke.setup.stepFrom', { a: fmtDay(s.from, lang, 'short') })}</Txt>
            </Row>
          ),
        )}
      </Card>

      <PillButton
        label={isEdit ? t('common.btn.save') : t('life.smoke.setup.begin')}
        onPress={() => onSave(plan, { packPrice: toNum(price), packSize, currency })}
        disabled={toNum(price) <= 0}
      />
      <Spacer h={12} />
      <Txt variant="caption" dim center>
        {t('common.medicalNote')}
      </Txt>
    </View>
  );
}
