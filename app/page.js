"use client"; // Mark this as a Client Component since we'll use state and effects

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import LineChartComponent from "./components/chartContainer";
import { db } from "./firebase"; // Adjust this import based on your Firebase setup
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Home() {
  const [temperature, setTemperature] = useState(null); // Current temperature
  const [temperatureSetting, setTemperatureSetting] = useState(null); // Target temperature
  const [editTemp, setEditTemp] = useState(""); // Value in the input field
  const [isEditing, setIsEditing] = useState(false); // Toggle edit mode
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch initial temperature from Firestore
  useEffect(() => {
    const fetchTemperatures = async () => {
      try {
        // Fetch live temperature from germination/live-climate
        const liveDocRef = doc(db, "germination", "live-climate");
        const liveDocSnap = await getDoc(liveDocRef);
        if (liveDocSnap.exists()) {
          const liveData = liveDocSnap.data();
          setTemperature(liveData.temperature);
        } else {
          console.log("No live-climate document found!");
        }

        // Fetch set temperature from germination/set-climate
        const setDocRef = doc(db, "germination", "set-climate");
        const setDocSnap = await getDoc(setDocRef);
        if (setDocSnap.exists()) {
          const setData = setDocSnap.data();
          setTemperatureSetting(setData.temperature);
          setEditTemp(setData.temperature); // Pre-fill input with current value
        } else {
          console.log("No set-climate document found!");
        }
      } catch (error) {
        console.error("Error fetching temperatures:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemperatures();
  }, []);

  // Handle temperature update
  const handleSave = async () => {
    const newTemp = parseFloat(editTemp);
    if (isNaN(newTemp)) {
      alert("Please enter a valid number");
      return;
    }

    try {
      const docRef = doc(db, "germination", "set-climate");
      await setDoc(docRef, { temperature: newTemp }, { merge: true });
      setTemperatureSetting(newTemp);
      setIsEditing(false); // Exit edit mode
      console.log("Temperature updated to:", newTemp);
    } catch (error) {
      console.error("Error updating temperature:", error);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.chart}>
          <LineChartComponent collectionName="germination" chartTitle="Germination Chamber"/>
        </div>

        {/* Temperature Display and Edit Section */}
        <div className={styles.temperatureSection}>
          {loading ? (
            <p>Loading temperature...</p>
          ) : temperature !== null ? (
            <>
              <h2>Set Temperature</h2>
              {isEditing ? (
                <div>
                  <input
                    type="number"
                    value={editTemp}
                    onChange={(e) => setEditTemp(e.target.value)}
                    step="0.1"
                    placeholder="Enter temperature (°F)"
                    className={styles.tempInput}
                  />
                  <button onClick={handleSave} className={styles.saveButton}>
                    Set Temp
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div>
                  <p>{temperatureSetting}°F</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                </div>
              )}
            </>
          ) : (
            <p>No temperature data available</p>
          )}
        </div>
        <div className={styles.chart}>
          <LineChartComponent collectionName="greenhouse" chartTitle="Greenhouse"/>
        </div>

        {/* Uncomment this if you want to add the greenhouse chart back */}
        {/* <div className={styles.chart}>
          <LineChartComponent collectionName="greenhouse" />
        </div> */}
      </main>
    </div>
  );
}