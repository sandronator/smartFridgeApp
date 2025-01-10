// app/(tabs)/CameraScreen.tsx

import React, { useState, useEffect, useRef } from "react";
import { Text, View, StyleSheet, Button, Alert } from "react-native";
import { Camera, CameraView } from "expo-camera";
import CustomToast from "../../components/CustomToast";
import { useStateManagement } from "@/components/StateManagment"; // Corrected import
import { v4 as uuidv4 } from "uuid";
import { useSegments } from "expo-router";

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const scanning = useRef(false);
  const { dispatch } = useStateManagement();
  const segment = useSegments();
  const [isCameraActive, setCameraState] = useState(false);
  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getCameraPermissions();

    setCameraState(segment.includes("CameraScreen"));
  }, [segment]);

  const handleBarcodeScanned = ({ type, data }) => {
    console.log("barcode scan triggered");

    if (scanning.current) {
      return;
    }

    console.log("barcode scan forward");
    scanning.current = true; // Set to true synchronously
    setScanned(true);
    setLoading(true);

    console.log("scanning.current (should be true):", scanning.current);

    fetch("https://1772-213-142-96-15.ngrok-free.app/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ barcode: data }),
    })
      .then((response) => response.json())
      .then((jsonArray) => {
        console.log("typeof jsonarray: ", typeof jsonArray);
        if (jsonArray != null) {
          console.log("protein: ", jsonArray.Protein);
          const itemName = jsonArray.Title || "Unknown Item";
          delete jsonArray.Title;
          console.log("jsonarray after delete: ", jsonArray);
          const item = {
            id: uuidv4(),
            name: itemName,
            nutrition: jsonArray,
          };
          dispatch({ type: "ADD_ITEM", payload: item });
          setToastVisible(true);
        } else {
          Alert.alert("No data found for this barcode.");
          scanning.current = false; // Reset scanning
          setScanned(false); // Reset state if needed
        }
      })
      .catch((error) => {
        console.error(error);
        Alert.alert("Error fetching data", error.message);
        scanning.current = false; // Reset scanning on error
        setScanned(false); // Reset state if needed
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const selectStrings = (items: Array<Object>) => {
    const itemValues = Object.values(items);
    console.log("itemValues: ", itemValues);
    const itemTexts = itemValues.map((item) => {
      console.log("item: ", item);
      // Extract all string values from the item
      const values = Object.values(item);
      const textValues = values.filter((v) => typeof v === "string");
      const text = textValues.join(" ").toLowerCase(); // Normalize to lowercase
      return text;
    });

    // Calculate lengths
    const lengths = itemTexts.map((text) => text.length);

    // Calculate average length
    const totalLength = lengths.reduce((sum, len) => sum + len, 0);
    const averageLength = totalLength / lengths.length;

    // Filter items based on length within 10% of average length
    const acceptableItems = [];
    const acceptableItemTexts = [];

    for (let i = 0; i < items.length; i++) {
      const length = lengths[i];
      const text = itemTexts[i];

      const lengthDiffPercent =
        Math.abs(length - averageLength) / averageLength;

      if (lengthDiffPercent <= 0.1) {
        // Length is within 10% of average
        acceptableItems.push(items[i]);
        acceptableItemTexts.push(text);
      }
      // Else, discard the item
    }

    // If no items are acceptable based on length, proceed with all items
    if (acceptableItems.length === 0) {
      acceptableItems.push(...items);
      acceptableItemTexts.push(...itemTexts);
    }

    // Step 2: Collect all characters and count their frequencies
    const charCounts = {};
    const allChars = acceptableItemTexts.join("").split("");
    allChars.forEach((char) => {
      charCounts[char] = (charCounts[char] || 0) + 1;
    });

    // Step 3: Rank the characters based on frequency
    const chars = Object.keys(charCounts);
    chars.sort((a, b) => charCounts[b] - charCounts[a]); // Sort descending

    // Step 4: Divide characters into quartiles
    const quartileSize = Math.ceil(chars.length / 4);
    const topQuartile = chars.slice(0, quartileSize);
    const secondQuartile = chars.slice(quartileSize, quartileSize * 2);
    const thirdQuartile = chars.slice(quartileSize * 2, quartileSize * 3);
    const fourthQuartile = chars.slice(quartileSize * 3);

    // Step 5: Calculate score for each acceptable item
    const itemScores = acceptableItems.map((item, index) => {
      const text = acceptableItemTexts[index];
      let score = 0;

      // Character scoring
      for (const char of text) {
        if (topQuartile.includes(char)) {
          score += 3; // Assign higher value
        } else if (secondQuartile.includes(char)) {
          score += 1; // Assign lower value
        } else if (thirdQuartile.includes(char)) {
          score -= 1; // Subtract value
        } else if (fourthQuartile.includes(char)) {
          score -= 2; // Subtract more
        } else {
          // Characters not in the list
          score -= 1;
        }
      }

      return { item, score };
    });

    // Step 6: Select the item with the highest score
    itemScores.sort((a, b) => b.score - a.score);

    return itemScores[0].item;
  };

  const handleToastClose = () => {
    setToastVisible(false);
    scanning.current = false; // Allow scanning again
    setScanned(false); // Reset state if needed
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission</Text>;
  }
  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text>No access to camera</Text>
        <Button
          title="Allow Camera"
          onPress={() =>
            Camera.requestCameraPermissionsAsync().then(({ status }) =>
              setHasPermission(status === "granted")
            )
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!scanned && isCameraActive && (
        <CameraView
          onBarcodeScanned={handleBarcodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {/* Removed the 'Scan Again' button */}
      {/* Display the Custom Toast after scanning */}
      <CustomToast
        message={loading ? "Fetching item data..." : "Item added"}
        visible={toastVisible}
        onClose={handleToastClose}
        type={loading ? "info" : "success"}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={{ color: "#fff" }}>Loading...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ... your existing styles ...
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    alignItems: "center",
  },
});
