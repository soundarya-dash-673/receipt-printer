import React from 'react';

type Props = {
  source?: {html?: string; uri?: string};
  style?: object;
  scrollEnabled?: boolean;
};

/** Browser iframe preview for receipt HTML (webpack web bundle only). */
export function WebView({source, style}: Props) {
  const html = source?.html ?? '';
  return React.createElement('iframe', {
    title: 'receipt-preview',
    srcDoc: html,
    style: {
      border: 'none',
      width: '100%',
      height: '100%',
      minHeight: 360,
      backgroundColor: '#fff',
      ...(style as object),
    },
  });
}

export default WebView;
