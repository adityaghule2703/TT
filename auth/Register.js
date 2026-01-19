import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";

const Register = ({ navigation, route }) => {
  const { mobile, otp_code, role = "user" } = route.params;
  
  // Refs for input fields
  const emailRef = useRef();
  const usernameRef = useRef();
  const addressRef = useRef();
  const referralRef = useRef();
  const confirmRef = useRef();
  
  const scrollViewRef = useRef();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [address, setAddress] = useState("");
  const [referral, setReferral] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateStep1 = () => {
    if (!name || !email || !username) {
      Alert.alert("Error", "Please fill all required fields");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (dob) {
      const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dobRegex.test(dob)) {
        Alert.alert("Error", "Please enter date in YYYY-MM-DD format");
        return false;
      }
    }
    return true;
  };

  const validateStep3 = () => {
    if (!password || !confirm) {
      Alert.alert("Error", "Please fill all required fields");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }

    if (password !== confirm) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      setDob(`${year}-${month}-${day}`);
    }
  };

  const focusNextField = (nextField) => {
    if (nextField && nextField.current) {
      nextField.current.focus();
    }
  };

  const registerUser = async () => {
    if (!validateStep3()) return;

    setIsLoading(true);

    try {
      let url = "";
      let requestData = {};

      if (role === "user") {
        url = "https://exilance.com/tambolatimez/public/api/user/register";
      } else {
        url = "https://exilance.com/tambolatimez/public/api/host/register";
      }

      requestData = {
        mobile,
        name,
        email,
        username,
        dob,
        address,
        under_referral: referral,
        otp_code,
        password,
        password_confirmation: confirm,
      };

      const res = await axios.post(url, requestData);

      Alert.alert(
        "Success",
        `${role === "user" ? "User" : "Host"
        } registration successful! Please login.`
      );
      navigation.replace("Login");
    } catch (err) {
      console.log(err.response?.data || err);
      Alert.alert(
        "Registration Failed",
        err.response?.data?.message || "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepRow}>
        <View style={[styles.stepCircle, step >= 1 && styles.activeStep]}>
          <Text style={[styles.stepText, step >= 1 && styles.activeStepText]}>1</Text>
        </View>
        <View style={[styles.stepLine, step >= 2 && styles.activeStepLine]} />
        <View style={[styles.stepCircle, step >= 2 && styles.activeStep]}>
          <Text style={[styles.stepText, step >= 2 && styles.activeStepText]}>2</Text>
        </View>
        <View style={[styles.stepLine, step >= 3 && styles.activeStepLine]} />
        <View style={[styles.stepCircle, step >= 3 && styles.activeStep]}>
          <Text style={[styles.stepText, step >= 3 && styles.activeStepText]}>3</Text>
        </View>
      </View>
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, step >= 1 && styles.activeStepLabel]}>
          Personal
        </Text>
        <Text style={[styles.stepLabel, step >= 2 && styles.activeStepLabel]}>
          Additional
        </Text>
        <Text style={[styles.stepLabel, step >= 3 && styles.activeStepLabel]}>
          Security
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/5345/5345809.png" }}
            style={styles.logo}
          />

          <View style={styles.card}>
            <Text style={styles.title}>
              {role === "user" ? "User" : "Host"} Registration
            </Text>
            <Text style={styles.subtitle}>
              Step {step} of 3
            </Text>

            {renderStepIndicator()}

            {/* Step 1 Content */}
            {step === 1 && (
              <>
                <Text style={styles.stepTitle}>Personal Information</Text>
                
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>Mobile: {mobile}</Text>
                </View>

                <TextInput
                  placeholder="Full Name *"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#999"
                  returnKeyType="next"
                  onSubmitEditing={() => focusNextField(emailRef)}
                />

                <TextInput
                  ref={emailRef}
                  placeholder="Email *"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => focusNextField(usernameRef)}
                />

                <TextInput
                  ref={usernameRef}
                  placeholder="Username *"
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </>
            )}

            {/* Step 2 Content */}
            {step === 2 && (
              <>
                <Text style={styles.stepTitle}>Additional Information</Text>

                <TouchableOpacity
                  style={styles.input}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={dob ? styles.inputText : styles.placeholderText}>
                    {dob || "Date of Birth (Tap to select)"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={dob ? new Date(dob) : new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onChangeDate}
                    maximumDate={new Date()}
                  />
                )}

                <TextInput
                  ref={addressRef}
                  placeholder="Address"
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={2}
                  returnKeyType="next"
                  onSubmitEditing={() => focusNextField(referralRef)}
                />

                <TextInput
                  ref={referralRef}
                  placeholder="Referral Code (Optional)"
                  style={styles.input}
                  value={referral}
                  onChangeText={setReferral}
                  placeholderTextColor="#999"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </>
            )}

            {/* Step 3 Content */}
            {step === 3 && (
              <>
                <Text style={styles.stepTitle}>Security Settings</Text>
                
                <TextInput
                  placeholder="Password * (min 6 characters)"
                  secureTextEntry
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor="#999"
                  returnKeyType="next"
                  onSubmitEditing={() => focusNextField(confirmRef)}
                />

                <TextInput
                  ref={confirmRef}
                  placeholder="Confirm Password *"
                  secureTextEntry
                  style={styles.input}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholderTextColor="#999"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />

                <View style={styles.passwordRules}>
                  <Text style={styles.ruleText}>• At least 6 characters</Text>
                  <Text style={styles.ruleText}>• Must match confirmation</Text>
                </View>
              </>
            )}

            <View style={styles.buttonContainer}>
              {step > 1 && (
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={handlePrev}
                  disabled={isLoading}
                >
                  <Text style={styles.btnSecondaryText}>← Back</Text>
                </TouchableOpacity>
              )}

              {step < 3 ? (
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary, { flex: 1 }]}
                  onPress={handleNext}
                  disabled={isLoading}
                >
                  <Text style={styles.btnText}>Next →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary, { flex: 1 }]}
                  onPress={registerUser}
                  disabled={isLoading}
                >
                  <Text style={styles.btnText}>
                    {isLoading ? "Registering..." : "Register Now"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.navigationLinks}>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.link}>
                  Already have an account? <Text style={styles.loginText}>Login</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>← Back to OTP</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Extra padding for keyboard */}
          <View style={{ height: Platform.OS === 'ios' ? 50 : 100 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logo: {
    width: 70,
    height: 70,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
    color: "#333",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    fontSize: 13,
    marginBottom: 16,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  activeStep: {
    backgroundColor: "#FF7675",
  },
  stepText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 14,
  },
  activeStepText: {
    color: "#fff",
  },
  stepLine: {
    width: 50,
    height: 2,
    backgroundColor: "#E0E0E0",
  },
  activeStepLine: {
    backgroundColor: "#FF7675",
  },
  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  stepLabel: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    width: 60,
  },
  activeStepLabel: {
    color: "#FF7675",
    fontWeight: "600",
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: "#F0F8FF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 14,
    minHeight: 45,
  },
  inputText: {
    fontSize: 14,
    color: "#333",
  },
  placeholderText: {
    fontSize: 14,
    color: "#999",
  },
  passwordRules: {
    backgroundColor: "#F9F9F9",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  ruleText: {
    color: "#666",
    fontSize: 12,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  btn: {
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: "#FF7675",
  },
  btnSecondary: {
    backgroundColor: "#F0F0F0",
    minWidth: 70,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
  },
  btnSecondaryText: {
    color: "#666",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  navigationLinks: {
    marginTop: 16,
    alignItems: "center",
  },
  link: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: 13,
    color: "#444",
  },
  loginText: {
    color: "#FF7675",
    fontWeight: "600",
  },
  backText: {
    textAlign: "center",
    color: "#666",
    fontSize: 13,
    fontWeight: "500",
  },
});