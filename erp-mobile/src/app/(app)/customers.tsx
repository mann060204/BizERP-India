import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import apiClient from '../../api/client';
import { MaterialIcons } from '@expo/vector-icons';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/customers');
      setCustomers(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const renderItem = ({ item }: { item: Customer }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="person" size={24} color="#4caf50" />
        <Text style={styles.name}>{item.name}</Text>
      </View>
      <View style={styles.cardBody}>
        {item.company ? <Text style={styles.infoText}><MaterialIcons name="business" size={16} /> {item.company}</Text> : null}
        {item.email ? <Text style={styles.infoText}><MaterialIcons name="email" size={16} /> {item.email}</Text> : null}
        {item.phone ? <Text style={styles.infoText}><MaterialIcons name="phone" size={16} /> {item.phone}</Text> : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={customers}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No customers found.</Text>
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
