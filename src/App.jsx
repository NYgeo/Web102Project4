import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'

export default function App() {
  const [inputs, setInputs] = useState({
    url: '',
    format: '',
    no_ads: '',
    no_cookie_banners: '',
    width: 300,
    height: 300,
  });
  const [objectID, setObjectID] = useState(null); // Start with null
  const [objectIDs, setObjectIDs] = useState([]); // Store all IDs
  const [currentImage, setCurrentImage] = useState('');
  const [status, setStatus] = useState('Idle');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [year, setYear] = useState('');
  const [filterName, setFilterName] = useState(false);

  // Fetch all objectIDs once on mount
  useEffect(() => {
    const fetchIDs = async () => {
      try {
        const res = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/objects');
        const data = await res.json();
        // Limit to first 50,000 IDs for performance
        const limitedIDs = (data.objectIDs || []).slice(200000, 250000);
        setObjectIDs(limitedIDs);
        // Pick a random ID to start
        if (limitedIDs.length > 0) {
          setObjectID(limitedIDs[Math.floor(Math.random() * limitedIDs.length)]);
        }
      } catch (err) {
        setStatus('Error fetching object IDs');
      }
    };
    fetchIDs();
  }, []);

  let response_type = 'json';
  let fail_on_status = '400%2C404%2C500-511';
  let url_starter = 'https://';
  let fullURL = url_starter + inputs.url;

  const makeQuery = () => `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}`;

  const handleFilterName = () => {
    setFilterName((prev) => !prev);
  };

  const callAPI = async (query) => {
    setStatus('Loading...');
    try {
      const response = await fetch(query);
      if (!response.ok) throw new Error('Network response was not ok');
      const json = await response.json();
      if (!json.primaryImageSmall) {
        // If no image, skip to next
        handleNext();
        return;
      }
      // Filter by artist name: skip if first initial is A-M (case-insensitive), unless blank
      if (filterName && json.artistDisplayName && json.artistDisplayName.trim() !== '') {
        const firstChar = json.artistDisplayName.trim().charAt(0).toUpperCase();
        if (firstChar >= 'A' && firstChar <= 'M') {
          // Skip and get next
          handleNext();
          return;
        }
      }
      setCurrentImage(json.primaryImageSmall);
      setDepartment(json.department || '');
      setTitle(json.title || '');
      setArtist(json.artistDisplayName && json.artistDisplayName.trim() !== '' ? json.artistDisplayName : 'Unknown');
      setYear(json.objectDate || '');
      setStatus('Success');
      reset();
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  };

  const handleNext = () => {
    if (objectIDs.length > 0) {
      let tries = 0;
      let found = false;
      let randomIndex, candidateID;
      while (!found && tries < 100) {
        randomIndex = Math.floor(Math.random() * objectIDs.length);
        candidateID = objectIDs[randomIndex];
        if (!filterName) {
          found = true;
        } else {
          // We'll check the artist name in callAPI
          found = true;
        }
        tries++;
      }
      setObjectID(candidateID);
    }
  };

  const reset = () => {
    setInputs({
      url: '',
      format: '',
      no_ads: '',
      no_cookie_banners: '',
      width: 300,
      height: 300,
    });
  };

  // Fetch new image when objectID changes
  useEffect(() => {
    if (objectID) {
      const query = makeQuery();
      callAPI(query).catch(console.error);
    }
  }, [objectID]);

  return (
    <div className="container">
      {currentImage && (
        <div className="centered-artwork">
          <img
            src={currentImage}
            alt="Met Museum Object"
            className="artwork-img"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              maxWidth: '300px',
              maxHeight: '300px',
            }}
          />
          <div className="artwork-artist">
            {artist}{year ? ` (${year})` : ''}
          </div>
          <div className="artwork-title">{title}</div>
          <div className="artwork-department">{department}</div>
          
        </div>
      )}
      <div style={{ margin: '10px 0' }}>
        <button onClick={handleNext} disabled={objectIDs.length === 0}>Next Picture</button>
        <button onClick={reset} style={{ marginLeft: 8 }}>Reset</button>
        <button onClick={handleFilterName} style={{ marginLeft: 8 }}>
          {filterName ? 'Show All Artists' : 'Only N-Z or Unknown'}
        </button>
      </div>
    </div>
  );
}

