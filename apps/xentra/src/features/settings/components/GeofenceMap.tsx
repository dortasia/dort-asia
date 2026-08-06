"use client"

import React, { useCallback, useRef, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'

interface Site {
  id: string
  name: string
  address: string
  radius: number
  lat?: number
  lng?: number
}

interface GeofenceMapProps {
  currentSite: Site
  allSites: Site[]
  showOtherSites: boolean
  onLocationUpdate: (lat: number, lng: number) => void
}

const DEFAULT_CENTER = { lat: 3.1390, lng: 101.6869 } // Kuala Lumpur fallback

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "landscape", elementType: "geometry.fill", stylers: [{ color: "#f2efe9" }] },
  { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#f2efe9" }] },
  { featureType: "landscape.natural", elementType: "geometry.fill", stylers: [{ color: "#e4eed3" }] },
  { featureType: "poi", elementType: "geometry.fill", stylers: [{ color: "#e8e5de" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#ccdfb3" }] },
  { featureType: "poi.medical", elementType: "geometry.fill", stylers: [{ color: "#f2e1e0" }] },
  { featureType: "poi.school", elementType: "geometry.fill", stylers: [{ color: "#eae0c8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#d6d2c4" }, { weight: 0.5 }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#ffdfa6" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#f5cc8d" }, { weight: 0.5 }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry.fill", stylers: [{ color: "#f9a86b" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry.stroke", stylers: [{ color: "#f5853b" }, { weight: 1 }] },
  { featureType: "road.local", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.local", elementType: "geometry.stroke", stylers: [{ color: "#d4d0c2" }, { weight: 0.5 }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#d2d2d2" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#98d3ea" }] },
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#4f4a44" }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#f2efe9" }, { weight: 3 }] },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
]

const containerStyle = { width: '100%', height: '100%' }

export default function GeofenceMap({ currentSite, allSites, showOtherSites, onLocationUpdate }: GeofenceMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GMAPS_KEY || '',
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  // Single imperative circle instance — never unmounted/remounted
  const circleRef = useRef<google.maps.Circle | null>(null)
  // Refs for other sites circles
  const otherCirclesRef = useRef<google.maps.Circle[]>([])
  // Always-current ref so onLoad doesn't capture stale values
  const currentSiteRef = useRef(currentSite)
  useEffect(() => { currentSiteRef.current = currentSite }, [currentSite])

  const center = currentSite.lat && currentSite.lng
    ? { lat: currentSite.lat, lng: currentSite.lng }
    : DEFAULT_CENTER

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map

    // Always destroy any orphaned circle before creating a fresh one
    if (circleRef.current) {
      circleRef.current.setMap(null)
      circleRef.current = null
    }

    const site = currentSiteRef.current
    const hasPos = !!(site.lat && site.lng)

    circleRef.current = new google.maps.Circle({
      map,
      center: hasPos ? { lat: site.lat!, lng: site.lng! } : DEFAULT_CENTER,
      radius: site.radius || 100,
      strokeColor: '#000000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#000000',
      fillOpacity: 0.15,
      visible: hasPos,
    })
   
  }, [])

  const onUnmount = useCallback(() => {
    circleRef.current?.setMap(null)
    circleRef.current = null
    otherCirclesRef.current.forEach(c => c.setMap(null))
    otherCirclesRef.current = []
    mapRef.current = null
  }, [])

  // Update circle position + radius when currentSite changes — mutates in place
  useEffect(() => {
    if (!circleRef.current) return
    const hasPos = !!(currentSite.lat && currentSite.lng)
    circleRef.current.setVisible(hasPos)
    if (hasPos) {
      circleRef.current.setCenter({ lat: currentSite.lat!, lng: currentSite.lng! })
    }
    circleRef.current.setRadius(currentSite.radius || 100)
  }, [currentSite.lat, currentSite.lng, currentSite.radius])

  // Manage other site circles imperatively
  useEffect(() => {
    if (!mapRef.current) return
    // Clear existing other circles
    otherCirclesRef.current.forEach(c => c.setMap(null))
    otherCirclesRef.current = []

    if (!showOtherSites) return

    const others = allSites.filter(s => s.id !== currentSite.id && s.lat && s.lng)
    otherCirclesRef.current = others.map(site => (
      new google.maps.Circle({
        map: mapRef.current!,
        center: { lat: site.lat!, lng: site.lng! },
        radius: site.radius || 100,
        strokeColor: '#9CA3AF',
        strokeOpacity: 0.6,
        strokeWeight: 1.5,
        fillColor: '#9CA3AF',
        fillOpacity: 0.08,
      })
    ))
  }, [showOtherSites, allSites, currentSite.id])

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onLocationUpdate(e.latLng.lat(), e.latLng.lng())
    }
  }, [onLocationUpdate])

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onLocationUpdate(e.latLng.lat(), e.latLng.lng())
    }
  }, [onLocationUpdate])

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F9FAFB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-black/10 border-t-black animate-spin" />
          <span className="text-sm text-gray-400">Loading map...</span>
        </div>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={{
        styles: MAP_STYLES,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        gestureHandling: 'greedy',
        clickableIcons: false,
      }}
    >
      {/* Current Site Marker — declarative is fine for the pin */}
      {currentSite.lat && currentSite.lng && (
        <Marker
          position={{ lat: currentSite.lat, lng: currentSite.lng }}
          draggable
          onDragEnd={handleMarkerDragEnd}
          title={currentSite.name || 'Site Location'}
        />
      )}

      {/* Other Site Markers */}
      {showOtherSites && allSites
        .filter(s => s.id !== currentSite.id && s.lat && s.lng)
        .map(site => (
          <Marker
            key={site.id}
            position={{ lat: site.lat as number, lng: site.lng as number }}
            title={site.name}
            opacity={0.5}
          />
        ))}
    </GoogleMap>
  )
}
