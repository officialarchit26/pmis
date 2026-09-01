import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const MapPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Initialize map centered on India (adjust as needed)
    mapInstance.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance.current)

    // Add some sample markers
    const projects = [
      { coords: [28.7041, 77.1025] as L.LatLngTuple, name: 'Delhi Metro Phase 4' },
      { coords: [19.0760, 72.8777] as L.LatLngTuple, name: 'Mumbai Coastal Road' },
      { coords: [13.0827, 80.2707] as L.LatLngTuple, name: 'Chennai Smart City' },
      { coords: [22.5726, 88.3639] as L.LatLngTuple, name: 'Kolkata Urban Renewal' }
    ]

    projects.forEach((project) => {
      L.marker(project.coords)
        .addTo(mapInstance.current!)
        .bindPopup(`<strong>${project.name}</strong>`)
    })

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Project Map</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div ref={mapRef} style={{ height: '600px', width: '100%' }} />
      </div>
    </div>
  )
}

export default MapPage