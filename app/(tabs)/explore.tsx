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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStateManagement } from "@/components/StateManagment";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { DocumentDetailsContext } from "@/components/DocumentDetailsContext";
import HTMLParser from "fast-html-parser";
import BouncyCheckbox from "react-native-bouncy-checkbox";

export default function TabTwoScreen() {
  const { state } = useStateManagement();
  const { updateDocumentDetails } = useContext(DocumentDetailsContext);

  const [recipes, setRecipes] = useState<any[]>([]);
  const [getVendors, setVendors] = useState<string[]>([]);
  const [getVendorsCopy, setVendorsCopy] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [getFindSearchButton, setFindSearchButton] = useState<Boolean>(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Add state for selected search type
  const [searchType, setSearchType] = useState<
    "normal" | "cheapest" | "nearby"
  >("normal");

  // Track whether cheapest is triggered and hold valid cheapest items
  const [cheapestTriggered, setCheapestTriggered] = useState(false);
  const [cheapValidItems, setCheapValidItems] = useState<any[]>([]);

  //Fetch list of vendors and display on nearby otherwise empty the list of vendors
  const handleSearchType = async (searchType: string) => {
    switch (searchType.toLowerCase()) {
      case "nearby":
        setFindSearchButton(false);
        setLoading(true);
        const location = await getLocation();
        if (!location) {
          setLoading(false);
          return;
        }

        const geoLocation = [location.longitude, location.latitude];
        const response = await fetch(
          "https://43e0-212-95-5-3.ngrok-free.app/nearestVendors",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ geoLocation: geoLocation }),
          }
        );

        const vendors = await response.json();
        console.log("vendors: ", vendors);
        setVendors([]);
        setVendorsCopy(vendors);
        setSearchType("nearby");
        setFindSearchButton(true);
        setLoading(false);
        break;
      case "cheapest":
        setSearchType("cheapest");
        setVendors([]);
        setVendorsCopy([]);
        setFindSearchButton(true);
        break;
      case "normal":
        setSearchType("normal");
        setVendors([]);
        setVendorsCopy([]);
        setFindSearchButton(true);
        break;
      default:
        setVendors([]);
        setVendorsCopy([]);
        setFindSearchButton(true);
        break;
    }
  };

  //Helper function for removing vendor on nearby Search
  const addWantedVendor = (vendor: string) => {
    console.log("addvendor: ", vendor);
    setVendors((prevVendors) => {
      if (!prevVendors.includes(vendor)) {
        return [...prevVendors, vendor]; // Add new vendor
      }
      return prevVendors; // No changes if vendor already exists
    });
  };

  //Helper function for removing vendor on nearby Search
  const removeVendor = (vendor: string) => {
    console.log("remove vendor: ", vendor);
    setVendors((prevVendor) => prevVendor.filter((v) => v !== vendor));
  };
  // Function to fetch recipes from the API
  const fetchRecipes = async () => {
    setLoading(true);
    setCheapestTriggered(false); // reset before each fetch
    try {
      // Extract item names from state
      const itemNames = state.items.map((item) => item.name);
      let response;
      let data;
      const location = await getLocation();
      if (!location) {
        setLoading(false);
        return;
      }
      const geoLocation = [location.longitude, location.latitude];

      if (searchType === "normal") {
        setCheapestTriggered(false);
        // Normal search using /receipe endpoint
        response = await fetch(
          "https://43e0-212-95-5-3.ngrok-free.app/receipe",
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
        setCheapestTriggered(true);
        console.log(
          "cheapestvaliditems: ",
          cheapValidItems,
          "cheapestvalidtriggered: ",
          cheapestTriggered
        );
        // Cheapest search using /cheapest endpoint
        // Get user's location

        response = await fetch(
          "https://43e0-212-95-5-3.ngrok-free.app/cheapest",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              geoLocation: geoLocation,
              items: itemNames,
            }),
          }
        );
        parseEndpointV2(response);
      } else if (searchType === "nearby") {
        setCheapestTriggered(false);
        console.log(
          "model: ",
          JSON.stringify({
            vendors: getVendors,
            model: { geoLocation: geoLocation, items: itemNames },
          })
        );
        response = await fetch(
          "https://43e0-212-95-5-3.ngrok-free.app/nearby",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vendors: getVendors,
              model: {
                geoLocation: geoLocation,
                items: itemNames,
              },
            }),
          }
        );
        parseApiResponse(response);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
      Alert.alert("Error", "An error occurred while fetching recipes.");
    } finally {
      setLoading(false);
    }
  };

  const parseEndpointV2 = async (req: Response) => {
    const data = await req.json();
    console.log("data v2: ", data);
    const receipes = data.receipes;
    const grocceries = data.grocceries;
    const cheapValid = validFilter(grocceries);
    const serilizeReceipes = parseApiResponse(receipes);
    setCheapestTriggered(true);
    setCheapValidItems(cheapValid);
    setRecipes(serilizeReceipes);
  };

  // Function to parse the API response for normal search
  const parseApiResponse = (datas: any) => {
    let recipesList: any[] = [];
    let ingredientsData = null;
    let directionData = null;
    let titlesData = null;
    console.log("datalength: ", datas.length);
    console.log("datas: ", datas);

    for (let value of Object.values(datas)) {
      console.log("value", value);
      if (value === "ingredients") {
        ingredientsData = value;
      }
      if (value === "directions") {
        directionData = value;
      }
      if (value === "titles") {
        console.log("titles: ", value);
        titlesData = value;
      }
    }

    if (!ingredientsData || !directionData || !titlesData) {
      console.log(
        "ingredientsData: ",
        ingredientsData,
        "directionsData :",
        directionData,
        "titleData: ",
        titlesData
      );
      console.log("Data not defined");
      throw new Error("Nothing parsed");
    }

    // Loop through the recipes
    for (let i = 0; i < directionData.ids.length; i++) {
      const directionItem = {
        id: directionData.ids[i],
        document: directionData.documents[i],
        metadatas: directionData.metadatas[i],
      };
      const titleItem = {
        id: titlesData.ids[i],
        document: titlesData.documents[i],
      };

      // ingredientsData.documents is assumed to be a nested array.
      // Adjust indexing logic if the structure differs.
      const ingredientItem = ingredientsData.documents[0][i];

      // Parse JSON fields if they are JSON strings
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
  };

  // Function to parse the Nearby API response
  const parseNearbyApiResponse = (data: any) => {
    try {
      const recipesList: any[] = [];
      for (const [id, item] of Object.entries(data)) {
        const recipe = {
          id: id,
          title: item.name,
          link: item.url,
          price: item.price,
          vendor: item.vendor,
          ingredients: item.ingredients,
          directions: item.directions,
          titles: item.titles,
        };
        recipesList.push(recipe);
      }
      return recipesList;
    } catch (error) {
      console.error("Error parsing Nearby API response:", error);
      return [];
    }
  };

  // *** IMPORTANT: Return the valid items from validFilter ***
  const validFilter = (data: any[]) => {
    console.log("data: ", data);
    if (!data || !Array.isArray(data)) return [];
    const validItems = data.filter((metadata: any) => {
      console.log("metadata: ", metadata);
      const validTo = new Date(metadata.validTo).getTime();
      return validTo > Date.now();
    });
    return validItems;
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
    let discountedPrice;
    let normalPrice;
    let imageUrl;
    let offerUrl;
    let validTo;
    const root = HTMLParser.parse(html);
    const allScripts = root.querySelectorAll("script");
    let scriptTag;
    allScripts.forEach((script) => {
      if (script.attributes.type === "application/ld+json") {
        console.log("FOUND USECASE SCRIPT");
        scriptTag = script;
      }
    });

    const titleElement = root.querySelector("title");
    let title = titleElement ? titleElement.text.trim() : "";

    if (scriptTag != null) {
      let attributeJson = JSON.parse(scriptTag.text);
      discountedPrice = attributeJson["lowPrice"];
      normalPrice = attributeJson["highPrice"];
      imageUrl = attributeJson["image"];
      offerUrl = attributeJson["url"];
      validTo = attributeJson["priceValidUntil"];
      if (!title) {
        title = attributeJson["name"];
      }
    }
    return { title, discountedPrice, normalPrice, imageUrl, offerUrl, validTo };
  };

  // Function to handle search for an ingredient
  const searchForGroccerie = async (ingredient: string) => {
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
        "https://43e0-212-95-5-3.ngrok-free.app/grocerie",
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
      const metadatas = data.metadatas[0];
      return metadatas;
    } catch (error) {
      console.log("Error occured during groccerie item lookup");
    }
  };

  const handleSearchIngredient = async (ingredient: string) => {
    const grocceryDetails = await searchForGroccerie(ingredient);
    // Set documentDetails in context
    updateDocumentDetails(grocceryDetails);

    // Navigate to GroceryResultsScreen without passing params
    router.push("/GroceryResultsScreen");
    setLoading(false);
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
          onPress={() => handleSearchType("normal")}
        >
          <Text style={styles.buttonText}>Normal Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.searchButton,
            searchType === "cheapest" && styles.activeButton,
          ]}
          onPress={() => handleSearchType("cheapest")}
        >
          <Text style={styles.buttonText}>Cheapest</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.searchButton,
            searchType === "nearby" && styles.activeButton,
          ]}
          onPress={() => handleSearchType("nearby")}
        >
          <Text style={styles.buttonText}>Nearby</Text>
        </TouchableOpacity>
      </View>

      {/* Fetch Recipes Button */}
      {getFindSearchButton && (
        <Button title="Find Recipes" onPress={fetchRecipes}></Button>
      )}

      {loading && <ActivityIndicator size="large" style={styles.loading} />}

      {getVendorsCopy.length > 0 &&
        getVendorsCopy.map((vendor) => {
          return (
            <BouncyCheckbox
              text={vendor}
              key={vendor}
              onPress={() => {
                if (getVendors.includes(vendor)) {
                  removeVendor(vendor);
                } else {
                  addWantedVendor(vendor);
                }
              }}
              textStyle={{ textDecorationLine: "none" }}
              size={30}
              iconStyle={{ borderColor: "#00ff00" }}
              style={{
                marginBottom: 4.5,
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
              fillColor="#007bff"
            ></BouncyCheckbox>
          );
        })}

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

            {/* Expanded details */}
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

                {/* Conditionally render cheapest items if triggered */}

                {cheapestTriggered && cheapValidItems.length > 0 && (
                  <View style={{ marginTop: 15 }}>
                    <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
                      Cheapest Valid Items:
                    </Text>
                    {cheapValidItems.map((validItem, vIndex) => (
                      <View key={vIndex} style={styles.card}>
                        <Image
                          source={{ uri: validItem.productImage }}
                          style={styles.image}
                        />
                        <Text style={styles.title}>{validItem.title}</Text>
                        <Text>Vendor: {validItem.vendor}</Text>
                        <Text>
                          Discounted Price: ${validItem.discountedPrice}
                        </Text>
                        <Text>
                          Discount Percentage: {validItem.discountedPercentage}%
                        </Text>
                        <Text
                          style={styles.link}
                          onPress={() => Linking.openURL(validItem.clickOutUrl)}
                        >
                          View Product
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
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
  card: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 5,
  },
  link: {
    color: "blue",
    textDecorationLine: "underline",
  },
});
