import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, FlatList,
  StyleSheet, Button, Alert, ImageBackground, Animated, Keyboard, ScrollView,
  Dimensions, Platform
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot, 
  setDoc, doc, getDoc, updateDoc
} from "@firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut  } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { launchImageLibrary } from 'react-native-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Highlighter from './Highlighter'; 
import { IntlProvider, useIntl } from 'react-intl';
import * as Localization from 'expo-localization';
import messages_en from './localization/en.json';
import messages_lv from './localization/lv.json';
import { KeyboardAwareScrollView } from '@codler/react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-root-toast';


const messages = {
  en: messages_en,
  lv: messages_lv,
};

const LocalizationContext = createContext();

const LocalizationProvider = ({ children }) => {
  const [locale, setLocale] = useState(Localization.locale || 'en');

  const switchLanguage = (lang) => {
    setLocale(lang);
  };

  return (
    <LocalizationContext.Provider value={{ locale, switchLanguage }}>
      <IntlProvider locale={locale} messages={messages[locale]}>
        {children}
      </IntlProvider>
    </LocalizationContext.Provider>
  );
};

const useLocalization = () => useContext(LocalizationContext);

const firebaseConfig = {
  apiKey: "AIzaSyBCpk03VElobbjAKuxeUTa-isDtjnzd4Oc",
  authDomain: "dev1-4cd5e.firebaseapp.com",
  projectId: "dev1-4cd5e",
  storageBucket: "dev1-4cd5e.appspot.com",
  messagingSenderId: "964815927627",
  appId: "1:964815927627:web:48007afa0b9c3496c0d0ce",
  measurementId: "G-RZ35X7PCER"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);
const auth = getAuth(app);

