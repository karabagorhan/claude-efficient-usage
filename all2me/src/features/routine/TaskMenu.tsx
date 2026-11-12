/**
 * Rutin kartına uzun basınca açılan menü: Düzenle · Yukarı · Aşağı · En üste · Sil.
 * Sürükle-bırak paketi yok; taşıma `useCore().moveHabit` ile `habit.order` alanına yazılır.
 */
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Txt } from '../../components/ui';
import type { Habit } from '../../engine/types';
import { useT } from '../../i18n';
import type { MoveDir } from '../../store/core';
import { radius, useTheme } from '../../theme';

function Item({ icon, label, onPress, disabled, danger }: { icon: string; label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 52,
        paddingHorizontal: 16,
        borderRadius: radius.md,
        backgroundColor: pressed ? t.cardAlt : 'transparent',
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Text style={{ fontSize: 20, width: 26, textAlign: 'center' }}>{icon}</Text>
      <Txt variant="bodyBold" color={danger ? t.dangerText : t.text}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function TaskMenu({
  habit,
  index,
  count,
  auto,
  onClose,
  onEdit,
  onMove,
  onDelete,
}: {
  habit: Habit | null;
  /** bölümdeki sırası (0 = en üst) */
  index: number;
  count: number;
  /** sıralama saate göre mi (taşıyınca elle sıraya geçilir) */
  auto: boolean;
  onClose: () => void;
  onEdit: () => void;
  onMove: (dir: MoveDir) => void;
  onDelete: () => void;
}) {
  const t = useTheme();
  const tr = useT();
  return (
    <Modal visible={!!habit} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel={tr('routine.menu.cancel')} onPress={onClose} style={{ flex: 1, backgroundColor: t.overlay, justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: t.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 16, paddingBottom: 28, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          {habit ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 30 }}>{habit.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Txt variant="caption" dim>
                    {tr('routine.menu.title')}
                  </Txt>
                  <Txt variant="h3" numberOfLines={2}>
                    {habit.title}
                  </Txt>
                </View>
              </View>
              <Item icon="✏️" label={tr('routine.menu.edit')} onPress={onEdit} />
              <Item icon="⬆️" label={tr('routine.menu.up')} disabled={index <= 0} onPress={() => onMove('up')} />
              <Item icon="⬇️" label={tr('routine.menu.down')} disabled={index >= count - 1} onPress={() => onMove('down')} />
              <Item icon="⏫" label={tr('routine.menu.top')} disabled={index <= 0} onPress={() => onMove('top')} />
              <Item icon="🗑️" label={tr('routine.menu.delete')} danger onPress={onDelete} />
              {auto && count > 1 ? (
                <Txt variant="caption" dim style={{ paddingHorizontal: 8, marginTop: 6 }}>
                  {tr('routine.menu.autoHint')}
                </Txt>
              ) : null}
              <Txt variant="caption" dim style={{ paddingHorizontal: 8, marginTop: 4 }}>
                {tr('routine.menu.swipeHint')}
              </Txt>
              <Item icon="✕" label={tr('routine.menu.cancel')} onPress={onClose} />
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
