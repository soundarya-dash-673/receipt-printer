import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  useTheme,
  Text,
  Divider,
  List,
  Switch,
  Snackbar,
  Surface,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useApp} from '../context/AppContext';
import {useAuth} from '../context/AuthContext';

export default function SettingsScreen() {
  const theme = useTheme();
  const {settings, updateSettings, menuItems, orders, clearAllOrders} = useApp();
  const {session, logout} = useAuth();

  const [restaurantName, setRestaurantName] = useState(settings.restaurantName);
  const [taxRate, setTaxRate] = useState(settings.taxRate.toString());
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [thankYouMessage, setThankYouMessage] = useState(settings.thankYouMessage);
  const [snackbar, setSnackbar] = useState<{visible: boolean; message: string}>({
    visible: false,
    message: '',
  });
  const [taxError, setTaxError] = useState('');

  useEffect(() => {
    setRestaurantName(settings.restaurantName);
    setTaxRate(settings.taxRate.toString());
    setAddress(settings.address);
    setPhone(settings.phone);
    setThankYouMessage(settings.thankYouMessage);
  }, [settings]);

  const handleSave = () => {
    const parsedTax = parseFloat(taxRate);
    if (isNaN(parsedTax) || parsedTax < 0 || parsedTax > 100) {
      setTaxError('Enter a valid tax rate (0–100)');
      return;
    }
    updateSettings({
      restaurantName: restaurantName.trim() || 'My Restaurant',
      taxRate: parsedTax,
      address: address.trim(),
      phone: phone.trim(),
      thankYouMessage: thankYouMessage.trim(),
    });
    setSnackbar({visible: true, message: 'Settings saved!'});
  };

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, {backgroundColor: theme.colors.background}]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Restaurant Info */}
        <Surface style={styles.section} elevation={1}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="store" size={20} color={theme.colors.primary} />
            <Text variant="titleSmall" style={styles.sectionTitle}>Restaurant Information</Text>
          </View>
          <Divider style={styles.divider} />

          <TextInput
            label="Restaurant Name"
            value={restaurantName}
            onChangeText={setRestaurantName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="store" />}
          />
          <TextInput
            label="Address"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="map-marker" />}
          />
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone" />}
          />
          <TextInput
            label="Thank You Message"
            value={thankYouMessage}
            onChangeText={setThankYouMessage}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="heart" />}
          />
        </Surface>

        {/* Tax Settings */}
        <Surface style={styles.section} elevation={1}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="percent" size={20} color={theme.colors.primary} />
            <Text variant="titleSmall" style={styles.sectionTitle}>Tax Settings</Text>
          </View>
          <Divider style={styles.divider} />

          <TextInput
            label="Tax Rate (%)"
            value={taxRate}
            onChangeText={t => {setTaxRate(t); setTaxError('');}}
            mode="outlined"
            style={styles.input}
            keyboardType="decimal-pad"
            error={!!taxError}
            left={<TextInput.Icon icon="percent" />}
            right={<TextInput.Affix text="%" />}
          />
          {taxError ? <Text style={styles.errorText}>{taxError}</Text> : null}

          <View style={[styles.taxPreview, {backgroundColor: theme.colors.primary + '10'}]}>
            <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>
              Example: $100.00 order
            </Text>
            <Text variant="bodyMedium" style={{fontWeight: '600'}}>
              Tax: ${(100 * (parseFloat(taxRate) || 0) / 100).toFixed(2)} →
              Total: ${(100 + 100 * (parseFloat(taxRate) || 0) / 100).toFixed(2)}
            </Text>
          </View>
        </Surface>

        {/* Stats */}
        <Surface style={styles.section} elevation={1}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="chart-bar" size={20} color={theme.colors.primary} />
            <Text variant="titleSmall" style={styles.sectionTitle}>App Statistics</Text>
          </View>
          <Divider style={styles.divider} />

          <View style={styles.statsGrid}>
            <StatCard
              icon="food-fork-drink"
              label="Menu Items"
              value={menuItems.length.toString()}
              color={theme.colors.primary}
            />
            <StatCard
              icon="receipt"
              label="Total Orders"
              value={orders.length.toString()}
              color={theme.colors.tertiary}
            />
            <StatCard
              icon="currency-usd"
              label="Total Revenue"
              value={`$${totalRevenue.toFixed(2)}`}
              color="#2E7D32"
            />
          </View>
        </Surface>

        {/* Save Button */}
        <Button
          mode="contained"
          icon="content-save"
          onPress={handleSave}
          style={[styles.saveBtn, {backgroundColor: theme.colors.primary}]}
          contentStyle={styles.saveBtnContent}
          labelStyle={styles.saveBtnLabel}>
          Save Settings
        </Button>

        {/* Account */}
        <Surface style={styles.section} elevation={1}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-circle-outline" size={20} color={theme.colors.primary} />
            <Text variant="titleSmall" style={styles.sectionTitle}>Account</Text>
          </View>
          <Divider style={styles.divider} />
          {session?.phone ? (
            <Text variant="bodyMedium" style={styles.signedInAs}>
              Signed in as {session.phone}
            </Text>
          ) : null}
          <Button mode="outlined" icon="logout" onPress={logout} textColor={theme.colors.primary} style={styles.logoutBtn}>
            Sign out
          </Button>
        </Surface>

        {/* Danger Zone */}
        <Surface style={[styles.section, styles.dangerSection]} elevation={1}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="alert" size={20} color="#C62828" />
            <Text variant="titleSmall" style={[styles.sectionTitle, {color: '#C62828'}]}>
              Danger Zone
            </Text>
          </View>
          <Divider style={styles.divider} />
          <Button
            mode="outlined"
            icon="trash-can"
            onPress={clearAllOrders}
            textColor="#C62828"
            style={{borderColor: '#C62828'}}>
            Clear All Order History
          </Button>
        </Surface>
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar(s => ({...s, visible: false}))}
        duration={2500}
        style={{backgroundColor: '#2E7D32'}}>
        {snackbar.message}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, {borderColor: color + '40', backgroundColor: color + '10'}]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text variant="headlineSmall" style={[styles.statValue, {color}]}>
        {value}
      </Text>
      <Text variant="labelSmall" style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  container: {flex: 1},
  content: {padding: 16, gap: 16, paddingBottom: 40},
  section: {borderRadius: 12, padding: 16, overflow: 'hidden'},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8},
  sectionTitle: {fontWeight: '700', color: '#424242'},
  divider: {marginBottom: 14},
  input: {marginBottom: 10},
  errorText: {color: '#C62828', fontSize: 12, marginBottom: 8, marginTop: -6},
  taxPreview: {
    padding: 12,
    borderRadius: 8,
    gap: 4,
    marginTop: 4,
  },
  statsGrid: {flexDirection: 'row', gap: 10},
  statCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {fontWeight: '700'},
  statLabel: {color: '#757575', textAlign: 'center'},
  saveBtn: {borderRadius: 12},
  saveBtnContent: {height: 50},
  saveBtnLabel: {fontSize: 15, fontWeight: '700'},
  dangerSection: {},
  signedInAs: {marginBottom: 12, color: '#616161'},
  logoutBtn: {borderColor: '#E86A2B'},
});
