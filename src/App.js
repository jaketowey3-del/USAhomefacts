import React, { useState, useEffect } from 'react';
import PropertySelector from './PropertySelector.js'; 
import UserProfile from './UserProfile.js';           
import { costMatrix, categoriesData, stateCostMultipliers } from './propertyData.js';
import { createClient } from '@supabase/supabase-js';
import Auth from './Auth.js';
import './style.css';

const supabase = createClient(
  'https://coxkznpuqtuweijetdja.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNveGt6bnB1cXR1d2VpamV0ZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MjAxMzEsImV4cCI6MjA5MzM5NjEzMX0.D_3BZhlNT6oaZKFOsSr8b1u55aTsGflCrqXmbMQx5ZU',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
  }
);

// Define AdBanner outside the main App component
const AdBanner = ({ client, slot }) => {
  const pushedRef = React.useRef(false);

  useEffect(() => {
    if (!pushedRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, []);

  return (
    <div style={{ textAlign: 'center', margin: '20px 0', overflow: 'hidden' }}>
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client={client}
           data-ad-slot={slot}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};
export default function App() {
  const [session, setSession] = useState(null);
  const [activeProperty, setActiveProperty] = useState(null);
  const [state, setState] = useState('');
  const [currentProfile, setCurrentProfile] = useState(null);
  const [screen, setScreen] = useState('home');
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [profileData, setProfileData] = useState({});
  const [property, setProperty] = useState('');
  const [beds, setBeds] = useState('3');
  const [baths, setBaths] = useState('2');
  const [stories, setStories] = useState('1');
  const [sqft, setSqft] = useState('2000');
  const [responses, setResponses] = useState({});
  const [notes, setNotes] = useState({});
  const [photos, setPhotos] = useState({});
  const [openCategories, setOpenCategories] = useState([]);
  const [publicReports, setPublicReports] = useState([]);
  const [communitySummary, setCommunitySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userInspections, setUserInspections] = useState([]);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [walkthroughStartTime, setWalkthroughStartTime] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user?.id) {
        getUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);
  useEffect(() => {
    if (screen === 'profile' && session?.user?.id) {
      const fetchProfileData = async () => {
        // Fetch past reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', session.user.id)
          .order('saved_at', { ascending: false });
          
        if (!reportsError && reportsData) {
          setUserInspections(reportsData);
        } else if (reportsError) {
          console.error('Error fetching reports:', reportsError.message);
        }

        // Fetch user profile info (name, etc.)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profileError && profileData) {
          setCurrentProfile(profileData);
        }
      };

      fetchProfileData();
    }
  }, [screen, session]);
  
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        getUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const cleanAddress = (rawText) => {
    if (!rawText) return "";

    let parsed = rawText;

    if (typeof rawText === 'string' && rawText.trim().startsWith('{')) {
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        console.error("Failed to parse address JSON:", e);
      }
    }

    if (typeof parsed === 'object' && parsed !== null) {
      // Grab whichever keys are present in the object dynamically
      const street = parsed.streetAddress || parsed.address || parsed.street || parsed.line1 || '';
      const city = parsed.city || '';
      const state = parsed.state || parsed.stateOrProvince || 'WA';
      const zip = parsed.zipcode || parsed.zip || parsed.postalCode || '';
      
      const cityStateZip = [city, state, zip].filter(Boolean).join(' ');
      const combined = [street, cityStateZip].filter(Boolean).join(', ');
      
      if (combined) return combined;
      
      // Ultimate fallback if keys don't match: turn the object into a clean readable string
      return Object.values(parsed).filter(Boolean).join(', ');
    }

    return String(rawText).replace(/["']/g, "").trim();
  };

  const getDistanceFromLatLonInFeet = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Radius of the earth in miles
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in miles
    const feet = d * 5280; // Convert miles to feet
    return feet;
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };
  const fetchPropertyFromMLS = async (mlsNumber, targetState) => {
    try {
      console.log("Querying Zillow search/bymls for:", mlsNumber);
      
      const url = new URL("https://zillow.realtyapi.io/search/bymls");
      url.searchParams.append("mlsid", mlsNumber);
      url.searchParams.append("listingStatus", "For_Sale");
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-realtyapi-key': 'rt_PBK6tCf2hX9t5nWXRaR1KiO8'
        }
      });
      
      const data = await response.json();
      console.log("MLS Search API Full Response:", data);
      
      const item = data.searchResult || data;
      let rawAddress = item.address || item.propertyAddress || item.formatted_address;
      let lat = item.latitude || null;
      let lon = item.longitude || null;

      // REVERSE LOOKUP FAIL-SAFE: If we got coordinates but no text address, 
      // query the coordinates back to get the physical street name.
      if (!rawAddress && lat && lon) {
        console.log(`Resolving coordinates (${lat}, ${lon}) to physical address...`);
        try {
          const revResponse = await fetch(`https://zillow.realtyapi.io/search/bycoordinates?latitude=${lat}&longitude=${lon}`, {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'x-realtyapi-key': 'rt_PBK6tCf2hX9t5nWXRaR1KiO8'
            }
          });
          const revData = await revResponse.json();
          rawAddress = revData.address || revData.formatted_address || revData.searchResult?.address;
        } catch (revErr) {
          console.error("Coordinate reverse-lookup failed:", revErr);
        }
      }

      let verifiedAddress = cleanAddress(rawAddress);

      if (response.ok && verifiedAddress) {
        return {
          address: verifiedAddress,
          latitude: lat,
          longitude: lon
        };
      }
      
      return {
        address: `MLS #${mlsNumber}, ${(targetState || "WA").toUpperCase()}`,
        latitude: lat || 47.4578,
        longitude: lon || -122.6453
      };
    } catch (err) {
      console.error("MLS fetch error:", err);
      return {
        address: `MLS #${mlsNumber}, ${targetState || "WA"}`,
        latitude: 47.4578,
        longitude: -122.6453
      };
    }
  };
  const getUserProfile = async (user) => {
    console.log("getUserProfile called with:", user);
    
    // Strict block for missing, null, or string "undefined" values
    if (!user || user === "undefined" || user === "null" || user === undefined || user === "NaN") {
      setLoading(false);
      return null;
    }
    
    let userId = typeof user === 'object' ? user?.id : user;
    
    if (!userId || userId === "undefined" || userId === "null" || userId === undefined || typeof userId !== 'string') {
      setLoading(false);
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
  
      if (error) throw error;
  
      if (data) {
        setCurrentProfile(data);
        setScreen(data.full_name && data.role ? 'home' : 'onboarding');
      }
      return data;
    } catch (err) {
      console.error("Error fetching profile:", err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: currentProfile?.full_name })
        .eq('id', session.user.id);

      if (error) throw error;

      alert('Profile saved successfully!');
      setScreen('home');
    } catch (err) {
      console.error('Error saving profile:', err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  const isMlsValid = (property.length === 7 || property.length === 8) && state !== '';
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  const loadPublicData = async (mls, overrideState = null) => {
    if (loading) return;
    
    const activeState = overrideState || state;
    console.log("DEBUG: loadPublicData called with MLS:", mls, "and State:", activeState);
  
    if (!mls) return;
    if (!activeState) {
      alert("Please select a state first.");
      return;
    }
  
    // 1. Fetch the Property record to get the verified address
    const { data: propData } = await supabase
      .from('Properties')
      .select('address')
      .eq('mls_number', mls)
      .maybeSingle();

    if (propData?.address) {
      setPropertyAddress(propData.address);
    } else {
      setPropertyAddress("Address not available");
    }

    // 2. Query your reports table using the top-level state column
    const { data: inspections, error: inspError } = await supabase
      .from('reports')
      .select('*')
      .eq('mls_id', mls)
      .ilike('state', activeState);
      
    console.log("DEBUG: Inspections found for state", activeState, ":", inspections);

    if (inspError) {
      console.error("DEBUG: Supabase Error Details:", inspError.message);
      alert("Database error: " + inspError.message);
      return;
    }

    if (!inspections || inspections.length === 0) {
      setPublicReports([]);
      setCommunitySummary(null);
      return;
    }

    setPublicReports(inspections);

    let totalScoreSum = 0, globalMinCost = 0, globalMaxCost = 0;
    const matrixKeys = Object.keys(costMatrix);
    const maxPossibleScore = matrixKeys.length > 0 ? matrixKeys.length * 5 : 1;

    // Apply state economic multiplier index
    const rawStateMultiplier = stateCostMultipliers[activeState.toUpperCase()] || stateCostMultipliers.DEFAULT || 750;
    const stateFactor = rawStateMultiplier / 750;
    console.log("DEBUG: Active State:", activeState, "State Factor:", stateFactor);

    inspections.forEach(insp => {
      const resp = insp.property_data?.responses || insp.responses || {};
      let propScoreTotal = 0;
      
      matrixKeys.forEach(id => {
        const itemScore = Number(resp[id] ?? 5);
        propScoreTotal += isNaN(itemScore) ? 5 : itemScore;
        if (itemScore < 5) {
          const bounds = costMatrix[id];
          if (bounds) {
            const scaleFactor = itemScore === 4 ? 0.15 : itemScore === 3 ? 0.40 : itemScore === 2 ? 0.75 : 1.0;
            globalMinCost += (bounds.min * scaleFactor * stateFactor);
            globalMaxCost += (bounds.max * scaleFactor * stateFactor);
          }
        }
      });

      const reportPercentage = (propScoreTotal / maxPossibleScore) * 100;
      totalScoreSum += isNaN(reportPercentage) ? 100 : reportPercentage;
    });

    const avgScoreResult = inspections.length > 0 ? Math.round(totalScoreSum / inspections.length) : 0;

    setCommunitySummary({
      avgScore: isNaN(avgScoreResult) ? 0 : avgScoreResult,
      totalReviews: inspections.length,
      estimatedMarketRepairsMin: Math.round(globalMinCost / inspections.length),
      estimatedMarketRepairsMax: Math.round(globalMaxCost / inspections.length)
    });
  };
  const saveInspection = async () => {
    console.log("🚀 saveInspection called!");
    console.log("Current MLS state:", property, state);

    if (loading) {
      console.log("Halted: loading is true");
      return;
    }
    if (!isMlsValid) {
      console.log("Halted: invalid MLS format");
      return alert('Invalid MLS Format');
    }

    // 12-Hour Window Check (12 hours * 60 minutes * 60 seconds * 1000 ms)
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    if (walkthroughStartTime && (Date.now() - walkthroughStartTime > TWELVE_HOURS_MS)) {
      alert("Session Expired: More than 12 hours have passed since you verified your presence on-site. Please re-verify at the property.");
      setScreen('dashboard');
      return;
    }

    try {
      // 1. Fetch live property details from RealtyAPI using the MLS and state
      const propertyDetails = await fetchPropertyFromMLS(property, state);

      let { data: prop, error: propError } = await supabase
        .from('Properties')
        .select('*')
        .eq('mls_number', property)
        .maybeSingle();

      if (propError) throw propError;

      if (!prop) { 
        // 2. Insert the property along with the fetched address and coordinates
        const { data: newP } = await supabase
          .from('Properties')
          .insert([{ 
            mls_number: property, 
            state: state,
            address: propertyDetails?.address || null,
            latitude: propertyDetails?.latitude || null,
            longitude: propertyDetails?.longitude || null
          }])
          .select(); 
        
        if (!newP || newP.length === 0) {
          const { data: fallbackFetch } = await supabase
            .from('Properties')
            .select('*')
            .eq('mls_number', property)
            .maybeSingle();
          prop = fallbackFetch;
        } else {
          prop = newP[0];
        }
      } else {
        // Optional: Update existing property row if address/coords were missing before
        if (!prop.address && propertyDetails?.address) {
          await supabase
            .from('Properties')
            .update({ 
              address: propertyDetails.address,
              latitude: propertyDetails.latitude,
              longitude: propertyDetails.longitude
            })
            .eq('id', prop.id);
        }
      }

      if (!prop || !prop.id) {
        throw new Error("Could not link data: Property reference ID generation failed.");
      }

      const { error: inspError } = await supabase
        .from('Inspections')
        .insert([{ 
          property_id: prop.id, 
          responses: responses, 
          notes: notes, 
          photos: photos, 
          state: state
        }]);

      if (inspError) throw inspError;

      alert('Your walkthrough log is now live in the Public Domain!'); 
      await loadPublicData(property);
      setScreen('home'); 
      setProperty('');
      setResponses({});
      setNotes({});
      setPhotos({});
      setWalkthroughStartTime(null); // Reset timer on successful save
    } catch (error) {
      console.error('Supabase Error:', error.message);
      alert(`Pipeline error: ${error.message}`);
    }
  };

  const getColor = (score) => {
    if (score <= 25) return '#ff4d4d'; if (score <= 50) return '#ff9933'; if (score <= 75) return '#ffd633'; return '#33cc66';
  };

  const handlePhoto = (id, files) => {
    if (!files || !files[0]) return;
    const reader = new FileReader();
    reader.onload = () => { setPhotos(prev => ({ ...prev, [id]: reader.result })); };
    reader.readAsDataURL(files[0]);
  };
  const saveReport = async () => {
    if (!session) {
      alert("You must be logged in to save reports.");
      return;
    }

    const reportData = {
      responses,
      notes,
      photos,
      mls_id: property,
      saved_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('reports')
      .insert([
        {
          user_id: session.user.id,
          mls_id: property,
          state: state, // <-- Saves directly into your new Supabase state column
          property_data: reportData
        }
      ]);

    if (error) {
      alert("Error saving report: " + error.message);
    } else {
      alert("Report saved successfully!");
    }
  };
  const pageStyle = { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', padding: '20px', fontFamily: '-apple-system, sans-serif' };
  const cardStyle = { background: 'rgba(255,255,255,0.07)', padding: '20px', borderRadius: '12px', marginBottom: '15px' };
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', background: 'rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '16px', boxSizing: 'border-box' };
  const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none', background: 'rgba(255,255,255,0.15) url("data:image/svg+xml;utf8,<svg fill=\'white\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://w3.org\'><path d=\'M7 10l5 5 5-5z\'/></svg>") no-repeat right 10px center' };
  const buttonStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' };

  const getItemRepairCost = (id, targetState = state) => {
    const val = responses[id] ?? 5;
    if (val === 'NA') return { min: 0, max: 0 };
    const score = Number(val);
    const bounds = costMatrix[id]; 
    if (!bounds || score === 5) return { min: 0, max: 0 };
    const scaleFactor = score === 4 ? 0.15 : score === 3 ? 0.40 : score === 2 ? 0.75 : 1.0;
    let sizeMultiplier = 1.0;
    if (bounds.cat === 'Interior' || bounds.cat === 'Electrical' || bounds.cat === 'HVAC') {
      sizeMultiplier = Number(beds) <= 2 ? 0.8 : Number(beds) === 3 ? 1.0 : Number(beds) === 4 ? 1.25 : 1.5;
    } else if (bounds.cat === 'Plumbing' || bounds.cat === 'Bathroom') {
      sizeMultiplier = Number(baths) <= 1 ? 0.7 : Number(baths) === 2 ? 1.0 : Number(baths) === 3 ? 1.3 : 1.6;
    }

    // Apply state economic multiplier index using targetState
    const rawStateMultiplier = stateCostMultipliers[targetState?.toUpperCase()] || stateCostMultipliers.DEFAULT || 750;
    const stateFactor = rawStateMultiplier / 750;

    return { 
      min: Math.round(bounds.min * scaleFactor * sizeMultiplier * stateFactor), 
      max: Math.round(bounds.max * scaleFactor * sizeMultiplier * stateFactor) 
    };
  };

  const getCategoryRepairCost = (catName, targetState = state) => {
    let min = 0, max = 0; 
    Object.keys(costMatrix).forEach(id => { 
      if (costMatrix[id].cat === catName) { 
        const c = getItemRepairCost(id, targetState); 
        min += c.min; 
        max += c.max; 
      } 
    }); 
    return { min, max };
  };

  const getCategoryScore = (catName) => {
    let scoreSum = 0;
    let itemCount = 0;
    Object.keys(costMatrix).forEach(id => {
      if (costMatrix[id].cat === catName) {
        const val = responses[id] ?? 5;
        if (val !== 'NA') {
          scoreSum += Number(val);
          itemCount++;
        }
      }
    });
    return itemCount > 0 ? Math.round((scoreSum / (itemCount * 5)) * 100) : 100;
  };

  let content;  if (screen === 'welcome') {
    content = (
      <div style={{ 
        ...pageStyle, 
        textAlign: 'center', 
        paddingTop: '50px',
        height: '100vh',
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <h1>Welcome to USA Home Facts</h1>
        <button style={{ ...buttonStyle, marginTop: '20px' }} onClick={() => setScreen('home')}>
          Enter App
        </button>
      </div>
    );
  } else if (screen === 'home') {

    // 1. Distance helper function (place this inside your component scope or outside the render loop)
    const calculateDistanceInFeet = (lat1, lon1, lat2, lon2) => {
      const R = 3958.8; // Earth's radius in miles
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c * 5280; // Distance in feet
    };

    // 2. Reusable validation & navigation function for the geofence check
    const handleGeofenceAndSearch = async () => {
      if (!state) {
        alert("Please select a state first.");
        return;
      }
      if (!property) {
        alert("Please enter an MLS number.");
        return;
      }

      console.log("DEBUG: Running geofence check for Property:", property, "State:", state);

      try {
        // A. Load public data first to fetch property details / coordinates 
        // (Ensure loadPublicData returns or populates your target property's latitude and longitude)
        const propertyData = await loadPublicData(property, state);
        
        // *Note: Adjust this depending on how loadPublicData stores the retrieved coordinates, 
        // e.g., propertyData?.lat or a state variable like currentPropertyLat*
        const targetLat = propertyData?.lat || 47.4412; // Fallback example coordinate
        const targetLon = propertyData?.lon || -122.7985;

        // B. Check browser geolocation
        if (!navigator.geolocation) {
          alert("Geolocation is not supported by your browser.");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            const distance = calculateDistanceInFeet(userLat, userLon, targetLat, targetLon);
            console.log(`Geofence Check: User is ${Math.round(distance)} ft away from target property.`);

            // C. Enforce the 1,000-foot limit
            if (distance > 1000) {
              alert(`Geofence Blocked: You are ${Math.round(distance)} feet away from the property. You must be within 1,000 ft to access the walkthrough.`);
              return; // Stop here, do not navigate to dashboard
            }

            // D. Passed! Proceed to dashboard
            alert("Geofence passed! Opening walkthrough dashboard...");
            setScreen('dashboard');
          },
          (error) => {
            console.error("GPS Error:", error);
            alert("Unable to verify your location. Please ensure location permissions are enabled.");
          }
        );

      } catch (err) {
        console.log("No existing public records found or error during fetch, proceeding with caution.");
        // If your flow allows proceeding even if public records aren't found, 
        // handle fallback coordinate fetching here if needed.
      }
    };

    content = (
      <div style={{
        ...pageStyle,
        minHeight: '100vh',
        background: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=2000")',
        backgroundSize: 'cover',
        backgroundPosition: 'bottom',
        backgroundAttachment: 'fixed',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
      }}>
        <div>
          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            {session ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setScreen('profile')} style={{ ...buttonStyle, background: '#6366f1', padding: '8px 16px', width: 'auto' }}>👤 My Profile</button>
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setScreen('home');
                  }} 
                  style={{ ...buttonStyle, background: '#ef4444', padding: '8px 16px', width: 'auto' }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setScreen('auth')} style={{ ...buttonStyle, background: '#3b82f6', padding: '8px 16px', width: 'auto' }}>Sign In</button>
                <button onClick={() => setScreen('register')} style={{ ...buttonStyle, background: '#10b981', padding: '8px 16px', width: 'auto' }}>Create Account</button>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '35px', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            <h1>🏡 USA Home Facts (est. 2026)</h1>
            <p style={{ color: '#f1f5f9' }}>Crowdsourced Transparency Matrix (Like CARFAX for Homes)</p>
          </div>
          
          <div style={{ ...cardStyle, backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Select State</label>
            <select value={state} onChange={(e) => setState(e.target.value)} style={{ ...selectStyle, marginBottom: '15px', backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%', fontSize: '16px' }}>
              <option value="">Select a State...</option>
              {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => (
                <option key={s} value={s} style={{color: 'black'}}>{s}</option>
              ))}
            </select>

            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Type an MLS property number</label>
            <input
              placeholder="Enter 7 or 8 Digit MLS IDCode"
              value={property}
              onChange={(e) => setProperty(e.target.value.replace(/\D/g, ''))}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  await handleGeofenceAndSearch();
                }
              }}
              style={{ ...inputStyle, backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%', boxSizing: 'border-box', fontSize: '16px', marginBottom: '15px' }}
            />

            <button 
              type="button"
              onClick={handleGeofenceAndSearch}
              style={{ 
                ...buttonStyle, 
                background: '#3b82f6',
                cursor: 'pointer'
              }}
            >
              Search Public Opinions
            </button>
          </div>

          {/* Generic Ad Space on Search Page */}
          <div style={{ marginTop: '25px' }}>
            <AdBanner client="ca-pub-3596352344964274" slot="6854844031" />
          </div>
        </div>

        {/* Privacy Policy Footer Link */}
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <button 
            onClick={() => setScreen('privacy')} 
            style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            Privacy Policy & Legal Terms
          </button>
        </div>
      </div>
    );
  } else if (screen === 'auth') {
    content = (
      <div style={{ ...pageStyle, maxWidth: '500px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <button 
          onClick={() => setScreen('home')} 
          style={{ ...buttonStyle, background: '#475569', marginBottom: '20px', width: 'auto' }}
        >
          ← Back to Search
        </button>
        
        <div style={cardStyle}>
          <h2>Sign In to Your Account</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
            Welcome back! Enter your credentials to sign in.
          </p>

          <input
            type="email"
            placeholder="Email Address"
            style={{ ...inputStyle, marginBottom: '15px', background: '#ffffff', color: '#000000' }}
            value={email || ''}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            style={{ ...inputStyle, marginBottom: '20px', background: '#ffffff', color: '#000000' }}
            value={password || ''}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button 
            style={{ ...buttonStyle, background: '#3b82f6', width: '100%', cursor: 'pointer' }} 
            onClick={async () => {
              if (!email || !password) {
                alert("Please enter both your email and password.");
                return;
              }
              try {
                const { data, error } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                });
                if (error) throw error;
                
                // Successfully signed in! Head back to home/dashboard
                setScreen('home');
              } catch (err) {
                alert(err.message);
              }
            }}
          >
            Sign In
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              type="button"
              onClick={() => setScreen('register')} 
              style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}
            >
              Don't have an account? Create one here
            </button>
          </div>
        </div>
      </div>
    );
  } else if (screen === 'register') {
    content = (
      <div style={{ ...pageStyle, maxWidth: '500px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <button 
          onClick={() => setScreen('home')} 
          style={{ ...buttonStyle, background: '#475569', marginBottom: '20px', width: 'auto' }}
        >
          ← Back to Search
        </button>
        
        <div style={cardStyle}>
          <h2>Create Your Account</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
            Enter your email and create a password to get started.
          </p>

          <input
            type="email"
            placeholder="Email Address"
            style={{ ...inputStyle, marginBottom: '15px', background: '#ffffff', color: '#000000' }}
            value={regEmail || ''}
            onChange={(e) => setRegEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Create Password"
            style={{ ...inputStyle, marginBottom: '20px', background: '#ffffff', color: '#000000' }}
            value={regPassword || ''}
            onChange={(e) => setRegPassword(e.target.value)}
          />

          <button 
            style={{ ...buttonStyle, background: '#10b981', width: '100%', cursor: 'pointer' }} 
            onClick={async () => {
              if (!regEmail || !regPassword) {
                alert("Please enter both an email and a password.");
                return;
              }
              try {
                const { data, error } = await supabase.auth.signUp({
                  email: regEmail,
                  password: regPassword,
                });
                if (error) throw error;
                
                // Successfully signed up! Send straight to onboarding
                setScreen('onboarding');
              } catch (err) {
                alert(err.message);
              }
            }}
          >
            Continue to Onboarding
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              onClick={() => setScreen('auth')} 
              style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}
            >
              Already have an account? Sign In here
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (screen === 'onboarding') {
    content = (
      <div style={{ ...pageStyle, maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h2>Welcome to USA Home Facts</h2>
        <div style={cardStyle}>
          {onboardingStep === 1 && (
            <div>
              <h3>Let's personalize your experience</h3>
              
              {/* Email verification reminder */}
              <div style={{ background: '#1e293b', border: '1px solid #3b82f6', padding: '12px', borderRadius: '6px', marginBottom: '15px' }}>
                <p style={{ color: '#38bdf8', fontSize: '0.85rem', margin: 0 }}>
                  ✉️ <strong>Check your email!</strong> Please make sure your email address is verified before finishing profile setup.
                </p>
              </div>

              <input
                type="text"
                placeholder="Full Name"
                style={{ ...inputStyle, marginBottom: '10px' }}
                value={profileData.full_name || ''}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              />
              
              <select
                style={{ ...inputStyle, marginTop: '0', color: '#f8fafc', background: '#0f172a' }}
                value={profileData.role || 'buyer'}
                onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
              >
                <option value="buyer" style={{ color: 'black' }}>Home Buyer</option>
                <option value="investor" style={{ color: 'black' }}>Real Estate Investor</option>
                <option value="inspector" style={{ color: 'black' }}>Professional Inspector</option>
              </select>

              {profileData.role === 'inspector' && (
                <input
                  type="text"
                  placeholder="Enter License Number (Optional)"
                  style={{ ...inputStyle, marginTop: '10px' }}
                  value={profileData.license_number || ''}
                  onChange={(e) => setProfileData({ ...profileData, license_number: e.target.value })}
                />
              )}

              <button 
                style={{ ...buttonStyle, marginTop: '20px', width: '100%' }} 
                onClick={() => saveOnboarding(profileData)}
              >
                Complete Setup
              </button>

              {/* Back to Login Button */}
              <button 
                type="button"
                onClick={() => {
                  supabase.auth.signOut();
                  setScreen('auth');
                }} 
                style={{ 
                  background: 'transparent', 
                  color: '#94a3b8', 
                  border: 'none', 
                  marginTop: '15px', 
                  width: '100%',
                  cursor: 'pointer', 
                  fontSize: '0.85rem',
                  textDecoration: 'underline'
                }}
              >
                ← Back to Login / Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'profile') {
    content = (
      <div style={pageStyle}>
        <button 
          onClick={() => setScreen('home')} 
          style={{ ...buttonStyle, background: '#475569', marginBottom: '20px' }}
        >
          ← Back to Home
        </button>
        
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <h2 style={{ color: 'white' }}>👤 Profile Settings</h2>
          <p style={{ color: '#94a3b8' }}>Logged in as: {session?.user?.email}</p>
          
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8' }}>
              Full Name
            </label>
            <input 
              type="text" 
              defaultValue={currentProfile?.full_name || ''}
              placeholder="Enter your name"
              style={inputStyle}
              onChange={(e) => setCurrentProfile({...currentProfile, full_name: e.target.value})}
            />
            <button 
              onClick={saveProfile}
              style={{ ...buttonStyle, background: '#3b82f6', marginTop: '15px' }}
            >
              Save Profile
            </button>
          </div>
        </div>

       {/* Past Walkthroughs Section */}
       <div style={{ ...cardStyle, marginTop: '20px' }}>
          <h3 style={{ color: 'white', marginBottom: '15px' }}>📋 Your Past Walkthroughs</h3>
          {userInspections.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No walkthroughs saved under your profile yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {userInspections.map((insp) => (
                <div 
                  key={insp.id} 
                  onClick={() => {
                    setProperty(insp.mls_id);
                    setState(insp.state || ''); // Also populates state when clicking to view!
                    setResponses(insp.property_data?.responses || insp.responses || {});
                    setNotes(insp.property_data?.notes || insp.notes || {});
                    setScreen('summary');
                  }}
                  style={{ 
                    background: '#1e293b', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    border: '1px solid #334155',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#334155'}
                >
                  <p style={{ color: 'white', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                    MLS ID: {insp.mls_id || 'N/A'} {insp.state ? `— State: ${insp.state}` : ''} (Click to view)
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0' }}>
                    Logged on: {new Date(insp.saved_at || insp.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
);
}
if (screen === 'dashboard') {
  content = (
    <div style={{
      ...pageStyle,
      minHeight: '100vh',
      background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=2000")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      padding: '20px',
      color: '#ffffff',
      textShadow: '0 0 2px #000000, 0 0 2px #000000, 0 0 2px #000000, 0 0 2px #000000'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0' }}>📋 Public Opinion on MLS Properties</h2>
          <p style={{ fontWeight: 'bold', margin: 0 }}>MLS ID Record Lookup: # {property}</p>
        </div>
        <button 
          style={{ ...buttonStyle, width: 'auto', marginTop: 0, background: '#475569', border: '1px solid #000000' }} 
          onClick={() => setScreen('home')}
        >
          Back to MLS search
        </button>
      </div>

      {propertyAddress && (
        <div style={{ background: 'rgba(255,255,255,0.07)', padding: '15px 20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', border: '1px solid #000000', wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#60a5fa', fontWeight: 'bold' }}>Verified Property Location</span>
          <h3 style={{ margin: '5px 0 0 0', color: '#ffffff', fontSize: '18px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {typeof propertyAddress === 'object' ? cleanAddress(JSON.stringify(propertyAddress)) : cleanAddress(propertyAddress)}
          </h3>
        </div>
      )}

      {communitySummary ? (
        <div style={{ ...cardStyle, backgroundColor: 'transparent', border: '1px solid #000000', boxShadow: 'none', textAlign: 'center', padding: '25px', marginBottom: '20px' }}>
          <div style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>Community Facts Profile</div>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '10px 0', color: '#ffffff' }}>{communitySummary.avgScore}%</div>
          <div style={{ fontSize: '15px' }}>Based on <strong>{communitySummary.totalReviews} public user reports</strong></div>
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #000000', fontSize: '28px', color: '#ff3366', fontWeight: 'bold' }}>
            Average property Repair/ update Liabilities Estimate: <br /><strong>${communitySummary.estimatedMarketRepairsMin.toLocaleString()} - ${communitySummary.estimatedMarketRepairsMax.toLocaleString()}</strong>
          </div>
        </div>
      ) : (
        <div style={{ ...cardStyle, backgroundColor: 'transparent', border: '1px solid #000000', textAlign: 'center', padding: '30px', marginBottom: '20px' }}>
          <p style={{ margin: 0 }}>⚠️ No public data files submitted for this listing. Be the first to review this MLS!</p>
        </div>
      )}

<div style={{ margin: '20px 0', textAlign: 'center' }}>
        <button 
          onClick={async () => { 
            if (!session) {
              alert("Please sign in or create an account to start your own walkthrough checklist.");
              setScreen('auth');
              return;
            }

            // 1. Fetch live property details to get its coordinates
            const propertyDetails = await fetchPropertyFromMLS(property, state);

            // 2. Geofence Check (Must be within 1,000 ft while on-site)
            if (propertyDetails?.latitude && propertyDetails?.longitude) {
              try {
                const userCoords = await new Promise((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                });
                
                const userLat = userCoords.coords.latitude;
                const userLon = userCoords.coords.longitude;
                
                const distanceInFeet = getDistanceFromLatLonInFeet(
                  userLat, userLon, 
                  propertyDetails.latitude, propertyDetails.longitude
                );

                console.log(`User is ${Math.round(distanceInFeet)} feet away from the property.`);

                if (distanceInFeet > 1000) {
                  alert(`Access Denied: You must be within 1,000 feet of the property to start a walkthrough. (You are currently ~${Math.round(distanceInFeet)} ft away).`);
                  return; // Stops them from entering the walkthrough screen!
                }
              } catch (geoErr) {
                console.warn("Geolocation denied or unavailable:", geoErr);
                alert("Location access is required to verify you are on-site at the property before beginning an inspection.");
                return;
              }
            }

            // 3. Passed! Record the start time for the 12-hour offline grace period
            setWalkthroughStartTime(Date.now());
            setResponses({}); 
            setNotes({}); 
            setScreen('dimensions'); 
          }} 
          style={{ ...buttonStyle, background: '#22c55e', marginTop: 0, width: 'auto', border: '1px solid #000000' }}
        >
          ➕ Start Your own Walkthrough
        </button>
      </div>

      <h3 style={{ borderBottom: '1px solid #000000', paddingBottom: '8px' }}>📜 Historical Report Logs Timeline</h3>
      {publicReports.length === 0 ? (
        <p style={{ fontStyle: 'italic', fontWeight: 'bold' }}>Timeline unpopulated.</p>
      ) : (
        [...publicReports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((report, idx) => {
          const dateStr = report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A';
          const propData = report.property_data || {};
          const rNotes = propData.notes || report.notes || {};
          const rResp = propData.responses || report.responses || {};
          let defectCount = 0;
          Object.keys(rResp).forEach(k => { if (Number(rResp[k]) <= 4) defectCount++; });

          return (
            <div key={report.id} style={{ ...cardStyle, backgroundColor: 'transparent', border: '1px solid #000000', borderLeft: '4px solid #000000', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span>User Report #{publicReports.length - idx}</span><span>Logged: {dateStr}</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>⚠️ Flags Sighted: <span style={{ fontWeight: 'bold' }}>{defectCount} property areas noted</span></div>
              {Object.keys(rNotes).some(k => rNotes[k].trim()) && (
                <div style={{ marginTop: '10px', padding: '8px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '6px', fontSize: '13px', border: '1px solid #000000' }}>
                  <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Inspector Observation Remarks:</span>
                  {Object.keys(rNotes).filter(k => rNotes[k].trim()).map(k => (
                    <div key={k} style={{ marginBottom: '4px' }}>• <strong>{costMatrix[k]?.label || 'Item'}:</strong> "{rNotes[k]}"</div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
if (screen === 'dimensions') {
    content = (
      <div style={{
        ...pageStyle,
        minHeight: '100vh',
        background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000")',
        backgroundSize: 'cover',
        backgroundPosition: 'bottom',
        padding: '30px',
        color: '#ffffff',
        textShadow: '0 0 3px #000000, 0 0 3px #000000'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          color: '#ffffff',
          fontSize: '32px', // Doubled heading size
          marginBottom: '25px'
        }}>
          📐 Step 1: Property Matrix Boundaries
        </h2>
        
        <div style={{ ...cardStyle, backgroundColor: 'transparent', border: '1px solid #000000' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '26px', fontWeight: 'bold' }}>
                Bedrooms
              </label>
              <select value={beds} onChange={(e) => setBeds(e.target.value)} style={{ ...selectStyle, width: '100%', appearance: 'auto', fontSize: '24px', padding: '12px' }}>
                {['1','2','3','4','5'].map(v => <option key={v} value={v} style={{color:'black', fontSize: '20px'}}>{v} Beds</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '26px', fontWeight: 'bold' }}>
                Bathrooms
              </label>
              <select value={baths} onChange={(e) => setBaths(e.target.value)} style={{ ...selectStyle, width: '100%', appearance: 'auto', fontSize: '24px', padding: '12px' }}>
                {['1','2','3','4'].map(v => <option key={v} value={v} style={{color:'black', fontSize: '20px'}}>{v} Baths</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '26px', fontWeight: 'bold' }}>
                Stories
              </label>
              <select value={stories} onChange={(e) => setStories(e.target.value)} style={{ ...selectStyle, width: '100%', appearance: 'auto', fontSize: '24px', padding: '12px' }}>
                {['1','2','3'].map(v => <option key={v} value={v} style={{color:'black', fontSize: '20px'}}>{v} {v === '1' ? 'Story' : 'Stories'}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '26px', fontWeight: 'bold' }}>
                Square Footage
              </label>
              <input 
                type="number" 
                value={sqft} 
                onChange={(e) => setSqft(e.target.value)} 
                placeholder="e.g. 2000" 
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', background: 'transparent', color: 'white', border: '1px solid #ffffff', fontSize: '24px', padding: '12px' }} 
              />
            </div>
          </div>
          
          <button onClick={() => setScreen('checklist')} style={{ ...buttonStyle, marginBottom: '15px', border: '1px solid #000000', fontSize: '24px', padding: '16px' }}>
            Continue to Inspection Sheet
          </button>
          
          <button 
            onClick={() => setScreen('home')} 
            style={{ ...buttonStyle, background: '#94a3b8', width: '100%', border: '1px solid #000000', fontSize: '24px', padding: '16px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  if (screen === 'checklist') {
    const isDevMode = true;

    if (!session && !isDevMode) {
      content = (
        <div style={{
          ...pageStyle,
          backgroundColor: 'transparent',
          minHeight: '100vh',
          background: 'linear-gradient(rgba(30, 64, 175, 0.6), rgba(30, 64, 175, 0.6)), url("https://images.unsplash.com/photo-1449844908441-8829872d2607")',
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '20px',
          border: '5px solid red',
          color: '#ffffff',
          textShadow: '0 0 2px #000000'
        }}>
          <h2 style={{ color: 'white' }}>Sign in required</h2>
          <p>You must be logged in to view or edit this checklist.</p>
          <button onClick={() => setScreen('auth')} style={buttonStyle}>
            Go to Login / Create Profile
          </button>
          <button onClick={() => setScreen('home')} style={{ ...buttonStyle, background: '#475569', marginLeft: '10px' }}>
            Back to Search
          </button>
        </div>
      );
    } else {
      const getGlobalRepairCost = () => {
        let globalMinCost = 0;
        let globalMaxCost = 0;
        
        // Apply state economic multiplier index
        const rawStateMultiplier = stateCostMultipliers[state?.toUpperCase()] || stateCostMultipliers.DEFAULT || 750;
        const stateFactor = rawStateMultiplier / 750;

        const resp = responses || {};
        Object.keys(costMatrix).forEach(id => {
          const itemScore = Number(resp[id] ?? 5);
          if (itemScore < 5) {
            const bounds = costMatrix[id];
            const scaleFactor = itemScore === 4 ? 0.15 : itemScore === 3 ? 0.40 : itemScore === 2 ? 0.75 : 1.0;
            
            let sizeMultiplier = 1.0;
            if (bounds.cat === 'Interior' || bounds.cat === 'Electrical' || bounds.cat === 'HVAC') {
              sizeMultiplier = Number(beds) <= 2 ? 0.8 : Number(beds) === 3 ? 1.0 : Number(beds) === 4 ? 1.25 : 1.5;
            } else if (bounds.cat === 'Plumbing' || bounds.cat === 'Bathroom') {
              sizeMultiplier = Number(baths) <= 1 ? 0.7 : Number(baths) === 2 ? 1.0 : Number(baths) === 3 ? 1.3 : 1.6;
            }

            globalMinCost += (bounds.min * scaleFactor * sizeMultiplier * stateFactor);
            globalMaxCost += (bounds.max * scaleFactor * sizeMultiplier * stateFactor);
          }
        });
        
        return { min: Math.round(globalMinCost), max: Math.round(globalMaxCost) };
      };

      const runningGlobalTotal = getGlobalRepairCost();
      
      content = (
        <div style={{
          ...pageStyle,
          backgroundColor: 'transparent',
          minHeight: '100vh',
          background: 'linear-gradient(rgba(30, 64, 175, 0.6), rgba(30, 64, 175, 0.6)), url("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=2000")',
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '20px',
          color: '#ffffff',
          textShadow: '0 0 2px #000000'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <h2 style={{ color: '#ffffff' }}>Property Checklist</h2>
              <p style={{ margin: 0 }}>MLS ID: {property} | {beds}B/{baths}Ba</p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {session && (
                <button style={{ ...buttonStyle, width: 'auto', marginTop: 0, background: '#6366f1' }} onClick={() => setScreen('profile')}>
                  👤 Profile
                </button>
              )}
              <button style={{ ...buttonStyle, width: 'auto', marginTop: 0, background: '#475569' }} onClick={() => setScreen('dashboard')}>
                Cancel
              </button>
            </div>
          </div>
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #16a34a, #15803d)', marginBottom: '25px', border: '1px solid #000000', color: '#ffffff' }}>
            <div style={{ fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold' }}>Your Estimated Repair Calculations Widget</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '5px' }}>${runningGlobalTotal.min.toLocaleString()} - ${runningGlobalTotal.max.toLocaleString()}</div>
          </div>

          {categoriesData.map((cat) => {
          const score = getCategoryScore(cat.name);
          const catCosts = getCategoryRepairCost(cat.name);
          const isExpanded = openCategories.includes(cat.name);

          return (
            <div key={cat.name} style={{ ...cardStyle, border: '1px solid #000000' }}>
              <div onClick={() => setOpenCategories(isExpanded ? openCategories.filter(c => c !== cat.name) : [...openCategories, cat.name])} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '20px' }}>{cat.icon}</span><span style={{ fontWeight: 'bold' }}>{cat.name}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ background: getColor(score), color: '#0f172a', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px' }}>{score}%</span><span>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: '15px', borderTop: '1px solid #000000', paddingTop: '15px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '6px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Running Cost:</span>
                    <span style={{ fontWeight: 'bold', color: catCosts.max > 0 ? '#fda4af' : '#4ade80' }}>${catCosts.min.toLocaleString()} - ${catCosts.max.toLocaleString()}</span>
                  </div>

                  {Object.keys(costMatrix).filter(id => costMatrix[id].cat === cat.name).map(id => {
                    const item = costMatrix[id];
                    const rawVal = responses[id] ?? 5;
                    const isNA = rawVal === 'NA';
                    const itemScore = isNA ? 'N/A' : Number(rawVal);
                    const itemCost = getItemRepairCost(id);

                    return (
                      <div key={id} style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #000000' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '500' }}>{item.icon} {item.label} <span style={{ color: isNA ? '#94a3b8' : getColor(itemScore * 20), marginLeft: '8px', fontWeight: 'bold' }}>({isNA ? 'N/A' : `${itemScore}/5`})</span></span>
                        </div>

                        {/* Clickable Tick Marks & N/A Selection Row */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setResponses({ ...responses, [id]: String(n) })}
                              style={{
                                flex: 1,
                                padding: '8px 0',
                                background: !isNA && Number(itemScore) === n ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              {n}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setResponses({ ...responses, [id]: 'NA' })}
                            style={{
                              padding: '8px 12px',
                              background: isNA ? '#64748b' : 'rgba(255,255,255,0.1)',
                              color: 'white',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            N/A
                          </button>
                        </div>

                        <div style={{ fontSize: '13px', color: isNA ? '#94a3b8' : (itemCost.max > 0 ? '#fda4af' : '#cbd5e1'), marginTop: '4px' }}>
                          {isNA ? 'Item marked as Not Applicable (Excluded from score & costs)' : `Current Market Cost Variance: $${itemCost.min.toLocaleString()} - $${itemCost.max.toLocaleString()}`}
                        </div>
                        <input placeholder="Add descriptive notes..." value={notes[id] || ''} onChange={(e) => setNotes({ ...notes, [id]: e.target.value })} style={{ ...inputStyle, fontSize: '13px', padding: '6px', marginTop: '8px', background: 'transparent', color: 'white', border: '1px solid #ffffff' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                          <label style={{ cursor: 'pointer', background: '#334155', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', border: '1px solid #ffffff' }}>
                            Add photo
                            <input type="file" accept="image/*" onChange={(e) => handlePhoto(id, e.target.files)} style={{ display: 'none' }} />
                          </label>
                          {photos[id] && <img src={photos[id]} alt="Evidence" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #ffffff' }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

          {/* Generic Ad Space on Checklist View */}
          <div style={{ margin: '25px 0' }}>
            <AdBanner client="ca-pub-3596352344964274" slot="9289435689" />
          </div>

          <div style={{ display: 'flex', marginTop: '20px' }}>
            <button onClick={() => setScreen('summary')} style={{ ...buttonStyle, background: '#6366f1', border: '1px solid #000000' }}>
              📊 View Your Breakdown Summary
            </button>
            <button onClick={saveReport} style={{ ...buttonStyle, background: '#16a34a', marginLeft: '10px', border: '1px solid #000000' }}>
              💾 Save Report
            </button>
          </div>
        </div>
      );
    }
  } else if (screen === 'summary') {
    const getGlobalRepairCost = () => {
      let globalMinCost = 0;
      let globalMaxCost = 0;
      
      // Use your state multiplier index
      const rawStateMultiplier = stateCostMultipliers[state?.toUpperCase()] || stateCostMultipliers.DEFAULT || 750;
      const stateFactor = rawStateMultiplier / 750;

      const resp = responses || {};
      Object.keys(costMatrix).forEach(id => {
        const itemScore = Number(resp[id] ?? 5);
        if (itemScore < 5) {
          const bounds = costMatrix[id];
          const scaleFactor = itemScore === 4 ? 0.15 : itemScore === 3 ? 0.40 : itemScore === 2 ? 0.75 : 1.0;
          
          let sizeMultiplier = 1.0;
          if (bounds.cat === 'Interior' || bounds.cat === 'Electrical' || bounds.cat === 'HVAC') {
            sizeMultiplier = Number(beds) <= 2 ? 0.8 : Number(beds) === 3 ? 1.0 : Number(beds) === 4 ? 1.25 : 1.5;
          } else if (bounds.cat === 'Plumbing' || bounds.cat === 'Bathroom') {
            sizeMultiplier = Number(baths) <= 1 ? 0.7 : Number(baths) === 2 ? 1.0 : Number(baths) === 3 ? 1.3 : 1.6;
          }

          globalMinCost += (bounds.min * scaleFactor * sizeMultiplier * stateFactor);
          globalMaxCost += (bounds.max * scaleFactor * sizeMultiplier * stateFactor);
        }
      });
      
      return { min: Math.round(globalMinCost), max: Math.round(globalMaxCost) };
    };
  
    const runningGlobalTotal = getGlobalRepairCost();
  
    content = (
      <div style={{
        ...pageStyle,
        backgroundColor: 'transparent',
        minHeight: '100vh',
        background: 'linear-gradient(rgba(30, 64, 175, 0.6), rgba(30, 64, 175, 0.6)), url("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=2000")',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '20px',
        color: '#ffffff',
        textShadow: '0 0 2px #000000'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div>
            <h2 style={{ color: '#ffffff' }}>📊 Breakdown Summary</h2>
            <p style={{ margin: 0 }}>MLS ID: {property} | Estimated Repairs: ${runningGlobalTotal.min.toLocaleString()} - ${runningGlobalTotal.max.toLocaleString()}</p>
          </div>
          
          <div>
            <button style={{ ...buttonStyle, width: 'auto', marginTop: 0, background: '#475569' }} onClick={() => setScreen('checklist')}>
              ← Back to Checklist
            </button>
          </div>
        </div>
  
        <div style={{ ...cardStyle, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #000000', marginBottom: '20px' }}>
          <h3 style={{ color: 'white', marginBottom: '15px' }}>Inspection Overview</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
            Review your scored categories and itemized notes below!
          </p>
        </div>

        {categoriesData.map((cat) => {
          const score = getCategoryScore(cat.name);
          const catCosts = getCategoryRepairCost(cat.name);
  
          return (
            <div key={cat.name} style={{ ...cardStyle, border: '1px solid #000000', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                  <span style={{ fontWeight: 'bold' }}>{cat.name}</span>
                </div>
                <span style={{ background: getColor(score), color: '#0f172a', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px' }}>
                  {score}%
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                Category Repair Cost: <span style={{ fontWeight: 'bold', color: catCosts.max > 0 ? '#fda4af' : '#4ade80' }}>${catCosts.min.toLocaleString()} - ${catCosts.max.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
  
  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={() => {
            console.log("🔥 Summary Button Clicked Directly!");
            saveInspection();
          }} style={{ ...buttonStyle, flex: 1, background: '#16a34a', border: '1px solid #000000', margin: 0 }}>
            💾 Save Report to Profile
          </button>
          <button onClick={() => setScreen('home')} style={{ ...buttonStyle, flex: 1, background: '#334155', border: '1px solid #000000', margin: 0 }}>
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }
  if (screen === 'orientation') {
    content = (
      <div style={pageStyle}>
        <h1>Welcome to USA Home Facts!</h1>
        <p>Your account is ready. Let's start by reviewing your home's needs.</p>
        <button onClick={() => setScreen('home')} style={buttonStyle}>
          Start My First Report
        </button>
      </div>
    );
  }
  console.log("Current screen state is:", screen);
  return (
    <div className="App">
      {loading ? (
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      ) : (
        content
      )}
    </div>
  );
}