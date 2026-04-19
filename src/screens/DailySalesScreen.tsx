import React, {useCallback, useState} from 'react';
import {View, ScrollView, StyleSheet, RefreshControl} from 'react-native';
import {Text, useTheme, Surface, Divider} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';
import {useApp} from '../context/AppContext';
import {isSqliteAvailable} from '../db/database';
import {
  getTodayStats,
  getTodayStatsFromOrders,
  getRevenueByLocalDay,
  getRevenueByLocalDayFromOrders,
  type DayRevenue,
} from '../db/salesStats';
import {listUsersForSession} from '../db/userIdentity';

function formatDayLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  if (!y || !m || !d) {
    return dayKey;
  }
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DailySalesScreen() {
  const theme = useTheme();
  const {session} = useAuth();
  const {orders} = useApp();
  const [today, setToday] = useState({orderCount: 0, totalIncome: 0});
  const [byDay, setByDay] = useState<DayRevenue[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const sqlite = isSqliteAvailable();
    if (sqlite) {
      setToday(getTodayStats());
      setByDay(getRevenueByLocalDay(31));
    } else {
      setToday(getTodayStatsFromOrders(orders));
      setByDay(getRevenueByLocalDayFromOrders(orders, 31));
    }
    const users = await listUsersForSession();
    setUserCount(users.length);
  }, [orders]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }>
      <Surface style={[styles.card, {backgroundColor: theme.colors.surface}]} elevation={1}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={22}
            color={theme.colors.primary}
            style={styles.cardHeaderIcon}
          />
          <Text variant="titleSmall" style={styles.cardTitle}>
            Signed-in profile
          </Text>
        </View>
        <Text variant="bodyMedium" style={{color: theme.colors.onSurface}}>
          {session?.phone ?? '—'}
        </Text>
        <Text variant="bodySmall" style={{color: theme.colors.secondary, marginTop: 6}}>
          {userCount} account{userCount === 1 ? '' : 's'} stored on this device
        </Text>
      </Surface>

      <Surface style={[styles.card, {backgroundColor: theme.colors.surface}]} elevation={1}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="calendar-today"
            size={22}
            color={theme.colors.tertiary}
            style={styles.cardHeaderIcon}
          />
          <Text variant="titleSmall" style={styles.cardTitle}>
            Today
          </Text>
        </View>
        <View style={styles.todayRow}>
          <View>
            <Text variant="labelSmall" style={{color: theme.colors.secondary}}>
              Orders
            </Text>
            <Text variant="headlineMedium" style={{fontWeight: '700', color: theme.colors.onSurface}}>
              {today.orderCount}
            </Text>
          </View>
          <View style={{alignItems: 'flex-end'}}>
            <Text variant="labelSmall" style={{color: theme.colors.secondary}}>
              Total income
            </Text>
            <Text variant="headlineMedium" style={{fontWeight: '700', color: theme.colors.primary}}>
              ${today.totalIncome.toFixed(2)}
            </Text>
          </View>
        </View>
      </Surface>

      {!isSqliteAvailable() ? (
        <Text variant="bodySmall" style={[styles.hint, {color: theme.colors.secondary}]}>
          Running without native SQLite — stats follow your order list. From the project root, run
          pod install (iOS), then rebuild the app so the database native module is linked.
        </Text>
      ) : null}

      <Text variant="titleSmall" style={[styles.sectionLabel, {color: theme.colors.onSurfaceVariant}]}>
        Income by day (local time)
      </Text>
      <Surface style={[styles.card, {backgroundColor: theme.colors.surface}]} elevation={1}>
        {byDay.length === 0 ? (
          <Text variant="bodyMedium" style={{color: theme.colors.secondary}}>
            No orders yet.
          </Text>
        ) : (
          byDay.map((row, i) => (
            <View key={row.dayKey}>
              {i > 0 ? <Divider style={styles.divider} /> : null}
              <View style={styles.dayRow}>
                <View style={{flex: 1}}>
                  <Text variant="bodyMedium" style={{fontWeight: '600', color: theme.colors.onSurface}}>
                    {formatDayLabel(row.dayKey)}
                  </Text>
                  <Text variant="bodySmall" style={{color: theme.colors.secondary}}>
                    {row.orderCount} order{row.orderCount === 1 ? '' : 's'}
                  </Text>
                </View>
                <Text variant="titleMedium" style={{fontWeight: '700', color: theme.colors.primary}}>
                  ${row.totalIncome.toFixed(2)}
                </Text>
              </View>
            </View>
          ))
        )}
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {padding: 16, paddingBottom: 32},
  card: {borderRadius: 12, padding: 16, marginBottom: 16},
  cardHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  cardHeaderIcon: {marginRight: 8},
  cardTitle: {fontWeight: '700'},
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  hint: {marginBottom: 12, marginHorizontal: 4, lineHeight: 20},
  sectionLabel: {marginBottom: 8, marginLeft: 4, fontWeight: '600'},
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  divider: {marginVertical: 4},
});
