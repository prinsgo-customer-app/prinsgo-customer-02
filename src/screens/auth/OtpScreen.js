import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import api from "../../services/api";

export default function OtpScreen({ route, navigation }) {
  const { phone } = route.params;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert("Error", "6 digit OTP enter kare");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/verify-otp", {
        phone,
        code: otp,
        name: "PrinsGo User",
      });

      setLoading(false);

      if (res.data.success) {
        Alert.alert("Success", "Login Successful");
        navigation.replace("Home");
      } else {
        Alert.alert("Error", res.data.message);
      }
    } catch (err) {
      setLoading(false);

      Alert.alert(
        "Error",
        err?.response?.data?.message || "OTP Verify Failed"
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>

      <Text style={styles.subtitle}>
        OTP sent to {phone}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 6 Digit OTP"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={verifyOtp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Verifying..." : "Verify OTP"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1976D2",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#1976D2",
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
});
