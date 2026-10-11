import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, onSnapshot } from "firebase/firestore";
import { appfirebase, db } from "../assets/database/firebaseconfig";

const functions = getFunctions(appfirebase);

export const subscribeToAttendances = (onAttendances, onError) => onSnapshot(
  collection(db, "asistencias"),
  (snapshot) => onAttendances(snapshot.docs.map((attendance) => ({
    ...attendance.data(),
    id: attendance.id,
  }))),
  onError,
);

export const registerClientAttendance = async () => {
  const registerAttendance = httpsCallable(functions, "registrarAsistencia");
  const response = await registerAttendance();
  return response.data;
};
