import { useState } from "react";
import EventForm from './EventForm.jsx';
import AddressAutocomplete from "./Destination.jsx";

const Calendar = () => {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthsOfYear = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    " July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentDate = new Date();

  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventTime, setEventTime] = useState({hours: '00', minutes: '00'});
  const [eventText, setEventText] = useState("");
  const [editEvent, seteditEvent] = useState(null);
  const [ eventDestination, setEventDestination] = useState("");
  
  // Get the number of days in the current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Get the first day of the month (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();


  const prevMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1));
    setCurrentYear((prevYear) => (currentYear === 0 ? prevYear - 1 : prevYear));
  };
  const nextMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1));
    setCurrentYear((prevYear) =>
      currentYear === 11 ? prevYear + 1 : prevYear
    );
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    const today = new Date();

    if (clickedDate >= today || isSameDate(clickedDate, today)) {
      setSelectedDate(clickedDate);
      setShowEventPopup(true);
      // Reset event time and text when a new date is selected
      setEventTime({hours: '00', minutes: '00'});
      setEventText("");
      seteditEvent(null);
    }
  };
  const isSameDate = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }
  const handleEventSubmit = () => {
    const newEvent = {
      id : editEvent ? editEvent.id : Date.now(), // If editing use existing id, else generate new id
      date : selectedDate, 
      time: `${eventTime.hours.padStart(2, '0')}:${eventTime.minutes.padStart(2, '0')}`,
      text : eventText,
      destination: eventDestination,
    }

    let updatedEvents = [...events]
    if(editEvent) {
      updatedEvents = updatedEvents.map((event) => event.id === editEvent.id ? newEvent : event,)
    }
    else {
      updatedEvents.push(newEvent)
    }
    updatedEvents.sort((a, b) => new Date(a.date) - new Date(b.date)) //subtarcts the date object from a date and b date 
    setEvents(updatedEvents)
    setEventTime({hours: '00', minutes: '00'});
    setEventText("")
    setShowEventPopup(false)
    seteditEvent(null);
    setEventDestination("");
  }
  const handleEditEvent = (event) => {
    setSelectedDate(new Date(event.date)) // Set the selected date to the event's date
    setEventTime({
      hours: event.time.split(':')[0],
      minutes: event.time.split(':')[1],
    })
    setEventText(event.text);
    seteditEvent(event); // Set the event to be edited
    setShowEventPopup(true); // Show the popup for editing
    setEventDestination(event.destination); 

  }
  const handleDeleteEvent = (eventId) => {
    const updatedEvents = events.filter((e) => e.id !== eventId) // Filter out the event with the given id
    
    setEvents(updatedEvents);
  }
  const handleTimeChange = (e) => {
    const {name, value} = e.target
    setEventTime((prevTime) => ({...prevTime, [name]: value.padStart(2, '0')})) // padStart ensures that hours and minutes are always two digits
  }

  return (

    <div className="calendar-app">
      <div className="calendar">
        <h1 className="heading">Calendar</h1>
        <div className="navigate-date">
          <h2 className="month">{monthsOfYear[currentMonth]}</h2>
          <h2 className="year">{currentYear}</h2>
          <div className="buttons">
            <i className="bx bx-chevron-left" onClick={prevMonth}></i>
            <i className="bx bx-chevron-right" onClick={nextMonth}></i>
          </div>
        </div>
        <div className="weekdays">
          {daysOfWeek.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="days">
          {[...Array(firstDayOfMonth).keys()].map((_, index) => (
            <span key={`empty-${index}`}></span>
          ))}
          {[...Array(daysInMonth).keys()].map((day) => (
            <span
              key={day + 1}
              className={
                day + 1 === currentDate.getDate() &&
                currentMonth === currentDate.getMonth() &&
                currentYear === currentDate.getFullYear()
                  ? "current-day"
                  : ""
              }
              onClick={() => handleDayClick(day + 1)}
            >
              {day + 1}
            </span>
          ))}
        </div>
      </div>
      <div className="events">
        {showEventPopup && (
          <div className="event-popup">
            <div className="time-input">
              <div className="event-popup-time">Time</div>
              <input
                type="number"
                name="hours"
                min={0}
                max={24}
                className="hours" value={eventTime.hours} onChange={handleTimeChange}
              />
              <input
                type="number"
                name="minutes"
                min={0}
                max={60}
                className="minutes" value={eventTime.minutes} onChange={handleTimeChange}
              />
            </div>
          
            <AddressAutocomplete
             value={eventDestination}
             setEventDestination={setEventDestination}
            />
            <textarea placeholder="Enter Event Text (Maximum 60 Characters)" value={eventText} onChange = {(e) => {
              if(e.target.value.length <= 60){
                setEventText(e.target.value);
              }
            }}></textarea>
            <button className="event-popup-button" onClick={handleEventSubmit}>{editEvent ? "Update Event" : "Add Event"}</button>
            <button className="close-popup-button" onClick={() => setShowEventPopup(false)}>
              <i className="bx bx-x"></i>
            </button>
          </div>
        )}
        {events.map((event, index) => (
          <div className="event" key={index}>
          <div className="event-date-wrapper">
            <div className="event-date">{`${monthsOfYear[event.date.getMonth()]} ${event.date.getDate()}, ${event.date.getFullYear()}`}</div>
            <div className="event-time">{event.time}</div>
          </div>
          <div className="event-text">{event.text}</div>
          {event.destination && (
            <div className="event-destination">
              <strong>Destination:</strong> {event.destination}
            </div>
          )}
          <div className="event-button">
            <i className="bx bxs-edit-alt" onClick={() => handleEditEvent(event)}></i>
            <i className="bx bxs-message-alt-x" onClick={() => handleDeleteEvent(event.id)}></i>
          </div>
        </div>
      ))}
      </div>
    </div>
  )}

export default Calendar;
