import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: "AIzaSyD7dcJDrGRTH743AoyYnMvTODAMPVRt5Yg",
  authDomain: "sportgym-2b2f8.firebaseapp.com",
  projectId: "sportgym-2b2f8",
  storageBucket: "sportgym-2b2f8.firebasestorage.app",
  messagingSenderId: "51187930142",
  appId: "1:51187930142:web:aed0e8f35bcfe5e8d44a0f"
};

// Inicializa Firebase
const appfirebase = initializeApp(firebaseConfig);

// Inicializa Firestore
const db = getFirestore(appfirebase);

// Inicializa Authentication
const auth = getAuth(appfirebase);

const storage = getStorage(appfirebase);

export { appfirebase, db, auth, storage };