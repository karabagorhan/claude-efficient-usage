// PLACEHOLDER — sahibi ekran ajanı bu dosyayı tamamen yeniden yazar. Sözleşme: docs/CONTRACTS.md
import React from 'react';
import { Placeholder } from '../../src/components/Placeholder';
import { useT } from '../../src/i18n';

export default function ScreenTaskId() {
  const t = useT();
  return <Placeholder name="task/[id]" title={t('task.editTask')} />;
}