const fetchBackgroundImageUrl = async () => {
  const storage = getStorage();
  const storageRef = ref(storage, 'Background/Gradiant.webp'); // Change path accordingly

  try {
    const url = await getDownloadURL(storageRef);
    console.log('Image URL:', url);
    return url;
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
};

const commonBackgroundColor = '#34495e'; 

const commonButtonStyle = {
  backgroundColor: '#5e6472', 
  width: '80%',
  height: 50,
  justifyContent: 'center',
  alignItems: 'center',
  marginVertical: 10,
  borderRadius: 10,
  shadowColor: '#5e6472',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 5,
};

const CustomButton = ({ title, onPress }) => (
  <TouchableOpacity style={commonButtonStyle} onPress={onPress}>
    <Text style={{ color: '#ecf0f1', fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
  </TouchableOpacity>
);

const commonInputStyle = {
  height: 40,
  borderColor: '#bdc3c7', 
  borderWidth: 1,
  marginBottom: 16,
  paddingHorizontal: 10,
  borderRadius: 8,
  fontSize: 16,
  color: '#34495e', 
  width: '80%',
};

const RegistrationScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [error, setError] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const intl = useIntl();

  useEffect(() => {
    fetchBackgroundImageUrl()
      .then(url => {
        setBackgroundImageUrl(url);

        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start(() => {
            setIsImageLoading(false);
            Animated.timing(screenFadeAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }).start();
          });
        }, 3000);
      })
      .catch(error => {
        console.error('Failed to fetch background image URL:', error);
      });

    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSignUp = async () => {
    setError(''); // Clear any previous errors

    if (password !== confirmPassword) {
      setError(intl.formatMessage({ id: 'Passwords Do Not Match' }));
      return;
    }

    if (password.length < 8) {
      setError(intl.formatMessage({ id: 'Password Too Short Needs To Be 8 Characters' }));
      return;
    }

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Registered with:', userCredential.user.email);
      navigation.navigate('UserInterestScreen');
    } catch (error) {
      console.error("Registration failed:", error.message);
      if (error.code === 'auth/email-already-in-use') {
        setError(intl.formatMessage({ id: 'Email Already In Use' }));
      } else if (error.code === 'auth/invalid-email') {
        setError(intl.formatMessage({ id: 'Invalid Email' }));
      } else if (error.code === 'auth/weak-password') {
        setError(intl.formatMessage({ id: 'Weak Password' }));
      } else {
        setError(intl.formatMessage({ id: 'Registration Failed' }));
      }
    }
  };

  if (isImageLoading) {
    return (
      <View style={REstyles.loadingContainer}>
        <Animated.Text style={{ ...REstyles.loadingText, opacity: fadeAnim }}>
          {intl.formatMessage({ id: 'Loading...' })}
        </Animated.Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ ...REstyles.container, opacity: screenFadeAnim }}>
      {backgroundImageUrl ? (
        <ImageBackground
          source={{ uri: backgroundImageUrl }}
          style={REstyles.backgroundImage}
          resizeMode="cover"
        >
          <View style={REstyles.tint}>
            <View style={REstyles.formContainer}>
              <Text style={REstyles.title}>{intl.formatMessage({ id: 'Sign Up' })}</Text>
              {error ? <Text style={REstyles.errorText}>{error}</Text> : null}
              <TextInput
                style={REstyles.input}
                placeholder={intl.formatMessage({ id: 'Email' })}
                placeholderTextColor="#d3d3d3"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
              <TextInput
                style={REstyles.input}
                placeholder={intl.formatMessage({ id: 'Password' })}
                placeholderTextColor="#d3d3d3"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
              <TextInput
                style={REstyles.input}
                placeholder={intl.formatMessage({ id: 'Confirm Password' })}
                placeholderTextColor="#d3d3d3"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
              />
              <TouchableOpacity style={REstyles.button} onPress={handleSignUp}>
                <Text style={REstyles.buttonText}>{intl.formatMessage({ id: 'Sign Up' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={REstyles.button} onPress={() => navigation.navigate('StartLoginScreen')}>
                <Text style={REstyles.buttonText}>{intl.formatMessage({ id: 'Login' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={REstyles.button} onPress={() => navigation.goBack()}>
                <Text style={REstyles.buttonText}>{intl.formatMessage({ id: 'Back' })}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      ) : (
        <View style={REstyles.loadingContainer}>
          <Text style={REstyles.loadingText}>{intl.formatMessage({ id: 'Failed to load background image' })}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const REstyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  tint: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: '#bdc3c7',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 10,
    borderRadius: 8,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(52, 52, 52, 0.8)',
  },
  button: {
    backgroundColor: '#5e6472',
    width: '100%',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 24,
    color: '#000000',
  },
});

// RulesScreen Component
const RulesScreen = ({ route, navigation }) => {
  const { topic } = route.params;
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const intl = useIntl();

  useEffect(() => {
    fetchBackgroundImageUrl()
      .then(url => {
        setBackgroundImageUrl(url);
        
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start(() => {
            setIsImageLoading(false);
            Animated.timing(screenFadeAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }).start();
          });
        }, 3000);
      })
      .catch(error => {
        console.error('Failed to fetch background image URL:', error);
      });

    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const acceptRules = () => {
    navigation.navigate('Topic', { topic });
  };

  const declineRules = () => {
    navigation.goBack();
  };

  if (isImageLoading) {
    return (
      <View style={Rstyles.loadingContainer}>
        <Animated.Text style={{ ...Rstyles.loadingText, opacity: fadeAnim }}>
          {intl.formatMessage({ id: 'Loading...' })}
        </Animated.Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ ...Rstyles.container, opacity: screenFadeAnim }}>
      {backgroundImageUrl ? (
        <ImageBackground
          source={{ uri: backgroundImageUrl }}
          style={Rstyles.backgroundImage}
          resizeMode="cover"
        >
          <View style={Rstyles.contentContainer}>
            <Text style={Rstyles.title}>{intl.formatMessage({ id: 'Community Rules Of' })}</Text>
            <Text style={Rstyles.title}>{topic.name}</Text>
            <Text style={Rstyles.rule}>
              {intl.formatMessage({ id: '1. Respect, safety and authenticity: No banning, attacking or spreading hate speech while respecting community rules and avoiding content manipulation and fraud' })}
            </Text>
            <Text style={Rstyles.rule}>
              {intl.formatMessage({ id: '2. Privacy: It is forbidden to disclose or threaten to disclose another persons private information.' })}
            </Text>
            <Text style={Rstyles.rule}>
              {intl.formatMessage({ id: '3. Protection against inappropriate content: Do not post material that involves minors in an abusive or sexual context.' })}
            </Text>
            <Text style={Rstyles.rule}>
              {intl.formatMessage({ id: '4. Identity preservation: Not to use false identities or impersonate others improperly.' })}
            </Text>
            <Text style={Rstyles.rule}>
              {intl.formatMessage({ id: '5. Compliance with the law: Avoid spreading illegal content, do not take actions that could disrupt the community.' })}
            </Text>
            <TouchableOpacity style={Rstyles.button} onPress={acceptRules}>
              <Text style={Rstyles.buttonText}>{intl.formatMessage({ id: 'Accept' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={Rstyles.button} onPress={declineRules}>
              <Text style={Rstyles.buttonText}>{intl.formatMessage({ id: 'Decline' })}</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      ) : (
        <View style={Rstyles.loadingContainer}>
          <Text style={Rstyles.loadingText}>{intl.formatMessage({ id: 'Failed to load background image' })}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const Rstyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
    textAlign: 'center',
  },
  rule: {
    fontSize: 14,
    marginBottom: 10,
    color: 'white',
    textAlign: 'left',
  },
  button: {
    backgroundColor: '#5e6472',
    width: 150,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#5e6472',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 24,
    color: '#000000',
  }
});

// StartLoginScreen Component
const StartLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const intl = useIntl();

  useEffect(() => {
    fetchBackgroundImageUrl()
      .then(url => {
        setBackgroundImageUrl(url);
        
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start(() => {
            setIsImageLoading(false);
            Animated.timing(screenFadeAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }).start();
          });
        }, 3000);
      })
      .catch(error => {
        console.error('Failed to fetch background image URL:', error);
      });

    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(firestore, 'users', userCredential.user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists() && docSnap.data().interests) {
        navigation.navigate('Profile');
      } else {
        navigation.navigate('UserInterestScreen');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(intl.formatMessage({ id: 'Login Failed' }) + ': ' + error.message);
    }
  };

  if (isImageLoading) {
    return (
      <View style={Lstyles.loadingContainer}>
        <Animated.Text style={{ ...Lstyles.loadingText, opacity: fadeAnim }}>
          {intl.formatMessage({ id: 'Loading...' })}
        </Animated.Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ ...Lstyles.container, opacity: screenFadeAnim }}>
      {backgroundImageUrl ? (
        <ImageBackground
          source={{ uri: backgroundImageUrl }}
          style={Lstyles.backgroundImage}
          resizeMode="cover"
        >
          <View style={Lstyles.formContainer}>
            <Text style={Lstyles.label}>{intl.formatMessage({ id: 'Email' })}</Text>
            <TextInput
              style={Lstyles.input}
              onChangeText={setEmail}
              value={email}
              placeholder={intl.formatMessage({ id: 'Enter Email' })}
              placeholderTextColor="#d3d3d3"
            />
            <Text style={Lstyles.label}>{intl.formatMessage({ id: 'Password' })}</Text>
            <TextInput
              style={Lstyles.input}
              onChangeText={setPassword}
              value={password}
              secureTextEntry={true}
              placeholder={intl.formatMessage({ id: 'Enter Password' })}
              placeholderTextColor="#d3d3d3"
            />
            {error ? <Text style={Lstyles.error}>{error}</Text> : null}
            <TouchableOpacity style={Lstyles.button} onPress={handleLogin}>
              <Text style={Lstyles.buttonText}>{intl.formatMessage({ id: 'Login' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={Lstyles.button} onPress={() => navigation.goBack()}>
              <Text style={Lstyles.buttonText}>{intl.formatMessage({ id: 'Back' })}</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      ) : (
        <View style={Lstyles.loadingContainer}>
          <Text style={Lstyles.loadingText}>{intl.formatMessage({ id: 'Failed to load background image' })}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const Lstyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  label: {
    fontSize: 18,
    color: 'white',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: '#bdc3c7',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 10,
    borderRadius: 8,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(52, 52, 52, 0.8)',
    width: '80%',
  },
  error: {
    fontSize: 14,
    color: 'red',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#5e6472',
    width: '80%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#5e6472',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 24,
    color: '#000000',
  },
});
// UserInterestScreen Component
const UserInterestScreen = ({ navigation }) => {
  const [interests, setInterests] = useState('');
  const [gender, setGender] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [origin, setOrigin] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const intl = useIntl();

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    fetchBackgroundImageUrl()
      .then(url => {
        setBackgroundImageUrl(url);
        
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start(() => {
            setIsImageLoading(false);
            Animated.timing(screenFadeAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }).start();
          });
        }, 3000);
      })
      .catch(error => {
        console.error('Failed to fetch background image URL:', error);
      });

    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSaveInterests = async () => {
    if (!user) {
      alert(intl.formatMessage({ id: 'Must_be_logged_in' }));
      return;
    }
  
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        interests,
        gender,
        nickname,
        age,
        origin,
        email: user.email,
        surveyCompleted: false,
        hasWrittenFirstComment: false, 
      }, { merge: true });
      console.log('Data saved successfully with user email:', user.email);
      navigation.navigate('Profile');
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert(intl.formatMessage({ id: 'Error' }), 
      intl.formatMessage({ id: 'Unable_to_save_data' }));
    }
  };
  if (isImageLoading) {
    return (
      <View style={Ustyles.loadingContainer}>
        <Animated.Text style={{ ...Ustyles.loadingText, opacity: fadeAnim }}>
          {intl.formatMessage({ id: 'Loading...' })}
        </Animated.Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ ...Ustyles.container, opacity: screenFadeAnim }}>
      {backgroundImageUrl ? (
        <ImageBackground source={{ uri: backgroundImageUrl }} style={Ustyles.backgroundImage} resizeMode="cover">
          <View style={Ustyles.formContainer}>
            <Text style={Ustyles.title}>{intl.formatMessage({ id: 'Create Profile' })}</Text>
            <TextInput
              style={Ustyles.input}
              onChangeText={setInterests}
              value={interests}
              placeholder={intl.formatMessage({ id: 'Interests' })}
              placeholderTextColor="#ccc"
            />
            <TextInput
              style={Ustyles.input}
              onChangeText={setGender}
              value={gender}
              placeholder={intl.formatMessage({ id: 'Gender' })}
              placeholderTextColor="#ccc"
            />
            <TextInput
              style={Ustyles.input}
              onChangeText={setNickname}
              value={nickname}
              placeholder={intl.formatMessage({ id: 'Nickname' })}
              placeholderTextColor="#ccc"
            />
            <TextInput
              style={Ustyles.input}
              onChangeText={setAge}
              value={age}
              placeholder={intl.formatMessage({ id: 'Age' })}
              placeholderTextColor="#ccc"
            />
            <TextInput
              style={Ustyles.input}
              onChangeText={setOrigin}
              value={origin}
              placeholder={intl.formatMessage({ id: 'Origin City' })}
              placeholderTextColor="#ccc"
            />
            <TouchableOpacity style={Ustyles.button} onPress={handleSaveInterests}>
              <Text style={Ustyles.buttonText}>{intl.formatMessage({ id: 'Save' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={Ustyles.button} onPress={() => navigation.navigate('StartLoginScreen')}>
              <Text style={Ustyles.buttonText}>{intl.formatMessage({ id: 'Back' })}</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      ) : (
        <View style={Ustyles.loadingContainer}>
          <Text style={Ustyles.loadingText}>{intl.formatMessage({ id: 'Failed to load background image' })}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const Ustyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 20,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#bdc3c7',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 10,
    borderRadius: 8,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(52, 52, 52, 0.8)',
    width: '80%',
  },
  button: {
    backgroundColor: '#5e6472',
    width: '80%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#5e6472',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 24,
    color: '#000000',
  },
});

// DeveloperLoginScreen Component
const DeveloperLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const intl = useIntl();

  useEffect(() => {
    fetchBackgroundImageUrl()
      .then(url => {
        setBackgroundImageUrl(url);

        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start(() => {
            setIsImageLoading(false);
            Animated.timing(screenFadeAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }).start();
          });
        }, 3000);
      })
      .catch(error => {
        console.error('Failed to fetch background image URL:', error);
      });

    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    try {
      const auth = getAuth();
      if (email === 'Test2@gmail.com' && password === '1234567') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        navigation.navigate('DeveloperView');
      } else {
        setError(intl.formatMessage({ id: 'Invalid_credentials' }));
      }
    } catch (error) {
      setError(intl.formatMessage({ id: 'Login_failed' }));
      console.error('Error logging in:', error.message);
    }
  };

  if (isImageLoading) {
    return (
      <View style={Dstyles.loadingContainer}>
        <Animated.Text style={{ ...Dstyles.loadingText, opacity: fadeAnim }}>
          {intl.formatMessage({ id: 'Loading...' })}
        </Animated.Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ ...Dstyles.container, opacity: screenFadeAnim }}>
      {backgroundImageUrl ? (
        <ImageBackground source={{ uri: backgroundImageUrl }} style={Dstyles.backgroundImage} resizeMode="cover">
          <View style={Dstyles.tint}>
            <View style={Dstyles.formContainer}>
              <Text style={Dstyles.label}>{intl.formatMessage({ id: 'Email' })}</Text>
              <TextInput
                style={Dstyles.input}
                onChangeText={setEmail}
                value={email}
                placeholder={intl.formatMessage({ id: 'Enter Email' })}
                placeholderTextColor="#d3d3d3"
              />
              <Text style={Dstyles.label}>{intl.formatMessage({ id: 'Password' })}</Text>
              <TextInput
                style={Dstyles.input}
                onChangeText={setPassword}
                value={password}
                secureTextEntry={true}
                placeholder={intl.formatMessage({ id: 'Enter Password' })}
                placeholderTextColor="#d3d3d3"
              />
              {error ? <Text style={Dstyles.error}>{error}</Text> : null}
              <TouchableOpacity style={Dstyles.button} onPress={handleLogin}>
                <Text style={Dstyles.buttonText}>{intl.formatMessage({ id: 'Login' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={Dstyles.button} onPress={() => navigation.goBack()}>
                <Text style={Dstyles.buttonText}>{intl.formatMessage({ id: 'Back' })}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      ) : (
        <View style={Dstyles.loadingContainer}>
          <Text style={Dstyles.loadingText}>{intl.formatMessage({ id: 'Failed to load background image' })}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const Dstyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  tint: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  formContainer: {
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 18,
    color: 'white',
    marginBottom: 8,
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: '#bdc3c7',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 10,
    borderRadius: 8,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(52, 52, 52, 0.8)',
  },
  error: {
    fontSize: 14,
    color: 'red',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#5e6472',
    width: '100%',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 24,
    color: '#000000',
  },
});

// Home Component
const Home = ({ navigation }) => {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const homeFadeAnim = useRef(new Animated.Value(0)).current;
  const { switchLanguage } = useLocalization();
  const intl = useIntl();

  useEffect(() => {
    fetchBackgroundImageUrl()
      .then(url => {
        setBackgroundImageUrl(url);

        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start(() => {
            setIsLoading(false);
            Animated.timing(homeFadeAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }).start();
          });
        }, 3000);
      })
      .catch(error => {
        console.error('Failed to fetch background image URL:', error);
      });

    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const onImageLoad = () => {
    setIsImageLoading(false);
  };

  if (isLoading) {
    return (
      <View style={Ostyles.loadingContainer}>
        <Animated.Text style={{ ...Ostyles.loadingText, opacity: fadeAnim }}>
          {intl.formatMessage({ id: 'Loading...' })}
        </Animated.Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ ...Wstyles.container, opacity: homeFadeAnim }}>
      {backgroundImageUrl ? (
        <ImageBackground
          source={{ uri: backgroundImageUrl }}
          style={Wstyles.backgroundImage}
          resizeMode="cover"
          onLoad={onImageLoad}
        >
          {isImageLoading && (
            <View style={Wstyles.placeholder}>
              <Text style={Wstyles.placeholderText}>{intl.formatMessage({ id: 'Loading background...' })}</Text>
            </View>
          )}
          {!isImageLoading && (
            <View style={Wstyles.container}>
              <Text style={Wstyles.title}>{intl.formatMessage({ id: 'Welcome!' })}</Text>
              <Image style={Wstyles.logo} source={require('./assets/Logotype_Black.png')} />
              <TouchableOpacity style={Wstyles.button} onPress={() => navigation.navigate('StartLoginScreen')}>
                <Text style={Wstyles.buttonText}>{intl.formatMessage({ id: 'Login' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={Wstyles.button} onPress={() => navigation.navigate('RegistrationScreen')}>
                <Text style={Wstyles.buttonText}>{intl.formatMessage({ id: 'Register' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={Wstyles.button} onPress={() => navigation.navigate('DeveloperLoginScreen')}>
                <Text style={Wstyles.buttonText}>{intl.formatMessage({ id: 'Developer' })}</Text>
              </TouchableOpacity>
              <View style={Wstyles.languageSwitcherContainer}>
                <TouchableOpacity style={Wstyles.languageButton} onPress={() => switchLanguage('en')}>
                  <Text style={Wstyles.buttonText}>English</Text>
                </TouchableOpacity>
                <TouchableOpacity style={Wstyles.languageButton} onPress={() => switchLanguage('lv')}>
                  <Text style={Wstyles.buttonText}>Latviešu</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ImageBackground>
      ) : (
        <View style={Ostyles.loadingContainer}>
          <Text style={Ostyles.loadingText}>{intl.formatMessage({ id: 'Failed to load background image' })}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const Ostyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 24,
    color: '#000000',
  }
});

const Wstyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#ecf0f1',
  },
  logo: {
    height: 146,
    width: 104,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#5e6472',
    width: '80%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#5e6472',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  languageSwitcherContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    width: '80%',
  },
  languageButton: {
    backgroundColor: '#5e6472',
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 10,
    shadowColor: '#5e6472',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5e6472',
  },
  placeholderText: {
    fontSize: 24,
    color: '#ecf0f1',
  }
});

// Profile Component
const Profile = ({ navigation }) => {
  const [topics, setTopics] = useState([]);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const intl = useIntl();

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const db = getFirestore();
        const topicsCollection = collection(db, 'topics');
        const querySnapshot = await getDocs(topicsCollection);

        const topicsData = [];
        querySnapshot.forEach(doc => {
          topicsData.push({
            id: doc.id,
            name: doc.data().topicName,
            description: doc.data().topicDescription,
          });
        });
        setTopics(topicsData);
      } catch (error) {
        console.error('Error fetching topics:', error.message);
      }
    };

    fetchTopics();
    fetchBackgroundImageUrl()
      .then(url => {
        setBackgroundImageUrl(url);

        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start(() => {
            setIsImageLoading(false);
            Animated.timing(screenFadeAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }).start();
          });
        }, 3000);
      })
      .catch(error => {
        console.error('Failed to fetch background image URL:', error);
      });

    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={Pstyles.topicItem}
      onPress={() => navigation.navigate('RulesScreen', { topic: item })}
    >
      <Text style={Pstyles.topicName}>{item.name}</Text>
      <Text style={Pstyles.topicDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  if (isImageLoading) {
    return (
      <View style={Pstyles.loadingContainer}>
        <Animated.Text style={{ ...Pstyles.loadingText, opacity: fadeAnim }}>
          {intl.formatMessage({ id: 'Loading...' })}
        </Animated.Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ ...Pstyles.container, opacity: screenFadeAnim }}>
      {backgroundImageUrl ? (
        <ImageBackground source={{ uri: backgroundImageUrl }} style={Pstyles.backgroundImage} resizeMode="cover">
          <View style={Pstyles.contentContainer}>
            <FlatList
              data={topics}
              renderItem={renderItem}
              keyExtractor={item => item.id}
            />
            <View style={Pstyles.buttonContainer}>
              <TouchableOpacity
                style={Pstyles.button}
                onPress={() => navigation.navigate('CommentScreen')}
              >
                <Text style={Pstyles.buttonText}>{intl.formatMessage({ id: 'X Comm.' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={Pstyles.button}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={Pstyles.buttonText}>{intl.formatMessage({ id: 'Sign Out' })}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      ) : (
        <View style={Pstyles.loadingContainer}>
          <Text style={Pstyles.loadingText}>{intl.formatMessage({ id: 'Failed to load background image' })}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const Pstyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  topicItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d8e0',
    width: '100%',
  },
  topicName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  topicDescription: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#5e6472',
    width: '40%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: '#5e6472',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 24,
    color: '#000000',
  },
});

// CommentScreen Component

const CommentScreen = ({ navigation }) => {
  const db = getFirestore();
  const auth = getAuth();
  const topicId = "uniqueTopicId"; // Static unique ID for this special topic
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [topicVotes, setTopicVotes] = useState(0);
  const [userTopicVote, setUserTopicVote] = useState(null);
  const [commentCount, setCommentCount] = useState(0);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [topicImageUrl, setTopicImageUrl] = useState(null); // New state for the topic image URL
  const [searchText, setSearchText] = useState('');
  const intl = useIntl();
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchBackgroundImageUrl = async () => {
      const storage = getStorage();
      const storageRef = ref(storage, 'Background/Gradiant.webp'); // Change path accordingly

      try {
        const url = await getDownloadURL(storageRef);
        console.log('Background Image URL:', url);
        setBackgroundImageUrl(url);
      } catch (error) {
        console.error("Error fetching background image:", error);
      }
    };

    const fetchProfileImageUrl = async () => {
      const storage = getStorage();
      const profileRef = ref(storage, 'RedditTopic/R.webp');
      try {
        const url = await getDownloadURL(profileRef);
        console.log('Profile Image URL:', url);
        setProfileImageUrl(url);
      } catch (error) {
        console.error("Failed to fetch profile image URL:", error);
      }
    };

    // Fetch the topic image URL
    const fetchTopicImageUrl = async () => {
      const storage = getStorage();
      const topicImageRef = ref(storage, 'RedditTopic/images_TY7oOSetBSxcRUfG73Gg.webp');
      try {
        const url = await getDownloadURL(topicImageRef);
        console.log('Topic Image URL:', url); // Added log for the topic image URL
        setTopicImageUrl(url);
      } catch (error) {
        console.error("Failed to fetch topic image URL:", error);
      }
    };

    fetchBackgroundImageUrl();
    fetchProfileImageUrl();
    fetchTopicImageUrl();

    const topicRef = doc(db, 'specialTopics', topicId);
    const topicVotesRef = collection(topicRef, 'votes');

    const unsubscribeTopicVotes = onSnapshot(topicVotesRef, async (snapshot) => {
      try {
        const totalVotes = snapshot.docs.reduce((sum, doc) => sum + (doc.data().vote || 0), 0);
        setTopicVotes(totalVotes);
        if (auth.currentUser) {
          const userVoteDoc = snapshot.docs.find(doc => doc.id === auth.currentUser.uid);
          setUserTopicVote(userVoteDoc ? userVoteDoc.data().vote : null);
        }
      } catch (error) {
        console.error("Error updating topic votes:", error);
      }
    });

    // Real-time updates for comments and their votes
    const commentsRef = collection(topicRef, 'comments');
    const commentsQuery = query(commentsRef, orderBy('timestamp', 'desc'));
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setComments(commentsData);
      setCommentCount(snapshot.size);  // Update comment count

      // Set up listeners for votes on each comment
      snapshot.docs.forEach(doc => {
        const commentId = doc.id;
        const votesRef = collection(doc.ref, 'votes');
        onSnapshot(votesRef, (voteSnapshot) => {
          const totalVotes = voteSnapshot.docs.reduce((sum, voteDoc) => sum + (voteDoc.data().vote || 0), 0);
          setComments(prevComments => prevComments.map(comment =>
            comment.id === commentId ? { ...comment, votes: totalVotes } : comment
          ));
        });
      });
    });

    return () => {
      unsubscribeTopicVotes();
      unsubscribeComments();
    };
  }, [db, topicId, auth.currentUser]);

  const handleVote = async (commentId, vote) => {
    if (!auth.currentUser) {
      showToast(intl.formatMessage({ id: 'Error' }) + ': ' + intl.formatMessage({ id: 'Must_be_logged_in_to_vote' }));
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const voteRef = commentId ?
        doc(db, 'specialTopics', topicId, 'comments', commentId, 'votes', userId) :
        doc(db, 'specialTopics', topicId, 'votes', userId);

      const voteDoc = await getDoc(voteRef);
      const existingVote = voteDoc.exists() ? voteDoc.data().vote : 0;

      const newVote = existingVote === vote ? 0 : vote;
      await setDoc(voteRef, { vote: newVote }, { merge: true });
    } catch (error) {
      console.error("Error handling vote:", error);
    }
  };

  const toggleVote = (commentId, currentVote) => {
    const newVote = currentVote === 1 ? 0 : 1;
    handleVote(commentId, newVote);
  };

  const toggleDownvote = (commentId, currentVote) => {
    const newVote = currentVote === -1 ? 0 : -1;
    handleVote(commentId, newVote);
  };

  const addComment = async () => {
    if (comment.trim() !== '') {
      try {
        await addDoc(collection(db, 'specialTopics', topicId, 'comments'), {
          comment,
          timestamp: new Date(),
          userEmail: auth.currentUser.email,
          votes: 0  // Initialize without any votes
        });
        setComment('');
        Keyboard.dismiss(); // Dismiss the keyboard after adding comment
      } catch (error) {
        console.error("Error adding comment:", error.message);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addComment();
    }
  };

  const showToast = (message) => {
    Toast.show(message, {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
      delay: 0,
    });
  };

  const reportTopic = async () => {
    if (!auth.currentUser) {
      showToast(intl.formatMessage({ id: 'Must_be_logged_in_to_report' }));
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const userEmail = auth.currentUser.email; // Get user's email
      const reportRef = doc(db, 'specialTopics', topicId, 'reports', userId);
      await setDoc(reportRef, { reported: true, timestamp: new Date(), userEmail }, { merge: true });
      showToast(intl.formatMessage({ id: 'Thanks For Completing The Survey' }));
    } catch (error) {
      console.error("Error reporting topic:", error);
    }
  };

  const reportComment = async (commentId) => {
    console.log('reportComment function called');
    if (!auth.currentUser) {
      showToast(intl.formatMessage({ id: 'Must_be_logged_in_to_report' }));
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const userEmail = auth.currentUser.email; // Get user's email
      const reportRef = doc(db, 'specialTopics', topicId, 'comments', commentId, 'reports', userId);
      await setDoc(reportRef, { reported: true, timestamp: new Date(), userEmail }, { merge: true });
      showToast(intl.formatMessage({ id: 'Thanks For Completing The Survey' }));
    } catch (error) {
      console.error("Error reporting comment:", error);
    }
  };

  const BackButton = () => {
    return (
      <View style={CSstyles.backButtonContainer}>
        <TouchableOpacity style={CSstyles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        {profileImageUrl && <Image source={{ uri: profileImageUrl }} style={CSstyles.profileImage} />}
      </View>
    );
  };

  const renderComment = ({ item }) => {
    return (
      <View style={CSstyles.commentContainer}>
        <View style={CSstyles.commentHeader}>
          <Text style={CSstyles.commentPoster}>{item.userEmail}</Text>
          <View style={CSstyles.voteContainer}>
            <TouchableOpacity onPress={() => toggleVote(item.id, item.userVote)}>
              <Icon name="arrow-upward" size={24} color={item.userVote === 1 ? "gold" : "#FF4500"} />
            </TouchableOpacity>
            <Text>{item.votes}</Text>
            <TouchableOpacity onPress={() => toggleDownvote(item.id, item.userVote)}>
              <Icon name="arrow-downward" size={24} color={item.userVote === -1 ? "gold" : "#0079D3"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { reportComment(item.id); }} style={CSstyles.reportButton}>
              <Icon name="more-vert" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
        <Highlighter
          text={item.comment}
          searchText={searchText}
          style={CSstyles.commentText}
        />
        <Text style={CSstyles.commentTimestamp}>{new Date(item.timestamp.toDate()).toLocaleString()}</Text>
      </View>
    );
  };

  if (!backgroundImageUrl) {
    return <Text>{intl.formatMessage({ id: 'Loading' })}</Text>;
  }

  return (
    <ImageBackground
      source={{ uri: backgroundImageUrl }}
      style={CSstyles.backgroundImage}
      resizeMode="cover"
    >
      <BackButton />
      <KeyboardAwareScrollView contentContainerStyle={CSstyles.container}>
        <View style={CSstyles.topicHeader}>
          <Text style={CSstyles.topicTitle}>{intl.formatMessage({ id: 'Pure Spring' })}</Text>
          <View style={CSstyles.voteContainer}>
            <TouchableOpacity onPress={() => toggleVote(null, userTopicVote)}>
              <Icon name="arrow-upward" size={24} color={userTopicVote === 1 ? "gold" : "#FF4500"} />
            </TouchableOpacity>
            <Text>{topicVotes}</Text>
            <TouchableOpacity onPress={() => toggleDownvote(null, userTopicVote)}>
              <Icon name="arrow-downward" size={24} color={userTopicVote === -1 ? "gold" : "#0079D3"} />
            </TouchableOpacity>
            <Text style={CSstyles.commentCount}>{intl.formatMessage({ id: 'Comments' })}: {commentCount}</Text>
            <TouchableOpacity onPress={() => { reportTopic(); }} style={CSstyles.reportButton}>
              <Icon name="more-vert" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={CSstyles.topicDescription}>{intl.formatMessage({ id: 'Imagine the purest water that comes from the heart of nature, where the gentle symphony of waterfalls blends harmoniously with the whispers of the forest. Every bottle of Pure Spring captures this unspoiled essence of refuge, offering you a taste of pure wildness with every sip.' })}</Text>
      
       {/* <Text style={CSstyles.initialComment}>{intl.formatMessage({ id: 'Welcome to our community! Our company wants to offer our customers something new and healthy, so the water Pure Spring is coming soon. We will be grateful if you participate with your suggestions to make the product better with your opinion about the described product. We would like to know what qualities your water should have in order to sip after a morning run or to refresh your thirst and your body with the necessary refreshment in the middle of a hot day.' })}</Text>*/}

        {/* Render the topic image here */}
        {topicImageUrl ? (
          <Image source={{ uri: topicImageUrl }} style={CSstyles.topicImage} resizeMode="contain" />
        ) : (
          <Text>{intl.formatMessage({ id: 'Loading Image...' })}</Text>
        )}
        
        <TextInput
          style={CSstyles.searchInput}
          placeholder={intl.formatMessage({ id: 'Search Comments' })}
          value={searchText}
          onChangeText={setSearchText}
        />
        <View style={{ flex: 1 }}>
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 100 }} // Add padding to prevent comments being hidden behind input
          />
        </View>
        <TextInput
          style={CSstyles.input}
          placeholder={intl.formatMessage({ id: 'Add Comment' })}
          value={comment}
          onChangeText={setComment}
          onKeyPress={handleKeyPress}
          onSubmitEditing={addComment}
          ref={inputRef}
        />
        <TouchableOpacity style={CSstyles.addButton} onPress={addComment}>
          <Text style={CSstyles.addButtonText}>{intl.formatMessage({ id: 'Add Comment' })}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={CSstyles.addButton} onPress={() => navigation.navigate('Home')}>
          <Text style={CSstyles.addButtonText}>{intl.formatMessage({ id: 'Sign Out' })}</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </ImageBackground>
  );
};

const CSstyles = StyleSheet.create({
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#ff4500',
    borderRadius: 20,
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: 10,
    borderColor: 'white',
    borderWidth: 2,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flexGrow: 1, // Ensure the container can grow to accommodate content
    backgroundColor: '#dae0e6',
    padding: 10,
  },
  topicTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#1c1c1c',
  },
  topicDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  initialComment: {
    fontSize: 14,
    color: '#4f4f4f',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: 'white',
    color: '#333',
    width: '100%',
  },
  addButton: {
    backgroundColor: '#0079d3',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  commentPoster: {
    fontWeight: 'bold',
    color: '#0079d3',
    marginBottom: 4,
  },
  commentText: {
    color: '#333',
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#787878',
    marginTop: 4,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentCount: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  reportButton: {
    marginLeft: 10,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: 'white',
    color: '#333',
    width: '100%',
  },
  topicImage: {
    width: '80%',
    height: 200,
    marginVertical: 10,
    alignSelf: 'center',
  },
});


const BAD_WORDS = [
  'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'cunt', 'damn', 'dick', 'pussy', 'slut', 'whore', 'nigger', 'faggot', 'motherfucker', 'cock', 'douche', 'bollocks', 'bugger', 'wanker', 'twat', 'prick', 'arse', 'piss', 'crap',
  'pists', 'sūds', 'mauka', 'dirst', 'pidars', 'dirsā', 'pakaļa', 'mātepisējs', 'kuce', 'mīzt', 'dirsa', 'jobans', 'sūkāt', 'pizda', 'pizģets', 'pidariņš', 'dirsiens', 'dauņi', 'kropļi', 'maukas', 'mīzējs', 'dirsāgrūdejs'
];

// Topic Component

const Topic = ({ route, navigation }) => {
  const { topic } = route.params;
  const [comment, setComment] = useState('');
  const [question, setQuestion] = useState('');
  const [comments, setComments] = useState([]);
  const [surveyPopupVisible, setSurveyPopupVisible] = useState(false);
  const [initialComment, setInitialComment] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const screenFadeAnim = useRef(new Animated.Value(0)).current;

  const db = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;
  const intl = useIntl();

  useEffect(() => {
    fetchBackgroundImageUrl()
      .then(url => {
        setBackgroundImageUrl(url);

        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start(() => {
            setIsImageLoading(false);
            Animated.timing(screenFadeAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }).start();
          });
        }, 3000);
      })
      .catch(error => {
        console.error('Failed to fetch background image URL:', error);
      });

    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!user) {
      console.log("No user logged in");
      return;
    }

    const fetchData = async () => {
      const topicDocRef = doc(db, 'topics', topic.id);
      const topicDocSnap = await getDoc(topicDocRef);

      if (topicDocSnap.exists()) {
        const topicData = topicDocSnap.data();
        setImageUrl(topicData.imageUrl || '');
        setInitialComment(topicData.initialComment || 'No initial comment provided.');
        setTopicDescription(topicData.topicDescription || 'No description provided.');
      }

      const unsubscribeComments = onSnapshot(
        query(collection(db, 'topics', topic.id, 'comments'), orderBy('timestamp', 'desc')),
        (querySnapshot) => {
          const loadedComments = [];
          querySnapshot.forEach((doc) => {
            loadedComments.push({ id: doc.id, ...doc.data() });
          });
          setComments(loadedComments);
        },
        error => console.error("Failed to load comments:", error)
      );

      return () => {
        unsubscribeComments();
      };
    };

    fetchData();
  }, [db, topic.id, user]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then(docSnap => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.hasWrittenFirstComment && !userData.surveyCompleted) {
            setSurveyPopupVisible(true);
          }
        }
      }).catch(error => console.error("Error checking survey status:", error));
    }
  }, [user, db]);

  const addComment = async () => {
    if (comment.trim() !== '') {
   
      if (BAD_WORDS.some(word => comment.toLowerCase().includes(word))) {
        //Alert.alert(intl.formatMessage({ id: 'Inappropriate_content' }), intl.formatMessage({ id: 'Revise_comment' }));
        return; 
      }
      try {
        await addDoc(collection(db, 'topics', topic.id, 'comments'), {
          comment,
          timestamp: new Date(),
          userEmail: user.email
        });

        // Check if this is the user's first comment
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && !userDoc.data().hasWrittenFirstComment) {
          await updateDoc(userRef, { hasWrittenFirstComment: true });
          // Check if the survey needs to be shown
          if (!userDoc.data().surveyCompleted) {
            setSurveyPopupVisible(true);
          }
        }

        setComment('');
        Keyboard.dismiss();
      } catch (error) {
        console.error("Error adding comment:", error.message);
      }
    }
  };

  const submitQuestion = async () => {
    if (question.trim() !== '') {
      try {
        await addDoc(collection(db, 'topics', topic.id, 'questions'), {
          question,
          userEmail: user.email,
          timestamp: new Date(),
        });
        setQuestion('');
        Keyboard.dismiss();
      } catch (error) {
        console.error("Error submitting question:", error.message);
      }
    }
  };

  const handleSurveyResponse = async (response) => {
    setSurveyPopupVisible(false);
    if (response === 'yes') {
      const userRef = doc(db, "users", user.uid);
      try {
        await updateDoc(userRef, {
          surveyCompleted: true
        });
        console.log("Survey status updated successfully");
      } catch (error) {
        console.error("Failed to update survey status:", error);
        Alert.alert("Error", "Could not update user data.");
      }
      navigation.navigate('SurveyForm'); // Navigate regardless of update status
    }
  };

  const handleKeyPress = ({ nativeEvent }) => {
    if (nativeEvent.key === 'Enter') {
      addComment();
    }
  };

  const handleQuestionKeyPress = ({ nativeEvent }) => {
    if (nativeEvent.key === 'Enter') {
      submitQuestion();
    }
  };

  if (isImageLoading) {
    return (
      <View style={Tstyles.loadingContainer}>
        <Animated.Text style={{ ...Tstyles.loadingText, opacity: fadeAnim }}>
          {intl.formatMessage({ id: 'Loading...' })}
        </Animated.Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Animated.View style={{ ...Tstyles.container, opacity: screenFadeAnim }}>
        {backgroundImageUrl ? (
          <ImageBackground
            source={{ uri: backgroundImageUrl }}
            style={Tstyles.backgroundImage}
            resizeMode="cover"
          >
            <View style={Tstyles.contentContainer}>
              <View style={Tstyles.topSection}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={Tstyles.topicImage} />
                ) : null}
                <View style={Tstyles.textContainer}>
                  <Text style={Tstyles.topicTitle}>{topic.name}</Text>
                  <Text style={Tstyles.topicDescription}>{topicDescription}</Text>
                  {initialComment && <Text style={Tstyles.topicDescription}>{initialComment}</Text>}
                </View>
              </View>
              <View style={Tstyles.commentsContainer}>
                <FlatList
                  data={comments}
                  renderItem={({ item }) => (
                    <View style={Tstyles.commentContainer}>
                      <Text style={Tstyles.commentPoster}>{item.userEmail}</Text>
                      <Text style={Tstyles.commentText}>{item.comment}</Text>
                      <Text style={Tstyles.commentTimestamp}>{new Date(item.timestamp.toDate()).toLocaleString()}</Text>
                    </View>
                  )}
                  keyExtractor={item => item.id}
                  contentContainerStyle={Tstyles.commentsList}
                />
              </View>
              <TextInput
                style={Tstyles.input}
                onChangeText={setComment}
                value={comment}
                placeholder={intl.formatMessage({ id: 'Add Comment' })}
                placeholderTextColor="#d3d3d3"
                onKeyPress={handleKeyPress}
              />
              <TextInput
                style={Tstyles.input}
                onChangeText={setQuestion}
                value={question}
                placeholder={intl.formatMessage({ id: 'Ask Question' })}
                placeholderTextColor="#d3d3d3"
                onKeyPress={handleQuestionKeyPress}
              />
              <View style={Tstyles.buttonRow}>
              <TouchableOpacity style={Tstyles.button} onPress={addComment}>
                  <Text style={Tstyles.buttonText}>{intl.formatMessage({ id: 'Add Comment' })}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={Tstyles.button} onPress={submitQuestion}>
                  <Text style={Tstyles.buttonText}>{intl.formatMessage({ id: 'Submit Question' })}</Text>
                </TouchableOpacity>
              </View>
              <View style={Tstyles.buttonRow}>
                <TouchableOpacity style={Tstyles.button} onPress={() => navigation.navigate('Profile')}>
                  <Text style={Tstyles.buttonText}>{intl.formatMessage({ id: 'Back' })}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={Tstyles.button} onPress={() => navigation.navigate('Home')}>
                  <Text style={Tstyles.buttonText}>{intl.formatMessage({ id: 'Sign Out' })}</Text>
                </TouchableOpacity>
              </View>
              {surveyPopupVisible && (
                <View style={Tstyles.surveyPopup}>
                  <Text style={Tstyles.popupText}>{intl.formatMessage({ id: 'Participate in a Survey?' })}</Text>
                  <TouchableOpacity style={Tstyles.popupButton} onPress={() => handleSurveyResponse('yes')}>
                    <Text style={Tstyles.popupButtonText}>{intl.formatMessage({ id: 'Yes' })}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={Tstyles.popupButton} onPress={() => handleSurveyResponse('no')}>
                    <Text style={Tstyles.popupButtonText}>{intl.formatMessage({ id: 'No' })}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ImageBackground>
        ) : (
          <View style={Tstyles.loadingContainer}>
            <Text style={Tstyles.loadingText}>{intl.formatMessage({ id: 'Failed to load background image' })}</Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
};

const Tstyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20, // Add padding at the bottom
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  topicImage: {
    width: 150,
    height: 150,
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  topicDescription: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'white',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 10,
    color: 'white',
    borderRadius: 8,
    width: '80%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#5e6472',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '45%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingVertical: 10,
    width: '100%', // Match the width of the comments container
  },
  commentPoster: {
    fontWeight: 'bold',
    color: 'white',
  },
  commentText: {
    marginBottom: 5,
    color: 'white',
  },
  commentTimestamp: {
    color: 'white',
  },
  commentsContainer: {
    width: '80%', // Match the width of the input field
    maxHeight: 200, // Set a maximum height
    marginBottom: 20, // Add some space at the bottom
  },
  commentsList: {
    width: '100%', // Ensure the list takes the full width
  },
  surveyPopup: {
    position: 'absolute',
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 10,
    top: '40%',
    left: '15%',
    width: '70%',
    alignItems: 'center',
  },
  popupText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  popupButton: {
    backgroundColor: '#5e6472',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 5,
  },
  popupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 24,
    color: '#000000',
  },
});



