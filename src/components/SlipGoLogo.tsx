import React from 'react';
import {View, StyleSheet, Text} from 'react-native';

type Props = {
  /** Larger logo for login hero */
  size?: 'default' | 'large';
};

/** Receipt mark drawn with views — no icon font (avoids "?" when fonts are missing). */
function ReceiptGlyph({large}: {large: boolean}) {
  const w = large ? 42 : 30;
  const thick = large ? 4 : 3;
  const thin = large ? 3 : 2;
  const accent = '#E86A2B';

  return (
    <View style={[glyphStyles.box, {width: w}]}>
      <View style={[glyphStyles.line, glyphStyles.lineSpaced, {height: thick, width: '100%', backgroundColor: accent}]} />
      <View style={[glyphStyles.line, glyphStyles.lineSpaced, {height: thin, width: '72%', backgroundColor: accent, opacity: 0.75}]} />
      <View style={[glyphStyles.line, glyphStyles.lineSpaced, {height: thin, width: '92%', backgroundColor: accent, opacity: 0.6}]} />
      <View style={[glyphStyles.line, glyphStyles.lineSpaced, {height: thin, width: '55%', backgroundColor: accent, opacity: 0.45}]} />
      <View style={[glyphStyles.line, {height: thick + 1, width: '38%', backgroundColor: accent}]} />
    </View>
  );
}

const glyphStyles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    borderRadius: 2,
  },
  lineSpaced: {
    marginBottom: 5,
  },
});

export default function SlipGoLogo({size = 'default'}: Props) {
  const large = size === 'large';
  const iconBox = large ? 88 : 64;

  return (
    <View style={styles.wrap} accessibilityRole="header">
      <View style={[styles.iconRing, {width: iconBox, height: iconBox, borderRadius: iconBox / 2}]}>
        <View style={[styles.iconInner, {width: iconBox - 16, height: iconBox - 16, borderRadius: (iconBox - 16) / 2}]}>
          <ReceiptGlyph large={large} />
        </View>
      </View>
      <View style={styles.wordmark}>
        <Text style={[styles.slip, large && styles.slipLarge]}>Slip</Text>
        <Text style={[styles.go, large && styles.goLarge]}>Go</Text>
      </View>
      <Text style={styles.tagline}>Receipts & orders, simplified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {alignItems: 'center'},
  iconRing: {
    backgroundColor: '#FFF7F0',
    borderWidth: 2,
    borderColor: '#F4D4BC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconInner: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E86A2B',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  wordmark: {flexDirection: 'row', alignItems: 'baseline'},
  slip: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2C2419',
    letterSpacing: -1,
  },
  slipLarge: {fontSize: 42},
  go: {
    fontSize: 36,
    fontWeight: '800',
    color: '#E86A2B',
    letterSpacing: -1,
  },
  goLarge: {fontSize: 42},
  tagline: {
    marginTop: 8,
    fontSize: 14,
    color: '#8D7B6A',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
