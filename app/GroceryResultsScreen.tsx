import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Button,
  Linking,
} from "react-native";
import { DocumentDetailsContext } from "@/components/DocumentDetailsContext";

// Helper function to check if today is within the valid range
function isInRange(validFrom, validTo) {
  const now = Date.now();
  const startDate = new Date(validFrom).getTime();
  const endDate = new Date(validTo).getTime();

  // Ensure both dates are valid and the range is correct
  return (
    !isNaN(startDate) && !isNaN(endDate) && startDate <= now && now <= endDate
  );
}

export default function GroceryResultsScreen() {
  const { documentDetails } = React.useContext(DocumentDetailsContext);

  if (!documentDetails) {
    return (
      <View style={styles.container}>
        <Text>No data available.</Text>
      </View>
    );
  }

  // Filter items within valid date range
  const validItems = documentDetails.filter((item) => {
    const { validFrom, validTo } = item.metadatas || {};
    return validFrom && validTo && isInRange(validFrom, validTo);
  });

  if (validItems.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No valid items available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={validItems}
        keyExtractor={(item) => item.document}
        renderItem={({ item }) => {
          const metadatas = item.metadatas || {};
          const imageUrl =
            metadatas.productImage !== "NaN" ? metadatas.productImage : null;
          const discountedPrice = parseFloat(
            metadatas.discountedPrice || "NaN"
          );
          const originalPrice = parseFloat(metadatas.originalPrice || "NaN");
          const discountPercentage = parseFloat(
            metadatas.discountedPercentage || "NaN"
          );
          const title = item.document;

          return (
            <View style={styles.itemContainer}>
              {title && <Text style={styles.title}>{title}</Text>}
              {imageUrl && (
                <Image source={{ uri: imageUrl }} style={styles.image} />
              )}
              {discountedPrice && originalPrice && (
                <View style={styles.priceContainer}>
                  <Text style={styles.discountedPrice}>
                    €{discountedPrice.toFixed(2)}
                  </Text>
                  <Text style={styles.originalPrice}>
                    €{originalPrice.toFixed(2)}
                  </Text>
                </View>
              )}
              {discountPercentage && (
                <Text style={styles.discountPercentage}>
                  Save {discountPercentage}%
                </Text>
              )}
              <Button
                title="View Product"
                onPress={() =>
                  Linking.openURL(`https://aktionsfinder.at/p/${item.document}`)
                }
              />
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  itemContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginVertical: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountedPrice: {
    fontSize: 16,
    color: "green",
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: "gray",
    textDecorationLine: "line-through",
  },
  discountPercentage: {
    fontSize: 14,
    color: "red",
    marginVertical: 4,
  },
});
