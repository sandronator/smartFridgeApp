import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Button,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
  TextInput,
} from "react-native";
import { useStateManagement } from "@/components/StateManagment";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const { state, dispatch } = useStateManagement();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");

  const deleteItem = (id: string) => {
    dispatch({ type: "DELETE_ITEM", payload: id });
  };

  const addItem = () => {
    if (newItemName.trim() === "") {
      return; // Do not add empty items
    }

    const newItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      nutrition: null, // You can set this based on your requirements
    };

    dispatch({ type: "ADD_ITEM", payload: newItem });
    setNewItemName(""); // Clear the input field
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={state.items}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              // Animate layout changes
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut
              );

              // Toggle visibility
              setExpandedItemId(expandedItemId === item.id ? null : item.id);
            }}
          >
            <View style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <Text
                  style={[
                    styles.itemText,
                    expandedItemId === item.id && styles.itemTextExpanded,
                  ]}
                >
                  {item.name}
                </Text>
                <Button
                  title="X"
                  color="red"
                  onPress={() => deleteItem(item.id)}
                />
              </View>
              {/* Conditionally render nutrition facts */}
              {expandedItemId === item.id && item.nutrition && (
                <View style={styles.nutritionContainer}>
                  {Object.entries(item.nutrition).map(([key, value]) => (
                    <Text key={key} style={styles.nutritionText}>
                      {key}: {value}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
      />
      {/* Input Field and Add Button */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Add a new item"
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <Button title="Add" onPress={addItem} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    padding: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
  },
  itemContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemText: {
    fontSize: 18,
  },
  itemTextExpanded: {
    fontWeight: "bold",
  },
  nutritionContainer: {
    marginTop: 5,
  },
  nutritionText: {
    fontSize: 14,
    color: "#555",
  },
});
