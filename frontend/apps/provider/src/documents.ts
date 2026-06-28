import * as ImagePicker from 'expo-image-picker';

/** Pick a single image and return a multipart FormData under `file`. */
export async function pickDocumentForm(): Promise<FormData | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') throw new Error('Permissão de fotos negada.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const form = new FormData();
  form.append('file', {
    uri: asset.uri,
    name: asset.fileName ?? 'document.jpg',
    type: asset.mimeType ?? 'image/jpeg',
  } as unknown as Blob);
  return form;
}
