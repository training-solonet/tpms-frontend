import React from 'react';

const SimpleChartCard = ({ 
  title, 
  subtitle, 
  data, 
  type = 'line', 
  // eslint-disable-next-line no-unused-vars
  height = 300,
  color = '#6366f1',
  colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'],
}) => {
  const renderBarChart = () => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="flex items-end justify-between h-64 px-4 py-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 mx-1">
            <div 
              className="w-full bg-indigo-500 rounded-t-md transition-all duration-300 hover:bg-indigo-600"
              style={{ 
                height: `${(item.value / maxValue) * 200}px`,
                backgroundColor: color 
              }}
            />
            <span className="text-xs text-gray-500 mt-2">{item.name}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderLineChart = () => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 300;
      const y = 200 - ((item.value - minValue) / range) * 180;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative h-64 p-4">
        <svg width="100%" height="200" className="overflow-visible">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          
          {/* Area fill */}
          <polygon
            points={`0,200 ${points} 300,200`}
            fill="url(#lineGradient)"
          />
          
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 300;
            const y = 200 - ((item.value - minValue) / range) * 180;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={color}
                className="hover:r-6 transition-all duration-200"
              />
            );
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2">
          {data.map((item, index) => (
            <span key={index} className="text-xs text-gray-500">
              {item.name}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <svg width="160" height="160" className="transform -rotate-90">
            {data.map((item, index) => {
              
              const angle = (item.value / total) * 360;
              const startAngle = currentAngle;
              currentAngle += angle;
              
              const x1 = 80 + 70 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 80 + 70 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 80 + 70 * Math.cos((currentAngle * Math.PI) / 180);
              const y2 = 80 + 70 * Math.sin((currentAngle * Math.PI) / 180);
              
              const largeArc = angle > 180 ? 1 : 0;
              
              return (
                <path
                  key={index}
                  d={`M 80 80 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={colors[index % colors.length]}
                  className="hover:opacity-80 transition-opacity duration-200"
                />
              );
            })}
          </svg>
          
          {/* Legend */}
          <div className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center mb-2">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm text-gray-600">
                  {item.name} ({Math.round((item.value / total) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'area':
      case 'line':
      default:
        return renderLineChart();
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          <button className="text-gray-400 hover:text-gray-500">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
        {renderChart()}
      </div>
    </div>
  );
};

export default SimpleChartCard;
