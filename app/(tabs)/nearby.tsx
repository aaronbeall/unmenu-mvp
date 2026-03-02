import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useStore } from '@/lib/store/useStore';
import { useNearbyScans } from '@/lib/hooks/useScans';

export default function NearbyScreen() {
  const router = useRouter();
  const currentLocation = useStore((state) => state.currentLocation);
  const setCurrentLocation = useStore((state) => state.setCurrentLocation);
  const { nearbyScans, isLoading } = useNearbyScans(
    currentLocation?.latitude,
    currentLocation?.longitude
  );

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

  if (!currentLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyText}>Location access needed</Text>
          <Text style={styles.emptySubtext}>
            Enable location services to see nearby restaurant scans
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading nearby scans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Scans</Text>
        <Text style={styles.subtitle}>
          {nearbyScans?.length || 0} scans within 5km
        </Text>
      </View>

      {!nearbyScans || nearbyScans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No nearby scans</Text>
          <Text style={styles.emptySubtext}>
            Be the first to scan a menu in this area!
          </Text>
        </View>
      ) : (
        <FlatList
          data={nearbyScans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.scanCard}
              onPress={() =>
                router.push({
                  pathname: '/scan-result',
                  params: { scanId: item.id },
                })
              }
            >
              <View style={styles.scanInfo}>
                <Text style={styles.scanLocation}>{item.location_name}</Text>
                <Text style={styles.scanDistance}>
                  {item.distance_km.toFixed(1)} km away
                </Text>
                <Text style={styles.scanDate}>
                  Scanned {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.arrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  scanCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scanInfo: {
    flex: 1,
  },
  scanLocation: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  scanDistance: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '500',
    marginBottom: 2,
  },
  scanDate: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 24,
    color: '#ccc',
  },
});
