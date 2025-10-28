import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapView.css";

const MAPBOX_TOKEN = "pk.eyJ1Ijoid3VpbG1lcnBhbGEyMDI2IiwiYSI6ImNtZWM1cmxiYzBscTYybHB4Z3F5d2Z4angifQ.3J2OTRrnz5nR4atZC83n8w";
mapboxgl.accessToken = MAPBOX_TOKEN;

export const MapView = ({ destinationCoords, destinationName }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);

  const [userLocation, setUserLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [directions, setDirections] = useState([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [destinationCoords.longitude, destinationCoords.latitude],
        zoom: 12,
      });

      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    if (destMarkerRef.current) destMarkerRef.current.remove();

    const el = document.createElement("div");
    el.className = "destination-marker";
    el.innerHTML = '<div class="marker-pin"></div>';

    destMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([destinationCoords.longitude, destinationCoords.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="map-popup">${destinationName}</div>`
        )
      )
      .addTo(mapRef.current);

    mapRef.current.flyTo({
      center: [destinationCoords.longitude, destinationCoords.latitude],
      zoom: 14,
      duration: 1500,
    });
  }, [destinationCoords, destinationName]);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (userMarkerRef.current) userMarkerRef.current.remove();

    const el = document.createElement("div");
    el.className = "user-marker";
    el.innerHTML = '<div class="marker-dot"></div>';

    userMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          '<div class="map-popup">Your Location</div>'
        )
      )
      .addTo(mapRef.current);

    const fetchDirections = async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.longitude},${userLocation.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const data = await res.json();
        const route = data?.routes?.[0];
        if (!route) return;

        setEta(Math.round(route.duration / 60));
        setDistance((route.distance / 1000).toFixed(1));
        setDirections(
          route.legs[0].steps.map((step, index) => ({
            id: index,
            instruction: step.maneuver.instruction,
            distance: `${(step.distance / 1000).toFixed(2)} km`,
          }))
        );

        if (mapRef.current?.getLayer("route")) mapRef.current.removeLayer("route");
        if (mapRef.current?.getSource("route")) mapRef.current.removeSource("route");

        mapRef.current?.addSource("route", {
          type: "geojson",
          data: { type: "Feature", geometry: route.geometry, properties: {} },
        });

        mapRef.current?.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#FF9933",
            "line-width": 6,
            "line-opacity": 0.8,
          },
        });

        const bounds = new mapboxgl.LngLatBounds();
        route.geometry.coordinates.forEach((coord) => bounds.extend(coord));
        mapRef.current?.fitBounds(bounds, { padding: 50 });
      } catch (err) {
        console.error("Error fetching directions:", err);
      }
    };

    fetchDirections();
  }, [userLocation, destinationCoords]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      (err) => {
        console.error("Error getting location:", err);
        alert("Could not get your location");
        setIsLoadingLocation(false);
      }
    );
  };

  return (
    <div className="map-view">
      <div className="map-header">
        <h3>Route Map</h3>
        {!userLocation && (
          <button
            onClick={getUserLocation}
            disabled={isLoadingLocation}
            className="location-button"
          >
            <i className="bx bx-navigation"></i>
            {isLoadingLocation ? "Getting Location..." : "Get My Location"}
          </button>
        )}
      </div>

      <div ref={mapContainerRef} className="map-container" />

      {eta && (
        <div className="route-info">
          <div className="info-cards">
            <div className="info-card eta-card">
              <p className="card-label">ETA</p>
              <p className="card-value">{eta} min</p>
            </div>
            <div className="info-card distance-card">
              <p className="card-label">Distance</p>
              <p className="card-value">{distance} km</p>
            </div>
          </div>

          <div className="directions-section">
            <h4 className="directions-title">
              <i className="bx bx-map-pin"></i>
              Turn-by-Turn Directions
            </h4>
            <div className="directions-list">
              {directions.map((step) => (
                <div key={step.id} className="direction-step">
                  <div className="step-number">{step.id + 1}</div>
                  <div className="step-content">
                    <p className="step-instruction">{step.instruction}</p>
                    <p className="step-distance">{step.distance}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};