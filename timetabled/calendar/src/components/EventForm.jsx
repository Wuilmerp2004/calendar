import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import AddressAutocomplete from "./Destination.jsx";
import "./Calendar.css";

const MAPBOX_TOKEN = "pk.eyJ1Ijoid3VpbG1lcnBhbGEyMDI2IiwiYSI6ImNtZWM1cmxiYzBscTYybHB4Z3F5d2Z4angifQ.3J2OTRrnz5nR4atZC83n8w";
mapboxgl.accessToken = MAPBOX_TOKEN;

function EventForm({ onSubmit }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);

  const [userLocation, setUserLocation] = useState(null);
  const [eventDestination, setEventDestination] = useState("");
  const [eventDestinationCoords, setEventDestinationCoords] = useState(null);
  const [eta, setEta] = useState(null);
  const [directions, setDirections] = useState([]);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [-74.0242, 40.6941],
        zoom: 12,
      });
    }
  }, []);

  // User location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (userMarkerRef.current) userMarkerRef.current.remove();

    userMarkerRef.current = new mapboxgl.Marker({ color: "blue" })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(mapRef.current);

    mapRef.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 14,
    });
  }, [userLocation]);

  // Destination + route
  useEffect(() => {
    if (!mapRef.current || !userLocation || !eventDestinationCoords) return;

    if (destMarkerRef.current) destMarkerRef.current.remove();

    destMarkerRef.current = new mapboxgl.Marker({ color: "red" })
      .setLngLat([eventDestinationCoords.longitude, eventDestinationCoords.latitude])
      .addTo(mapRef.current);

    const fetchDirections = async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.longitude},${userLocation.latitude};${eventDestinationCoords.longitude},${eventDestinationCoords.latitude}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const data = await res.json();
        const route = data?.routes?.[0];
        if (!route) return;

        setEta(Math.round(route.duration / 60));
        setDirections(
          route.legs[0].steps.map((step, index) => ({
            id: index,
            instruction: step.maneuver.instruction,
            distance: `${(step.distance / 1000).toFixed(2)} km`,
          }))
        );

        // Remove old route
        if (mapRef.current.getLayer("route")) mapRef.current.removeLayer("route");
        if (mapRef.current.getSource("route")) mapRef.current.removeSource("route");

        // Add new route
        mapRef.current.addSource("route", {
          type: "geojson",
          data: { type: "Feature", geometry: route.geometry },
        });

        mapRef.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#1DB954", "line-width": 6 }, // highlighted
        });

        const bounds = new mapboxgl.LngLatBounds();
        route.geometry.coordinates.forEach((coord) => bounds.extend(coord));
        bounds.extend([userLocation.longitude, userLocation.latitude]);
        bounds.extend([eventDestinationCoords.longitude, eventDestinationCoords.latitude]);
        mapRef.current.fitBounds(bounds, { padding: 50 });
      } catch (err) {
        console.error("Error fetching directions:", err);
      }
    };

    fetchDirections();
  }, [userLocation, eventDestinationCoords]);

  const getUserLocation = () => {
    if (!navigator.geolocation) return console.error("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => console.error("Error getting location:", err)
    );
  };

  const handleSubmit = () => {
    if (onSubmit)
      onSubmit({
        destination: eventDestination,
        coords: eventDestinationCoords,
        userLocation,
      });
  };

  return (
    <div>
      <AddressAutocomplete
        setEventDestination={setEventDestination}
        setEventDestinationCoords={setEventDestinationCoords}
      />
      <button onClick={getUserLocation}>Get My Location</button>
      <button onClick={handleSubmit}>Submit Event</button>

      <div ref={mapContainerRef} style={{ width: "100%", height: "400px", marginTop: "20px" }} />

      {eta && (
        <div>
          <h4>Estimated Time of Arrival: {eta} minutes</h4>
          <h5>Directions:</h5>
          <ol>
            {directions.map((step) => (
              <li key={step.id}>
                {step.instruction} - {step.distance}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default EventForm;
