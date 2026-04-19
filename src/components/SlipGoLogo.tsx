import React from 'react';
import {View, StyleSheet, Text, Platform} from 'react-native';

const BRAND = {
  orange: '#E86A2B',
  orangeLight: '#FF9F70',
  orangeDeep: '#D45A1F',
  ink: '#1A1512',
  inkMuted: '#6B5E54',
  accent: '#2A9D8F',
  paper: '#FFFCF9',
};

type Props = {
  size?: 'default' | 'large';
};

/** Modern squircle mark: depth layers + tilted receipt slip + motion accent — no icon fonts. */
function BrandMark({large}: {large: boolean}) {
  const outer = large ? 96 : 72;
  const radius = large ? 22 : 18;

  return (
    <View
      style={[
        markStyles.outer,
        {
          width: outer,
          height: outer,
          borderRadius: radius,
        },
      ]}
      accessibilityLabel="SlipGo logo">
      {/* Depth: base + faux gradient */}
      <View style={[markStyles.depthBase, {borderRadius: radius}]} />
      <View
        style={[
          markStyles.depthTop,
          {
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
          },
        ]}
      />

      <View style={markStyles.markCenter}>
        {/* Tilted receipt slip */}
        <View
          style={[
            markStyles.paper,
            {
              width: large ? 38 : 30,
              height: large ? 48 : 38,
              borderRadius: large ? 8 : 6,
              transform: [{rotate: '-8deg'}],
            },
          ]}>
          <View style={[markStyles.paperBar, markStyles.paperBarSp, {width: '88%', opacity: 0.95}]} />
          <View style={[markStyles.paperBar, markStyles.paperBarSp, {width: '62%', opacity: 0.55}]} />
          <View style={[markStyles.paperBar, {width: '78%', opacity: 0.4}]} />
          <View style={markStyles.tear} />
        </View>

        {/* Forward motion streak */}
        <View style={[markStyles.motion, large && markStyles.motionLarge]} />

        {/* Teal accent — matches app tertiary */}
        <View style={[markStyles.spark, large && markStyles.sparkLarge]} />
      </View>
    </View>
  );
}

const markStyles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: BRAND.orangeDeep,
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {elevation: 10},
    }),
  },
  depthBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND.orange,
  },
  depthTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  markCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paper: {
    backgroundColor: BRAND.paper,
    alignItems: 'center',
    paddingTop: 9,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.12,
        shadowRadius: 5,
      },
      android: {elevation: 3},
    }),
  },
  paperBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: BRAND.orangeDeep,
  },
  paperBarSp: {
    marginBottom: 5,
  },
  tear: {
    position: 'absolute',
    right: -2,
    top: '38%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND.orangeLight,
    opacity: 0.9,
  },
  motion: {
    position: 'absolute',
    bottom: '18%',
    right: '14%',
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    transform: [{rotate: '-35deg'}],
  },
  motionLarge: {
    bottom: '20%',
    right: '16%',
    width: 22,
    height: 5,
  },
  spark: {
    position: 'absolute',
    top: '12%',
    right: '12%',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: BRAND.accent,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  sparkLarge: {
    top: '11%',
    right: '11%',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default function SlipGoLogo({size = 'default'}: Props) {
  const large = size === 'large';

  return (
    <View style={styles.wrap} accessibilityRole="header">
      <BrandMark large={large} />

      <View style={styles.wordRow}>
        <Text style={[styles.slip, large && styles.slipLg]}>Slip</Text>
        <View style={styles.goWrap}>
          <Text style={[styles.go, large && styles.goLg]}>Go</Text>
          <View style={styles.underline} />
        </View>
      </View>

      <Text style={[styles.tag, large && styles.tagLg]}>Orders that move</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {alignItems: 'center'},
  wordRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  slip: {
    fontSize: 38,
    fontWeight: '700',
    color: BRAND.ink,
    letterSpacing: -1.8,
  },
  slipLg: {fontSize: 44, letterSpacing: -2},
  goWrap: {marginLeft: 2},
  go: {
    fontSize: 38,
    fontWeight: '800',
    color: BRAND.orange,
    letterSpacing: -1.2,
  },
  goLg: {fontSize: 44},
  underline: {
    marginTop: 2,
    height: 3,
    borderRadius: 2,
    backgroundColor: BRAND.accent,
    opacity: 0.85,
  },
  tag: {
    marginTop: 10,
    fontSize: 13,
    color: BRAND.inkMuted,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  tagLg: {fontSize: 14, marginTop: 12},
});
