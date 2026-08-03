
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

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (phone.length !== 10) {
      Alert.alert("Error", "10 digit mobile number enter kare");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/send-otp", {
        phone,
      });

      setLoading(false);

      if (res.data.success) {
        Alert.alert("Success", "OTP Send Successfully");

        navigation.navigate("Otp", {
          phone,
        });
      } else {
        Alert.alert("Error", res.data.message);
      }
    } catch (err) {
      setLoading(false);

      Alert.alert(
        "Server Error",
        err?.response?.data?.message || "Backend connect nahi ho raha"
      );
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.logo}>PrinsGo</Text>
      <Text style={styles.tagline}>
        Ride • Parcel • Safe • Smart
      </Text>

      <Text style={styles.heading}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Mobile Number"
        keyboardType="phone-pad"
        maxLength={10}
        value={phone}
        onChangeText={setPhone}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={sendOtp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Sending OTP..." : "Send OTP"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#DB4437", marginTop: 15 }]}
      >
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#1877F2", marginTop: 15 }]}
      >
        <Text style={styles.buttonText}>Continue with Facebook</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#444", marginTop: 15 }]}
      >
        <Text style={styles.buttonText}>Continue with Email</Text>
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
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1976D2",
    textAlign: "center",
  },
  tagline: {
    textAlign: "center",
    color: "#666",
    marginBottom: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
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
