
import Calendar from './components/Calendar';
import './index.css';
import EventForm from './components/EventForm';

const App = () => {

  return (
    <div className="App">
      <h2></h2>
      <div className="calendar-section">
      <Calendar />
      </div>
      <div className="map-section">
      <EventForm />
      </div>
      <div id='map-container'>
      </div>
    </div>
  )
}

export default App