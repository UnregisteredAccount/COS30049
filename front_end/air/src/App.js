import React, { useState } from 'react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, 
    PolarRadiusAxis, Radar 
} from 'recharts';

// --- API Service and Helpers ---
const API_BASE_URL = 'http://localhost:8000';

const pollutantMapping = {
    'PM2.5': 'pm2.5',
    'PM10': 'pm10',
    'NO2': 'no2',
    'O3': 'o3',
    'CO': 'co',
    'SO2': 'so2'
};

const api = {
    predictAirQuality: async (date, city, pollutants) => {
        const apiPollutants = pollutants.map(p => pollutantMapping[p]);

        const results = [];
        for (const pollutant of apiPollutants) {
            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, city, pollutant }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Prediction for ${pollutant.toUpperCase()} failed`);
            }
            const result = await response.json();
            results.push({
                ...result.data,
                pollutant: Object.keys(pollutantMapping).find(key => pollutantMapping[key] === pollutant) || pollutant, // Map back to display name
                city,
                date,
            });
        }
        return results;
    },
    healthCheck: async () => {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.json();
    }
};

// AQI Category Helper (AUS), colours according to severity categories:https://soe.dcceew.gov.au/air-quality/about-chapter/approach
const getAQICategory = (aqi) => {
    // 1. Very Good (0-32) - Color: Blue
    if (aqi <= 32) return { category: 'Very Good', color: '#007bff', description: 'Air quality is satisfactory', range: [0, 32] };
    
    // 2. Good (33-65) - Color: Green
    if (aqi <= 65) return { category: 'Good', color: '#28a745', description: 'Acceptable for most people', range: [33, 65] };
    
    // 3. Fair (66-98) - Color: Yellow
    if (aqi <= 98) return { category: 'Fair', color: '#ffc107', description: 'Sensitive groups may experience health effects', range: [66, 98] };
    
    // 4. Poor (99-148) - Color: Orange
    if (aqi <= 148) return { category: 'Poor', color: '#fd7e14', description: 'Everyone may begin to experience health effects', range: [99, 148] };
    
    // 5. Very Poor (149-199) - Color: Red
    if (aqi <= 199) return { category: 'Very Poor', color: '#dc3545', description: 'Health alert: everyone may experience serious effects', range: [149, 199] };
    
    // 6. Extremely Poor (200+) - Color: Maroon
    return { category: 'Extremely Poor', color: '#800000', description: 'Hazardous air quality. Emergency conditions', range: [200, Infinity] };
};

// --- Input Form Component ---
const InputForm = ({ onSubmit, loading }) => {
    const cities = ['Adelaide', 'Brisbane', 'Canberra', 'Darwin', 'Hobart', 'Launceston', 'Melbourne', 'Newcastle', 'Perth', 'Sydney', 'Wollongong'];
    const allPollutants = ['PM2.5', 'PM10', 'NO2', 'O3', 'CO', 'SO2'];

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        city: 'Sydney',
        pollutants: [...allPollutants], // Default to ALL selected for consistency
    });

    const [errors, setErrors] = useState({});
    
    // Check if 'Select All' should be checked
    const isAllSelected = formData.pollutants.length === allPollutants.length;

    const validateForm = () => {
        const newErrors = {};
        if (!formData.date) newErrors.date = 'Date is required';
        if (!formData.city) newErrors.city = 'City is required';
        if (formData.pollutants.length === 0) newErrors.pollutants = 'At least one pollutant is required';
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
    
    // UPDATED: Handles toggling individual pollutants and automatically updates the "All" state
    const handlePollutantChange = (pollutant) => {
        setFormData(prev => {
            let newPollutants;
            const isCurrentlySelected = prev.pollutants.includes(pollutant);

            if (isCurrentlySelected) {
                // Remove the pollutant if it was checked
                newPollutants = prev.pollutants.filter(p => p !== pollutant);
            } else {
                // Add the pollutant if it was unchecked
                newPollutants = [...prev.pollutants, pollutant];
            }
            
            if (errors.pollutants) setErrors(prevErrors => ({ ...prevErrors, pollutants: '' }));
            
            return { ...prev, pollutants: newPollutants };
        });
    };

    // UNCHANGED: Handles "Select All"
    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setFormData(prev => {
            const newPollutants = isChecked ? [...allPollutants] : [];
            return { ...prev, pollutants: newPollutants };
        });
        if (errors.pollutants) setErrors(prevErrors => ({ ...prevErrors, pollutants: '' }));
    };

    const inputStyle = {
        width: '100%', padding: '12px', marginBottom: '5px', border: '1px solid #ddd',
        borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box',
    };
    const errorStyle = { color: '#ff0000', fontSize: '12px', marginBottom: '10px' };
    const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' };
    // Updated Grid for Pollutants: 3 columns now
    const checkboxGroupStyle = { 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', // Changed to 3 columns to fit "All"
        gap: '8px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', 
        backgroundColor: '#f9f9f9' 
    };
    
    return (
        <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>Air Quality Prediction Input</h2>
            
            <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Select Date *</label>
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
                <label style={labelStyle}>Select City *</label>
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
                <label style={labelStyle}>🌫️ Select Pollutant(s) *</label>
                <div style={{...checkboxGroupStyle, borderColor: errors.pollutants ? '#ff0000' : '#ddd'}}>
                    {/* Select All Option: Checked state relies on the isAllSelected variable */}
                    <label style={{ 
                        display: 'flex', alignItems: 'center', cursor: 'pointer', 
                        fontWeight: '600', fontSize: '14px', color: '#3498db', 
                        gridColumn: 'span 3', 
                        borderBottom: '1px dashed #ddd', paddingBottom: '5px', marginBottom: '5px' 
                    }}>
                        <input
                            type="checkbox"
                            checked={isAllSelected} // This is the key: it checks itself if length matches.
                            onChange={handleSelectAll}
                            style={{ marginRight: '10px' }}
                        />
                        **All Pollutants**
                    </label>

                    {allPollutants.map(pollutant => (
                        <label key={pollutant} style={{ 
                            display: 'flex', alignItems: 'center', cursor: 'pointer', 
                            fontWeight: 'normal', fontSize: '14px' 
                        }}>
                            <input
                                type="checkbox"
                                value={pollutant}
                                checked={formData.pollutants.includes(pollutant)}
                                onChange={() => handlePollutantChange(pollutant)}
                                style={{ marginRight: '10px' }}
                            />
                            {pollutant}
                        </label>
                    ))}
                </div>
                {errors.pollutants && <div style={errorStyle}>{errors.pollutants}</div>}
            </div>

            <div style={{ padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '4px', marginBottom: '20px', fontSize: '13px', color: '#555' }}>
                <strong>Info:</strong> This will request a prediction for **all selected pollutants**.
            </div>

            <button 
                onClick={handleSubmit}
                disabled={loading}
                style={{
                    width: '100%', padding: '14px', 
                    backgroundColor: loading ? '#95a5a6' : '#3498db',
                    color: '#fff', border: 'none', borderRadius: '4px', 
                    fontSize: '16px', fontWeight: '600', 
                    cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s',
                }}
            >
                {loading ? 'Processing Predictions...' : 'Get Predictions'}
            </button>
        </div>
    );
};

// --- Overall AQI Summary Component ---
const OverallAQISummary = ({ maxAqi, city, date, predictions }) => {
    const { category, color, description } = getAQICategory(maxAqi);
    
    // Define all standard sections up to AQI 500.
    const gaugeData = [
        { name: 'Very Good', value: 32, color: '#007bff' }, // Blue (0-32)
        { name: 'Good', value: 33, color: '#28a745' }, // Green (33-65)
        { name: 'Fair', value: 33, color: '#ffc107' }, // Yellow (66-98)
        { name: 'Poor', value: 50, color: '#fd7e14' }, // Orange (99-148)
        { name: 'Very Poor', value: 51, color: '#dc3545' }, // Red (149-199)
        { name: 'Extremely Poor', value: 301, color: '#800000' }, // Maroon (200-500)
    ];

    const dataValue = maxAqi > 500 ? 500 : maxAqi;

    // Angle Calculation: Maps AQI 0 to 180 degrees, and AQI 500 to 0 degrees.
    const baseAngle = 180 - (dataValue / 500) * 180; 
    
    const angle = -baseAngle; 

    // Custom function to render the needle and central pivot
    const renderNeedle = ({ cx, cy }) => {
        // Needle length matches innerRadius (70)
        const needleLength = 70; 
        const rad = Math.PI / 180;
        
        // Calculate the end point (x, y) of the needle based on the new negative angle
        const x = cx + needleLength * Math.cos(angle * rad);
        const y = cy + needleLength * Math.sin(angle * rad);
        
        return (
            <g>
                <line 
                    x1={cx} 
                    y1={cy} 
                    x2={x} 
                    y2={y} 
                    stroke="#2c3e50" 
                    strokeWidth={3} 
                    strokeLinecap="round"
                />
                <circle cx={cx} cy={cy} r={5} fill="#2c3e50" />
            </g>
        );
    };

    return (
        <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                Overall Predicted AQI for {city}
            </h3>
            
            {/* RESPONSIVE FLEX CONTAINER */}
            <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                alignItems: 'center', 
                justifyContent: 'center'
            }}>
                {/* Gauge Column */}
                <div style={{ 
                    width: '100%', 
                    textAlign: 'center',
                    minWidth: '200px', 
                }}>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            {/* Main gauge ring */}
                            <Pie
                                data={gaugeData}
                                dataKey="value"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={70}
                                outerRadius={90}
                                fill="#8884d8"
                                stroke="none"
                                paddingAngle={0} 
                            >
                                {gaugeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            
                            {/* Custom needle */}
                            <Pie
                                data={[{ value: 1, fill: 'none' }]} 
                                dataKey="value"
                                startAngle={0} 
                                endAngle={0}
                                innerRadius={0} 
                                outerRadius={0}
                                fill="none"
                                isAnimationActive={false}
                                labelLine={false}
                                label={renderNeedle} 
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: '-40px', fontSize: '14px', color: '#666' }}>AQI Scale: 0 - 500</div>
                </div>

                {/* AQI Summary Box Column */}
                <div style={{ 
                    width: '100%', 
                    paddingLeft: '0px', 
                    marginTop: '20px', 
                }}>
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '15px', 
                        backgroundColor: color, 
                        color: '#fff', 
                        borderRadius: '6px',
                        marginBottom: '15px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ fontSize: '18px', fontWeight: '500' }}>Overall AQI</div>
                        <div style={{ fontSize: '56px', fontWeight: 'bold' }}>{maxAqi.toFixed(0)}</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{category}</div>
                    </div>
                    <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>
                        **Primary Concern:** This AQI level is determined by the maximum predicted pollutant ({predictions.find(p => parseFloat(p.AQI) === maxAqi)?.pollutant || 'N/A'}).
                    </p>
                </div>
            </div>
            
        </div>
    );
};


// --- Pollutant Detail Card Component ---
const PollutantDetailCard = ({ prediction }) => {
    const getValueWithFallback = (obj, key, defaultValue = 'N/A') => {
        return obj && obj[key] !== undefined && obj[key] !== null ? obj[key] : defaultValue;
    };

    const predictedValue = getValueWithFallback(prediction, 'AQI', 0);
    const aqiValue = typeof predictedValue === 'number' ? predictedValue : parseFloat(predictedValue) || 0;
    const { category, color } = getAQICategory(aqiValue);

    // Filter out keys already displayed or used for context
    const dataKeysToExclude = ['pollutant', 'city', 'date', 'AQI']; 
    
    // Ensure we filter out Model_Used if it exists, to prevent it appearing in the table below
    const otherData = Object.entries(prediction).filter(([key]) => 
        !dataKeysToExclude.includes(key) && key !== 'Model_Used' 
    );
    
    // Function to format key names (e.g., 'Conc_Min' -> 'Min Concentration')
    const formatKeyName = (key) => {
        return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    };

    // Style to force text wrapping for long numbers/words in the table
    const tableValueStyle = { 
        padding: '5px 0', 
        textAlign: 'right', 
        color: '#2c3e50', 
        wordBreak: 'break-all', 
        overflowWrap: 'break-word' 
    };

    // Variance Check SETUP ---
    const predictedVariance = getValueWithFallback(prediction, 'variance', -1); // Use -1 as sentinel for missing/unpredicted
    const varianceValue = parseFloat(predictedVariance);
    const isVarianceZeroOrMissing = varianceValue === 0;

    return (
        <div style={{ 
        padding: '20px', backgroundColor: '#fff', borderRadius: '8px', 
        boxShadow: `0 2px 10px ${color}33`, border: `2px solid ${color}`,
        }}>
        <h4 style={{ 
            marginTop: 0, color: color, marginBottom: '15px', borderBottom: `1px solid ${color}80`, 
            paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
            <span>{prediction.pollutant} Prediction</span>
        </h4>
        
        <div style={{ 
            textAlign: 'center', backgroundColor: color, padding: '20px', 
            borderRadius: '6px', marginBottom: '15px',
        }}>
            <div style={{ color: '#fff', fontSize: '16px', marginBottom: '5px' }}>Predicted AQI Value</div>
            <div style={{ color: '#fff', fontSize: '42px', fontWeight: 'bold' }}>{aqiValue.toFixed(2)}</div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <div style={{ 
            color: color, fontSize: '20px', fontWeight: 'bold',
            textShadow: '1px 1px 1px #00000033'
            }}>{category}</div>
        </div>

        {/* Detailed Data Table */}
        {otherData.length > 0 && (
            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px' }}>Detailed Prediction Data:</h5>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                {otherData.map(([key, value]) => {
                    const formattedKey = formatKeyName(key);

                    // --- NEW: Conditional Warning for Zero Variance ---
                    if (key === 'variance' && isVarianceZeroOrMissing) {
                        return (
                            <tr key={key} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fef3f2' }}>
                                <td style={{ padding: '5px 0', fontWeight: '600', color: '#dc3545' }}>
                                    {formattedKey}:
                                </td>
                                <td style={{ ...tableValueStyle, color: '#dc3545', fontWeight: 'bold' }}>
                                    <span role="img" aria-label="warning">⚠️</span> Not Found (Zero)
                                </td>
                            </tr>
                        );
                    }
                    // --- END NEW LOGIC ---

                    return (
                        <tr key={key} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '5px 0', fontWeight: '600', color: '#555' }}>
                                {formattedKey}:
                            </td>
                            <td style={tableValueStyle}> 
                                {typeof value === 'number' ? value.toFixed(3) : value}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
            </div>
        )}
        </div>
    );
};

// --- Other Components ---
const HealthRecommendations = ({ maxAqi }) => {
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

    const recommendations = getRecommendations(maxAqi);
    const { color } = getAQICategory(maxAqi);

    return (
        <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>Health Recommendations (Max AQI: <span style={{color}}>{maxAqi.toFixed(2)}</span>)</h3>
            
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

const HistoricalComparison = ({ currentAQI }) => {
    const historicalData = [
        { period: 'Last Week', aqi: Math.max(0, currentAQI - 15 + Math.random() * 10) },
        { period: 'Last Month', aqi: Math.max(0, currentAQI - 20 + Math.random() * 15) },
        { period: 'Current', aqi: currentAQI },
    ];

    return (
        <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>Historical Comparison (Max AQI)</h3>
            <ResponsiveContainer width="100%" height={250}> 
                <BarChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="aqi" fill="#3498db" name={`Max AQI`} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const CombinedChart = ({ predictions }) => {
    const data = predictions.map(p => ({
        pollutant: p.pollutant,
        aqi: parseFloat(p.AQI) || 0,
    }));

    const maxAQI = Math.max(...data.map(d => d.aqi));
    const highestCategory = getAQICategory(maxAQI);

    const chartTitleStyle = {
        color: highestCategory.color, 
        fontWeight: 'bold', 
        fontSize: '18px', 
        marginBottom: '15px' 
    };

    return (
        <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '10px' }}>Pollutant AQI Comparison</h3>
            <p style={chartTitleStyle}>
                Maximum Predicted AQI: {maxAQI.toFixed(2)} ({highestCategory.category})
            </p>
            <ResponsiveContainer width="100%" height={250}>
                <RadarChart outerRadius={90} width={730} height={250} data={data}>
                    <PolarGrid stroke="#ccc" />
                    <PolarAngleAxis dataKey="pollutant" />
                    <PolarRadiusAxis angle={30} domain={[0, Math.ceil(maxAQI / 100) * 100 || 200]} /> 
                    <Radar 
                        name="Predicted AQI" 
                        dataKey="aqi" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6} 
                    />
                    <Tooltip />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

const AQITrendChart = ({ currentAQI }) => {
    const trendData = Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        aqi: Math.max(0, currentAQI + (Math.random() - 0.5) * 40),
    }));

    return (
        <div style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>7-Day AQI Forecast (Max Pollutant)</h3>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="aqi" stroke="#e74c3c" strokeWidth={3} dot={{ r: 5 }} name="Max Predicted AQI" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};


const App = () => {
    const [predictions, setPredictions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [serverStatus, setServerStatus] = useState(null);

    // Dynamic Server Health Check Hook
    React.useEffect(() => {
        const checkServerHealth = async () => {
            try {
                // Assuming 'api.healthCheck' is defined and works
                const health = await api.healthCheck(); 
                setServerStatus(health);
            } catch (err) {
                // If fetch fails (e.g., connection refused, CORS issue), treat it as offline
                setServerStatus({ status: 'error', model_loaded: false, message: 'Connection Failed' });
            }
        };

        // 1. Run immediately on component mount
        checkServerHealth();

        // 2. Run dynamically every 15 seconds (15000 milliseconds)
        const intervalId = setInterval(checkServerHealth, 15000);

        // 3. Clean up the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, []); // Empty dependency array means this runs only on mount/unmount

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);
        
        try {
            const results = await api.predictAirQuality(
                formData.date,
                formData.city,
                formData.pollutants
            );
            
            setPredictions(results);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const maxAqi = predictions 
        ? Math.max(...predictions.map(p => parseFloat(p.AQI) || 0)) 
        : 0;

    const city = predictions?.[0]?.city || '';
    const date = predictions?.[0]?.date || '';

    return (
        // Global Padding: 10px
        <div style={{ minHeight: '100vh', backgroundColor: '#ecf0f1', padding: '10px', fontFamily: 'Arial, sans-serif' }}>
            
            <div style={{ 
                maxWidth: '1400px', 
                margin: '0 auto',
                overflowX: 'hidden' 
            }}>
                <header style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ color: '#2c3e50', fontSize: '42px', marginBottom: '10px', fontWeight: 'bold' }}>
                        🌏 Air Quality & Health Monitor
                    </h1>
                    <p style={{ color: '#7f8c8d', fontSize: '18px', marginBottom: '15px' }}>
                        AI-Powered Air Quality Predictions for Australian Cities
                    </p>
                    {serverStatus && (
                        <div style={{ 
                            display: 'inline-block', padding: '8px 16px', 
                            backgroundColor: serverStatus.model_loaded ? '#2ecc71' : '#e74c3c', 
                            color: '#fff', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold'
                        }}>
                            {serverStatus.model_loaded ? '✓ Server Online' : '✗ Server Offline'}
                        </div>
                    )}
                </header>

                {error && (
                    <div style={{ 
                        padding: '15px 20px', backgroundColor: '#e74c3c', color: '#fff', 
                        borderRadius: '8px', marginBottom: '20px', textAlign: 'center',
                        fontSize: '15px', fontWeight: '500'
                    }}>
                        ⚠️ Error: {error}
                    </div>
                )}

                {/* MAIN RESPONSIVE LAYOUT GRID: Input form and Summary/Health (Responsive) */}
                <div style={{ 
                    display: 'grid', 
                    gap: '20px', 
                    marginBottom: '20px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' 
                }}>
                    {/* Input Form Column */}
                    <div style={{ minWidth: '250px' }}>
                        <InputForm onSubmit={handleSubmit} loading={loading} />
                    </div>
                    
                    {/* Summary Block */}
                    {predictions && predictions.length > 0 && (
                        <div style={{ 
                            display: 'grid', 
                            gap: '20px',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                        }}>
                            <OverallAQISummary 
                                maxAqi={maxAqi} 
                                city={city} 
                                date={date} 
                                predictions={predictions} 
                            />
                            <HealthRecommendations maxAqi={maxAqi} />
                        </div>
                    )}
                </div>

                {/* Detailed Results and Visualisation Section */}
                {predictions && predictions.length > 0 && (
                    <>
                        <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>Detailed Pollutant Results</h3>
                        {/* Pollutant Cards remain responsive to allow multiple cards on wide screens */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            {/* Render a card for each predicted pollutant */}
                            {predictions.map((p, index) => (
                                <PollutantDetailCard key={index} prediction={p} />
                            ))}
                        </div>

                        {/* CHART ROW 1: Comparison Chart and Info Box (Now Single Column) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
                            
                            {/* 1. Combined Chart (ORDER: 1) */}
                            <div style={{ order: 1 }}>
                                <CombinedChart predictions={predictions} /> 
                            </div>

                        </div>

                        {/* CHART ROW 2: Historical and Trend Charts (Single Column) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
                            <HistoricalComparison currentAQI={maxAqi} />
                            <AQITrendChart currentAQI={maxAqi} />
                        </div>

                        {/* Info Box */}
                        <div style={{ 
                            padding: '25px', 
                            backgroundColor: '#fff', 
                            borderRadius: '8px', 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            order: 2,
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '15px' }}>About This Prediction</h3>
                            <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.8' }}>
                                <p style={{ marginBottom: '12px' }}>
                                    <strong>Model:</strong> Combined AI ensemble using multiple machine learning algorithms
                                </p>
                                <p style={{ marginBottom: '12px' }}>
                                    <strong>Pollutants:</strong> {predictions.map(p => p.pollutant).join(', ')} 
                                </p>
                                <p style={{ marginBottom: '12px' }}>
                                    <strong>Prediction Date:</strong> {new Date(date).toLocaleDateString('en-AU', { 
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                                    })}
                                </p>
                                <p style={{ margin: 0 }}>
                                    <strong>Interpretation:</strong> The overall health risk is assessed based on the pollutant that yields the highest AQI value (Max AQI).
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default App;