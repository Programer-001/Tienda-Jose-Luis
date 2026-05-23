import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBO8ZPU6a05Eiqqn-SKw6xZx-8D1wh2nJQ",
  authDomain: "tienda-j-l.firebaseapp.com",
  databaseURL: "https://tienda-j-l-default-rtdb.firebaseio.com",
  projectId: "tienda-j-l",
  storageBucket: "tienda-j-l.firebasestorage.app",
  messagingSenderId: "112387023585",
  appId: "1:112387023585:web:20e7043316fb9bbe4b0da0"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);