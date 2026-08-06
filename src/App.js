import React, { useState, useEffect } from 'react';
import PropertySelector from './PropertySelector.js'; 
import UserProfile from './UserProfile.js';           
import { costMatrix, categoriesData } from './propertyData.js';
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
  const [responses, setResponses] = useState({});
  const [notes, setNotes] = useState({});
  const [photos, setPhotos] = useState({});
  const [openCategories, setOpenCategories] = useState([]);
  const [publicReports, setPublicReports] = useState([]);
  const [communitySummary, setCommunitySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userInspections, setUserInspections] = useState([]);

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
        setScreen('auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const loadPublicData = async (mls) => {
    if (loading) return;
    console.log("DEBUG: loadPublicData was called with MLS:", mls);
  
    if (!mls) {
      console.log("DEBUG: MLS was empty, exiting function.");
      return;
    }
  
    // Query your reports table directly using the mls_id column
    const { data: inspections, error: inspError } = await supabase
      .from('reports')
      .select('*')
      .eq('mls_id', mls);
      
    console.log("DEBUG: Inspections found in reports:", inspections);

    if (inspError) {
      console.error("DEBUG: Supabase Error Details:", inspError.message);
      return;
    }

    if (!inspections || inspections.length === 0) {
      setPublicReports([]);
      setCommunitySummary(null);
      return;
    }

    setPublicReports(inspections);

    let totalScoreSum = 0, globalMinCost = 0, globalMaxCost = 0;
    inspections.forEach(insp => {
      // Handle responses whether they are stored nested or directly
      const resp = insp.property_data?.responses || insp.responses || {};
      let propScoreTotal = 0;
      Object.keys(costMatrix).forEach(id => {
        const itemScore = Number(resp[id] ?? 5);
        propScoreTotal += itemScore;
        if (itemScore < 5) {
          const bounds = costMatrix[id];
          const scaleFactor = itemScore === 4 ? 0.15 : itemScore === 3 ? 0.40 : itemScore === 2 ? 0.75 : 1.0;
          globalMinCost += (bounds.min * scaleFactor);
          globalMaxCost += (bounds.max * scaleFactor);
        }
      });
      totalScoreSum += Math.round((propScoreTotal / (50 * 5)) * 100);
    });

    setCommunitySummary({
      avgScore: Math.round(totalScoreSum / inspections.length),
      totalReviews: inspections.length,
      estimatedMarketRepairsMin: Math.round(globalMinCost / inspections.length),
      estimatedMarketRepairsMax: Math.round(globalMaxCost / inspections.length)
    });
  };

  const saveInspection = async () => {
    if (loading) return;
    if (!isMlsValid) return alert('Invalid MLS Format');
    try {
      let { data: prop, error: propError } = await supabase
        .from('Properties')
        .select('*')
        .eq('mls_number', property)
        .maybeSingle();

      if (propError) throw propError;

      if (!prop) { 
        const { data: newP } = await supabase
          .from('Properties')
          .insert([{ mls_number: property, state: state }])
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

  const getItemRepairCost = (id) => {
    const score = Number(responses[id] ?? 5); 
    const bounds = costMatrix[id]; 
    if (!bounds || score === 5) return { min: 0, max: 0 };
    const scaleFactor = score === 4 ? 0.15 : score === 3 ? 0.40 : score === 2 ? 0.75 : 1.0;
    let sizeMultiplier = 1.0;
    if (bounds.cat === 'Interior' || bounds.cat === 'Electrical' || bounds.cat === 'HVAC') {
      sizeMultiplier = Number(beds) <= 2 ? 0.8 : Number(beds) === 3 ? 1.0 : Number(beds) === 4 ? 1.25 : 1.5;
    } else if (bounds.cat === 'Plumbing' || bounds.cat === 'Bathroom') {
      sizeMultiplier = Number(baths) <= 1 ? 0.7 : Number(baths) === 2 ? 1.0 : Number(baths) === 3 ? 1.3 : 1.6;
    }
    return { min: Math.round(bounds.min * scaleFactor * sizeMultiplier), max: Math.round(bounds.max * scaleFactor * sizeMultiplier) };
  };

  const getCategoryRepairCost = (catName) => {
    let min = 0, max = 0; 
    Object.keys(costMatrix).forEach(id => { 
      if (costMatrix[id].cat === catName) { 
        const c = getItemRepairCost(id); 
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
        scoreSum += Number(responses[id] ?? 5);
        itemCount++;
      }
    });
    return itemCount > 0 ? Math.round((scoreSum / (itemCount * 5)) * 100) : 100;
  };


  let content;

  if (screen === 'welcome') {
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
    content = (
      <div style={{
        ...pageStyle,
        minHeight: '100vh',
        background: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'bottom',
        backgroundAttachment: 'fixed',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          {session ? (
            <button onClick={() => setScreen('profile')} style={{ ...buttonStyle, background: '#6366f1', padding: '8px 16px', width: 'auto' }}>👤 My Profile</button>
          ) : (
            <button onClick={() => setScreen('auth')} style={{ ...buttonStyle, background: '#10b981', padding: '8px 16px', width: 'auto' }}>Login / Create Profile</button>
          )}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '35px', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          <h1>🏡 USA Home Facts Public Domain</h1>
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

          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Search Property History</label>
          <input
            placeholder="Enter 7 or 8 Digit MLS ID Code"
            value={property}
            onChange={(e) => setProperty(e.target.value.replace(/\D/g, ''))}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && isMlsValid) {
                try {
                  await loadPublicData(property);
                  setScreen('dashboard');
                } catch (err) {
                  console.error("Search failed", err);
                }
              }
            }}
            style={{ ...inputStyle, backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%', boxSizing: 'border-box', fontSize: '16px', marginBottom: '15px' }}
          />

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Bedrooms</label>
              <input type="number" placeholder="Beds" value={beds} onChange={(e) => setBeds(e.target.value)} style={{ ...inputStyle, width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#000000', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Bathrooms</label>
              <input type="number" placeholder="Baths" value={baths} onChange={(e) => setBaths(e.target.value)} style={{ ...inputStyle, width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#000000', boxSizing: 'border-box' }} />
            </div>
          </div>

          <button 
            onClick={async () => {
              try {
                await loadPublicData(property);
                setScreen('dashboard'); 
              } catch (err) {
                console.error("Search failed", err);
              }
            }}
            disabled={!isMlsValid}
            style={{ 
              ...buttonStyle, 
              background: isMlsValid ? '#3b82f6' : '#94a3b8',
              cursor: isMlsValid ? 'pointer' : 'not-allowed'
            }}
          >
            Search Public Opinions
          </button>
        </div>
      </div>
    );
  }
  if (screen === 'auth') {
    content = (
      <div style={pageStyle}>
        <button 
          onClick={() => setScreen('home')} 
          style={{ ...buttonStyle, background: '#475569', marginBottom: '20px' }}
        >
          ← Back to Search
          </button>
          <Auth 
          supabaseClient={supabase} 
          setLoading={setLoading}
          loading={loading}
          onSignUpSuccess={() => setScreen('onboarding')}
          onSignInSuccess={() => setScreen('home')}
        />
      </div>
    );
  }
  if (screen === 'onboarding') {
    content = (
      <div style={{ ...pageStyle, maxWidth: '600px', margin: '0 auto' }}>
        <h2>Welcome to USA Home Facts</h2>
        <div style={cardStyle}>
          {onboardingStep === 1 && (
            <div>
              <h3>Let's personalize your experience</h3>
              
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
                    MLS ID: {insp.mls_id || 'N/A'} (Click to view)
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
        background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=2000&q=80")',
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

        {communitySummary ? (
          <div style={{ ...cardStyle, backgroundColor: 'transparent', border: '1px solid #000000', boxShadow: 'none', textAlign: 'center', padding: '25px', marginBottom: '20px' }}>
            <div style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>Community Facts Profile</div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '10px 0', color: '#ffffff' }}>{communitySummary.avgScore}%</div>
            <div style={{ fontSize: '15px' }}>Based on <strong>{communitySummary.totalReviews} public user reports</strong></div>
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #000000', fontSize: '14px' }}>
              Average Market Repair Liabilities Estimate: <strong>${communitySummary.estimatedMarketRepairsMin.toLocaleString()} - ${communitySummary.estimatedMarketRepairsMax.toLocaleString()}</strong>
            </div>
          </div>
        ) : (
          <div style={{ ...cardStyle, backgroundColor: 'transparent', border: '1px solid #000000', textAlign: 'center', padding: '30px', marginBottom: '20px' }}>
            <p style={{ margin: 0 }}>⚠️ No public data files submitted yet for this listing. Be the first to review this MLS!</p>
          </div>
        )}

        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <button 
            onClick={() => { setResponses({}); setNotes({}); setScreen('dimensions'); }} 
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
        padding: '20px',
        color: '#ffffff',
        textShadow: '0 0 2px #000000, 0 0 2px #000000, 0 0 2px #000000, 0 0 2px #000000'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          color: '#ffffff'
        }}>
          📐 Step 1: Property Matrix Boundaries
        </h2>
        
        <div style={{ ...cardStyle, backgroundColor: 'transparent', border: '1px solid #000000' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                Bedrooms
              </label>
              <select value={beds} onChange={(e) => setBeds(e.target.value)} style={{ ...selectStyle, width: '100%', appearance: 'auto' }}>
                {['1','2','3','4','5'].map(v => <option key={v} value={v} style={{color:'black'}}>{v} Beds</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                Bathrooms
              </label>
              <select value={baths} onChange={(e) => setBaths(e.target.value)} style={{ ...selectStyle, width: '100%', appearance: 'auto' }}>
                {['1','2','3','4'].map(v => <option key={v} value={v} style={{color:'black'}}>{v} Baths</option>)}
              </select>
            </div>
          </div>
          
          <button onClick={() => setScreen('checklist')} style={{ ...buttonStyle, marginBottom: '10px', border: '1px solid #000000' }}>
            Continue to Inspection Sheet
          </button>
          
          <button 
            onClick={() => setScreen('home')} 
            style={{ ...buttonStyle, background: '#94a3b8', width: '100%', border: '1px solid #000000' }}
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
        const resp = responses || {};
        
        Object.keys(costMatrix).forEach(id => {
          const itemScore = Number(resp[id] ?? 5);
          if (itemScore < 5) {
            const bounds = costMatrix[id];
            const scaleFactor = itemScore === 4 ? 0.15 : itemScore === 3 ? 0.40 : itemScore === 2 ? 0.75 : 1.0;
            globalMinCost += (bounds.min * scaleFactor);
            globalMaxCost += (bounds.max * scaleFactor);
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
                      const itemScore = Number(responses[id] ?? 5);
                      const itemCost = getItemRepairCost(id);

                      return (
                        <div key={id} style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #000000' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontWeight: '500' }}>{item.icon} {item.label} <span style={{ color: getColor(itemScore * 20), marginLeft: '8px', fontWeight: 'bold' }}>({itemScore}/5)</span></span>
                          </div>
                          <input type="range" min="1" max="5" value={itemScore} onChange={(e) => setResponses({ ...responses, [id]: e.target.value })} style={{ width: '100%' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 5px', fontSize: '10px', marginBottom: '10px' }}>
                            {[1,2,3,4,5].map(n => <span key={n}>{n}</span>)}
                          </div>
                          <div style={{ fontSize: '13px', color: itemCost.max > 0 ? '#fda4af' : '#cbd5e1', marginTop: '4px' }}>Current Market Cost Variance: ${itemCost.min.toLocaleString()} - ${itemCost.max.toLocaleString()}</div>
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
  }
  if (screen === 'summary') {
    const getGlobalRepairCost = () => {
      let globalMinCost = 0;
      let globalMaxCost = 0;
      const resp = responses || {};
      
      Object.keys(costMatrix).forEach(id => {
        const itemScore = Number(resp[id] ?? 5);
        if (itemScore < 5) {
          const bounds = costMatrix[id];
          const scaleFactor = itemScore === 4 ? 0.15 : itemScore === 3 ? 0.40 : itemScore === 2 ? 0.75 : 1.0;
          globalMinCost += (bounds.min * scaleFactor);
          globalMaxCost += (bounds.max * scaleFactor);
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
          
          <button style={{ ...buttonStyle, width: 'auto', marginTop: 0, background: '#475569' }} onClick={() => setScreen('checklist')}>
            ← Back to Checklist
          </button>
        </div>

        <div style={{ ...cardStyle, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #000000', marginBottom: '20px' }}>
          <h3 style={{ color: 'white', marginBottom: '15px' }}>Inspection Overview</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
            Review your scored categories and itemized notes below before saving or finalizing your report.
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

        <div style={{ display: 'flex', marginTop: '20px' }}>
          <button onClick={saveReport} style={{ ...buttonStyle, background: '#16a34a', border: '1px solid #000000' }}>
            💾 Save Report to Profile
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