import React, { useState } from 'react';

// ============================================================================
// 1. Platform Overview Multi-line Chart
// ============================================================================
export function PlatformOverviewChart({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const width = 560;
  const height = 210;
  const padding = { top: 20, right: 30, bottom: 35, left: 40 };

  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  const maxY = 200;

  const getX = (index) => padding.left + (index / (months.length - 1)) * graphWidth;
  const getY = (val) => padding.top + graphHeight - (Math.min(val, maxY) / maxY) * graphHeight;

  // Format smooth curved path
  const createCurvedPath = (values) => {
    return values.reduce((acc, val, i) => {
      const x = getX(i);
      const y = getY(val);
      if (i === 0) return `M ${x} ${y}`;
      const prevX = getX(i - 1);
      const prevY = getY(values[i - 1]);
      const cp1X = prevX + (x - prevX) / 2;
      const cp2X = prevX + (x - prevX) / 2;
      return `${acc} C ${cp1X} ${prevY}, ${cp2X} ${y}, ${x} ${y}`;
    }, '');
  };

  const createAreaPath = (values) => {
    const linePath = createCurvedPath(values);
    const lastX = getX(values.length - 1);
    const firstX = getX(0);
    const bottomY = padding.top + graphHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const students = data?.map((d) => d.students) || [48, 95, 140, 138, 172, 165];
  const projects = data?.map((d) => d.projects) || [12, 28, 45, 52, 74, 88];
  const workshops = data?.map((d) => d.workshops) || [6, 14, 22, 30, 42, 56];

  const yTicks = [0, 50, 100, 150, 200];

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D5A32D" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#D5A32D" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Grid lines and labels */}
        {yTicks.map((val) => {
          const y = getY(val);
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#EFE8DE"
                strokeWidth="1"
                strokeDasharray={val === 0 ? 'none' : '3,3'}
              />
              <text
                x={padding.left - 10}
                y={y + 3.5}
                textAnchor="end"
                fill="#8C9BAE"
                fontSize="10"
                fontFamily="Inter, sans-serif"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* X Axis labels */}
        {months.map((m, i) => (
          <text
            key={m}
            x={getX(i)}
            y={height - 12}
            textAnchor="middle"
            fill="#8C9BAE"
            fontSize="10"
            fontFamily="Inter, sans-serif"
          >
            {m}
          </text>
        ))}

        {/* Shaded Areas */}
        <path d={createAreaPath(students)} fill="url(#blueGradient)" />
        <path d={createAreaPath(projects)} fill="url(#goldGradient)" />
        <path d={createAreaPath(workshops)} fill="url(#purpleGradient)" />

        {/* Colored Lines */}
        <path
          d={createCurvedPath(students)}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d={createCurvedPath(projects)}
          fill="none"
          stroke="#D5A32D"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d={createCurvedPath(workshops)}
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Data points */}
        {months.map((m, i) => (
          <g key={m} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
            <circle cx={getX(i)} cy={getY(students[i])} r={hoveredIndex === i ? 5 : 3} fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx={getX(i)} cy={getY(projects[i])} r={hoveredIndex === i ? 5 : 3} fill="#D5A32D" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx={getX(i)} cy={getY(workshops[i])} r={hoveredIndex === i ? 5 : 3} fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="1.5" />
          </g>
        ))}
      </svg>

      {/* Legend below chart */}
      <div className="chart-legend-row">
        <div className="chart-legend-item">
          <span className="chart-legend-dot" style={{ backgroundColor: '#3B82F6' }} />
          <span>Students Joined</span>
        </div>
        <div className="chart-legend-item">
          <span className="chart-legend-dot" style={{ backgroundColor: '#D5A32D' }} />
          <span>Projects Created</span>
        </div>
        <div className="chart-legend-item">
          <span className="chart-legend-dot" style={{ backgroundColor: '#8B5CF6' }} />
          <span>Workshop Registrations</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. Project Status Distribution Doughnut Chart
// ============================================================================
export function ProjectStatusDoughnutChart({ distribution }) {
  const planning = distribution?.planning || 78;
  const inProgress = distribution?.inProgress || 132;
  const completed = distribution?.completed || 86;
  const onHold = distribution?.onHold || 16;
  const total = distribution?.total || (planning + inProgress + completed + onHold);

  const data = [
    { label: 'Planning', count: planning, color: '#3B82F6' },
    { label: 'In Progress', count: inProgress, color: '#D5A32D' },
    { label: 'Completed', count: completed, color: '#10B981' },
    { label: 'On Hold', count: onHold, color: '#94A3B8' }
  ];

  // SVG Circle stroke dash calculations
  const size = 140;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;
  const segments = data.map((item) => {
    const fraction = total > 0 ? item.count / total : 0.25;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulated * circumference;
    accumulated += fraction;
    return { ...item, strokeDasharray, strokeDashoffset };
  });

  return (
    <div className="admin-doughnut-wrap">
      <div className="admin-doughnut-svg-box">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#EFEAE0"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg) => (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
            />
          ))}
        </svg>

        <div className="admin-doughnut-center-text">
          <div className="admin-doughnut-center-number">{total}</div>
          <div className="admin-doughnut-center-label">Projects</div>
        </div>
      </div>

      <div className="admin-doughnut-legend-col">
        {data.map((item) => (
          <div className="admin-doughnut-legend-row" key={item.label}>
            <div className="admin-doughnut-legend-label">
              <span className="chart-legend-dot" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
            <span className="admin-doughnut-legend-count">({item.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 3. Student Registrations Vertical Bar Chart (for Reports)
// ============================================================================
export function StudentRegistrationsBarChart({ data }) {
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const values = data?.map((d) => d.count) || [48, 95, 140, 138, 172, 165];
  const maxVal = Math.max(...values, 200);

  const width = 360;
  const height = 180;
  const padding = { top: 15, right: 15, bottom: 25, left: 35 };

  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  const barWidth = 24;

  const yTicks = [0, 50, 100, 150, 200];

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="purpleBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>

        {yTicks.map((val) => {
          const y = padding.top + graphHeight - (val / maxVal) * graphHeight;
          return (
            <g key={val}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#EFE8DE" strokeWidth="1" strokeDasharray="3,3" />
              <text x={padding.left - 6} y={y + 3.5} textAnchor="end" fill="#8C9BAE" fontSize="9" fontFamily="Inter, sans-serif">
                {val}
              </text>
            </g>
          );
        })}

        {months.map((m, i) => {
          const val = values[i] || 0;
          const barHeight = (val / maxVal) * graphHeight;
          const x = padding.left + (i + 0.5) * (graphWidth / months.length) - barWidth / 2;
          const y = padding.top + graphHeight - barHeight;

          return (
            <g key={m}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" fill="url(#purpleBarGrad)" />
              <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fill="#8C9BAE" fontSize="9.5" fontFamily="Inter, sans-serif">
                {m}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================================
// 4. Top Departments Doughnut Chart (for Reports)
// ============================================================================
export function TopDepartmentsDoughnutChart({ distribution, total = 312 }) {
  const list = distribution || [
    { name: 'CSE', percentage: 38, color: '#3B82F6' },
    { name: 'IT', percentage: 22, color: '#D5A32D' },
    { name: 'ECE', percentage: 16, color: '#10B981' },
    { name: 'AIML', percentage: 14, color: '#8B5CF6' },
    { name: 'Other', percentage: 10, color: '#94A3B8' }
  ];

  const size = 140;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;
  const segments = list.map((item) => {
    const fraction = item.percentage / 100;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulated * circumference;
    accumulated += fraction;
    return { ...item, strokeDasharray, strokeDashoffset };
  });

  return (
    <div className="admin-doughnut-wrap">
      <div className="admin-doughnut-svg-box">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="#EFEAE0" strokeWidth={strokeWidth} />
          {segments.map((seg) => (
            <circle
              key={seg.name}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
            />
          ))}
        </svg>

        <div className="admin-doughnut-center-text">
          <div className="admin-doughnut-center-number">{total}</div>
          <div className="admin-doughnut-center-label">Projects</div>
        </div>
      </div>

      <div className="admin-doughnut-legend-col">
        {list.map((item) => (
          <div className="admin-doughnut-legend-row" key={item.name}>
            <div className="admin-doughnut-legend-label">
              <span className="chart-legend-dot" style={{ backgroundColor: item.color }} />
              <span>{item.name} ({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

