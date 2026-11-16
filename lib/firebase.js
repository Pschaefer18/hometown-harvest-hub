// Firebase web SDK setup. These config values are public identifiers, not
// secrets. Access is controlled by Google sign-in plus Firestore security rules.
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Main project: orders, inventory, CSA members (shared with the website).
const mainConfig = {
  apiKey: "AIzaSyD1XjZ4g6pbvTiwB-HxHczIBtEpOEg-RtI",
  authDomain: "csa-registration-1ed70.firebaseapp.com",
  projectId: "csa-registration-1ed70",
  storageBucket: "csa-registration-1ed70.appspot.com",
  messagingSenderId: "953766080846",
  appId: "1:953766080846:web:77b75ab16b5a0369122e1f",
};

// Climate project: Raspberry Pi data. When the Pis move to the main project,
// set this to null and the climate tabs will read from the main project instead.
const climateConfig = {
  apiKey: "AIzaSyDlqmw1nlzHyOuzjAij4JjocXiCou1u-Ls",
  authDomain: "hometown-harvest-hub.firebaseapp.com",
  projectId: "hometown-harvest-hub",
  storageBucket: "hometown-harvest-hub.firebasestorage.app",
  messagingSenderId: "469331070172",
  appId: "1:469331070172:web:7cb996c4c670ee7dc17819",
};

const getOrInit = (config, name) =>
  getApps().find((a) => a.name === name) || initializeApp(config, name);

const mainApp = getOrInit(mainConfig, "[DEFAULT]");
const climateApp = climateConfig ? getOrInit(climateConfig, "climate") : mainApp;

export const auth = getAuth(mainApp);
export const db = getFirestore(mainApp);

export const climateAuth = getAuth(climateApp);
export const climateDb = getFirestore(climateApp);
export const climateIsSeparate = climateApp !== mainApp;
