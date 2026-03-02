import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProfile } from '@/lib/hooks/useProfile';
import { scanMenu, createLocation } from '@/lib/services/scanner';
import { useStore } from '@/lib/store/useStore';

export default function ScanScreen() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const currentLocation = useStore((state) => state.currentLocation);
  const setCurrentLocation = useStore((state) => state.setCurrentLocation);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  const handleImageScan = async (imageUri: string) => {
    try {
      setScanning(true);

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];

        let locationId: string | undefined;
        if (currentLocation) {
          const locationData = await createLocation(
            'Current Location',
            currentLocation.latitude,
            currentLocation.longitude
          );
          locationId = locationData.id;
        }

        const result = await scanMenu({
          imageBase64: base64,
          locationId,
          language: 'en',
        });

        router.push({
          pathname: '/scan-result',
          params: { scanId: result.scan_id },
        });
      };

      reader.readAsDataURL(blob);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to scan menu');
    } finally {
      setScanning(false);
      setShowCamera(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageScan(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Camera permission is required to scan menus');
        return;
      }
    }
    setShowCamera(true);
  };

  if (scanning) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Analyzing menu...</Text>
          <Text style={styles.loadingSubtext}>
            This may take a moment as we generate images for each dish
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.container}>
        <CameraView style={styles.camera}>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={async () => {
                const result = await ImagePicker.launchCameraAsync({
                  allowsEditing: true,
                  quality: 0.8,
                });
                if (!result.canceled && result.assets[0]) {
                  await handleImageScan(result.assets[0].uri);
                }
              }}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  const scanLimit = profile?.subscription_tier === 'pro' ? 100 : 5;
  const scansRemaining = scanLimit - (profile?.scans_used_this_month || 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Scan a Menu</Text>
        <Text style={styles.subtitle}>
          Take a photo or upload an image of any menu to get started
        </Text>

        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Scans Remaining This Month</Text>
          <Text style={styles.statsValue}>
            {scansRemaining} / {scanLimit}
          </Text>
          {profile?.subscription_tier === 'free' && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/profile')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={takePhoto}
            disabled={scansRemaining <= 0}
          >
            <Text style={styles.actionButtonIcon}>📸</Text>
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={pickImage}
            disabled={scansRemaining <= 0}
          >
            <Text style={styles.actionButtonIcon}>🖼️</Text>
            <Text style={styles.actionButtonText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>

        {scansRemaining <= 0 && (
          <View style={styles.limitReachedCard}>
            <Text style={styles.limitReachedText}>
              You've reached your monthly scan limit
            </Text>
            <Text style={styles.limitReachedSubtext}>
              Upgrade to Pro for 100 scans per month
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  upgradeButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#4285F4',
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 16,
  },
  actionButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#4285F4',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4285F4',
  },
  actionButtonIcon: {
    fontSize: 24,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    color: '#1a1a1a',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 24,
  },
  cancelButton: {
    padding: 16,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4285F4',
  },
  limitReachedCard: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  limitReachedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  limitReachedSubtext: {
    fontSize: 14,
    color: '#856404',
  },
});
