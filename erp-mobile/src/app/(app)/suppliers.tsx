import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import apiClient from '../../api/client';
import { MaterialIcons } from '@expo/vector-icons';

interface Supplier {
  _id: string;
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
}

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const response = await apiClient.get('/suppliers');
      setSuppliers(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch suppliers', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSuppliers();
  };

  const renderItem = ({ item }: { item: Supplier }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="local-shipping" size={24} color="#ff9800" />
        <Text style={styles.name}>{item.name}</Text>
      </View>
      <View style={styles.cardBody}>
        {item.contactPerson ? <Text style={styles.infoText}><MaterialIcons name="person" size={16} /> {item.contactPerson}</Text> : null}
        {item.email ? <Text style={styles.infoText}><MaterialIcons name="email" size={16} /> {item.email}</Text> : null}
        {item.phone ? <Text style={styles.infoText}><MaterialIcons name="phone" size={16} /> {item.phone}</Text> : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff9800" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={suppliers}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No suppliers found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  cardBody: {
    gap: 6,
  },
  infoText: {
    color: '#555',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
  },
});
