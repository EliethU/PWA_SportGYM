import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { appfirebase, db } from "../assets/database/firebaseconfig";

const functions = getFunctions(appfirebase);

export const subscribeToAttendances = (dateKey, onAttendances, onError) => onSnapshot(
  query(collection(db, "asistencias"), where("fechaClave", "==", dateKey)),
  (snapshot) => onAttendances(snapshot.docs.map((attendance) => ({
    id: attendance.id,
    ...attendance.data(),
  }))),
  onError,
);

export const registerClientAttendance = async () => {
  const registerAttendance = httpsCallable(functions, "registrarAsistencia");
  const response = await registerAttendance();
  return response.data;
};
