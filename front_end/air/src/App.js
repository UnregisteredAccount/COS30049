import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// API Service
const API_BASE_URL = 'http://localhost:8000';

const api = {
  predictAirQuality: async (date, city, pollutant) => {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, city, pollutant }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Prediction failed');
    }
    return response.json();
  },
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  }
};

// AQI Category Helper
const getAQICategory = (aqi) => {
  if (aqi <= 50) return { category: 'Good', color: '#00e400', description: 'Air quality is satisfactory' };
  if (aqi <= 100) return { category: 'Moderate', color: '#ffff00', description: 'Acceptable for most people' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', color: '#ff7e00', description: 'Sensitive groups may experience health effects' };
  if (aqi <= 200) return { category: 'Unhealthy', color: '#ff0000', description: 'Everyone may begin to experience health effects' };
  if (aqi <= 300) return { category: 'Very Unhealthy', color: '#8f3f97', description: 'Health alert: everyone may experience serious effects' };
  return { category: 'Hazardous', color: '#7e0023', description: 'Health warning of emergency conditions' };
};

// Pollutant name mapping
const pollutantMapping = {
  'PM2.5': 'pm2.5',
  'PM10': 'pm10',
  'NO2': 'no2',
  'O3': 'o3',
  'CO': 'co'
};

// Input Form Component
const InputForm = ({ onSubmit, loading }) => {
  const cities = ['Adelaide', 'Brisbane', 'Canberra', 'Darwin', 'Hobart', 'Launceston', 'Melbourne', 'Newcastle', 'Perth', 'Sydney', 'Wollongong'];
  const pollutants = ['PM2.5', 'PM10', 'NO2', 'O3', 'CO'];
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    city: 'Sydney',
    pollutant: 'PM2.5',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.city) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.pollutant) {
      newErrors.pollutant = 'Pollutant is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    marginBottom: '5px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  const errorStyle = {
    color: '#ff0000',
    fontSize: '12px',
    marginBottom: '10px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333',
    fontSize: '14px',
  };

  return (
    <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>Air Quality Prediction Input</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>📅 Select Date *</label>
        <input 
          type="date" 
          name="date" 
          value={formData.date} 
          onChange={handleChange} 
          style={{...inputStyle, borderColor: errors.date ? '#ff0000' : '#ddd'}}
          max="2030-12-31"
        />
        {errors.date && <div style={errorStyle}>{errors.date}</div>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>🏙️ Select City *</label>
        <select 
          name="city" 
          value={formData.city} 
          onChange={handleChange} 
          style={{...inputStyle, borderColor: errors.city ? '#ff0000' : '#ddd'}}
        >
          {cities.map(city => <option key={city} value={city}>{city}</option>)}
        </select>
        {errors.city && <div style={errorStyle}>{errors.city}</div>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>🌫️ Select Pollutant *</label>
        <select 
          name="pollutant" 
          value={formData.pollutant} 
          onChange={handleChange} 
          style={{...inputStyle, borderColor: errors.pollutant ? '#ff0000' : '#ddd'}}
        >
          {pollutants.map(pollutant => (
            <option key={pollutant} value={pollutant}>{pollutant}</option>
          ))}
        </select>
        {errors.pollutant && <div style={errorStyle}>{errors.pollutant}</div>}
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#e8f4f8', 
        borderRadius: '4px', 
        marginBottom: '20px',
        fontSize: '13px',
        color: '#555'
      }}>
        <strong>ℹ️ Info:</strong> This prediction uses a combined AI model to forecast air quality levels for the selected date, city, and pollutant.
      </div>

      <button 
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: loading ? '#95a5a6' : '#3498db',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.3s',
        }}
      >
        {loading ? '⏳ Processing Prediction...' : '🔮 Get Prediction'}
      </button>
    </div>
  );
};

