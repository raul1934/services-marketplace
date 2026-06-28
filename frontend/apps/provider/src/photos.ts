import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { http } from '@walvee/shared';

export interface PickedPhoto {
  uri: string;
  fileName: string;
  mimeType: string;
}

/**
 * Append a picked photo to FormData as a real file.
 * On web the RN `{ uri, name, type }` shape serializes to "[object Object]"
 * (→ 422 on `image` validation), so we fetch the uri into a Blob and append
 * that with a filename. On native the RN shape is what the bridge expects.
 */
export async function appendPhoto(form: FormData, field: string, p: PickedPhoto): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = await fetch(p.uri).then((r) => r.blob());
    form.append(field, blob, p.fileName);
  } else {
    form.append(field, { uri: p.uri, name: p.fileName, type: p.mimeType } as unknown as Blob);
  }
}

/** Pick up to `remaining` images from the library. */
export async function pickPhotos(remaining: number): Promise<PickedPhoto[]> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') throw new Error('Permissão de fotos negada.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.7,
  });
  if (result.canceled) return [];

  return result.assets.map((a, i) => ({
    uri: a.uri,
    fileName: a.fileName ?? `photo-${i}.jpg`,
    mimeType: a.mimeType ?? 'image/jpeg',
  }));
}

/**
 * Upload one or more photos to the single upload endpoint (`POST uploads`,
 * field `photos[]`) and return their media `{ id, url }`. The caller passes the
 * ids to the owning create/update/action (upload-first).
 */
export async function uploadPhotos(photos: PickedPhoto[]): Promise<{ id: number; url: string }[]> {
  const form = new FormData();
  for (const p of photos) {
    await appendPhoto(form, 'photos[]', p);
  }
  return http.post<{ data: { id: number; url: string }[] }>('uploads', { form }).then((r) => r.data);
}
