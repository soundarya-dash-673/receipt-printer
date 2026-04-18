import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, Image, Platform, Alert} from 'react-native';
import {Text, TextInput, Button, useTheme} from 'react-native-paper';
import {launchImageLibrary} from 'react-native-image-picker';
import * as RNFS from 'react-native-fs';
import * as settingsRepo from '../data/repositories/settingsRepository';

export default function BrandingSetupScreen() {
  const theme = useTheme();
  const [shopName, setShopName] = useState('SlipGo');
  const [tax, setTax] = useState('8.5');
  const [footer, setFooter] = useState('Fast. Simple. Receipts.');
  const [logoPath, setLogoPath] = useState<string | null>(null);

  useEffect(() => {
    settingsRepo.getSettings().then(s => {
      setShopName(s.shopName);
      setTax(String(s.taxPercentage));
      setFooter(s.receiptFooter);
      setLogoPath(s.logoPath);
    });
  }, []);

  const pickLogo = async () => {
    const res = await launchImageLibrary({mediaType: 'photo', quality: 0.9});
    const asset = res.assets?.[0];
    if (!asset?.uri) {
      return;
    }
    try {
      const ext = asset.type?.includes('png') ? 'png' : 'jpg';
      const dest = `${RNFS.DocumentDirectoryPath}/slipgo_logo_${Date.now()}.${ext}`;
      const from = Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri;
      if (from.startsWith('content://')) {
        Alert.alert('On Android, pick a file from local storage or grant access in a future update.');
        return;
      }
      await RNFS.copyFile(from, dest);
      setLogoPath(dest);
    } catch (e) {
      Alert.alert('Could not save logo', String(e));
    }
  };

  const save = async () => {
    const t = parseFloat(tax);
    await settingsRepo.updateSettings({
      shopName,
      taxPercentage: Number.isFinite(t) ? t : 0,
      receiptFooter: footer,
      logoPath,
    });
  };

  return (
    <ScrollView style={[styles.root, {backgroundColor: theme.colors.background}]} contentContainerStyle={styles.content}>
      <Text variant="titleMedium">Branding</Text>
      <TextInput label="Shop name" value={shopName} onChangeText={setShopName} mode="outlined" style={styles.input} />
      <TextInput
        label="Tax %"
        value={tax}
        onChangeText={setTax}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Receipt footer"
        value={footer}
        onChangeText={setFooter}
        mode="outlined"
        multiline
        style={styles.input}
      />
      <Button mode="outlined" onPress={pickLogo} style={styles.input}>
        Choose logo image
      </Button>
      {logoPath ? (
        <Image source={{uri: Platform.OS === 'ios' ? logoPath : `file://${logoPath}`}} style={styles.img} />
      ) : null}
      <Button mode="contained" onPress={save} style={styles.save}>
        Save
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {padding: 20, paddingBottom: 40},
  input: {marginTop: 12, backgroundColor: '#fff'},
  img: {width: 120, height: 120, resizeMode: 'contain', marginTop: 12, alignSelf: 'center'},
  save: {marginTop: 24, borderRadius: 12},
});
