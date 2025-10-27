import React, { useState, useEffect } from "react";

const MAPBOX_TOKEN = "pk.eyJ1Ijoid3VpbG1lcnBhbGEyMDI2IiwiYSI6ImNtZWM1cmxiYzBscTYybHB4Z3F5d2Z4angifQ.3J2OTRrnz5nR4atZC83n8w";

function AddressAutocomplete({ setEventDestination, setEventDestinationCoords }) {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!searchText) return setSuggestions([]);

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            searchText
          )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`
        );
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    };

    fetchSuggestions();
  }, [searchText]);

  const handleSelect = (place) => {
    setSearchText(place.place_name);
    setSuggestions([]);
    setEventDestination(place.place_name);
    setEventDestinationCoords({
      latitude: place.center[1],
      longitude: place.center[0],
    });
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter Destination"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <ul>
        {suggestions.map((place) => (
          <li
            key={place.id}
            onClick={() => handleSelect(place)}
            style={{ cursor: "pointer" }}
          >
            {place.place_name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AddressAutocomplete;

