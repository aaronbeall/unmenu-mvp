import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useScanById } from '@/lib/hooks/useScans';

export default function ScanResultScreen() {
  const { scanId } = useLocalSearchParams();
  const { scan, isLoading } = useScanById(scanId as string);
  const router = useRouter();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading scan results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!scan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Scan not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu Scan</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {scan.location && (
          <View style={styles.locationCard}>
            <Text style={styles.locationIcon}>📍</Text>
            <View>
              <Text style={styles.locationName}>{scan.location.name}</Text>
              {scan.location.address && (
                <Text style={styles.locationAddress}>{scan.location.address}</Text>
              )}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          Menu Items ({scan.items?.length || 0})
        </Text>

        {scan.items?.map((item: any) => (
          <View key={item.id} style={styles.itemCard}>
            {item.generated_image_url && (
              <Image
                source={{ uri: item.generated_image_url }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.itemContent}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.price && <Text style={styles.itemPrice}>{item.price}</Text>}
              </View>

              {item.original_name && item.original_name !== item.name && (
                <Text style={styles.itemOriginalName}>{item.original_name}</Text>
              )}

              {item.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}

              {item.description && (
                <Text style={styles.itemDescription}>{item.description}</Text>
              )}

              {item.taste_profile && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Taste Profile</Text>
                  <Text style={styles.infoText}>{item.taste_profile}</Text>
                </View>
              )}

              {item.similar_dishes && item.similar_dishes.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Similar To</Text>
                  <Text style={styles.infoText}>{item.similar_dishes.join(', ')}</Text>
                </View>
              )}

              {item.allergens && item.allergens.length > 0 && (
                <View style={styles.allergenSection}>
                  <Text style={styles.allergenLabel}>⚠️ Possible Allergens</Text>
                  <View style={styles.allergenList}>
                    {item.allergens.map((allergen: string, index: number) => (
                      <View key={index} style={styles.allergenBadge}>
                        <Text style={styles.allergenText}>{allergen}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: '#4285F4',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  locationIcon: {
    fontSize: 24,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4285F4',
    marginLeft: 12,
  },
  itemOriginalName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4285F4',
    textTransform: 'uppercase',
  },
  itemDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  infoSection: {
    marginTop: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  allergenSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  allergenLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  allergenList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  allergenText: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '500',
  },
});
