import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveAfterPhoto } from '@/lib/reset-service';

const C = { ink: '#19201D', muted: '#68716C', cream: '#F8F6F0', card: '#FFFFFF', green: '#215C48', greenSoft: '#E5EFEA', coral: '#F0785E' };
const goalLabels: Record<string, string> = { quick: 'Quick Reset', guest: 'Guest Ready', calm: 'Clear My Head', function: 'Make It Functional' };

export default function CameraScreen() {
  const { minutes = '10', goal = 'quick', mode = 'before', sessionId } = useLocalSearchParams<{ minutes?: string; goal?: string; mode?: string; sessionId?: string }>();
  const isAfter = mode === 'after';
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function takePhoto() {
    if (!cameraReady || capturing || !cameraRef.current) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) setPhotoUri(photo.uri);
    } finally {
      setCapturing(false);
    }
  }

  async function usePhoto() {
    if (!photoUri) return;
    if (!isAfter) {
      router.push({ pathname: '/plan-preview', params: { minutes, goal, photoUri } });
      return;
    }
    if (!sessionId) return Alert.alert('Missing reset', 'Please return to Progress and try again.');
    setSaving(true);
    try {
      await saveAfterPhoto(sessionId, photoUri);
      router.dismissAll();
      router.navigate('/(tabs)/explore');
    } catch (cause) { Alert.alert('Could not save photo', cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setSaving(false); }
  }

  if (!permission) {
    return <View style={styles.loading}><ActivityIndicator color={C.green} size="large" /></View>;
  }

  if (!permission.granted) {
    const permanentlyDenied = permission.canAskAgain === false;
    return (
      <SafeAreaView style={styles.permissionPage}>
        <StatusBar style="dark" />
        <Pressable accessibilityLabel="Close camera" onPress={() => router.back()} style={styles.permissionClose}><Ionicons name="close" size={26} color={C.ink} /></Pressable>
        <View style={styles.permissionContent}>
          <View style={styles.permissionIcon}><Ionicons name="camera-outline" size={36} color={C.green} /></View>
          <Text style={styles.permissionTitle}>{isAfter ? 'Capture your progress' : 'Let Reset see the room'}</Text>
          <Text style={styles.permissionText}>{isAfter ? 'Take one photo from roughly the same angle so you can see the difference.' : 'Camera access lets you take the one photo Reset needs to build your focused cleanup plan.'}</Text>
          <View style={styles.privateRow}><Ionicons name="lock-closed" size={16} color={C.green} /><Text style={styles.privateText}>Your photo stays private.</Text></View>
          <Pressable onPress={permanentlyDenied ? () => Linking.openSettings() : requestPermission} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>{permanentlyDenied ? 'Open iPhone Settings' : 'Allow camera access'}</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}><Text style={styles.notNow}>Not now</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (photoUri) {
    return (
      <View style={styles.reviewPage}>
        <StatusBar style="light" />
        <Image source={{ uri: photoUri }} style={styles.reviewImage} resizeMode="cover" />
        <SafeAreaView style={styles.reviewOverlay} edges={['top', 'bottom']}>
          <View style={styles.reviewHeader}><Pressable accessibilityLabel="Close review" onPress={() => router.back()} style={styles.darkCircle}><Ionicons name="close" size={25} color="#FFFFFF" /></Pressable><View style={styles.reviewPill}><Text style={styles.reviewPillText}>{isAfter ? 'AFTER PHOTO' : `${minutes} min · ${goalLabels[goal] ?? 'Quick Reset'}`}</Text></View></View>
          <View style={styles.reviewBottom}>
            <Text style={styles.reviewTitle}>{isAfter ? 'Happy with this angle?' : 'Does the room fit in frame?'}</Text><Text style={styles.reviewText}>{isAfter ? 'A similar angle makes your before-and-after easier to compare.' : 'A clear, wide view helps Reset find the highest-impact tasks.'}</Text>
            <View style={styles.reviewActions}>
              <Pressable onPress={() => setPhotoUri(null)} style={styles.retakeButton}><Ionicons name="refresh" size={20} color="#FFFFFF" /><Text style={styles.retakeText}>Retake</Text></Pressable>
              <Pressable disabled={saving} onPress={usePhoto} style={styles.useButton}>{saving ? <ActivityIndicator color={C.green} /> : <><Text style={styles.useText}>{isAfter ? 'Save after photo' : 'Use photo'}</Text><Ionicons name="arrow-forward" size={20} color={C.ink} /></>}</Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.cameraPage}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setCameraReady(true)} />
      <SafeAreaView style={styles.cameraOverlay} edges={['top', 'bottom']}>
        <View style={styles.cameraHeader}><Pressable accessibilityLabel="Close camera" onPress={() => router.back()} style={styles.darkCircle}><Ionicons name="close" size={25} color="#FFFFFF" /></Pressable><View style={styles.cameraPill}><Text style={styles.cameraPillText}>{isAfter ? 'AFTER PHOTO' : `${minutes} min · ${goalLabels[goal] ?? 'Quick Reset'}`}</Text></View><View style={styles.headerSpacer} /></View>
        <View style={styles.guide}><View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} /><View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} /></View>
        <View style={styles.cameraBottom}><Text style={styles.cameraHint}>{isAfter ? 'Match the angle of your first photo if you can' : 'Step back and fit most of the room in frame'}</Text><Pressable accessibilityLabel="Take photo" disabled={!cameraReady || capturing} onPress={takePhoto} style={[styles.shutterOuter, (!cameraReady || capturing) && styles.shutterDisabled]}><View style={styles.shutterInner}>{capturing && <ActivityIndicator color={C.green} />}</View></Pressable></View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream },
  permissionPage: { flex: 1, backgroundColor: C.cream }, permissionClose: { marginLeft: 20, marginTop: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  permissionContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 80 }, permissionIcon: { width: 76, height: 76, borderRadius: 24, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  permissionTitle: { color: C.ink, fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 12 }, permissionText: { color: C.muted, fontSize: 16, lineHeight: 23, textAlign: 'center' }, privateRow: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 18, marginBottom: 30 }, privateText: { color: C.green, fontWeight: '600' },
  permissionButton: { width: '100%', height: 56, borderRadius: 17, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }, permissionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, notNow: { color: C.muted, fontSize: 15, fontWeight: '600', marginTop: 20 },
  cameraPage: { flex: 1, backgroundColor: '#000000' }, cameraOverlay: { flex: 1, paddingHorizontal: 20, justifyContent: 'space-between' }, cameraHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }, darkCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }, headerSpacer: { width: 44 }, cameraPill: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 }, cameraPillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  guide: { position: 'absolute', left: 28, right: 28, top: '20%', bottom: '28%' }, corner: { position: 'absolute', width: 38, height: 38, borderColor: '#FFFFFF' }, topLeft: { left: 0, top: 0, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 12 }, topRight: { right: 0, top: 0, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 12 }, bottomLeft: { left: 0, bottom: 0, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 12 }, bottomRight: { right: 0, bottom: 0, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 12 },
  cameraBottom: { alignItems: 'center', paddingBottom: 10 }, cameraHint: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 16, overflow: 'hidden', marginBottom: 23 }, shutterOuter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, shutterDisabled: { opacity: 0.55 },
  reviewPage: { flex: 1, backgroundColor: '#000000' }, reviewImage: { ...StyleSheet.absoluteFillObject }, reviewOverlay: { flex: 1, justifyContent: 'space-between' }, reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 8 }, reviewPill: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 }, reviewPillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  reviewBottom: { backgroundColor: 'rgba(20,25,23,0.88)', paddingHorizontal: 22, paddingTop: 22, paddingBottom: 10 }, reviewTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginBottom: 7 }, reviewText: { color: '#D5DAD7', fontSize: 14, lineHeight: 20, marginBottom: 19 }, reviewActions: { flexDirection: 'row', gap: 10 }, retakeButton: { flex: 1, height: 54, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, retakeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 }, useButton: { flex: 1.35, height: 54, borderRadius: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, useText: { color: C.ink, fontWeight: '700', fontSize: 15 },
});
