// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "@firebase/firestore";
import { getAuth } from "firebase/auth"; // Import auth module


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
//Tika mainīts, jo ir public
const firebaseConfig = {
    apiKey: "1AIzaSyBCpk03VElobbjAKuxeUTa-isDtjnzd4Oc",
    authDomain: "dev1-4cd5e.firebaseapp.com",
    projectId: "dev1-4cd5e",
    storageBucket: "dev1-4cd5e.appspot.com",
    messagingSenderId: "964815927627",
    appId: "1:964815927627:web:48007afa0b9c3496c0d0ce"
  };

  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);
  const auth = getAuth(app); // Initialize auth module
  
  export { app, firestore, auth }; // Export the app, firestore, and auth for use in other files
