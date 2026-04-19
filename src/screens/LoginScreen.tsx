import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  HelperText,
} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SlipGoLogo from '../components/SlipGoLogo';
import {useAuth} from '../context/AuthContext';

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {login} = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await login(phone.trim(), password);
      if (result.ok === false) {
        setError(result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.scroll,
          {paddingTop: Math.max(insets.top, 20) + 12, paddingBottom: insets.bottom + 24},
        ]}
        showsVerticalScrollIndicator={false}
        bounces>
        <SlipGoLogo size="large" />

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: 'rgba(0,0,0,0.1)',
            },
          ]}>
          <Text variant="titleMedium" style={[styles.title, {color: theme.colors.onSurface}]}>
            Sign in
          </Text>
          <Text variant="bodySmall" style={[styles.subtitle, {color: theme.colors.onSurfaceVariant}]}>
            Use your phone number and password to continue.
          </Text>

          <TextInput
            label="Phone number"
            value={phone}
            onChangeText={t => {
              setPhone(t);
              setError('');
            }}
            mode="outlined"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            left={<TextInput.Icon icon="phone-outline" />}
            style={[styles.input, {backgroundColor: theme.colors.surface}]}
            disabled={loading}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={t => {
              setPassword(t);
              setError('');
            }}
            mode="outlined"
            secureTextEntry={secure}
            textContentType="password"
            autoComplete="password"
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={secure ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setSecure(!secure)}
                forceTextInputFocus={false}
              />
            }
            style={[styles.input, {backgroundColor: theme.colors.surface}]}
            disabled={loading}
            onSubmitEditing={onSubmit}
          />

          {error ? (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={onSubmit}
            disabled={loading}
            loading={loading}
            style={[styles.button, {backgroundColor: theme.colors.primary}]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}>
            Sign in
          </Button>

          <View style={styles.hintRow}>
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color={theme.colors.onSurfaceVariant}
              style={styles.hintIcon}
            />
            <Text variant="bodySmall" style={[styles.hint, {color: theme.colors.onSurfaceVariant}]}>
              Demo: any 8+ digit phone and 6+ character password.
            </Text>
          </View>
        </View>

        <Pressable style={styles.footer} hitSlop={12}>
          <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>
            © SlipGo
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    marginTop: 32,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  title: {fontWeight: '700', marginBottom: 4},
  subtitle: {marginBottom: 20, lineHeight: 20},
  input: {marginBottom: 4, backgroundColor: '#FFFFFF'},
  button: {marginTop: 12, borderRadius: 12},
  buttonContent: {height: 48},
  buttonLabel: {fontSize: 16, fontWeight: '700'},
  hintRow: {flexDirection: 'row', alignItems: 'flex-start', marginTop: 16},
  hintIcon: {marginRight: 8, marginTop: 2},
  hint: {flex: 1, lineHeight: 18},
  footer: {marginTop: 28},
});
