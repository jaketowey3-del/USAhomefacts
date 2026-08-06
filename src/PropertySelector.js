import React, { useState } from 'react';

// Array of US States for the dropdown menu
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

export default function PropertySelector({ onSelectionComplete }) {
  const [mls, setMls] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Quick validation checks
    if (!mls.trim()) {
      setError('Please enter a valid MLS Number.');
      return;
    }
    if (!selectedState) {
      setError('Please select a property state.');
      return;
    }

    // Pass the combined key back up to App.js
    onSelectionComplete({ mlsNumber: mls.trim(), stateCode: selectedState });
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Initialize HomeFacts Survey</h2>
      <p style={styles.subtext}>Enter the regional tracking numbers to load or create a property record.</p>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>MLS / Listing Number</label>
          <input 
            type="text" 
            placeholder="e.g., 7654321" 
            value={mls}
            onChange={(e) => setMls(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Property State location</label>
          <select 
            value={selectedState} 
            onChange={(e) => setSelectedState(e.target.value)}
            style={styles.select}
          >
            <option value="">-- Choose State --</option>
            {US_STATES.map((st) => (
              <option key={st.code} value={st.code}>
                {st.name} ({st.code})
              </option>
            ))}
          </select>
        </div>

        {error && <p style={styles.errorText}>⚠️ {error}</p>}

        <button type="submit" style={styles.button}>
          Begin Evaluation Matrix
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: { padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '450px', margin: '20px auto' },
  heading: { margin: '0 0 8px 0', fontSize: '1.5rem', color: '#1a1a1a', textAlign: 'center' },
  subtext: { margin: '0 0 20px 0', fontSize: '0.9rem', color: '#666', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#444', textTransform: 'uppercase' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' },
  select: { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', backgroundColor: '#fff' },
  button: { padding: '12px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' },
  errorText: { color: '#d32f2f', fontSize: '0.85rem', margin: '0', fontWeight: 'bold' }
};