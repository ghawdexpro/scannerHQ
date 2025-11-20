'use client'

import { useEffect, useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { Building3DViewProps } from './types'

export default function Building3DView({
  visualizationData,
  coordinates,
  onComplete,
  isActive
}: Building3DViewProps) {
  const [showControls, setShowControls] = useState(false)

  useEffect(() => {
    if (!isActive) return

    const timer1 = setTimeout(() => {
      setShowControls(true)
    }, 1000)

    const timer2 = setTimeout(() => {
      onComplete()
    }, 3500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [isActive, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      {/* 3D Canvas */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-lg overflow-hidden mb-6">
        <Canvas shadows>
          <Suspense fallback={null}>
            <Scene visualizationData={visualizationData} />
          </Suspense>
        </Canvas>

        {/* Corner badges */}
        <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-400">3D Solar Model</div>
          <div className="text-sm font-semibold text-white">{visualizationData.imageryQuality} Quality</div>
        </div>

        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-gray-700"
          >
            <div className="text-xs text-gray-400 mb-1">Controls</div>
            <div className="text-xs text-white space-y-1">
              <div>🖱️ Drag to rotate</div>
              <div>🔍 Scroll to zoom</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            {visualizationData.maxPanels}
          </div>
          <div className="text-xs text-gray-500 mt-1">Solar Panels</div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
          <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            {((visualizationData.maxPanels * visualizationData.panelDimensions.capacity) / 1000).toFixed(1)}
            <span className="text-lg">kW</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">System Capacity</div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
          <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            {visualizationData.totalRoofArea.toFixed(0)}
            <span className="text-lg">m²</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Total Roof Area</div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
          <div className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            {visualizationData.roofSegments.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Roof Segments</div>
        </div>
      </div>

      {/* Completion message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="mt-6 text-center"
      >
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Solar Analysis Complete!</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// 3D Scene component
function Scene({ visualizationData }: { visualizationData: Building3DViewProps['visualizationData'] }) {
  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={50} />

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        autoRotate
        autoRotateSpeed={1}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <hemisphereLight args={['#ffffff', '#444444', 0.6]} />

      {/* Environment */}
      <Environment preset="sunset" />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Building base */}
      <BuildingMesh visualizationData={visualizationData} />

      {/* Solar panels */}
      <SolarPanels visualizationData={visualizationData} />
    </>
  )
}

// Building mesh
function BuildingMesh({ visualizationData }: { visualizationData: Building3DViewProps['visualizationData'] }) {
  const segments = visualizationData.roofSegments

  return (
    <group>
      {/* Main building structure (simplified box) */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 3, 4]} />
        <meshStandardMaterial color="#8b7355" roughness={0.8} />
      </mesh>

      {/* Roof segments */}
      {segments.map((segment, index) => {
        const pitchRadians = (segment.pitch * Math.PI) / 180
        const azimuthRadians = ((segment.azimuth - 90) * Math.PI) / 180

        // Position roof segments around the building
        const angleStep = (Math.PI * 2) / segments.length
        const angle = angleStep * index
        const radius = 2.2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius

        return (
          <group key={segment.id} position={[x, 3.2, z]} rotation={[pitchRadians, azimuthRadians, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2, 0.1, 1.5]} />
              <meshStandardMaterial
                color={segment.sunlightIntensity.quality === 'excellent' ? '#10b981' : '#8b4513'}
                roughness={0.6}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// Solar panels
function SolarPanels({ visualizationData }: { visualizationData: Building3DViewProps['visualizationData'] }) {
  const [visiblePanels, setVisiblePanels] = useState(0)
  const segments = visualizationData.roofSegments
  const maxPanels = Math.min(visualizationData.maxPanels, 40)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisiblePanels(prev => {
        if (prev < maxPanels) return prev + 1
        clearInterval(interval)
        return prev
      })
    }, 60)

    return () => clearInterval(interval)
  }, [maxPanels])

  // Distribute panels across segments
  const panels: Array<{ position: [number, number, number]; rotation: [number, number, number] }> = []
  let remainingPanels = visiblePanels

  segments.forEach((segment, segmentIndex) => {
    if (remainingPanels <= 0) return

    const panelsForSegment = Math.min(remainingPanels, Math.ceil(maxPanels / segments.length))
    const pitchRadians = (segment.pitch * Math.PI) / 180
    const azimuthRadians = ((segment.azimuth - 90) * Math.PI) / 180

    // Position on roof segment
    const angleStep = (Math.PI * 2) / segments.length
    const angle = angleStep * segmentIndex
    const radius = 2.2
    const baseX = Math.cos(angle) * radius
    const baseZ = Math.sin(angle) * radius

    for (let i = 0; i < panelsForSegment; i++) {
      const row = Math.floor(i / 3)
      const col = i % 3

      panels.push({
        position: [
          baseX + (col - 1) * 0.5,
          3.3 + row * 0.02,
          baseZ + (row - 1) * 0.3
        ],
        rotation: [pitchRadians, azimuthRadians, 0]
      })
    }

    remainingPanels -= panelsForSegment
  })

  return (
    <group>
      {panels.map((panel, index) => (
        <motion.group
          key={index}
          initial={{ scale: 0, y: panel.position[1] + 2 }}
          animate={{ scale: 1, y: panel.position[1] }}
          // @ts-ignore - motion group typing issue
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: index * 0.03
          }}
        >
          <mesh
            position={panel.position}
            rotation={panel.rotation}
            castShadow
          >
            <boxGeometry args={[0.4, 0.02, 0.7]} />
            <meshStandardMaterial
              color="#1e40af"
              metalness={0.5}
              roughness={0.2}
              emissive="#3b82f6"
              emissiveIntensity={0.1}
            />
          </mesh>
        </motion.group>
      ))}
    </group>
  )
}
