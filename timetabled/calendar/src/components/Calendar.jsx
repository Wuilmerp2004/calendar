import { useState, useEffect } from "react";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { MapView } from "./MapView";
import "./Calendar.css";

export const Calendar = () => {
  const monthsOfYear = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [events, setEvents] = useState({});
  const [eventTime, setEventTime] = useState({ hours: "", minutes: "" });
  const [eventText, setEventText] = useState("");
  const [eventDestination, setEventDestination] = useState("");
  const [eventDestinationCoords, setEventDestinationCoords] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const savedEvents = localStorage.getItem("calendarEvents");
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }, [events]);

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    setSelectedDate(date);
    setShowPopup(true);
    setEditEvent(null);
    setEventTime({ hours: "", minutes: "" });
    setEventText("");
    setEventDestination("");
    setEventDestinationCoords(null);
    setShowMap(false);
  };

  const handleAddEvent = () => {
    if (!selectedDate) return;

    const dateKey = selectedDate.toDateString();
    const newEvent = {
      id: editEvent ? editEvent.id : Date.now(),
      time: `${eventTime.hours.padStart(2, "0")}:${eventTime.minutes.padStart(2, "0")}`,
      text: eventText,
      destination: eventDestination,
      destinationCoords: eventDestinationCoords,
    };

    setEvents((prev) => {
      const dateEvents = prev[dateKey] || [];
      if (editEvent) {
        return {
          ...prev,
          [dateKey]: dateEvents.map((e) => (e.id === editEvent.id ? newEvent : e)),
        };
      } else {
        return {
          ...prev,
          [dateKey]: [...dateEvents, newEvent],
        };
      }
    });

    setShowPopup(false);
    setEventTime({ hours: "", minutes: "" });
    setEventText("");
    setEventDestination("");
    setEventDestinationCoords(null);
    setEditEvent(null);
    setShowMap(false);
  };

  const handleEditEvent = (date, event) => {
    setSelectedDate(date);
    setEditEvent(event);
    const [hours, minutes] = event.time.split(":");
    setEventTime({ hours, minutes });
    setEventText(event.text);
    setEventDestination(event.destination || "");
    setEventDestinationCoords(event.destinationCoords || null);
    setShowPopup(true);
    setShowMap(false);
  };

  const handleDeleteEvent = (date, eventId) => {
    const dateKey = date.toDateString();
    setEvents((prev) => ({
      ...prev,
      [dateKey]: prev[dateKey].filter((e) => e.id !== eventId),
    }));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<span key={`empty-${i}`}></span>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateKey = date.toDateString();
      const dayEvents = events[dateKey] || [];
      const isToday =
        day === new Date().getDate() &&
        currentMonth === new Date().getMonth() &&
        currentYear === new Date().getFullYear();

      days.push(
        <span
          key={day}
          className={isToday ? "current-day" : ""}
          onClick={() => handleDateClick(day)}
        >
          {day}
          {dayEvents.length > 0 && (
            <div className="event-indicators">
              {dayEvents.map((event) => (
                <div key={event.id} className="event-dot" title={`${event.time} - ${event.text}`} />
              ))}
            </div>
          )}
        </span>
      );
    }

    return days;
  };

  const todayEvents = events[new Date().toDateString()] || [];

  return (
    <div className="calendar-app">
      <div className="calendar">
        <h1 className="heading">Calendar</h1>
        <div className="navigate-date">
          <h2 className="month">{monthsOfYear[currentMonth]}</h2>
          <h2 className="year">{currentYear}</h2>
          <div className="buttons">
            <i className="bx bx-chevron-left" onClick={handlePrevMonth}></i>
            <i className="bx bx-chevron-right" onClick={handleNextMonth}></i>
          </div>
        </div>
        <div className="weekdays">
          {daysOfWeek.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="days">{renderCalendar()}</div>
      </div>

      <div className="events">
        {todayEvents.map((event) => (
          <div className="event" key={event.id}>
            <div className="event-date-wrapper">
              <div className="event-date">Today</div>
              <div className="event-time">{event.time}</div>
            </div>
            <div className="event-text">{event.text}</div>
            {event.destination && (
              <div className="event-destination">
                <strong>📍</strong> {event.destination}
              </div>
            )}
            <div className="event-button">
              <i className="bx bxs-edit-alt" onClick={() => handleEditEvent(new Date(), event)}></i>
              <i className="bx bxs-message-alt-x" onClick={() => handleDeleteEvent(new Date(), event.id)}></i>
            </div>
          </div>
        ))}
        {todayEvents.length === 0 && (
          <div className="no-events">No events today</div>
        )}
      </div>

      {showPopup && selectedDate && (
        <div className="event-popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="event-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup-button" onClick={() => setShowPopup(false)}>
              <i className="bx bx-x"></i>
            </button>

            <h3 className="popup-title">
              {editEvent ? "Edit Event" : "New Event"}
            </h3>
            <p className="popup-date">
              {monthsOfYear[selectedDate.getMonth()]} {selectedDate.getDate()},{" "}
              {selectedDate.getFullYear()}
            </p>

            {!showMap ? (
              <div className="popup-content">
                <div className="time-input">
                  <div className="event-popup-time">Time</div>
                  <input
                    type="number"
                    name="hours"
                    min={0}
                    max={23}
                    className="hours"
                    value={eventTime.hours}
                    onChange={(e) => setEventTime((prev) => ({ ...prev, hours: e.target.value }))}
                  />
                  <input
                    type="number"
                    name="minutes"
                    min={0}
                    max={59}
                    className="minutes"
                    value={eventTime.minutes}
                    onChange={(e) => setEventTime((prev) => ({ ...prev, minutes: e.target.value }))}
                  />
                </div>

                <AddressAutocomplete
                  value={eventDestination}
                  setEventDestination={setEventDestination}
                  setEventDestinationCoords={setEventDestinationCoords}
                />

                <textarea
                  placeholder="Enter Event Text (Maximum 60 Characters)"
                  value={eventText}
                  onChange={(e) => {
                    if (e.target.value.length <= 60) {
                      setEventText(e.target.value);
                    }
                  }}
                ></textarea>
                <p className="char-count">{eventText.length}/60</p>

                <div className="popup-buttons">
                  {eventDestinationCoords && (
                    <button className="map-button" onClick={() => setShowMap(true)}>
                      <i className="bx bx-map"></i>
                      View Map
                    </button>
                  )}
                  <button className="event-popup-button" onClick={handleAddEvent}>
                    {editEvent ? "Update Event" : "Add Event"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="popup-content">
                <button className="back-button" onClick={() => setShowMap(false)}>
                  <i className="bx bx-arrow-back"></i>
                  Back to Details
                </button>
                <MapView
                  destinationCoords={eventDestinationCoords}
                  destinationName={eventDestination}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};