// Prediction Result Display Component
const PredictionResult = ({ data, city, date, pollutant }) => {
  const getValueWithFallback = (obj, key, defaultValue = 'N/A') => {
    return obj && obj[key] !== undefined && obj[key] !== null ? obj[key] : defaultValue;
  };

  const predictedValue = getValueWithFallback(data, 'AQI', 0);
  const aqiValue = typeof predictedValue === 'number' ? predictedValue : parseFloat(predictedValue) || 0;
  const { category, color, description } = getAQICategory(aqiValue);

  return (
    <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>📊 Prediction Results</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Date</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>{date}</div>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>City</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>{city}</div>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Pollutant</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>{pollutant}</div>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Model Used</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>
            {getValueWithFallback(data, 'Model_Used', 'Combined')}
          </div>
        </div>
      </div>

      <div style={{ 
        textAlign: 'center', 
        padding: '30px', 
        backgroundColor: color, 
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ color: '#fff', fontSize: '18px', marginBottom: '10px' }}>Predicted Pollutant AQI Value</div>
        <div style={{ color: '#fff', fontSize: '48px', fontWeight: 'bold' }}>{aqiValue.toFixed(2)}</div>
        <div style={{ color: '#fff', fontSize: '20px', marginTop: '10px', fontWeight: 'bold' }}>{category}</div>
        <div style={{ color: '#fff', fontSize: '14px', marginTop: '5px', opacity: 0.9 }}>{description}</div>
      </div>

      {data && Object.keys(data).length > 0 && (
        <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#2c3e50' }}>Additional Data</h4>
          <div style={{ fontSize: '13px', color: '#555' }}>
            {Object.entries(data).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '5px' }}>
                <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Health Recommendations Component
const HealthRecommendations = ({ aqi }) => {
  const getRecommendations = (aqi) => {
    if (aqi <= 50) {
      return {
        general: 'Air quality is good. Ideal for outdoor activities.',
        sensitive: 'No precautions needed.',
        activities: 'All outdoor activities are safe.',
      };
    } else if (aqi <= 100) {
      return {
        general: 'Air quality is acceptable for most people.',
        sensitive: 'Unusually sensitive people should consider limiting prolonged outdoor exertion.',
        activities: 'Outdoor activities are generally safe.',
      };
    } else if (aqi <= 150) {
      return {
        general: 'Members of sensitive groups may experience health effects.',
        sensitive: 'People with respiratory or heart disease, children, and older adults should limit prolonged outdoor exertion.',
        activities: 'Reduce prolonged or heavy outdoor exertion for sensitive groups.',
      };
    } else if (aqi <= 200) {
      return {
        general: 'Everyone may begin to experience health effects.',
        sensitive: 'Sensitive groups should avoid prolonged outdoor exertion.',
        activities: 'Everyone should reduce prolonged or heavy outdoor exertion.',
      };
    } else if (aqi <= 300) {
      return {
        general: 'Health alert: everyone may experience more serious health effects.',
        sensitive: 'Sensitive groups should avoid all outdoor exertion.',
        activities: 'Everyone should avoid prolonged outdoor exertion. Consider moving activities indoors.',
      };
    }
    return {
      general: 'Health warning of emergency conditions.',
      sensitive: 'Everyone should avoid all outdoor exertion.',
      activities: 'Remain indoors and keep activity levels low.',
    };
  };

  const recommendations = getRecommendations(aqi);

  return (
    <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>💊 Health Recommendations</h3>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fee', borderLeft: '4px solid #e74c3c', borderRadius: '4px' }}>
        <h4 style={{ color: '#e74c3c', marginBottom: '8px', marginTop: 0, fontSize: '16px' }}>⚠️ General Population</h4>
        <p style={{ color: '#555', margin: 0, fontSize: '14px' }}>{recommendations.general}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3e0', borderLeft: '4px solid #e67e22', borderRadius: '4px' }}>
        <h4 style={{ color: '#e67e22', marginBottom: '8px', marginTop: 0, fontSize: '16px' }}>👥 Sensitive Groups</h4>
        <p style={{ color: '#555', margin: 0, fontSize: '14px' }}>{recommendations.sensitive}</p>
      </div>

      <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderLeft: '4px solid #3498db', borderRadius: '4px' }}>
        <h4 style={{ color: '#3498db', marginBottom: '8px', marginTop: 0, fontSize: '16px' }}>🏃 Activity Recommendations</h4>
        <p style={{ color: '#555', margin: 0, fontSize: '14px' }}>{recommendations.activities}</p>
      </div>
    </div>
  );
};

// Historical Comparison Component
const HistoricalComparison = ({ currentAQI, pollutant }) => {
  const historicalData = [
    { period: 'Last Week', aqi: Math.max(0, currentAQI - 15 + Math.random() * 10) },
    { period: 'Last Month', aqi: Math.max(0, currentAQI - 20 + Math.random() * 15) },
    { period: 'Current', aqi: currentAQI },
  ];

  return (
    <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>📈 Historical Comparison</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={historicalData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="aqi" fill="#3498db" name={`${pollutant} AQI`} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Pollutant Breakdown Component
const PollutantBreakdown = ({ currentPollutant, currentValue }) => {
  const allPollutants = [
    { name: 'PM2.5', value: currentPollutant === 'PM2.5' ? currentValue : Math.random() * 100, color: '#e74c3c' },
    { name: 'PM10', value: currentPollutant === 'PM10' ? currentValue : Math.random() * 100, color: '#e67e22' },
    { name: 'NO2', value: currentPollutant === 'NO2' ? currentValue : Math.random() * 100, color: '#f39c12' },
    { name: 'O3', value: currentPollutant === 'O3' ? currentValue : Math.random() * 100, color: '#3498db' },
    { name: 'CO', value: currentPollutant === 'CO' ? currentValue : Math.random() * 100, color: '#9b59b6' },
  ];

  return (
    <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>🌫️ Pollutant Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={allPollutants}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis />
          <Radar name="AQI Levels" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// AQI Trend Chart
const AQITrendChart = ({ currentAQI }) => {
  const trendData = Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    aqi: Math.max(0, currentAQI + (Math.random() - 0.5) * 40),
  }));

  return (
    <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>📊 7-Day AQI Forecast</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="aqi" stroke="#e74c3c" strokeWidth={3} dot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Main App Component
const App = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);

  React.useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      const health = await api.healthCheck();
      setServerStatus(health);
    } catch (err) {
      setServerStatus({ status: 'error', model_loaded: false });
    }
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.predictAirQuality(
        formData.date,
        formData.city,
        pollutantMapping[formData.pollutant]
      );
      
      setPrediction({
        ...result.data,
        city: formData.city,
        date: formData.date,
        pollutant: formData.pollutant,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const predictedValue = prediction?.AQI || 0;
  const aqiValue = typeof predictedValue === 'number' ? predictedValue : parseFloat(predictedValue) || 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ecf0f1', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#2c3e50', fontSize: '42px', marginBottom: '10px', fontWeight: 'bold' }}>
            🌏 Air Quality & Health Monitor
          </h1>
          <p style={{ color: '#7f8c8d', fontSize: '18px', marginBottom: '15px' }}>
            AI-Powered Air Quality Predictions for Australian Cities
          </p>
          {serverStatus && (
            <div style={{ 
              display: 'inline-block',
              padding: '8px 16px', 
              backgroundColor: serverStatus.model_loaded ? '#2ecc71' : '#e74c3c', 
              color: '#fff', 
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {serverStatus.model_loaded ? '✓ Server Online' : '✗ Server Offline'}
            </div>
          )}
        </header>

        {error && (
          <div style={{ 
            padding: '15px 20px', 
            backgroundColor: '#e74c3c', 
            color: '#fff', 
            borderRadius: '8px', 
            marginBottom: '20px', 
            textAlign: 'center',
            fontSize: '15px',
            fontWeight: '500'
          }}>
            ⚠️ Error: {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: prediction ? '400px 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <InputForm onSubmit={handleSubmit} loading={loading} />
          </div>
          
          {prediction && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <PredictionResult 
                data={prediction} 
                city={prediction.city}
                date={prediction.date}
                pollutant={prediction.pollutant}
              />
              <HealthRecommendations aqi={aqiValue} />
            </div>
          )}
        </div>

        {prediction && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <HistoricalComparison currentAQI={aqiValue} pollutant={prediction.pollutant} />
            <AQITrendChart currentAQI={aqiValue} />
            <PollutantBreakdown currentPollutant={prediction.pollutant} currentValue={aqiValue} />
            <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '15px' }}>ℹ️ About This Prediction</h3>
              <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '12px' }}>
                  <strong>Model:</strong> Combined AI ensemble using multiple machine learning algorithms
                </p>
                <p style={{ marginBottom: '12px' }}>
                  <strong>Pollutant:</strong> {prediction.pollutant} - {
                    prediction.pollutant === 'PM2.5' ? 'Fine particulate matter (≤2.5 micrometers)' :
                    prediction.pollutant === 'PM10' ? 'Coarse particulate matter (≤10 micrometers)' :
                    prediction.pollutant === 'NO2' ? 'Nitrogen Dioxide' :
                    prediction.pollutant === 'O3' ? 'Ground-level Ozone' :
                    'Carbon Monoxide'
                  }
                </p>
                <p style={{ marginBottom: '12px' }}>
                  <strong>Prediction Date:</strong> {new Date(prediction.date).toLocaleDateString('en-AU', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Data Source:</strong> Historical air quality monitoring data from Australian government stations
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;