// TabTwoScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Linking,
  Text,
  Button,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStateManagement } from '@/components/StateManagment'; // Import your state management
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function TabTwoScreen() {
  const { state } = useStateManagement(); // Access the current items
  const [recipes, setRecipes] = useState<any[]>([]); // State to hold recipes
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  // Function to fetch recipes from the API
  const fetchRecipes = async () => {
    setLoading(true);
    try {
      // Extract item names from state
      const itemNames = state.items.map((item) => item.name);

      // Make API request
      const response = await fetch('https://5e9f-46-125-249-116.ngrok-free.app/searchi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemNames }),
      });

      // Parse the response as JSON
      const data = await response.json();

      // Parse the API response
      const parsedRecipes = parseApiResponse(data);

      setRecipes(parsedRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to parse the API response
  const parseApiResponse = (data: any) => {
    try {
      const ingredientsData = data.ingredients;
      const directionsData = data.directions;
      const titlesData = data.titles;

      const recipesList: any[] = [];

      // directionsData and titlesData are now objects, no need to JSON.parse
      const directionsArray = directionsData;
      const titlesArray = titlesData;

      // Loop through the recipes
      for (let i = 0; i < directionsArray.ids.length; i++) {
        // Access the data directly
        const directionItem = {
          id: directionsArray.ids[i],
          document: directionsArray.documents[i],
          metadatas: directionsArray.metadatas[i],
        };

        const titleItem = {
          id: titlesArray.ids[i],
          document: titlesArray.documents[i],
        };

        const ingredientItem = ingredientsData.documents[0][i];

        // Parse the documents if they are JSON strings
        const directions = JSON.parse(directionItem.document);
        const ingredients = JSON.parse(ingredientItem);

        const recipe = {
          id: directionItem.id,
          title: titleItem.document,
          directions: directions,
          link: directionItem.metadatas.link,
          ingredients: ingredients,
        };
        recipesList.push(recipe);
      }

      return recipesList;
    } catch (error) {
      console.error('Error parsing API response:', error);
      return [];
    }
  };

  // Function to check if an ingredient is in the user's items
  const hasIngredient = (ingredient: string) => {
    // Normalize the ingredient
    const normalizedIngredient = ingredient.toLowerCase().trim();

    // Check if any of the user's items match this ingredient
    return state.items.some((item) => {
      const normalizedItemName = item.name.toLowerCase().trim();
      return normalizedIngredient.includes(normalizedItemName);
    });
  };

  // Function to toggle expanded items
  const toggleItem = (index: number) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(index)) {
      newExpandedItems.delete(index);
    } else {
      newExpandedItems.add(index);
    }
    setExpandedItems(newExpandedItems);
  };

  // Function to open the recipe link
  const openLink = (url: string) => {
    Linking.openURL(url.startsWith('http') ? url : `http://${url}`);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Recipes</ThemedText>
      <Button title="Find Recipes" onPress={fetchRecipes} />
      {loading && <ActivityIndicator size="large" style={styles.loading} />}
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.itemContainer}>
            <TouchableOpacity onPress={() => toggleItem(index)}>
              <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
            </TouchableOpacity>
            {expandedItems.has(index) && (
              <View style={styles.expandedContent}>
                <ThemedText style={styles.sectionTitle}>Ingredients:</ThemedText>
                {item.ingredients.map((ingredient: string, idx: number) => {
                  const hasItem = hasIngredient(ingredient);
                  return (
                    <View key={idx} style={styles.ingredientItem}>
                      <Ionicons
                        name="ellipse"
                        size={12}
                        color={hasItem ? 'green' : 'orange'}
                        style={styles.dotIcon}
                      />
                      <ThemedText style={styles.textItem}>{ingredient}</ThemedText>
                    </View>
                  );
                })}
                <ThemedText style={styles.sectionTitle}>Directions:</ThemedText>
                {item.directions.map((direction: string, idx: number) => (
                  <ThemedText key={idx} style={styles.textItem}>
                    {direction}
                  </ThemedText>
                ))}
                <Button title="Go to Page" onPress={() => openLink(item.link)} />
              </View>
            )}
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loading: {
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 8,
  },
  itemTitle: {
    fontSize: 18,
  },
  expandedContent: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: 'bold',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  dotIcon: {
    marginRight: 8,
  },
  textItem: {
    fontSize: 14,
  },
});
