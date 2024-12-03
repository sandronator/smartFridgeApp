// app/(tabs)/TabTwoScreen.tsx

import React, { useState, useContext } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Linking,
  Text,
  Button,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStateManagement } from "@/components/StateManagment";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { DocumentDetailsContext } from "@/components/DocumentDetailsContext";
import HTMLParser from "fast-html-parser";

export default function TabTwoScreen() {
  const { state } = useStateManagement();
  const { setDocumentDetails } = useContext(DocumentDetailsContext);

  const [recipes, setRecipes] = useState<any[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Add state for selected search type
  const [searchType, setSearchType] = useState<
    "normal" | "cheapest" | "nearby"
  >("normal");

  // Function to fetch recipes from the API
  const fetchRecipes = async () => {
    setLoading(true);
    try {
      // Extract item names from state
      const itemNames = state.items.map((item) => item.name);

      let response;
      let data;

      if (searchType === "normal") {
        // Normal search using /receipe endpoint
        response = await fetch(
          "https://3e7b-46-125-249-61.ngrok-free.app/receipe",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ items: itemNames }),
          }
        );
        data = await response.json();
        // Parse the API response
        const parsedRecipes = parseApiResponse(data);
        setRecipes(parsedRecipes);
      } else if (searchType === "cheapest") {
        // Cheapest search using /cheapest endpoint
        // Get user's location
        const location = await getLocation();
        if (!location) {
          setLoading(false);
          return;
        }
        const geoLocation = [location.longitude, location.latitude];

        response = await fetch(
          "https://3e7b-46-125-249-61.ngrok-free.app/cheapest",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              geoLocation: geoLocation,
              names: { items: itemNames },
            }),
          }
        );
        data = await response.json();
        // Parse and set recipes
        const parsedRecipes = parseCheapestApiResponse(data);
        setRecipes(parsedRecipes);
      } else if (searchType === "nearby") {
        // Nearby search using /nearby endpoint
        // Get user's location
        const location = await getLocation();
        if (!location) {
          setLoading(false);
          return;
        }
        const geoLocation = [location.longitude, location.latitude];

        response = await fetch(
          "https://3e7b-46-125-249-61.ngrok-free.app/nearby",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              geoLocation: geoLocation,
              names: { items: itemNames },
            }),
          }
        );
        data = await response.json();
        // Parse and set recipes
        const parsedRecipes = parseNearbyApiResponse(data);
        setRecipes(parsedRecipes);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
      Alert.alert("Error", "An error occurred while fetching recipes.");
    } finally {
      setLoading(false);
    }
  };

  // Function to parse the API response for normal search
  const parseApiResponse = (data: any) => {
    try {
      const ingredientsData = data.ingredients;
      const directionsData = data.directions;
      const titlesData = data.titles;
      const recipesList: any[] = [];

      const directionsArray = directionsData;
      const titlesArray = titlesData;

      // Loop through the recipes
      for (let i = 0; i < directionsArray.ids.length; i++) {
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
      console.error("Error parsing API response:", error);
      return [];
    }
  };

  // Function to parse the Cheapest API response
  const parseCheapestApiResponse = (data: any) => {
    try {
      // data is an object with IDs as keys
      const recipesList: any[] = [];
      for (const [id, item] of Object.entries(data)) {
        const recipe = {
          id: id,
          title: item.name,
          link: item.url,
          price: item.price,
          vendor: item.vendor,
          ingredients: item.ingredients, // Adjust based on actual data structure
          directions: item.directions, // Adjust based on actual data structure
          titles: item.titles, // Adjust based on actual data structure
        };
        recipesList.push(recipe);
      }
      return recipesList;
    } catch (error) {
      console.error("Error parsing Cheapest API response:", error);
      return [];
    }
  };

  // Function to parse the Nearby API response
  const parseNearbyApiResponse = (data: any) => {
    try {
      // data is an object with IDs as keys
      const recipesList: any[] = [];
      for (const [id, item] of Object.entries(data)) {
        const recipe = {
          id: id,
          title: item.name,
          link: item.url,
          price: item.price,
          vendor: item.vendor,
          ingredients: item.ingredients, // Adjust based on actual data structure
          directions: item.directions, // Adjust based on actual data structure
          titles: item.titles, // Adjust based on actual data structure
        };
        recipesList.push(recipe);
      }
      return recipesList;
    } catch (error) {
      console.error("Error parsing Nearby API response:", error);
      return [];
    }
  };

  // Function to check if an ingredient is in the user's items
  const hasIngredient = (ingredient: string) => {
    const normalizedIngredient = ingredient.toLowerCase().trim();
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
    Linking.openURL(url.startsWith("http") ? url : `http://${url}`);
  };

  // Function to get user's location
  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Allow location access to search for recipes based on your location."
        );
        return null;
      }
      let location = await Location.getCurrentPositionAsync({});
      return location.coords;
    } catch (error) {
      console.error("Error getting location:", error);
      return null;
    }
  };

  // Function to parse HTML from the document page using fast-html-parser
  const parseDocumentHtml = (html: string) => {
    const root = HTMLParser.parse(html);

    // Extract title
    const titleElement = root.querySelector("title");
    const title = titleElement ? titleElement.text.trim() : "";

    // Extract meta description
    const metaDescription = root.querySelector('meta[name="description"]');
    const description = metaDescription
      ? metaDescription.getAttribute("content") || ""
      : "";

    // Extract og:image
    const metaImage = root.querySelector('meta[property="og:image"]');
    const imageUrl = metaImage ? metaImage.getAttribute("content") || "" : "";

    // Extract price
    const priceElement = root.querySelector(".price");
    const price = priceElement ? priceElement.text.trim() : "";

    return {
      title,
      description,
      imageUrl,
      price,
    };
  };

  // Function to handle search for ingredient
  const handleSearchIngredient = async (ingredient: string) => {
    try {
      setLoading(true);
      const location = await getLocation();
      if (!location) {
        setLoading(false);
        return;
      }
      const geoLocation = [location.longitude, location.latitude];

      // Make the POST request to the grocerie endpoint
      const response = await fetch(
        "https://3e7b-46-125-249-61.ngrok-free.app/grocerie",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wantedItem: ingredient,
            geoLocation: geoLocation,
          }),
        }
      );
      const data = await response.json();

      // Process the response, get the documents
      const documents = data.documents[0]; // Adjust based on actual response structure

      // For each document, make a request to https://aktionsfinder.at/p/{document}
      const documentDetails = await Promise.all(
        documents.map(async (doc: string) => {
          const docResponse = await fetch(`https://aktionsfinder.at/p/${doc}`);
          const html = await docResponse.text();

          // Parse the HTML to extract necessary information
          const info = parseDocumentHtml(html);

          return {
            document: doc,
            info: info,
          };
        })
      );

      // Set documentDetails in context
      setDocumentDetails(documentDetails);

      // Navigate to GroceryResultsScreen without passing params
      router.push("/GroceryResultsScreen");
    } catch (error) {
      console.error("Error searching for ingredient:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.margin}></ThemedText>

      {/* Search Option Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.searchButton,
            searchType === "normal" && styles.activeButton,
          ]}
          onPress={() => setSearchType("normal")}
        >
          <Text style={styles.buttonText}>Normal Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.searchButton,
            searchType === "cheapest" && styles.activeButton,
          ]}
          onPress={() => setSearchType("cheapest")}
        >
          <Text style={styles.buttonText}>Cheapest</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.searchButton,
            searchType === "nearby" && styles.activeButton,
          ]}
          onPress={() => setSearchType("nearby")}
        >
          <Text style={styles.buttonText}>Nearby</Text>
        </TouchableOpacity>
      </View>

      {/* Fetch Recipes Button */}
      <Button title="Find Recipes" onPress={fetchRecipes} />

      {loading && <ActivityIndicator size="large" style={styles.loading} />}
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.itemContainer}>
            <TouchableOpacity onPress={() => toggleItem(index)}>
              <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
              {/* Display price and vendor if available */}
              {item.price && (
                <ThemedText style={styles.itemPrice}>
                  Price: {item.price}
                </ThemedText>
              )}
              {item.vendor && (
                <ThemedText style={styles.itemVendor}>
                  Vendor: {item.vendor}
                </ThemedText>
              )}
            </TouchableOpacity>
            {expandedItems.has(index) && (
              <View style={styles.expandedContent}>
                <ThemedText style={styles.sectionTitle}>
                  Ingredients:
                </ThemedText>
                {item.ingredients &&
                  item.ingredients.map((ingredient: string, idx: number) => {
                    const hasItem = hasIngredient(ingredient);
                    return (
                      <View key={idx} style={styles.ingredientItem}>
                        <Ionicons
                          name="ellipse"
                          size={12}
                          color={hasItem ? "green" : "orange"}
                          style={styles.dotIcon}
                        />
                        <ThemedText style={styles.textItem}>
                          {ingredient}
                        </ThemedText>
                        {!hasItem && (
                          <Button
                            title="Search"
                            onPress={() => handleSearchIngredient(ingredient)}
                          />
                        )}
                      </View>
                    );
                  })}
                <ThemedText style={styles.sectionTitle}>Directions:</ThemedText>
                {item.directions &&
                  item.directions.map((direction: string, idx: number) => (
                    <ThemedText key={idx} style={styles.textItem}>
                      {direction}
                    </ThemedText>
                  ))}
                <Button
                  title="Go to Page"
                  onPress={() => openLink(item.link)}
                />
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
  margin: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  searchButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
    alignItems: "center",
    borderRadius: 5,
  },
  activeButton: {
    backgroundColor: "#007bff",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 8,
  },
  itemTitle: {
    fontSize: 18,
  },
  itemPrice: {
    fontSize: 16,
    color: "green",
  },
  itemVendor: {
    fontSize: 16,
    color: "blue",
  },
  expandedContent: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: "bold",
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  dotIcon: {
    marginRight: 8,
  },
  textItem: {
    fontSize: 14,
    flex: 1,
  },
});
