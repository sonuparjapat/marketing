import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, type ThemeColors } from '../context/theme';
import type { Faq } from '../api/services';

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [openId, setOpenId] = useState<number | null>(faqs[0]?.id ?? null);

  if (!faqs.length) return null;

  return (
    <View style={styles.wrap}>
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <View key={faq.id} style={styles.item}>
            <Pressable style={styles.question} onPress={() => setOpenId(isOpen ? null : faq.id)}>
              <Text style={styles.questionText}>{faq.question}</Text>
              <Text style={styles.icon}>{isOpen ? '−' : '+'}</Text>
            </Pressable>
            {isOpen && <Text style={styles.answer}>{faq.answer}</Text>}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { borderTopWidth: 1, borderTopColor: colors.line },
    item: { borderBottomWidth: 1, borderBottomColor: colors.line },
    question: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
    questionText: { color: colors.fg, fontSize: 14.5, fontWeight: '600', flex: 1, marginRight: 12 },
    icon: { color: colors.accent, fontSize: 18 },
    answer: { color: colors.muted, fontSize: 13.5, lineHeight: 20, paddingBottom: 16 },
  });
