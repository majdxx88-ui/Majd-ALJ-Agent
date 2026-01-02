import React, { useEffect, useState } from 'react';
import { useMajdAgent } from './hooks/useMajdAgent';
import { ConnectionState } from './types';

// Icons
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
);

const PhoneOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="22" y1="2" x2="2" y2="22"/></svg>
);

const App: React.FC = () => {
  const { connectionState, isTalking, volume, connect, disconnect } = useMajdAgent();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToggleConnection = () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      disconnect();
    } else {
      setErrorMsg(null);
      connect();
    }
  };

  useEffect(() => {
    if (connectionState === ConnectionState.ERROR) {
      setErrorMsg("حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.");
    }
  }, [connectionState]);

  const isConnected = connectionState === ConnectionState.CONNECTED;

  // Scale calculation for visualizer
  // Adjusted for subtlety: max scale increase is only 0.15 (15%)
  const scale = isConnected 
    ? (isTalking ? 1 + Math.min(volume, 0.15) : 1) 
    : 0.85;

  return (
    <div className="App" style={{ 
        backgroundColor: "#500E84", // ALJ Purple
        height: "100vh",            
        width: "100%",
        display: "flex",
        flexDirection: "column",   
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px",
        boxSizing: "border-box",
        color: "white",
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        overflow: "hidden"
    }}>
      
      {/* === Header / Identity Area === */}
      <div style={{ 
          marginTop: "60px", 
          display: "flex", 
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px",
          direction: "ltr" // Force LTR for correct English text alignment
      }}>
        <h1 style={{ margin: "0", fontSize: "28px", fontWeight: "700", lineHeight: "1.2", textAlign: "center" }}>
          Abdul Latif Jameel
        </h1>
        <h2 style={{ 
          margin: "0", 
          fontSize: "14px", 
          fontWeight: "400", 
          letterSpacing: "4px", 
          textTransform: "uppercase", 
          opacity: 0.9,
          textAlign: "center"
        }}>
          FINANCE
        </h2>
      </div>

      {/* === AI Agent Visualizer === */}
      <div style={{ 
          flex: 1, 
          width: "100%",
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center",
          position: "relative"
      }}>
        {/* Error Message Toast */}
        {errorMsg && (
          <div style={{
            position: "absolute",
            top: "10%",
            backgroundColor: "rgba(220, 38, 38, 0.9)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "14px",
            marginBottom: "10px",
            backdropFilter: "blur(4px)",
            zIndex: 20
          }}>
            {errorMsg}
          </div>
        )}

        {/* Visualizer and Control Button */}
        <div style={{
           display: 'flex',
           flexDirection: 'column',
           alignItems: 'center',
           gap: '40px'
        }}>
            {/* Wrapper for Scaling (Separates Scale logic from Morph animation) */}
            <div style={{
                width: "220px",
                height: "220px",
                transform: `scale(${scale})`,
                transition: "transform 0.1s ease-out", // Smooth scaling without restarting keyframes
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                {/* Inner Blob for Animation */}
                <div
                    className="blob"
                    style={{
                      width: "100%",
                      height: "100%",
                      background: isTalking ? "linear-gradient(135deg, #a855f7, #ec4899)" : "rgba(255, 255, 255, 0.05)",
                      boxShadow: isTalking 
                        ? "inset 0 0 40px rgba(255,255,255,0.3), 0 0 30px rgba(255, 255, 255, 0.2)" 
                        : "inset 0 0 20px rgba(255,255,255,0.05)",
                      animation: isConnected ? "morph 10s linear infinite alternate" : "float 6s ease-in-out infinite",
                      border: "1px solid rgba(255,255,255,0.15)",
                      transition: "background 0.3s ease, box-shadow 0.3s ease",
                      borderRadius: "50%" // Default shape is a perfect circle
                    }}
                />
            </div>

            {/* The Control Button */}
            <button
                onClick={handleToggleConnection}
                disabled={connectionState === ConnectionState.CONNECTING}
                style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    backgroundColor: isConnected ? "#ef4444" : "white",
                    color: isConnected ? "white" : "#500E84",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: connectionState === ConnectionState.CONNECTING ? "wait" : "pointer",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                    transition: "all 0.3s ease"
                }}
            >
                {connectionState === ConnectionState.CONNECTING ? (
                    <div className="spinner"></div>
                ) : (
                    isConnected ? <PhoneOffIcon /> : <MicIcon />
                )}
            </button>
        </div>
      </div>

      {/* === Footer === */}
      <div style={{ marginBottom: "30px", textAlign: "center", opacity: 0.6, fontSize: "12px", letterSpacing: "1px" }}>
        <p>AI AGENT - MAJD</p>
      </div>

      {/* Styles */}
      <style>{`
        /* Very subtle organic movement, keeping it mostly circular */
        @keyframes morph {
          0% { border-radius: 50%; transform: rotate(0deg); }
          25% { border-radius: 52% 48% 53% 47% / 53% 47% 52% 48%; }
          50% { border-radius: 48% 52% 47% 53% / 47% 53% 48% 52%; transform: rotate(180deg); }
          75% { border-radius: 53% 47% 52% 48% / 52% 48% 53% 47%; }
          100% { border-radius: 50%; transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .blob {
           background-size: 200% 200%;
        }
        .spinner {
           width: 20px;
           height: 20px;
           border: 3px solid rgba(80, 14, 132, 0.3);
           border-radius: 50%;
           border-top-color: #500E84;
           animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;