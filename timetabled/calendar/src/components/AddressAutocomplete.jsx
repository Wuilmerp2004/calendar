import { useState, useEffect } from "react";
import "./AddressAutocomplete.css";

const MAPBOX_TOKEN = "pk.eyJ1Ijoid3VpbG1lcnBhbGEyMDI2IiwiYSI6ImNtZWM1cmxiYzBscTYybHB4Z3F5d2Z4angifQ.3J2OTRrnz5nR4atZC83n8w";

export const AddressAutocomplete = ({
  value,
  setEventDestination,
  setEventDestinationCoords,
}) => {
  const [searchText, setSearchText] = useState(value);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    setSearchText(value);
  }, [value]);

  useEffect(() => {
    if (!searchText) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            searchText
          )}.json?access_token=${MAPBOX_TOKEN}&limit=5`
        );
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSelect = (place) => {
    setEventDestination(place.place_name);
    setEventDestinationCoords({
      latitude: place.center[1],
      longitude: place.center[0],
    });
    setSuggestions([]);
  };

  return (
    <div className="autocomplete-wrapper">
      <div className="autocomplete-input-wrapper">
        <i className="bx bx-map-pin input-icon"></i>
        <input
          type="text"
          placeholder="Search for a location"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="autocomplete-input"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((place) => (
            <button
              key={place.id}
              onClick={() => handleSelect(place)}
              className="suggestion-item"
            >
              <i className="bx bx-current-location"></i>
              {place.place_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};