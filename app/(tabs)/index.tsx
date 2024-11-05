import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Button, FlatList } from 'react-native';
import { useStateManagement } from '@/components/StateManagment'; // Import the custom hook
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';

export default function HomeScreen() {
  const { state, dispatch } = useStateManagement(); // Access state and dispatch
  const [newItemName, setNewItemName] = useState(''); // Track new item name

  // Function to add a new item
  const addItem = () => {
    if (newItemName.trim()) {
      dispatch({ type: 'ADD_ITEM', payload: newItemName });
      setNewItemName(''); // Clear input field after adding
    }
  };

  // Function to delete an item
  const deleteItem = (id: string) => {
    dispatch({ type: 'DELETE_ITEM', payload: id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter item name"
        value={newItemName}
        onChangeText={setNewItemName}
      />

      <FlatList
        data={state.items}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <ThemedText style={styles.itemText}>{item.name}</ThemedText>
            <Button title="X" color="red" onPress={() => deleteItem(item.id)} />
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
      <Button title="Add Item" onPress={addItem} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  itemText: {
    fontSize: 18,
  },
});
