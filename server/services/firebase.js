import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, push } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDgidLUBG3nBLdkABqDck1ZOQxOQIiLoFg",
  authDomain: "higgsfield228.firebaseapp.com",
  projectId: "higgsfield228",
  databaseURL: "https://higgsfield228-default-rtdb.europe-west1.firebasedatabase.app/",
  storageBucket: "higgsfield228.firebasestorage.app",
  messagingSenderId: "120694614464",
  appId: "1:120694614464:web:58baa242dfa3b119c88025"
};


const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

export const getCanvasData = async (workspaceId) => {
  try {
    const canvasRef = ref(database, `workspaces/${workspaceId}/canvas`);
    const snapshot = await get(canvasRef);
    if (snapshot.exists()) {
      return snapshot.val().elements || [];
    }
  } catch (error) {
    console.error("Error reading canvas from Firebase:", error);
  }
  return [];
};


export const saveCanvasData = async (workspaceId, elements) => {
  try {
    const canvasRef = ref(database, `workspaces/${workspaceId}/canvas`);
    await set(canvasRef, { elements });
    return true;
  } catch (error) {
    console.error("Error saving canvas to Firebase:", error);
    return false;
  }
};
