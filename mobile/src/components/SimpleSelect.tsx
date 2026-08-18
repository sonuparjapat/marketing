import { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { useTheme, type ThemeColors } from '../context/theme';

export function SimpleSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={{ color: value ? colors.fg : colors.faint, fontSize: 15 }}>{value || placeholder}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text style={{ color: item === value ? colors.accent : colors.fg, fontSize: 15 }}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    label: { color: colors.muted, fontSize: 12, letterSpacing: 0.5, marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
    input: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: 6, padding: 14 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.bg2, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%', paddingVertical: 8 },
    option: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  });
