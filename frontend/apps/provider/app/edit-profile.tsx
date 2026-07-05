import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Alert } from '@walvee/shared';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Avatar, BackBar, Button, Card, Field, Icon, Row, Screen, Text, Toggle, useAuth, useTheme } from '@walvee/shared';
import { providerApi } from '../src/api';
import { pickPhotos, uploadPhotos } from '../src/photos';

export default function EditProfile() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { user, refresh } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState(user?.provider_profile?.bio ?? '');
  const [insured, setInsured] = useState(!!user?.provider_profile?.insured);

  const save = useMutation({
    mutationFn: () => providerApi.updateProfile({ name: name.trim(), phone: phone.trim() || undefined, bio: bio.trim() || undefined, insured }),
    onSuccess: async () => {
      await refresh();
      Alert.alert(tr('common.saved'), tr('editProfile.saved'));
      router.back();
    },
    onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
  });

  const changeAvatar = async () => {
    try {
      const [pic] = await pickPhotos(1);
      if (!pic) return;
      // Upload-first: upload the photo, then set the avatar by its media id.
      const [m] = await uploadPhotos([pic]);
      if (m) await providerApi.updateProfile({ avatar_media_id: m.id });
      await refresh();
    } catch (e) {
      Alert.alert(tr('common.error'), (e as Error).message);
    }
  };

  return (
    <Screen stickyHeader padded={false}>
      <BackBar title={tr('editProfile.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        <View style={{ alignItems: 'center', marginTop: 6 }}>
          <Pressable onPress={changeAvatar}>
            <Avatar name={user?.name} uri={user?.avatar_url} size={84} />
            <View style={{ position: 'absolute', right: -4, bottom: -4, width: 32, height: 32, borderRadius: 16, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.colors.bg }}>
              <Icon name="camera" size={15} color={t.colors.accentInk} />
            </View>
          </Pressable>
        </View>

        <Field label={tr('editProfile.name')} value={name} onChangeText={setName} placeholder={tr('editProfile.namePlaceholder')} />
        <Field label={tr('editProfile.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+55 11 9..." />
        <Field label={tr('editProfile.bio')} value={bio} onChangeText={setBio} placeholder={tr('editProfile.bioPlaceholder')} multiline style={{ height: 84, textAlignVertical: 'top' }} />

        <Card flat onPress={() => setInsured((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shieldCheck" size={20} color={t.colors.ok} />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="700" style={{ fontSize: 14 }}>{tr('editProfile.insuranceTitle')}</Text>
            <Text variant="caption">{tr('editProfile.insuranceSub')}</Text>
          </View>
          <Toggle on={insured} />
        </Card>

        <Button title={tr('editProfile.save')} full loading={save.isPending} onPress={() => save.mutate()} style={{ marginTop: 4 }} />
      </View>
    </Screen>
  );
}
