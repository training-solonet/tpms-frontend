import React from 'react';

const TailwindStatCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'positive', 
  color = 'indigo',
  subtitle,
  icon: Icon,
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getChangePrefix = () => {
    if (changeType === 'positive') return '+';
    if (changeType === 'negative') return '-';
    return '';
  };

  const getColorClasses = () => {
    const colorMap = {
      indigo: 'bg-indigo-500 text-white',
      green: 'bg-green-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      red: 'bg-red-500 text-white',
      blue: 'bg-blue-500 text-white',
    };
    return colorMap[color] || colorMap.indigo;
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
      <div>
        <div className={`absolute rounded-md p-3 ${getColorClasses()}`}>
          {Icon ? (
            <Icon className="h-6 w-6" aria-hidden="true" />
          ) : null}
        </div>
        <p className="ml-16 truncate text-sm font-medium text-gray-500">{title}</p>
        <p className="ml-16 text-2xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          {subtitle && (
            <p className="text-gray-600 mb-1">{subtitle}</p>
          )}
          {change && (
            <div className="flex items-center">
              <span className={`font-medium ${getChangeColor()}`}>
                {getChangePrefix()}{change}
              </span>
              <span className="ml-2 text-gray-500">vs last month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TailwindStatCard;
