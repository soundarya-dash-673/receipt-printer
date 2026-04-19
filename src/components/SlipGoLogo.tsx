import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {View} from 'react-native';
import {appPalette} from '../theme/slipgoTheme';

type Props = {
  size?: number;
  color?: string;
};

/** Stylized "S" like a receipt slip with zig-zag bottom — vector placeholder. */
export default function SlipGoLogo({size = 56, color = appPalette.primary}: Props) {
  return (
    <View style={{width: size, height: size}}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path
          d="M18 12 C28 8 40 10 44 18 C46 24 42 30 34 34 C26 38 22 42 24 48 C26 54 36 56 46 52"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          transform="rotate(-8 32 32)"
        />
        <Path
          d="M14 46 L18 50 L22 46 L26 50 L30 46 L34 50 L38 46 L42 50 L46 46 L50 50"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}
