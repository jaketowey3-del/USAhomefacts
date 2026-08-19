import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient'; 

export default function UserProfile({ profile, onLogout, onSelectInspection }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const user = profile || {
    full_name: "Account Member",
    role: "user",
    avatar_url: "https://via.placeholder.com/150",
    id: profile?.id
  };

  useEffect(() => {
    async function fetchUserInspections() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false });

        if (error) throw error;
        if (data) setInspections(data);
      } catch (error) {
        console.error('Error fetching inspections:', error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserInspections();
  }, [user?.id]);

  // Filter reviews dynamically based on search input
  const filteredReviews = inspections
    ? inspections.filter((review) => {
        const search = searchQuery.toLowerCase();
        const reviewString = JSON.stringify(review).toLowerCase();
        return reviewString.includes(search);
      })
    : [];

  return (
    <div style={{ maxWidth: '500px', margin: '20px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h2>User Profile</h2>
      <p style={{ color: '#94a3b8' }}>Email: {user.email || 'Linked Account'}</p>

      {/* Section header for past reviews */}
      <div style={{ marginTop: '25px', marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#ffffff' }}>MLS Reviews By You</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Review history and submissions linked to your account</p>
      </div>

      {/* Conditional Search Bar */}
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Search by MLS number or state..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontSize: '0.9rem',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Past reviews list container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
        {loading ? (
          <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Loading history...</p>
        ) : filteredReviews && filteredReviews.length > 0 ? (
          filteredReviews.map((review) => {
            const targetState = review.state || review.property_data?.state || '';
            const mlsToLoad = review.mls_id || '';

            return (
              <div 
                key={review.id} 
                onClick={() => onSelectInspection && onSelectInspection(review)}
                style={{ 
                  padding: '12px', 
                  borderRadius: '6px', 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  cursor: 'pointer' 
                }}
              >
                <p style={{ margin: 0, fontWeight: '500', color: '#0f172a' }}>
                  MLS: {mlsToLoad || 'N/A'} {targetState ? `— State: ${targetState}` : ''}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Submitted on: {new Date(review.saved_at || review.created_at || Date.now()).toLocaleDateString()}
                </p>
              </div>
            );
          })
        ) : (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
            {searchQuery ? 'No matching reviews found.' : 'No past reviews found.'}
          </p>
        )}
      </div>

      {/* Button container */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: '10px', borderRadius: '6px', background: '#475569', color: '#fff', border: 'none', flex: 1, cursor: 'pointer' }}
        >
          ← Back to Home
        </button>

        {onLogout && (
          <button 
            onClick={onLogout} 
            style={{ padding: '10px', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', flex: 1, cursor: 'pointer' }}
          >
            Log Out
          </button>
        )}
      </div>
    </div>
  );
}