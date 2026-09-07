import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getProjectMapData } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import StatusBadge from '../components/StatusBadge';

// Fix default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createColorIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const STATUS_ICONS = {
  active: createColorIcon('#10b981'),
  delayed: createColorIcon('#ef4444'),
  completed: createColorIcon('#3b82f6'),
  on_hold: createColorIcon('#f59e0b'),
  planning: createColorIcon('#6b7280'),
};

export default function MapView() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjectMapData();
      setProjects(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading map data..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  // Calculate center based on projects
  const validProjects = projects.filter(p => p.latitude && p.longitude);
  const center = validProjects.length > 0
    ? [
        validProjects.reduce((sum, p) => sum + Number(p.latitude), 0) / validProjects.length,
        validProjects.reduce((sum, p) => sum + Number(p.longitude), 0) / validProjects.length,
      ]
    : [39.5, -98.35]; // Center of US

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Project Map</h1>
        <p className="text-gray-600 mt-1">Geographic view of all government projects</p>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 bg-white p-3 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
          <span className="text-sm text-gray-700">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>
          <span className="text-sm text-gray-700">Delayed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
          <span className="text-sm text-gray-700">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow"></div>
          <span className="text-sm text-gray-700">On Hold</span>
        </div>
        <div className="ml-auto text-sm text-gray-500">
          {validProjects.length} project{validProjects.length !== 1 ? 's' : ''} on map
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <MapContainer
          center={center}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {validProjects.map((project) => (
            <Marker
              key={project.id}
              position={[Number(project.latitude), Number(project.longitude)]}
              icon={STATUS_ICONS[project.status] || STATUS_ICONS.planning}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-gray-900 mb-2">{project.name}</h3>
                  <div className="mb-2">
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Progress:</strong> {project.progress_percent}%
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Budget:</strong> ${((project.budget_total || 0) / 1000000).toFixed(1)}M
                  </p>
                  {project.department && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Dept:</strong> {project.department.name}
                    </p>
                  )}
                  <Link
                    to={`/projects/${project.id}`}
                    className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}