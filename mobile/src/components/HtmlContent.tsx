import { useState } from 'react';
import { View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useTheme, type ThemeColors } from '../context/theme';

// Renders rich post/case-study HTML (images, tables, YouTube embeds, formatting) with real
// fidelity — a JS-to-native-component mapper (e.g. react-native-render-html) can't render an
// <iframe> or a proper <table> layout at all, and that library hasn't been updated since 2022.
// A WebView renders the same HTML/CSS the web site uses, so anything the editor supports here
// just works. The tradeoff is that a WebView doesn't auto-size to its content inside a ScrollView,
// so we measure document.body.scrollHeight via an injected script and resize the WebView to match,
// with scrolling itself left to the outer screen's ScrollView (scrollEnabled=false here).
export function HtmlContent({ html }: { html: string }) {
  const colors = useTheme();
  const [height, setHeight] = useState(200);

  const document = buildDocument(html, colors);

  const injectedJavaScript = `
    (function() {
      function sendHeight() {
        window.ReactNativeWebView.postMessage(String(document.body.scrollHeight));
      }
      sendHeight();
      window.addEventListener('load', sendHeight);
      if (window.ResizeObserver) {
        new ResizeObserver(sendHeight).observe(document.body);
      } else {
        setInterval(sendHeight, 600);
      }
    })();
    true;
  `;

  const onMessage = (e: WebViewMessageEvent) => {
    const next = parseInt(e.nativeEvent.data, 10);
    if (!Number.isNaN(next) && next > 0 && next !== height) setHeight(next);
  };

  return (
    <View style={{ height, width: '100%' }}>
      <WebView
        source={{ html: document }}
        originWhitelist={['*']}
        scrollEnabled={false}
        injectedJavaScript={injectedJavaScript}
        onMessage={onMessage}
        style={{ backgroundColor: 'transparent' }}
        containerStyle={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
}

function buildDocument(html: string, colors: ThemeColors) {
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    font-family: -apple-system, Roboto, sans-serif;
    font-size: 15.5px;
    line-height: 1.6;
    color: ${colors.fg};
    padding: 0 2px;
  }
  h1, h2, h3 { color: ${colors.fg}; font-weight: 600; line-height: 1.3; }
  h2 { font-size: 21px; margin: 22px 0 10px; }
  h3 { font-size: 18px; margin: 18px 0 8px; }
  p { margin: 0 0 14px; }
  a { color: ${colors.accent}; }
  img { max-width: 100%; height: auto; border-radius: 6px; display: block; margin: 12px 0; }
  iframe { max-width: 100%; width: 100%; aspect-ratio: 16 / 9; border: 0; border-radius: 6px; margin: 12px 0; }
  blockquote { margin: 14px 0; padding: 2px 14px; border-left: 3px solid ${colors.accent}; color: ${colors.muted}; }
  pre { background: ${colors.bg2}; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 13px; }
  code { background: ${colors.bg2}; padding: 1px 5px; border-radius: 3px; font-size: 0.9em; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 13.5px; }
  th, td { border: 1px solid ${colors.line}; padding: 6px 8px; text-align: left; }
  th { background: ${colors.bg2}; font-weight: 600; }
  ul, ol { padding-left: 22px; margin: 0 0 14px; }
  li { margin-bottom: 4px; }
  hr { border: none; border-top: 1px solid ${colors.line}; margin: 20px 0; }
</style>
</head>
<body>${html}</body>
</html>`;
}
