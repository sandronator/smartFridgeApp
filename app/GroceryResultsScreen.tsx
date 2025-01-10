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

export default function GroceryResultsScreen() {
  const { documentDetails } = React.useContext(DocumentDetailsContext);
  console.log("DocumentDetails: ", documentDetails);

  if (!documentDetails) {
    return (
      <View style={styles.container}>
        <Text>No data available.</Text>
      </View>
    );
  }

  // Filter items within valid date range
  const validItems = documentDetails.filter((metadata: any) => {
    const validTo = new Date(metadata.validTo).getTime();
    return validTo > Date.now();
  });

  console.log("validItems: ", validItems);

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
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
          console.log("item: ", item);

          // Handle product image
          const imageUrl = item.productImage ?? null;

          // Handle discounted price
          const discountedPrice = item.discountedPrice
            ? parseFloat(item.discountedPrice)
            : 0;

          // Handle original price
          const originalPrice = item.originalPrice
            ? parseFloat(item.originalPrice)
            : 0;

          // Handle discount percentage
          const discountPercentage = item.discountedPercentage ?? null;

          // Handle title
          const title = item.title ?? null;

          // Handle slug
          const slug = item.slug ?? null;

          // Handle vendor (previously 'source')
          const vendor = item.source ?? null;

          // Handle click-out URL
          // nullify it if it’s one of the placeholders or "None"
          let clickOutUrl = item.clickOutUrl;
          if (
            !clickOutUrl ||
            clickOutUrl === "None" ||
            clickOutUrl === "https://en.wikipedia.org/wiki/HTTP_404"
          ) {
            clickOutUrl = null;
          }

          return (
            <View style={styles.itemContainer}>
              {/* Conditionally display title */}
              {title && <Text style={styles.title}>{title}</Text>}

              {/* Display vendor under the title as "Markt: vendor" */}
              {vendor && <Text style={styles.vendor}>Markt: {vendor}</Text>}

              {/* Conditionally display image */}
              {imageUrl && (
                <Image source={{ uri: imageUrl }} style={styles.image} />
              )}

              {/* Conditionally display price information */}
              {(discountedPrice || originalPrice) && (
                <View style={styles.priceContainer}>
                  {discountedPrice > 0 && (
                    <Text style={styles.discountedPrice}>
                      €{discountedPrice.toFixed(2)}
                    </Text>
                  )}
                  {originalPrice > 0 && (
                    <Text style={styles.originalPrice}>
                      €{originalPrice.toFixed(2)}
                    </Text>
                  )}
                </View>
              )}

              {/* Conditionally display discount percentage (in black) */}
              {discountPercentage && (
                <Text style={styles.discountPercentage}>
                  Save {discountPercentage}%
                </Text>
              )}

              {/* View Product Button */}
              {slug && (
                <Button
                  title="View Product"
                  onPress={() =>
                    Linking.openURL(`https://aktionsfinder.at/p/${slug}`)
                  }
                />
              )}

              {/* Vendor Page Button — only if there's a valid link */}
              {clickOutUrl && (
                <Button
                  title="View Vendor Page"
                  onPress={() => Linking.openURL(clickOutUrl)}
                />
              )}
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
  // New style for the vendor text
  vendor: {
    fontSize: 14,
    marginBottom: 8,
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
  // Updated discountPercentage style: remove red color, keep it simpler
  discountPercentage: {
    fontSize: 14,
    color: "black",
    marginVertical: 4,
  },
});
