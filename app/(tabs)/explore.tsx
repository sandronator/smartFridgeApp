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

  // Nearby vendors list: expanded by default
  const [showNearbyVendors, setShowNearbyVendors] = useState<boolean>(true);

  // Cheapest items list: expanded by default
  const [showCheapestItems, setShowCheapestItems] = useState<boolean>(true);

  // Add state for selected search type
  const [searchType, setSearchType] = useState<
    "normal" | "cheapest" | "nearby"
  >("normal");

  // Track whether cheapest is triggered and hold valid cheapest items
  const [cheapestTriggered, setCheapestTriggered] = useState(false);
  const [cheapValidItems, setCheapValidItems] = useState<any[]>([]);

  // ------------------------------------------
  //  handleSearchType
  // ------------------------------------------
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
          "https://ed2a-213-142-96-15.ngrok-free.app/nearestVendors",
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

  // ------------------------------------------
  //  Add / Remove vendors
  // ------------------------------------------
  const addWantedVendor = (vendor: string) => {
    console.log("addvendor: ", vendor);
    setVendors((prevVendors) => {
      if (!prevVendors.includes(vendor)) {
        return [...prevVendors, vendor];
      }
      return prevVendors;
    });
  };

  const removeVendor = (vendor: string) => {
    console.log("remove vendor: ", vendor);
    setVendors((prevVendor) => prevVendor.filter((v) => v !== vendor));
  };

  // ------------------------------------------
  //  fetchRecipes
  // ------------------------------------------
  const fetchRecipes = async () => {
    setLoading(true);
    setCheapestTriggered(false);

    try {
      const itemNames = state.items.map((item) => item.name);
      let response;
      const location = await getLocation();
      if (!location) {
        setLoading(false);
        return;
      }
      const geoLocation = [location.longitude, location.latitude];

      if (searchType === "normal") {
        setCheapestTriggered(false);
        response = await fetch(
          "https://ed2a-213-142-96-15.ngrok-free.app/receipe",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: itemNames }),
          }
        );
        const data = await response.json();
        const parsedRecipes = parseApiResponse(data);
        console.log("parsedReceipes: ", parsedRecipes);
        setRecipes(parsedRecipes);
      } else if (searchType === "cheapest") {
        setCheapestTriggered(true);
        response = await fetch(
          "https://ed2a-213-142-96-15.ngrok-free.app/cheapest",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
          "https://ed2a-213-142-96-15.ngrok-free.app/nearby",
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
        parseEndpointV2(response);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
      Alert.alert("Error", "An error occurred while fetching recipes.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  //  parseEndpointV2
  // ------------------------------------------
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

  // ------------------------------------------
  //  parseApiResponse
  // ------------------------------------------
  const parseApiResponse = (datas: any) => {
    let recipesList: any[] = [];
    let aiResults_raw_list: any[] = [];

    for (let [_, value] of Object.entries(datas)) {
      let merged = {
        ingredientsData: null,
        directionsData: null,
        titlesData: null,
      };

      for (let [subkey, subvalue] of Object.entries(value)) {
        if (subkey === "ingredients") {
          merged.ingredientsData = subvalue;
        }
        if (subkey === "directions") {
          merged.directionsData = subvalue;
        }
        if (subkey === "titles") {
          merged.titlesData = subvalue;
        }
      }
      aiResults_raw_list.push(merged);
    }

    for (let item of aiResults_raw_list) {
      if (!item.directionsData?.ids) continue;

      for (let i = 0; i < item.directionsData.ids.length; i++) {
        const directionItem = {
          id: item.directionsData.ids[i],
          document: item.directionsData.documents[i],
          metadatas: item.directionsData.metadatas[i],
        };
        const titleItem = {
          id: item.titlesData?.ids?.[i],
          document: item.titlesData?.documents?.[i],
        };
        const ingredientItem =
          item.ingredientsData?.documents?.[0]?.[i] ?? "[]";

        const directions = JSON.parse(directionItem.document ?? "[]");
        const ingredients = JSON.parse(ingredientItem ?? "[]");

        const recipe = {
          id: directionItem.id,
          title: titleItem?.document ?? "",
          directions,
          link: directionItem.metadatas?.link ?? "",
          ingredients,
        };

        recipesList.push(recipe);
      }
    }

    return recipesList;
  };

  // ------------------------------------------
  //  validFilter
  // ------------------------------------------
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

  // ------------------------------------------
  //  hasIngredient
  // ------------------------------------------
  const hasIngredient = (ingredient: string) => {
    const normalizedIngredient = ingredient.toLowerCase().trim();
    return state.items.some((item) => {
      const normalizedItemName = item.name.toLowerCase().trim();
      return normalizedIngredient.includes(normalizedItemName);
    });
  };

  // ------------------------------------------
  //  toggleItem
  // ------------------------------------------
  const toggleItem = (index: number) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(index)) {
      newExpandedItems.delete(index);
    } else {
      newExpandedItems.add(index);
    }
    setExpandedItems(newExpandedItems);
  };

  // ------------------------------------------
  //  openLink
  // ------------------------------------------
  const openLink = (url: string) => {
    Linking.openURL(url.startsWith("http") ? url : `http://${url}`);
  };

  // ------------------------------------------
  //  getLocation
  // ------------------------------------------
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

  // ------------------------------------------
  //  parseDocumentHtml
  // ------------------------------------------
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

  // ------------------------------------------
  //  searchForGroccerie
  // ------------------------------------------
  const searchForGroccerie = async (ingredient: string) => {
    try {
      setLoading(true);
      const location = await getLocation();
      if (!location) {
        setLoading(false);
        return;
      }
      const geoLocation = [location.longitude, location.latitude];

      const response = await fetch(
        "https://ed2a-213-142-96-15.ngrok-free.app/grocerie",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wantedItem: ingredient,
            geoLocation: geoLocation,
          }),
        }
      );
      const data = await response.json();

      const metadatas = data.metadatas[0];
      return metadatas;
    } catch (error) {
      console.log("Error occured during groccerie item lookup");
    }
  };

  // ------------------------------------------
  //  handleSearchIngredient
  // ------------------------------------------
  const handleSearchIngredient = async (ingredient: string) => {
    const grocceryDetails = await searchForGroccerie(ingredient);
    // Set documentDetails in context
    updateDocumentDetails(grocceryDetails);
    // Navigate to GroceryResultsScreen
    router.push("/GroceryResultsScreen");
    setLoading(false);
  };

  // ------------------------------------------
  //  Render
  // ------------------------------------------
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

      {/* Button that only shows if getFindSearchButton is true */}
      {getFindSearchButton && (
        <Button title="Find Recipes" onPress={fetchRecipes} />
      )}

      {/* Loading Indicator */}
      {loading && <ActivityIndicator size="large" style={styles.loading} />}

      {/* 
        If 'nearby' mode and vendors exist, 
        display a small title "Markets" (opacity 50%) plus arrow icon.
        Default expanded: showNearbyVendors = true
      */}
      {searchType === "nearby" && getVendorsCopy.length > 0 && (
        <>
          <TouchableOpacity
            style={[styles.arrowContainer, styles.arrowRow]}
            onPress={() => setShowNearbyVendors((prev) => !prev)}
          >
            <Text style={styles.labelOpacity}>Markets</Text>
            {showNearbyVendors ? (
              <Ionicons name="chevron-up" size={24} color="black" />
            ) : (
              <Ionicons name="chevron-down" size={24} color="black" />
            )}
          </TouchableOpacity>

          {/* Conditionally render the vendor checkboxes if expanded */}
          {showNearbyVendors && (
            <View style={styles.checkboxContainer}>
              {getVendorsCopy.map((vendor) => {
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
                      flexDirection: "row",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                    }}
                    fillColor="#007bff"
                  />
                );
              })}
            </View>
          )}
        </>
      )}

      {/* Recipe List */}
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

            {/* Expanded section for each recipe */}
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

                {/* 
                  Expand/Collapse for cheapest valid items (if available).
                  Title "Bestfit" at 50% opacity, arrow icon, expanded by default.
                */}
                {cheapestTriggered && cheapValidItems.length > 0 && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.arrowContainer,
                        styles.arrowRow,
                        { marginTop: 10 },
                      ]}
                      onPress={() => setShowCheapestItems((prev) => !prev)}
                    >
                      <Text style={styles.labelOpacity}>Bestfit</Text>
                      {showCheapestItems ? (
                        <Ionicons name="chevron-up" size={24} color="black" />
                      ) : (
                        <Ionicons name="chevron-down" size={24} color="black" />
                      )}
                    </TouchableOpacity>

                    {showCheapestItems && (
                      <View style={{ marginTop: 15 }}>
                        {cheapValidItems.map((validItem, vIndex) => (
                          <View key={vIndex} style={styles.card}>
                            <Image
                              source={{ uri: validItem.productImage }}
                              style={styles.image}
                            />
                            <Text style={styles.title}>{validItem.title}</Text>
                            <Text>Vendor: {validItem.vendor}</Text>
                            {/* Use € instead of $ */}
                            <Text>
                              Discounted Price: €{validItem.discountedPrice}
                            </Text>
                            <Text>
                              Discount Percentage:{" "}
                              {validItem.discountedPercentage}%
                            </Text>
                            <Text
                              style={styles.link}
                              onPress={() =>
                                Linking.openURL(validItem.clickOutUrl)
                              }
                            >
                              View Product
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
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

  // Arrow container & text
  arrowContainer: {
    alignSelf: "flex-start",
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 8,
  },
  arrowRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  labelOpacity: {
    opacity: 0.5,
    marginRight: 6, // space between text and arrow
  },

  checkboxContainer: {
    marginVertical: 8,
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
