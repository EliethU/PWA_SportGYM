import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../assets/database/firebaseconfig";

const planesRef = collection(db, "planes");

export const obtenerPlanes = async () => {
  const snapshot = await getDocs(planesRef);

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
};

export const crearPlan = async (plan) => {
  const docRef = await addDoc(planesRef, {
    ...plan,
    activo: true,
    fechaCreacion: serverTimestamp(),
  });

  return docRef.id;
};