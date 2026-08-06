import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient'; 

export default function UserProfile({ profile, onLogout }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback placeholder data if profile isn't fetched yet
  const user = profile || {
    full_name: "Anonymous User",
    role: "user",
    avatar_url: "https://via.placeholder.com/150",
    id: profile?.id
  };

  useEffect(() => {
    async function fetchUserInspections() {
      try {
        const { data, error } = await supabase
          .from('Inspections')
          .select(`
            id,
            created_at,
            state,
            notes,
            Properties (
              mls_number
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setInspections(data);
      } catch (error) {
        console.error('Error fetching inspections:', error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserInspections();
  }, []);

  // Assign distinct UI badges for different marketplace tiers
  const getBadgeStyle = (role) => {
    switch(role) {
      case 'inspector': return { bg: '#e3f2fd', color: '#0d47a1', label: '🛡️ Certified Inspector' };
      case 'owner': return { bg: '#e8f5e9', color: '#1b5e20', label: '🏠 Verified Owner' };
      default: return { bg: '#f5f5f5', color: '#424242', label: '👤 Account Member' };
    }
  };

  const badge = getBadgeStyle(user.role);

  return (
    <div style={styles.outerContainer}>
      <div style={styles.container}>
        <div style={styles.profileHeader}>
          <img 
            src={user.avatar_url || "https://via.placeholder.com/150"} 
            alt="Avatar" 
            style={styles.avatar} 
          />
          <div style={styles.info}>
            <h4 style={styles.name}>{user.full_name}</h4>
            <span style={{ ...styles.badge, backgroundColor: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
          </div>
        </div>
        {onLogout && (
          <button onClick={onLogout} style={styles.logoutBtn}>
            Sign Out
          </button>
        )}
      </div>

      <div style={styles.historyContainer}>
        <h3 style={styles.historyTitle}>Your Walkthrough / Inspection History</h3>
        {loading ? (
          <p style={styles.subText}>Loading history...</p>
        ) : inspections.length === 0 ? (
          <p style={styles.subText}>No inspections submitted yet. Complete a walkthrough to see it here!</p>
        ) : (
          <ul style={styles.list}>
            {inspections.map((item) => (
              <li key={item.id} style={styles.listItem}>
                <div>
                  <span>MLS: <strong>{item.Properties?.mls_number || 'N/A'}</strong></span>
                  <div style={styles.subText}>State: {item.state}</div>
                </div>
                <span style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const styles = {
  outerContainer: { maxWidth: '500px', margin: '20px auto', fontFamily: 'sans-serif' },
  container: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '15px' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0070f3' },
  info: { display: 'flex', flexDirection: 'column', gap: '4px' },
  name: { margin: 0, fontSize: '1rem', fontWeight: '600', color: '#222' },
  badge: { fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', width: 'fit-content' },
  logoutBtn: { padding: '6px 12px', backgroundColor: '#fff', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' },
  historyContainer: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' },
  historyTitle: { margin: '0 0 10px 0', fontSize: '1.1rem', color: '#333' },
  subText: { fontSize: '0.85rem', color: '#666' },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.95rem' },
  date: { color: '#888', fontSize: '0.85rem' }
};