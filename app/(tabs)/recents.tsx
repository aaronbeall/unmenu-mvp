import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { useScans } from '@/lib/hooks/useScans';

export default function RecentsScreen() {
  const { user } = useAuth();
  const { scans, isLoading } = useScans(user?.id);
  const router = useRouter();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Scans</Text>
        <Text style={styles.subtitle}>
          {scans?.length || 0} {scans?.length === 1 ? 'scan' : 'scans'}
        </Text>
      </View>

      {!scans || scans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No scans yet</Text>
          <Text style={styles.emptySubtext}>
            Scan your first menu to see it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={scans}
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
              <Image
                source={{ uri: item.original_image_url }}
                style={styles.scanImage}
                resizeMode="cover"
              />
              <View style={styles.scanInfo}>
                <Text style={styles.scanLocation}>
                  {item.location?.name || 'Unknown Location'}
                </Text>
                <Text style={styles.scanDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.scanItems}>
                  {item.items?.length || 0} items
                </Text>
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  scanImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  scanInfo: {
    padding: 16,
  },
  scanLocation: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  scanDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scanItems: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '500',
  },
});
