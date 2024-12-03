// components/CustomToast.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";

const CustomToast = ({
  message,
  visible,
  duration = 3000,
  onClose,
  type = "info", // 'info', 'success', 'error'
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    let timer;
    if (visible) {
      // Fade in the toast
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Automatically close the toast after the duration
      timer = setTimeout(() => {
        handleClose();
      }, duration);
    }

    // Clean up the timer
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible]);

  const handleClose = () => {
    // Fade out the toast
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose(); // Call the onClose callback after fade out
    });
  };

  if (!visible) return null;

  const backgroundColors = {
    info: "#333",
    success: "#4CAF50",
    error: "#F44336",
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          backgroundColor: backgroundColors[type] || "#333",
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleClose}
        accessible
        accessibilityLabel="Close notification"
      >
        <Text style={styles.toastText}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    bottom: 50,
    left: "10%",
    right: "10%",
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
  },
  toastText: {
    color: "white",
    textAlign: "center",
  },
});

export default CustomToast;