// SurveyForm Component
const SurveyForm = ({ navigation }) => {
  const [surveyData, setSurveyData] = useState({
    answer1: '',
    answer2: '',
    answer3: '',
  });
  const [userEmail, setUserEmail] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const intl = useIntl();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email);
    }
    fetchBackgroundImageUrl().then(url => {
      setBackgroundImageUrl(url);
    });
  }, []);

  const handleInputChange = (fieldName, value) => {
    setSurveyData({
      ...surveyData,
      [fieldName]: value,
    });
  };

  const handleSubmitSurvey = async () => {
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error("No user logged in");
      alert(intl.formatMessage({ id: 'Login_to_submit_survey' }));
      return;
    }

    // Path to the user's document
    const userRef = doc(db, 'users', user.uid);
    await addDoc(collection(db, 'surveys'), {
      ...surveyData,
      userEmail,
      timestamp: new Date(),
    });

    await setDoc(userRef, {
      surveyCompleted: true
    }, { merge: true });

    console.log("Survey data saved and user profile updated.");
    alert(intl.formatMessage({ id: 'Thanks For Completing The Survey' }));
    navigation.goBack();
  };

  return (
    <ImageBackground 
      source={{ uri: backgroundImageUrl }}
      style={Sstyles.backgroundImage}
      resizeMode="cover"
    >
      <View style={Sstyles.container}>
        <Text style={Sstyles.title}>{intl.formatMessage({ id: 'User Satisfaction Test' })}</Text>
        <Text style={Sstyles.title}>{intl.formatMessage({ id: 'What is your mood/feelings today?' })}</Text>
        <TextInput
          style={Sstyles.input}
          placeholder={intl.formatMessage({ id: 'Answer' })}
          value={surveyData.answer1}
          onChangeText={(text) => handleInputChange('answer1', text)}
        />
        <Text style={Sstyles.title}>{intl.formatMessage({ id: 'Do you like participating in this community?' })}</Text>
        <TextInput
          style={Sstyles.input}
          placeholder={intl.formatMessage({ id: 'Answer' })}
          value={surveyData.answer2}
          onChangeText={(text) => handleInputChange('answer2', text)}
        />
        <Text style={Sstyles.title}>{intl.formatMessage({ id: 'What more would you like to know about the product?' })}</Text>
        <TextInput
          style={Sstyles.input}
          placeholder={intl.formatMessage({ id: 'Answer' })}
          value={surveyData.answer3}
          onChangeText={(text) => handleInputChange('answer3', text)}
        />
        <TouchableOpacity style={Sstyles.addButton} onPress={handleSubmitSurvey}>
          <Text style={Sstyles.buttonText}>{intl.formatMessage({ id: 'Submit Survey' })}</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const Sstyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
    textAlign: 'center',
  },
  input: {
    height: 40,
    width: '80%',
    borderColor: 'white',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 10,
    color: 'white',
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: '#5e6472',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



// DeveloperView Component
const DeveloperView = ({ navigation }) => {
  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [initialComment, setInitialComment] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const intl = useIntl();

  useEffect(() => {
    fetchBackgroundImageUrl()
      .then(url => {
        setBackgroundImageUrl(url);

        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start(() => {
            setIsImageLoading(false);
            Animated.timing(screenFadeAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }).start();
          });
        }, 3000);
      })
      .catch(error => {
        console.error('Failed to fetch background image URL:', error);
      });

    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const pickImage = () => {
    const options = { mediaType: 'photo', quality: 1 };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error:', response.error);
      } else if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri);
        console.log('Image selected:', response.assets[0].uri);
      }
    });
  };

  const saveTopicInformation = async () => {
    if (!topicName || !topicDescription || !initialComment || !imageUri) {
      Alert.alert('Error', intl.formatMessage({ id: 'fill_all_fields' }));
      return;
    }

    try {
      const db = getFirestore();
      const storage = getStorage();

      const topicRef = doc(collection(db, 'topics'));
      const topicId = topicRef.id;
      const imageName = `${topicId}.jpg`;
      const storageRef = ref(storage, `topics/${imageName}`);
      const img = await fetch(imageUri);
      const bytes = await img.blob();
      await uploadBytes(storageRef, bytes);
      const downloadURL = await getDownloadURL(storageRef);

      await setDoc(topicRef, {
        topicName,
        topicDescription,
        initialComment,
        imageUrl: downloadURL,
      });

      console.log('Topic, image, and initial comment saved successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving topic information:', error);
      Alert.alert('Error', intl.formatMessage({ id: 'Failed_to_save' }) + `: ${error.message}`);
    }
  };

  if (isImageLoading) {
    return (
      <View style={DVstyles.loadingContainer}>
        <Animated.Text style={{ ...DVstyles.loadingText, opacity: fadeAnim }}>
          {intl.formatMessage({ id: 'Loading...' })}
        </Animated.Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ ...DVstyles.container, opacity: screenFadeAnim }}>
      {backgroundImageUrl ? (
        <ImageBackground source={{ uri: backgroundImageUrl }} style={DVstyles.backgroundImage} resizeMode="cover">
          <View style={DVstyles.contentContainer}>
            <Text style={DVstyles.title}>{intl.formatMessage({ id: 'Enter Topic Details' })}</Text>
            <TextInput
              style={DVstyles.input}
              onChangeText={setTopicName}
              value={topicName}
              placeholder={intl.formatMessage({ id: 'Enter Topic Name' })}
              placeholderTextColor="#ccc"
            />
            <TextInput
              style={DVstyles.input}
              onChangeText={setTopicDescription}
              value={topicDescription}
              placeholder={intl.formatMessage({ id: 'Enter Topic Desc' })}
              placeholderTextColor="#ccc"
            />
            <TextInput
              style={DVstyles.input}
              onChangeText={setInitialComment}
              value={initialComment}
              placeholder={intl.formatMessage({ id: 'Enter Initial Comment' })}
              placeholderTextColor="#ccc"
            />
            <TouchableOpacity style={DVstyles.button} onPress={pickImage}>
              <Text style={DVstyles.buttonText}>{intl.formatMessage({ id: 'Choose Image' })}</Text>
            </TouchableOpacity>
            {imageUri ? <Image source={{ uri: imageUri }} style={DVstyles.imagePreview} /> : null}
            <TouchableOpacity style={DVstyles.button} onPress={saveTopicInformation}>
              <Text style={DVstyles.buttonText}>{intl.formatMessage({ id: 'Save' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={DVstyles.button} onPress={() => navigation.navigate('Home')}>
              <Text style={DVstyles.buttonText}>{intl.formatMessage({ id: 'Sign Out' })}</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      ) : (
        <View style={DVstyles.loadingContainer}>
          <Text style={DVstyles.loadingText}>{intl.formatMessage({ id: 'Failed to load background image' })}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const DVstyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 20,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    color: '#fff',
  },
  imagePreview: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#5e6472',
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#5e6472',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    color: '#ecf0f1',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 24,
    color: '#000000',
  },
});

// Settings Component
const Settings = ({ navigation }) => {
  const intl = useIntl();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{intl.formatMessage({ id: 'Settings' })}</Text>
      <TouchableOpacity style={commonButtonStyle} onPress={() => navigation.goBack()}>
        <Text style={{ color: '#ecf0f1', fontSize: 18, fontWeight: 'bold' }}>
          {intl.formatMessage({ id: 'Back' })}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const Stack = createStackNavigator();

const MyStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        gestureEnabled: true,
        cardOverlayEnabled: true,
        ...TransitionPresets.ModalPresentationIOS,
      }}
      mode="modal"
      headerMode="none"
    >
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="UserInterestScreen" component={UserInterestScreen} />
      <Stack.Screen name="Topic" component={Topic} />
      <Stack.Screen name="SurveyForm" component={SurveyForm} />
      <Stack.Screen name="DeveloperLoginScreen" component={DeveloperLoginScreen} />
      <Stack.Screen name="StartLoginScreen" component={StartLoginScreen} />
      <Stack.Screen name="DeveloperView" component={DeveloperView} />
      <Stack.Screen name="RulesScreen" component={RulesScreen} />
      <Stack.Screen name="RegistrationScreen" component={RegistrationScreen} />
      <Stack.Screen name="CommentScreen" component={CommentScreen} />
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <LocalizationProvider>
      <NavigationContainer>
        <MyStack />
      </NavigationContainer>
    </LocalizationProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  label: {
    fontSize: 18,
    color: 'white',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: '#bdc3c7',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 10,
    borderRadius: 8,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(52, 52, 52, 0.8)',
  },
  error: {
    fontSize: 14,
    color: 'red',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#5e6472',
    width: 150,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#5e6472',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 24,
    color: '#000000',
  },
});