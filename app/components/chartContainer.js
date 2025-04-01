"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { db } from "../firebase.js";
import { collection, getDocs, query, orderBy, limit, doc, getDoc, setDoc } from "firebase/firestore";

// Dynamically import Plotly with SSR disabled
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const LineChartComponent = ({collectionName, chartTitle}) => {
  const [data, setData] = useState([]);
  const [layout, setLayout] = useState({});

  useEffect(() => {
    const fetchData = async (collectionName) => {
      console.log("Fetching data for collection:", collectionName);
      const logRef = collection(db, collectionName, "history", "log");
      const q = query(logRef, orderBy("timestamp", "desc"), limit(72));
      const querySnapshot = await getDocs(q);

      const xData = []; // Timestamps in milliseconds
      const yData = []; // Temperatures

      querySnapshot.forEach((doc) => {
        const { timestamp, temperature } = doc.data();
        xData.push(timestamp.seconds * 1000); // Convert seconds to milliseconds
        yData.push(temperature);
      });
      console.log("xData:", xData);
      console.log("yData:", yData);

      // Calculate dynamic ranges
      const minX = Math.min(...xData);
      const maxX = Math.max(...xData);
      const xPadding = (maxX - minX) * 0.05 || 3600000; // 5% of range or 1 hour if zero
      const xRange = [minX - xPadding, maxX + xPadding];

      const minY = Math.min(...yData);
      const maxY = Math.max(...yData);
      const yPadding = (maxY - minY) * 0.1 || 2; // 10% of range or 2°F if zero
      const yRange = [minY - yPadding, maxY + yPadding];

      // Set Plotly data
      setData([
        {
          x: xData,
          y: yData,
          type: "scatter",
          mode: "lines+markers",
          marker: { color: "rgb(255, 99, 132)", size: 8 },
          line: { color: "rgb(255, 99, 132)", width: 2 },
          hoverinfo: "x+y",
          name: "Temperature Over Time",
        },
      ]);

      // Set Plotly layout with dynamic ranges
      setLayout({
        title: 
        {text: chartTitle,},
        xaxis: {
          title: {text: "Time"},
          type: "date",
          range: xRange, // Dynamic x-axis range
          tickformat: "%I:%M %p", // e.g., "1:53 PM"
          dtick: Math.max((maxX - minX) / 10, 300000), // ~10 ticks, min 5 minutes
        },
        yaxis: {
          title: 
          {text: "Temperature (°F)"},
          range: yRange, // Dynamic y-axis range
          dtick: Math.max((maxY - minY) / 10, 0.5), // ~10 ticks, min 0.5°F
        },
        autosize: true,
        margin: { l: 50, r: 50, t: 50, b: 50 },
        hovermode: "closest",
      });
    };

    fetchData(collectionName).catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div className="chart-container">
      <Plot
        data={data}
        layout={layout}
        useResizeHandler={true}
        style={{ width: "100%", height: "400px" }}
        config={{ displayModeBar: true, responsive: true }}
      />
    </div>
  );
};

export default LineChartComponent;