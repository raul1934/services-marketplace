import React from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { IconButton, Text, useTheme } from '@chamafacil/shared';
import { MEDICAO_HTML } from '../src/poc/medicaoHtml';

/**
 * POC de Medição por RA embutido via WebView.
 * O conteúdo é o protótipo self-contained (medição + cômodos + 360°). Um baseUrl
 * https dá origem segura ao WebView, habilitando localStorage (persistência do POC)
 * e getUserMedia (câmera). Produção usaria ARKit/ARCore nativo no lugar do WebView.
 */
export default function Medicao() {
  const t = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.surface }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: t.colors.line,
        }}
      >
        <IconButton name="back" accessibilityLabel="Voltar" onPress={() => router.back()} />
        <Text weight="800" style={{ fontSize: 17 }}>
          Medir com RA
        </Text>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => router.push('/ar-medicao')}
          style={{ backgroundColor: t.colors.accent, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 }}
        >
          <Text weight="800" style={{ color: t.colors.accentInk, fontSize: 13 }}>
            ◉ AR nativo
          </Text>
        </Pressable>
      </View>
      <WebView
        source={{ html: MEDICAO_HTML, baseUrl: 'https://chamafacil.local/' }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onPermissionRequest={(event: any) => event?.grant?.(event?.resources)}
      />
    </SafeAreaView>
  );
}
