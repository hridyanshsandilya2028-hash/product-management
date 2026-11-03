import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Float, Line, Sparkles, Text } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import * as THREE from 'three'
import { contact, districts, legend, pathways, ranks, type District } from './data/content'
import { story, type StoryNode } from './data/story'

type RealmState = {
  entered: boolean
  classic: boolean
  selected: string | null
  visited: string[]
  firstPerson: boolean
  pathwayOpen: boolean
  paused: boolean
  storyMode: boolean
  storyRead: string[]
  reader: string | null
  bookOpen: boolean
  debug: boolean
  arrival: boolean
  arrivalComplete: boolean
  activeAttendee: string | null
  sitting: string | null
  starOpen: string | null
  memoryOpen: number | null
  memoryAlbum: 'good-days' | 'throwbacks'
  compass: boolean
  set: (patch: Partial<RealmState>) => void
}

const useRealm = create<RealmState>((set) => ({
  entered: false,
  classic: false,
  selected: null,
  visited: [],
  firstPerson: false,
  pathwayOpen: false,
  paused: false,
  storyMode: true,
  storyRead: [],
  reader: null,
  bookOpen: false,
  debug: false,
  arrival: false,
  arrivalComplete: false,
  activeAttendee: null,
  sitting: null,
  starOpen: null,
  memoryOpen: null,
  memoryAlbum: 'good-days',
  compass: false,
  set: (patch) => set(patch),
}))

const playerPosition = new THREE.Vector3(0, 0, 11)
const chairPosition = (districtId: string) => {
  const index = Math.max(0, districts.findIndex((district) => district.id === districtId))
  return new THREE.Vector3(index % 2 ? 3.6 : -3.6, 0, -8 + Math.floor(index / 2) * 3.6)
}
const starPosition = (index: number) => new THREE.Vector3(8 + index * 3.2, 2.6 + (index % 2) * 2.2, -3 + index * 2.8)

const fogMood = (readCount: number) => {
  const progress = THREE.MathUtils.clamp(readCount / Math.max(story.length - 1, 1), 0, 1)
  return {
    tint: new THREE.Color('#8a8fa3').lerp(new THREE.Color('#667b90'), progress * 0.62),
    density: THREE.MathUtils.lerp(0.035, 0.022, progress),
    aurora: THREE.MathUtils.lerp(0.12, 0.72, progress),
  }
}

function FirstPersonHands({ visible }: { visible: boolean }) {
  const { camera } = useThree()
  const hands = useRef<THREE.Group>(null)
  useEffect(() => {
    if (hands.current) camera.add(hands.current)
    return () => { if (hands.current) camera.remove(hands.current) }
  }, [camera])
  return (
    <group ref={hands} visible={visible} position={[0, -0.75, -1.05]}>
      <mesh position={[-0.34, 0, 0]} rotation={[0.2, 0.1, -0.18]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color="#1c2435" roughness={0.75} /></mesh>
      <mesh position={[0.34, 0, 0]} rotation={[0.2, -0.1, 0.18]}><sphereGeometry args={[0.16, 10, 10]} /><meshStandardMaterial color="#1c2435" roughness={0.75} /></mesh>
      <mesh position={[0, 0.18, 0.08]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color="#73e6df" emissive="#73e6df" emissiveIntensity={7} /></mesh>
      <pointLight position={[0, 0.18, 0.15]} color="#73e6df" intensity={2.2} distance={3} />
    </group>
  )
}

function DebugCapsule({ position, visible }: { position: React.MutableRefObject<THREE.Vector3>; visible: boolean }) {
  const capsule = useRef<THREE.Mesh>(null)
  useFrame(() => { if (capsule.current) capsule.current.position.set(position.current.x, position.current.y + 1.05, position.current.z) })
  return <mesh ref={capsule} visible={visible}><capsuleGeometry args={[0.48, 1.55, 8, 16]} /><meshBasicMaterial color="#ff6d8e" wireframe transparent opacity={0.65} /></mesh>
}

function Fool({ moving, drifting, sitting, reaching, firstPerson, groupRef, bodyYaw, bank }: { moving: boolean; drifting: boolean; sitting: boolean; reaching: boolean; firstPerson: boolean; groupRef: React.RefObject<THREE.Group>; bodyYaw: React.MutableRefObject<number>; bank: React.MutableRefObject<THREE.Vector3> }) {
  const cloak = useRef<THREE.Group>(null)
  const halo = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Group>(null)
  const rightLeg = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!cloak.current) return
    const time = clock.getElapsedTime()
    cloak.current.rotation.z = Math.sin(time * (moving ? 5 : 1.4)) * (moving ? 0.05 : 0.015)
    cloak.current.position.y = Math.sin(time * (moving ? 7 : 1.8)) * (moving ? 0.035 : 0.012) + (drifting ? 0.35 : 0)
    if (halo.current) {
      halo.current.rotation.z = Math.sin(time * 0.8) * 0.035
      halo.current.rotation.y = Math.sin(time * 0.55) * 0.08
    }
    if (groupRef.current) groupRef.current.rotation.y = bodyYaw.current
    if (cloak.current) {
      cloak.current.rotation.x = drifting ? -0.12 : 0
      cloak.current.rotation.z += (bank.current.x * (drifting ? 0.22 : 0.06) - cloak.current.rotation.z) * 0.08
      cloak.current.scale.y = 1 + (drifting ? 0.08 : 0) + Math.min(bank.current.length() * 0.018, 0.08)
    }
    const stride = sitting ? 0 : moving ? Math.sin(time * 8) * 0.45 : Math.sin(time * 1.6) * 0.03
    if (leftArm.current) leftArm.current.rotation.x = stride
    if (rightArm.current) rightArm.current.rotation.x = reaching ? -0.95 : -stride
    if (leftLeg.current) leftLeg.current.rotation.x = -stride
    if (rightLeg.current) rightLeg.current.rotation.x = stride
  })
  return (
    <group ref={groupRef} visible={!firstPerson} scale={sitting ? [1, 0.72, 1] : [1, 1, 1]}>
      <group ref={cloak}>
        <group position={[0, 0.06, 0.16]}>
          <mesh position={[0, 1.52, 0.02]} scale={[0.62, 1.1, 0.34]} rotation-x={-0.04}>
            <cylinderGeometry args={[0.42, 0.52, 1.22, 10]} />
            <meshStandardMaterial color="#171c2b" roughness={0.88} />
          </mesh>
          <mesh position={[0, 1.82, 0.34]} scale={[0.68, 0.34, 0.2]} rotation-x={-0.18}>
            <sphereGeometry args={[0.58, 12, 8]} />
            <meshStandardMaterial color="#252c40" roughness={0.82} />
          </mesh>
          <mesh position={[0, 1.37, 0.4]} rotation-x={-0.06}>
            <boxGeometry args={[0.34, 0.82, 0.035]} />
            <meshStandardMaterial color="#0b101d" roughness={0.86} />
          </mesh>
          <mesh position={[0, 1.46, 0.43]} rotation-x={-0.06}>
            <boxGeometry args={[0.06, 0.88, 0.045]} />
            <meshStandardMaterial color="#c7954b" emissive="#6f421b" emissiveIntensity={1.6} roughness={0.62} />
          </mesh>
          <mesh position={[0, 1.08, 0.42]} rotation-x={-0.06}>
            <boxGeometry args={[0.7, 0.12, 0.08]} />
            <meshStandardMaterial color="#b78d5a" emissive="#6f421b" emissiveIntensity={1.2} roughness={0.66} />
          </mesh>
          <mesh position={[0, 1.09, 0.47]} rotation-x={-0.06}>
            <boxGeometry args={[0.42, 0.045, 0.035]} />
            <meshStandardMaterial color="#73e6df" emissive="#73e6df" emissiveIntensity={2.2} />
          </mesh>
        </group>
        <mesh position={[0, 1.25, -0.44]} rotation-x={0.16} scale={[1, 1, 0.38]}><coneGeometry args={[0.86, 2.55, 7]} /><meshStandardMaterial color="#111727" roughness={0.92} /></mesh>
        <mesh position={[0, 1.34, -0.68]} rotation-x={0.22} scale={[1, 1, 0.35]}><coneGeometry args={[0.98, 2.45, 7]} /><meshStandardMaterial color="#192133" roughness={0.9} /></mesh>
        <mesh position={[0, 1.48, -0.9]} rotation-x={0.28} scale={[1, 1, 0.3]}><coneGeometry args={[1.08, 2.25, 7]} /><meshStandardMaterial color="#0d1322" roughness={0.94} /></mesh>
        <mesh position={[0, 1.56, 0.03]} scale={[0.68, 1, 0.48]}><cylinderGeometry args={[0.42, 0.5, 1.18, 10]} /><meshStandardMaterial color="#151c2d" roughness={0.96} /></mesh>
        <mesh position={[0, 0.92, 0.02]} scale={[0.72, 0.35, 0.52]}><sphereGeometry args={[0.5, 10, 8]} /><meshStandardMaterial color="#101829" roughness={0.94} /></mesh>
        <mesh position={[0, 2.05, 0.08]}><cylinderGeometry args={[0.16, 0.18, 0.28, 10]} /><meshStandardMaterial color="#d1a58f" roughness={0.86} /></mesh>
        <mesh position={[0, 2.2, 0.16]} scale={[0.82, 1.04, 0.72]}><sphereGeometry args={[0.34, 14, 12]} /><meshStandardMaterial color="#d1a58f" roughness={0.82} /></mesh>
        <mesh position={[0, 2.19, 0.39]} scale={[0.7, 0.8, 0.12]}><sphereGeometry args={[0.34, 12, 8]} /><meshStandardMaterial color="#151a28" roughness={0.94} /></mesh>
        <mesh position={[0, 2.17, 0.42]} scale={[0.56, 0.7, 0.1]}><sphereGeometry args={[0.34, 12, 8]} /><meshStandardMaterial color="#080d18" roughness={0.98} /></mesh>
        <mesh position={[0, 2.22, 0.43]} rotation-z={-0.08} scale={[0.34, 0.08, 0.05]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#101522" /></mesh>
        <mesh position={[-0.13, 2.3, 0.47]} scale={[0.045, 0.028, 0.018]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#d3a25c" emissive="#d3a25c" emissiveIntensity={2.6} /></mesh>
        <mesh position={[0.13, 2.3, 0.47]} scale={[0.045, 0.028, 0.018]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#d3a25c" emissive="#d3a25c" emissiveIntensity={2.6} /></mesh>
        <mesh position={[0, 2.17, 0.5]} scale={[0.035, 0.09, 0.018]}><coneGeometry args={[1, 1, 6]} /><meshStandardMaterial color="#b77e73" roughness={0.7} /></mesh>
        <group position={[0, 2.27, -0.02]}>
          <mesh position={[-0.3, 0.04, 0]} rotation-z={-0.18} scale={[0.18, 0.58, 0.18]}><sphereGeometry args={[0.34, 10, 8]} /><meshStandardMaterial color="#101522" roughness={0.92} /></mesh>
          <mesh position={[0.3, 0.04, 0]} rotation-z={0.18} scale={[0.18, 0.58, 0.18]}><sphereGeometry args={[0.34, 10, 8]} /><meshStandardMaterial color="#101522" roughness={0.92} /></mesh>
          <mesh position={[-0.42, -0.1, -0.02]} rotation-z={-0.28} scale={[0.12, 0.66, 0.15]}><sphereGeometry args={[0.34, 10, 8]} /><meshStandardMaterial color="#0b101d" roughness={0.95} /></mesh>
          <mesh position={[0.42, -0.1, -0.02]} rotation-z={0.28} scale={[0.12, 0.66, 0.15]}><sphereGeometry args={[0.34, 10, 8]} /><meshStandardMaterial color="#0b101d" roughness={0.95} /></mesh>
        </group>
        <mesh position={[0, 2.52, 0.05]}><torusGeometry args={[0.56, 0.055, 8, 18]} /><meshStandardMaterial color="#202a42" roughness={0.88} /></mesh>
        <mesh position={[0, 2.58, 0.08]}><torusGeometry args={[0.58, 0.025, 6, 28]} /><meshStandardMaterial color="#c7954b" emissive="#6f421b" emissiveIntensity={2.4} /></mesh>
        <mesh position={[0, 2.78, -0.02]} scale={[0.66, 0.78, 0.66]}><coneGeometry args={[0.62, 1.02, 12]} /><meshStandardMaterial color="#080d18" roughness={0.98} /></mesh>
        <mesh position={[0, 2.74, 0.23]} rotation-x={-0.18} scale={[0.52, 0.06, 0.06]}><torusGeometry args={[0.7, 0.035, 6, 32, Math.PI]} /><meshStandardMaterial color="#d3a25c" emissive="#8a5b25" emissiveIntensity={2.2} /></mesh>
        <mesh position={[0, 2.65, -0.16]} scale={[0.74, 0.62, 0.32]}><sphereGeometry args={[0.42, 12, 8]} /><meshStandardMaterial color="#111727" roughness={0.92} /></mesh>
        <mesh position={[0, 2.74, 0.18]} rotation-x={-0.28} scale={[0.64, 0.18, 0.06]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#c7954b" emissive="#6f421b" emissiveIntensity={1.8} /></mesh>
        <group ref={leftLeg} position={[-0.27, 0.86, 0]}><mesh position-y={-0.34} rotation-z={0.04}><cylinderGeometry args={[0.14, 0.17, 0.7, 10]} /><meshStandardMaterial color="#161d2e" /></mesh><mesh position-y={-0.76} position-z={0.09} rotation-z={0.02}><boxGeometry args={[0.28, 0.18, 0.58]} /><meshStandardMaterial color="#080d18" /></mesh></group>
        <group ref={rightLeg} position={[0.27, 0.86, 0]}><mesh position-y={-0.34} rotation-z={-0.04}><cylinderGeometry args={[0.14, 0.17, 0.7, 10]} /><meshStandardMaterial color="#161d2e" /></mesh><mesh position-y={-0.76} position-z={0.09} rotation-z={-0.02}><boxGeometry args={[0.28, 0.18, 0.58]} /><meshStandardMaterial color="#080d18" /></mesh></group>
        <group ref={leftArm} position={[-0.55, 1.78, 0]}><mesh position-y={-0.22} rotation-z={0.12}><cylinderGeometry args={[0.14, 0.16, 0.52, 10]} /><meshStandardMaterial color="#121a2b" /></mesh><mesh position={[-0.06, -0.58, 0.02]} rotation-z={0.18}><cylinderGeometry args={[0.11, 0.13, 0.48, 10]} /><meshStandardMaterial color="#202a42" /></mesh><mesh position={[-0.1, -0.87, 0.04]}><sphereGeometry args={[0.14, 10, 8]} /><meshStandardMaterial color="#252d3e" /></mesh></group>
        <group ref={rightArm} position={[0.55, 1.78, 0]}><mesh position-y={-0.22} rotation-z={-0.12}><cylinderGeometry args={[0.14, 0.16, 0.52, 10]} /><meshStandardMaterial color="#121a2b" /></mesh><mesh position={[0.06, -0.58, 0.02]} rotation-z={-0.18}><cylinderGeometry args={[0.11, 0.13, 0.48, 10]} /><meshStandardMaterial color="#202a42" /></mesh><mesh position={[0.1, -0.87, 0.04]}><sphereGeometry args={[0.14, 10, 8]} /><meshStandardMaterial color="#252d3e" /></mesh></group>
        <mesh position={[0, 1.36, 0.58]}><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#eafcff" emissive="#73e6df" emissiveIntensity={9} roughness={0.2} /></mesh>
        <mesh position={[0, 1.36, 0.6]} rotation-y={Math.PI / 2}><torusGeometry args={[0.28, 0.025, 6, 28]} /><meshStandardMaterial color="#d3a25c" emissive="#8a5b25" emissiveIntensity={3} /></mesh>
        <mesh position={[0, 1.36, 0.61]} rotation-x={Math.PI / 2}><torusGeometry args={[0.28, 0.02, 6, 28]} /><meshStandardMaterial color="#73e6df" emissive="#73e6df" emissiveIntensity={3} /></mesh>
        <mesh position={[-0.48, 2.25, 0.03]} rotation-z={-0.18} scale={[0.8, 1.35, 0.32]}><sphereGeometry args={[0.34, 10, 8]} /><meshStandardMaterial color="#101829" roughness={0.94} /></mesh>
        <mesh position={[0.48, 2.25, 0.03]} rotation-z={0.18} scale={[0.8, 1.35, 0.32]}><sphereGeometry args={[0.34, 10, 8]} /><meshStandardMaterial color="#101829" roughness={0.94} /></mesh>
        <mesh position={[0, 2.53, 0.03]} rotation-z={Math.PI / 2}><torusGeometry args={[0.49, 0.025, 6, 28, Math.PI * 1.25]} /><meshStandardMaterial color="#d3a25c" emissive="#8a5b25" emissiveIntensity={2.8} /></mesh>
        <mesh position={[0, 2.59, 0.03]} rotation-z={Math.PI / 2}><torusGeometry args={[0.5, 0.018, 6, 28, Math.PI * 1.15]} /><meshStandardMaterial color="#73e6df" emissive="#73e6df" emissiveIntensity={2.4} /></mesh>
        <group ref={halo} position={[0, 2.14, -0.72]} rotation-x={0.06}>
          <mesh rotation-y={Math.PI / 2}><torusGeometry args={[0.82, 0.045, 8, 48, Math.PI * 1.55]} /><meshStandardMaterial color="#b78d5a" emissive="#8a5b25" emissiveIntensity={3.5} /></mesh>
          <mesh rotation-y={Math.PI / 2} rotation-z={Math.PI}><torusGeometry args={[0.82, 0.045, 8, 48, Math.PI * 1.45]} /><meshStandardMaterial color="#b78d5a" emissive="#8a5b25" emissiveIntensity={3.5} /></mesh>
          <mesh position={[0.79, 0.02, 0]} rotation-y={Math.PI / 2}><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial color="#d3a25c" emissive="#d3a25c" emissiveIntensity={5} /></mesh>
        </group>
        <pointLight position={[0, 1.35, 0.65]} color="#73e6df" intensity={3.2} distance={4.5} />
        <pointLight position={[0, 1.2, -0.5]} color="#d3a25c" intensity={1.2} distance={3} />
      </group>
    </group>
  )
}

type MotionState = {
  position: THREE.Vector3
  yaw: number
  speed: number
  drifting: boolean
  still: number
}

function FogWake({ motion }: { motion: React.MutableRefObject<MotionState> }) {
  const cone = useRef<THREE.Mesh>(null)
  const trail = useRef<THREE.Mesh>(null)
  const stillFog = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const state = motion.current
    if (cone.current) {
      cone.current.position.copy(state.position).add(new THREE.Vector3(0, 0.42, 0))
      cone.current.rotation.set(0, state.yaw, 0)
      cone.current.scale.set(0.7 + state.speed * 0.16, 0.65 + state.speed * 0.12, 1.15 + state.speed * 0.25)
      ;(cone.current.material as THREE.MeshBasicMaterial).opacity = 0.035 + Math.min(state.speed * 0.025, 0.06)
    }
    if (trail.current) {
      trail.current.position.copy(state.position).add(new THREE.Vector3(0, 0.18, 0))
      trail.current.rotation.y = state.yaw
      trail.current.rotation.z = Math.sin(clock.elapsedTime * 1.8) * 0.08
      trail.current.scale.set(0.75 + state.speed * 0.12, 0.75 + state.speed * 0.12, 1 + state.speed * 0.3)
      ;(trail.current.material as THREE.MeshBasicMaterial).opacity = 0.025 + (state.drifting ? 0.045 : 0.018)
    }
    if (stillFog.current) {
      stillFog.current.position.copy(state.position).add(new THREE.Vector3(0, 0.3, 0))
      const density = Math.min(state.still / 9, 1)
      stillFog.current.scale.setScalar(1 + density * 0.8)
      ;(stillFog.current.material as THREE.MeshBasicMaterial).opacity = density * 0.055
    }
  })
  return (
    <>
      <mesh ref={cone} rotation-x={Math.PI / 2}>
        <coneGeometry args={[0.8, 3.4, 20, 1, true]} />
        <meshBasicMaterial color="#d5d8e2" transparent opacity={0.05} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={trail} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.7, 0.08, 8, 24]} />
        <meshBasicMaterial color="#73e6df" transparent opacity={0.035} depthWrite={false} />
      </mesh>
      <mesh ref={stillFog}>
        <sphereGeometry args={[1.3, 16, 10]} />
        <meshBasicMaterial color="#aeb4c3" transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  )
}

function LandingMist({ pulse, position }: { pulse: React.MutableRefObject<number>; position: React.MutableRefObject<THREE.Vector3> }) {
  const mist = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    pulse.current = Math.max(0, pulse.current - delta * 1.8)
    if (!mist.current) return
    const value = pulse.current
    mist.current.position.set(position.current.x, 0.02, position.current.z)
    mist.current.scale.setScalar(1 + (1 - value) * 1.8)
    ;(mist.current.material as THREE.MeshBasicMaterial).opacity = value * 0.18
    mist.current.visible = value > 0
  })
  return <mesh ref={mist} rotation-x={-Math.PI / 2} visible={false}><ringGeometry args={[0.35, 0.95, 24]} /><meshBasicMaterial color="#d5d8e2" transparent depthWrite={false} /></mesh>
}

function ArrivalArchitecture({ active }: { active: boolean }) {
  const lights = useRef<(THREE.PointLight | null)[]>([])
  const glow = useRef<(THREE.Mesh | null)[]>([])
  const reveal = useRef(0)
  useFrame((_, delta) => {
    reveal.current = active ? Math.min(reveal.current + delta * 0.22, 1) : 0
    lights.current.forEach((light, index) => {
      if (light) light.intensity = active && reveal.current > index / 9 ? 0.85 : 0.06
    })
    glow.current.forEach((mesh, index) => {
      if (mesh) (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = active && reveal.current > index / 9 ? 2 : 0.2
    })
  })
  const opacity = active ? 1 : 0.18
  return (
    <group>
      <mesh position={[0, 0.02, 17]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[4.8, 24]} />
        <meshStandardMaterial color="#5f4630" metalness={0.75} roughness={0.52} transparent opacity={opacity} />
      </mesh>
      {[-2.2, 2.2].map((x) => <mesh key={x} position={[x, 0.42, 17]}><boxGeometry args={[0.18, 0.08, 24]} /><meshStandardMaterial color="#b78d5a" emissive="#6f421b" emissiveIntensity={1.4} transparent opacity={opacity} /></mesh>)}
      {[-1.4, 0, 1.4].map((x) => <mesh key={`step-${x}`} position={[x, 0.05, 10.9]}><boxGeometry args={[1.2, 0.18, 0.42]} /><meshStandardMaterial color="#75502e" metalness={0.7} roughness={0.48} transparent opacity={opacity} /></mesh>)}
      <group position={[0, 3.2, 21.5]}>
        <mesh position={[-3, 2, 0]}><boxGeometry args={[0.7, 4.8, 0.9]} /><meshStandardMaterial color="#171b2a" roughness={0.95} transparent opacity={opacity} /></mesh>
        <mesh position={[3, 2, 0]}><boxGeometry args={[0.7, 4.8, 0.9]} /><meshStandardMaterial color="#171b2a" roughness={0.95} transparent opacity={opacity} /></mesh>
        <mesh position-y={4.25}><boxGeometry args={[6.7, 0.72, 0.9]} /><meshStandardMaterial color="#171b2a" roughness={0.95} transparent opacity={opacity} /></mesh>
        <mesh position={[0, 4.05, -0.02]} rotation-y={Math.PI / 2}><torusGeometry args={[2.45, 0.22, 10, 32, Math.PI]} /><meshStandardMaterial color="#2b3042" emissive="#161d2f" emissiveIntensity={1.6} transparent opacity={opacity} /></mesh>
      </group>
      {[-2.3, 2.3].map((x) => <group key={`lantern-${x}`} position={[x, 1.2, 18]}><mesh position-y={0.7}><cylinderGeometry args={[0.06, 0.06, 1.4, 8]} /><meshStandardMaterial color="#24283a" transparent opacity={opacity} /></mesh><mesh position-y={1.45}><sphereGeometry args={[0.13, 10, 8]} /><meshStandardMaterial color="#d3a25c" emissive="#d3a25c" emissiveIntensity={active ? 2 : 0.3} transparent opacity={opacity} /></mesh><pointLight position={[0, 1.45, 0]} color="#d3a25c" intensity={active ? 1.1 : 0.12} distance={4} /></group>)}
      {Array.from({ length: 8 }, (_, index) => {
        const z = 20 - index * 2.2
        const x = index % 2 ? 2.35 : -2.35
        return <group key={`path-lantern-${index}`} position={[x, 0.9, z]}><mesh position-y={0.55}><cylinderGeometry args={[0.04, 0.05, 1.1, 8]} /><meshStandardMaterial color="#24283a" transparent opacity={opacity} /></mesh><mesh ref={(mesh) => { glow.current[index] = mesh }} position-y={1.12}><sphereGeometry args={[0.1, 8, 8]} /><meshStandardMaterial color="#d3a25c" emissive="#d3a25c" emissiveIntensity={0.2} transparent opacity={opacity} /></mesh><pointLight ref={(light) => { lights.current[index] = light }} position={[0, 1.12, 0]} color="#d3a25c" intensity={0.06} distance={3} /></group>
      })}
    </group>
  )
}

function FootprintTrail({ positions }: { positions: React.MutableRefObject<{ position: THREE.Vector3; born: number }[]> }) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(({ clock }) => refs.current.forEach((mesh, index) => {
    const item = positions.current[index]
    if (!mesh || !item) return
    mesh.position.copy(item.position)
    const opacity = Math.max(0, 1 - (clock.elapsedTime - item.born) / 4)
    ;(mesh.material as THREE.MeshBasicMaterial).opacity = opacity * 0.22
    mesh.visible = opacity > 0
  }))
  return <>{Array.from({ length: 10 }, (_, index) => <mesh key={index} ref={(mesh) => { refs.current[index] = mesh }} rotation-x={-Math.PI / 2}><circleGeometry args={[0.12, 10]} /><meshBasicMaterial color="#121725" transparent /></mesh>)}</>
}

function SpectralAttendee({ district, position, active, seated }: { district: District; position: [number, number, number]; active: boolean; seated: boolean }) {
  const head = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const world = new THREE.Vector3(position[0], position[1], position[2])
    const distance = playerPosition.distanceTo(world)
    const nearby = distance < 5
    const target = nearby ? Math.atan2(playerPosition.x - world.x, playerPosition.z - world.z) : 0
    if (head.current) head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, target, 0.035)
    if (body.current) {
      body.current.position.y = Math.sin(clock.elapsedTime * 1.2 + position[2]) * 0.025
      body.current.rotation.x = active ? -0.08 : 0
      body.current.scale.setScalar(active ? 1.04 : 1)
    }
  })
  return (
    <group position={position} rotation-y={position[0] > 0 ? Math.PI : 0}>
      <group ref={body} position-y={1.02}>
        <mesh scale={[0.7, 1.15, 0.48]}><coneGeometry args={[0.5, 1.5, 7]} /><meshStandardMaterial color="#1a2032" transparent opacity={0.78} emissive={district.color} emissiveIntensity={active ? 1.6 : 0.7} /></mesh>
        <mesh position-y={0.98} scale={[0.62, 0.8, 0.55]}><coneGeometry args={[0.42, 1, 8]} /><meshStandardMaterial color="#0b101d" transparent opacity={0.86} emissive={district.color} emissiveIntensity={active ? 1.8 : 0.65} /></mesh>
        <mesh position={[0, 0.28, 0.28]}><sphereGeometry args={[0.12, 10, 8]} /><meshStandardMaterial color={district.color} emissive={district.color} emissiveIntensity={active ? 7 : 2.5} transparent opacity={0.9} /></mesh>
        <pointLight position={[0, 0.28, 0.36]} color={district.color} intensity={active ? 1.5 : 0.45} distance={3} />
      </group>
      <group ref={head} position-y={2.25}>
        <mesh><sphereGeometry args={[0.28, 10, 8]} /><meshStandardMaterial color="#0b101d" transparent opacity={0.85} emissive={district.color} emissiveIntensity={active ? 1.8 : 0.7} /></mesh>
        <mesh position-y={0.3}><coneGeometry args={[0.42, 0.68, 8]} /><meshStandardMaterial color="#121a2b" transparent opacity={0.82} /></mesh>
        <mesh position={[0, 0.08, 0.3]}><torusGeometry args={[0.16, 0.025, 6, 16]} /><meshStandardMaterial color={district.color} emissive={district.color} emissiveIntensity={active ? 4 : 1.8} /></mesh>
      </group>
      <Float speed={0.4} floatIntensity={0.12}>
        <group position={[0, 3.08, 0]}>
          <mesh><octahedronGeometry args={[0.1, 0]} /><meshStandardMaterial color={district.color} emissive={district.color} emissiveIntensity={4} /></mesh>
          <mesh position-y={-0.18}><planeGeometry args={[0.72, 0.12]} /><meshBasicMaterial color={district.color} transparent opacity={0.55} /></mesh>
        </group>
      </Float>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}><circleGeometry args={[0.52, 16]} /><meshBasicMaterial color={district.color} transparent opacity={active ? 0.1 : 0.035} /></mesh>
      {seated && <pointLight position={[0, 1.5, -0.2]} color={district.color} intensity={0.7} distance={3} />}
    </group>
  )
}

function Chair({ position, rotation, district, onSelect }: { position: [number, number, number]; rotation: number; district: District; onSelect: (district: District) => void }) {
  return (
    <group position={position} rotation-y={rotation} onClick={(event) => { event.stopPropagation(); onSelect(district) }} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      <mesh position-y={0.9}><boxGeometry args={[1.3, 0.22, 1.25]} /><meshStandardMaterial color="#352a2b" roughness={0.74} metalness={0.35} /></mesh>
      <mesh position-y={2.05}><boxGeometry args={[1.05, 2.1, 0.22]} /><meshStandardMaterial color="#302a3b" roughness={0.78} metalness={0.25} /></mesh>
      <mesh position={[0, 1.8, 0.17]}><torusGeometry args={[0.28, 0.035, 8, 16]} /><meshStandardMaterial color={district.color} emissive={district.color} emissiveIntensity={3} /></mesh>
      <pointLight position={[0, 1.8, 0.25]} color={district.color} intensity={1.7} distance={4} />
    </group>
  )
}

function SpectralCouncil({ activeId, sittingId }: { activeId: string | null; sittingId: string | null }) {
  return <>{districts.slice(0, 10).map((district, index) => <SpectralAttendee key={district.id} district={district} position={[index % 2 ? 3.6 : -3.6, 0, -8 + Math.floor(index / 2) * 3.6]} active={activeId === district.id} seated={sittingId === district.id} />)}</>
}

function Star({ district, position }: { district: District; position: [number, number, number] }) {
  return (
    <Float speed={0.7} floatIntensity={0.7} rotationIntensity={0.2}>
      <group position={position}>
        <mesh><icosahedronGeometry args={[0.2, 1]} /><meshStandardMaterial color={district.color} emissive={district.color} emissiveIntensity={6} /></mesh>
        <mesh position-y={-1.1} rotation-x={-Math.PI / 2}><cylinderGeometry args={[0.85, 0.65, 0.16, 6]} /><meshStandardMaterial color="#31374a" roughness={0.9} /></mesh>
        <pointLight color={district.color} intensity={2.2} distance={6} />
      </group>
    </Float>
  )
}

function StarPath({ target, drifting }: { target: THREE.Vector3 | null; drifting: boolean }) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const bridgeRefs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => refs.current.forEach((stone, index) => {
    if (!stone || !target) return
    const t = (index + 1) / 9
    stone.position.set(THREE.MathUtils.lerp(playerPosition.x, target.x, t), 0.02 + Math.sin(index) * 0.025, THREE.MathUtils.lerp(playerPosition.z, target.z, t))
    const distance = stone.position.distanceTo(playerPosition)
    ;(stone.material as THREE.MeshStandardMaterial).emissiveIntensity = distance < 1.1 ? 4 : 0.6
    ;(stone.material as THREE.MeshStandardMaterial).opacity = distance < 0.5 ? 0.12 : 0.45
  }))
  useFrame(() => bridgeRefs.current.forEach((plank, index) => {
    if (!plank || !target) return
    const t = (index + 1) / 11
    plank.position.set(THREE.MathUtils.lerp(playerPosition.x, target.x, t), playerPosition.y - 0.05, THREE.MathUtils.lerp(playerPosition.z, target.z, t))
    plank.rotation.y = Math.atan2(target.x - playerPosition.x, target.z - playerPosition.z)
  }))
  return <>{Array.from({ length: 8 }, (_, index) => <mesh key={`stone-${index}`} ref={(mesh) => { refs.current[index] = mesh }} rotation-x={-Math.PI / 2}><circleGeometry args={[0.24, 6]} /><meshStandardMaterial color={drifting ? '#73e6df' : '#8d8792'} emissive={drifting ? '#73e6df' : '#b78d5a'} emissiveIntensity={0.6} transparent opacity={0.45} /></mesh>)}{Array.from({ length: 10 }, (_, index) => <mesh key={`bridge-${index}`} ref={(mesh) => { bridgeRefs.current[index] = mesh }} visible={drifting}><boxGeometry args={[0.85, 0.08, 0.3]} /><meshStandardMaterial color="#73e6df" emissive="#73e6df" emissiveIntensity={4} transparent opacity={0.5} /></mesh>)}</>
}

function StarDestination({ district, position, open, onOpen }: { district: District; position: [number, number, number]; open: boolean; onOpen: (district: District) => void }) {
  const platform = useRef<THREE.Mesh>(null)
  const label = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const world = new THREE.Vector3(...position)
    const distance = playerPosition.distanceTo(world)
    const near = distance < 5
    if (platform.current) {
      platform.current.scale.setScalar(1 + (near ? 0.08 : 0) + (open ? Math.sin(clock.elapsedTime * 3) * 0.04 : 0))
      ;(platform.current.material as THREE.MeshStandardMaterial).emissiveIntensity = near ? 2.4 : 0.7
    }
    if (label.current) label.current.visible = near
  })
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onOpen(district) }} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      <mesh ref={platform} position-y={-1.08}><cylinderGeometry args={[0.95, 0.72, 0.18, 7]} /><meshStandardMaterial color="#34384a" emissive={district.color} emissiveIntensity={0.7} roughness={0.9} /></mesh>
      <mesh><icosahedronGeometry args={[0.25, 1]} /><meshStandardMaterial color={district.color} emissive={district.color} emissiveIntensity={open ? 10 : 6} /></mesh>
      <pointLight color={district.color} intensity={open ? 4 : 2.2} distance={6} />
      <group ref={label}>
        <Text position={[0, 0.65, 0]} fontSize={0.3} color="#eee7d8" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#0b1020">{district.shortName}</Text>
      </group>
      <mesh position-y={-1.14} rotation-x={-Math.PI / 2}><ringGeometry args={[0.55, 0.64, 24]} /><meshBasicMaterial color={district.color} transparent opacity={0.22} /></mesh>
    </group>
  )
}

function LongTable() {
  return (
    <group position-y={1.2}>
      <mesh><boxGeometry args={[5.2, 0.3, 20]} /><meshStandardMaterial color="#30231f" roughness={0.62} metalness={0.68} /></mesh>
      <mesh position-y={0.18}><boxGeometry args={[4.7, 0.05, 19.5]} /><meshStandardMaterial color="#6e4a2d" emissive="#251711" emissiveIntensity={1.2} roughness={0.5} /></mesh>
      {[-9, -5, -1, 3, 7, 10].map((z) => <mesh key={z} position={[0, -0.75, z]}><boxGeometry args={[4.6, 1.5, 0.2]} /><meshStandardMaterial color="#211c29" roughness={0.9} /></mesh>)}
      <mesh position={[0, 0.35, -10.3]}><torusGeometry args={[1.1, 0.1, 10, 48]} /><meshStandardMaterial color="#b78d5a" emissive="#8a5b25" emissiveIntensity={3} /></mesh>
    </group>
  )
}

function Controller() {
  const { camera, gl } = useThree()
  const realm = useRealm()
  const keys = useRef<Record<string, boolean>>({})
  const position = useRef(new THREE.Vector3(0, 0, 11))
  const yaw = useRef(0)
  const pitch = useRef(-0.08)
  const locked = useRef(false)
  const avatar = useRef<THREE.Group>(null)
  const velocity = useRef(new THREE.Vector3())
  const bodyYaw = useRef(0)
  const driftHeight = useRef(0)
  const cameraPosition = useRef(new THREE.Vector3(0, 1.6, 15))
  const footprints = useRef<{ position: THREE.Vector3; born: number }[]>([])
  const lastFootprint = useRef(0)
  const lastStep = useRef(0)
  const audio = useRef<AudioContext | null>(null)
  const landingPulse = useRef(0)
  const previousDrifting = useRef(false)
  const arrivalTime = useRef(0)
  const arrivalWasActive = useRef(false)
  const motion = useRef<MotionState>({ position: position.current, yaw: 0, speed: 0, drifting: false, still: 0 })
  const [moving, setMoving] = useState(false)
  const [drifting, setDrifting] = useState(false)

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current[event.code] = true
      if (event.code === 'KeyV') realm.set({ firstPerson: !realm.firstPerson })
      if (event.code === 'Space' && !event.repeat) {
        if (realm.arrival) realm.set({ arrival: false, arrivalComplete: true })
        else { setDrifting((value) => !value); realm.set({ firstPerson: false }) }
      }
      if (event.code === 'KeyE') {
        if (realm.sitting) realm.set({ sitting: null, activeAttendee: null })
        else if (realm.starOpen) realm.set({ starOpen: null })
        else if (realm.activeAttendee) realm.set({ sitting: realm.activeAttendee })
        else {
          const nearest = districts.slice(0, 10).map((district, index) => ({ district, distance: playerPosition.distanceTo(chairPosition(district.id)) })).sort((a, b) => a.distance - b.distance)[0]
          const nearestStar = districts.slice(10).map((district, index) => ({ district, distance: playerPosition.distanceTo(starPosition(index)) })).sort((a, b) => a.distance - b.distance)[0]
          if (nearest && nearest.distance < 3.2) realm.set({ activeAttendee: nearest.district.id })
          else if (nearestStar && nearestStar.distance < 2.4) realm.set({ starOpen: nearestStar.district.id })
        }
      }
      if (event.code === 'KeyN') realm.set({ compass: !realm.compass })
      if (event.code === 'KeyH') realm.set({ debug: !realm.debug })
      if (event.code === 'Tab') { event.preventDefault(); realm.set({ pathwayOpen: !realm.pathwayOpen }) }
      if (event.code === 'Escape') {
        if (realm.sitting) realm.set({ sitting: null, activeAttendee: null })
        else realm.set({ paused: !realm.paused })
      }
    }
    const up = (event: KeyboardEvent) => {
      keys.current[event.code] = false
      if (event.code === 'Space') setDrifting(false)
    }
    const move = (event: MouseEvent) => {
      if (!locked.current) return
      yaw.current -= event.movementX * 0.0024
      pitch.current = THREE.MathUtils.clamp(pitch.current - event.movementY * 0.0024, -1.2, 1.2)
    }
    const lockChange = () => { locked.current = document.pointerLockElement === gl.domElement }
    const click = () => {
      gl.domElement.requestPointerLock()
      if (!audio.current) audio.current = new AudioContext()
      if (audio.current.state === 'suspended') void audio.current.resume()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('mousemove', move)
    document.addEventListener('pointerlockchange', lockChange)
    gl.domElement.addEventListener('click', click)
    return () => {
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('mousemove', move)
      document.removeEventListener('pointerlockchange', lockChange); gl.domElement.removeEventListener('click', click)
    }
  }, [gl.domElement, realm.firstPerson, realm.pathwayOpen, realm.paused, realm.selected, realm.visited])

  useFrame((_, delta) => {
    if (realm.arrival && !arrivalWasActive.current) {
      arrivalTime.current = 0
      arrivalWasActive.current = true
      position.current.set(0, 0, 22)
      velocity.current.set(0, 0, 0)
      bodyYaw.current = Math.PI
    }
    if (!realm.arrival && arrivalWasActive.current) {
      position.current.set(0, 0, 10.9)
      velocity.current.set(0, 0, 0)
      bodyYaw.current = Math.PI
      arrivalWasActive.current = false
    }
    if (realm.arrival) {
      arrivalTime.current += delta
      const walkTime = THREE.MathUtils.clamp((arrivalTime.current - 1.8) / 8.2, 0, 1)
      position.current.set(0, 0, THREE.MathUtils.lerp(22, 10.9, walkTime))
      bodyYaw.current = Math.PI
      const target = new THREE.Vector3(0, 1.45, position.current.z + 3.2)
      const arrivalCamera = arrivalTime.current < 1.8
        ? new THREE.Vector3(0, 3.2, 26)
        : target.clone().add(new THREE.Vector3(0, 1.25, 3.8))
      camera.position.lerp(arrivalCamera, 1 - Math.exp(-3.2 * delta))
      camera.lookAt(new THREE.Vector3(0, 1.4, position.current.z - 1))
      if (arrivalTime.current > 10.8) realm.set({ arrival: false, arrivalComplete: true })
      setMoving(walkTime > 0 && walkTime < 1)
      return
    }
    if (realm.sitting) {
      const seat = chairPosition(realm.sitting)
      position.current.lerp(new THREE.Vector3(seat.x, 0.62, seat.z + (seat.x > 0 ? 0.45 : -0.45)), 1 - Math.exp(-4 * delta))
      bodyYaw.current = seat.x > 0 ? Math.PI / 2 : -Math.PI / 2
      velocity.current.set(0, 0, 0)
      camera.position.lerp(new THREE.Vector3(position.current.x, 1.65, position.current.z + (seat.x > 0 ? 2.8 : -2.8)), 1 - Math.exp(-3.5 * delta))
      camera.lookAt(new THREE.Vector3(0, 1.45, 0))
      playerPosition.copy(position.current)
      setMoving(false)
      return
    }
    const input = new THREE.Vector3()
    if (keys.current.KeyW || keys.current.ArrowUp) input.z -= 1
    if (keys.current.KeyS || keys.current.ArrowDown) input.z += 1
    if (keys.current.KeyA || keys.current.ArrowLeft) input.x -= 1
    if (keys.current.KeyD || keys.current.ArrowRight) input.x += 1
    const isMoving = input.lengthSq() > 0
    const slow = keys.current.ShiftLeft || keys.current.ShiftRight
    const maxSpeed = drifting ? (slow ? 1.25 : 2.2) : (slow ? 0.85 : 1.8)
    if (isMoving) input.normalize()
    const forward = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current))
    const desired = new THREE.Vector3().addScaledVector(forward, -input.z).addScaledVector(right, input.x).multiplyScalar(maxSpeed)
    velocity.current.lerp(desired, 1 - Math.exp(-(isMoving ? 5.2 : 3.2) * delta))
    const candidate = position.current.clone().addScaledVector(velocity.current, delta)
    const slide = (x: number, z: number) => {
      const radius = 0.48
      if (x > -2.72 && x < 2.72 && z > -10.15 && z < 10.15) {
        const dx = Math.min(Math.abs(x + 2.72), Math.abs(2.72 - x))
        const dz = Math.min(Math.abs(z + 10.15), Math.abs(10.15 - z))
        if (dx < dz) x = x < 0 ? -2.72 - radius : 2.72 + radius
        else z = z < 0 ? -10.15 - radius : 10.15 + radius
      }
      for (let index = 0; index < 10; index += 1) {
        const chairX = index % 2 ? 3.6 : -3.6
        const chairZ = -8 + Math.floor(index / 2) * 3.6
        if (Math.abs(x - chairX) < 0.86 + radius && Math.abs(z - chairZ) < 0.82 + radius) {
          if (Math.abs(x - chairX) > Math.abs(z - chairZ)) x = chairX + (x < chairX ? -1 : 1) * (0.86 + radius)
          else z = chairZ + (z < chairZ ? -1 : 1) * (0.82 + radius)
        }
      }
      return { x, z }
    }
    const resolved = slide(candidate.x, candidate.z)
    position.current.x = resolved.x
    position.current.z = resolved.z
    if (drifting) {
      driftHeight.current = THREE.MathUtils.clamp(driftHeight.current + (keys.current.KeyE ? delta * 2 : 0) - (keys.current.KeyQ ? delta * 2 : 0), 0.18, 8)
      position.current.y = THREE.MathUtils.lerp(position.current.y, driftHeight.current, 1 - Math.exp(-4.5 * delta))
    } else {
      driftHeight.current = THREE.MathUtils.lerp(driftHeight.current, 0, 1 - Math.exp(-3.2 * delta))
      position.current.y = THREE.MathUtils.lerp(position.current.y, driftHeight.current, 1 - Math.exp(-4.5 * delta))
      if (previousDrifting.current && position.current.y < 0.12) landingPulse.current = 1
    }
    position.current.x = THREE.MathUtils.clamp(position.current.x, -20, 20)
    position.current.z = THREE.MathUtils.clamp(position.current.z, -20, 20)
    playerPosition.copy(position.current)
    if (Math.abs(position.current.x) > 19.2 || Math.abs(position.current.z) > 19.2) {
      const edgeYaw = Math.atan2(-position.current.x, -position.current.z)
      yaw.current = THREE.MathUtils.lerp(yaw.current, edgeYaw, 1 - Math.exp(-2.2 * delta))
      velocity.current.multiplyScalar(0.7)
    }
    const horizontalSpeed = Math.hypot(velocity.current.x, velocity.current.z)
    if (horizontalSpeed > 0.05) {
      const travelYaw = Math.atan2(velocity.current.x, velocity.current.z)
      bodyYaw.current = THREE.MathUtils.lerp(bodyYaw.current, travelYaw, 1 - Math.exp(-8 * delta))
    }
    if (avatar.current) avatar.current.position.copy(position.current)
    if (isMoving && !drifting && _.clock.elapsedTime - lastFootprint.current > (slow ? 0.38 : 0.28)) {
      footprints.current.unshift({ position: new THREE.Vector3(position.current.x, 0.015, position.current.z), born: _.clock.elapsedTime })
      footprints.current.splice(10)
      lastFootprint.current = _.clock.elapsedTime
    }
    if (isMoving && horizontalSpeed > 0.2 && _.clock.elapsedTime - lastStep.current > (slow ? 0.75 : 0.52) && audio.current) {
      const context = audio.current
      const now = context.currentTime
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const nearTable = Math.abs(position.current.x) < 3 && Math.abs(position.current.z) < 10.4
      oscillator.type = nearTable ? 'triangle' : 'sine'
      oscillator.frequency.setValueAtTime(nearTable ? (slow ? 88 : 118) : (slow ? 54 : 72), now)
      oscillator.frequency.exponentialRampToValueAtTime(nearTable ? 46 : 32, now + 0.16)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(nearTable ? 0.075 : 0.045, now + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + 0.22)
      lastStep.current = _.clock.elapsedTime
    }
    motion.current = { position: position.current, yaw: yaw.current, speed: horizontalSpeed, drifting, still: isMoving ? 0 : motion.current.still + delta }
    previousDrifting.current = drifting
    const target = new THREE.Vector3(position.current.x, position.current.y + 1.6, position.current.z)
    const look = new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ')
    const desiredCamera = realm.firstPerson
      ? target
      : target.clone().add(new THREE.Vector3(0, 1.35, 3.2).applyEuler(new THREE.Euler(0, yaw.current, 0)))
    desiredCamera.y = Math.max(desiredCamera.y, 0.45)
    if (desiredCamera.x > -2.95 && desiredCamera.x < 2.95 && desiredCamera.z > -10.35 && desiredCamera.z < 10.35) {
      desiredCamera.z = desiredCamera.z < position.current.z ? -10.45 : 10.45
    }
    for (let index = 0; index < 10; index += 1) {
      const chairX = index % 2 ? 3.6 : -3.6
      const chairZ = -8 + Math.floor(index / 2) * 3.6
      const offset = new THREE.Vector2(desiredCamera.x - chairX, desiredCamera.z - chairZ)
      const distance = offset.length()
      if (distance < 1.15) {
        const safe = offset.normalize().multiplyScalar(1.15)
        desiredCamera.x = chairX + safe.x
        desiredCamera.z = chairZ + safe.y
      }
    }
    cameraPosition.current.lerp(desiredCamera, 1 - Math.exp(-7 * delta))
    camera.position.copy(cameraPosition.current)
    if ('fov' in camera) {
      const perspective = camera as THREE.PerspectiveCamera
      perspective.fov = THREE.MathUtils.lerp(perspective.fov, 72 + Math.min(horizontalSpeed * 3.2, 6), 1 - Math.exp(-4 * delta))
      perspective.updateProjectionMatrix()
    }
    camera.quaternion.setFromEuler(look)
    setMoving(isMoving)
  })
  return (
    <>
      <Fool groupRef={avatar} moving={moving} drifting={drifting} sitting={Boolean(realm.sitting)} reaching={Boolean(realm.starOpen)} firstPerson={realm.firstPerson} bodyYaw={bodyYaw} bank={velocity} />
      <FirstPersonHands visible={realm.firstPerson} />
      <FootprintTrail positions={footprints} />
      <DebugCapsule position={position} visible={realm.debug} />
      <FogWake motion={motion} />
      <LandingMist pulse={landingPulse} position={position} />
    </>
  )
}

function MoodAtmosphere() {
  const realm = useRealm()
  const { scene } = useThree()
  const target = useRef(fogMood(0))
  const current = useRef(fogMood(0))
  useEffect(() => { target.current = fogMood(realm.storyRead.length) }, [realm.storyRead.length])
  useFrame((_, delta) => {
    current.current.density = THREE.MathUtils.lerp(current.current.density, target.current.density, 1 - Math.exp(-0.7 * delta))
    current.current.tint.lerp(target.current.tint, 1 - Math.exp(-0.7 * delta))
    const fog = scene.fog
    if (fog instanceof THREE.FogExp2) {
      fog.color.copy(current.current.tint)
      fog.density = current.current.density
    }
  })
  return null
}

function GroundMist() {
  const mist = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!mist.current) return
    const material = mist.current.material as THREE.ShaderMaterial
    material.uniforms.uTime.value = clock.elapsedTime
  })
  return (
    <mesh ref={mist} rotation-x={-Math.PI / 2} position-y={0.04}>
      <planeGeometry args={[62, 62, 64, 64]} />
      <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={{ uTime: { value: 0 }, uColor: { value: new THREE.Color('#aeb5c5') } }} vertexShader={`
        uniform float uTime;
        varying float vNoise;
        void main() {
          vec3 p = position;
          float wave = sin(p.x * 0.18 + uTime * 0.18) * 0.22 + cos(p.y * 0.24 - uTime * 0.13) * 0.16;
          p.z += wave;
          vNoise = 0.5 + 0.5 * sin(p.x * 0.31 + p.y * 0.17 + uTime * 0.25);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `} fragmentShader={`
        uniform vec3 uColor;
        varying float vNoise;
        void main() {
          float edge = smoothstep(1.0, 0.08, length(gl_PointCoord - 0.5));
          gl_FragColor = vec4(uColor, (0.055 + vNoise * 0.07) * edge);
        }
      `} />
    </mesh>
  )
}

function DriftingBanks() {
  const banks = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!banks.current) return
    banks.current.rotation.y = clock.elapsedTime * 0.012
    banks.current.children.forEach((child, index) => {
      child.position.y += Math.sin(clock.elapsedTime * 0.35 + index) * 0.0007
      child.rotation.z = Math.sin(clock.elapsedTime * 0.18 + index * 1.4) * 0.04
    })
  })
  return (
    <group ref={banks}>
      {[
        [-10, 1.2, -4, 7, 1.2, 1.4],
        [9, 1.9, -8, 8, 1.4, 1.8],
        [12, 1.4, 8, 6, 1, 1.3],
        [-11, 2.4, 10, 9, 1.3, 1.5],
      ].map(([x, y, z, sx, sy, sz], index) => (
        <mesh key={index} position={[x, y, z]} scale={[sx, sy, sz]}>
          <sphereGeometry args={[1, 24, 12]} />
          <meshBasicMaterial color="#aeb4c3" transparent opacity={0.09} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function CeilingSky({ aurora }: { aurora: number }) {
  const moon = useRef<THREE.Mesh>(null)
  const auroraRefs = useRef<THREE.Mesh[]>([])
  const auroraTarget = useRef(aurora)
  const auroraCurrent = useRef(aurora)
  useEffect(() => { auroraTarget.current = aurora }, [aurora])
  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    auroraCurrent.current = THREE.MathUtils.lerp(auroraCurrent.current, auroraTarget.current, 1 - Math.exp(-0.55 * 0.016))
    if (moon.current) {
      moon.current.position.x = -9 + Math.sin(time * 0.015) * 0.7
      ;(moon.current.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(time * 0.2) * 0.025
    }
    auroraRefs.current.forEach((mesh, index) => {
      if (!mesh) return
      mesh.rotation.z = Math.sin(time * 0.06 + index) * 0.12
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = auroraCurrent.current * (0.45 + Math.sin(time * 0.24 + index) * 0.08)
    })
  })
  return (
    <group>
      <mesh ref={moon} position={[-9, 15, -12]}>
        <sphereGeometry args={[2.1, 32, 16]} />
        <meshBasicMaterial color="#d9d4c7" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {Array.from({ length: 4 }, (_, index) => (
        <mesh key={index} ref={(mesh) => { if (mesh) auroraRefs.current[index] = mesh }} position={[-2 + index * 3, 10 + index * 0.55, -12]} rotation-z={index * 0.2}>
          <torusGeometry args={[3.5 + index * 0.65, 0.025, 8, 80, Math.PI * 1.2]} />
          <meshBasicMaterial color={index % 2 ? '#73e6df' : '#9e9ee9'} transparent opacity={0.25} depthWrite={false} />
        </mesh>
      ))}
      <Sparkles count={180} scale={[42, 4, 42]} position={[0, 13, 0]} size={2.2} speed={0.12} color="#e8e1d2" opacity={0.36} />
    </group>
  )
}

function DistantSilhouettes() {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.children.forEach((child, index) => {
      const fade = 0.16 + (Math.sin(clock.elapsedTime * 0.12 + index * 1.7) + 1) * 0.09
      child.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const material = object.material as THREE.MeshBasicMaterial
          material.opacity = fade
        }
      })
    })
  })
  const material = <meshBasicMaterial color="#20263a" wireframe transparent opacity={0.2} depthWrite={false} />
  return (
    <group ref={group}>
      <group position={[-16, 3.4, -15]}>{material}<torusGeometry args={[3.2, 0.18, 8, 20, Math.PI]} /></group>
      <group position={[15, 4.2, -18]} rotation-z={0.2}>{material}<coneGeometry args={[1.8, 7, 4]} /></group>
      <group position={[-17, 1.2, 12]} rotation-z={-0.18}>{material}<boxGeometry args={[5, 0.18, 0.8]} /></group>
      <group position={[16, 2.8, 13]} rotation-z={0.3}>{material}<boxGeometry args={[2.8, 2.2, 1.8]} /></group>
    </group>
  )
}

function FogTendrils() {
  const strands = useRef<THREE.Mesh[]>([])
  useFrame(({ clock }) => {
    const targets = [
      chairPosition('foundry'),
      chairPosition('academy'),
      starPosition(0),
    ]
    strands.current.forEach((strand, index) => {
      if (!strand) return
      const target = targets[index]
      const distance = playerPosition.distanceTo(target)
      const near = THREE.MathUtils.clamp(1 - distance / 5.2, 0, 1)
      const material = strand.material as THREE.MeshBasicMaterial
      material.opacity = near * (0.12 + Math.sin(clock.elapsedTime * 2.1 + index) * 0.035)
      strand.position.copy(playerPosition).lerp(target, 0.54)
      strand.position.y = Math.max(0.35, playerPosition.y + 0.65 + Math.sin(clock.elapsedTime * 1.5 + index) * 0.18)
      strand.scale.set(0.12 + near * 0.25, 0.12 + near * 0.25, 0.7 + near * 1.8)
      strand.lookAt(target.x, target.y + 0.7, target.z)
    })
  })
  return (
    <group>
      {Array.from({ length: 3 }, (_, index) => (
        <mesh key={index} ref={(mesh) => { if (mesh) strands.current[index] = mesh }} visible>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color={index === 2 ? '#73e6df' : '#b7bac7'} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function AmbientSound() {
  const realm = useRealm()
  const audio = useRef<AudioContext | null>(null)
  const master = useRef<GainNode | null>(null)
  const choir = useRef<GainNode | null>(null)
  const bellTimer = useRef<number | null>(null)
  useEffect(() => {
    const start = () => {
      if (audio.current) return
      const context = new AudioContext()
      const output = context.createGain()
      output.gain.value = 0.055
      output.connect(context.destination)
      const wind = context.createBufferSource()
      const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
      const data = buffer.getChannelData(0)
      for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * 0.32
      wind.buffer = buffer
      wind.loop = true
      const windFilter = context.createBiquadFilter()
      windFilter.type = 'lowpass'
      windFilter.frequency.value = 420
      wind.connect(windFilter).connect(output)
      wind.start()
      const pad = context.createOscillator()
      const padGain = context.createGain()
      pad.type = 'sine'
      pad.frequency.value = 147
      padGain.gain.value = 0.0001
      pad.connect(padGain).connect(output)
      pad.start()
      audio.current = context
      master.current = output
      choir.current = padGain
      bellTimer.current = window.setInterval(() => {
        const bell = context.createOscillator()
        const bellGain = context.createGain()
        bell.type = 'sine'
        bell.frequency.setValueAtTime(220, context.currentTime)
        bell.frequency.exponentialRampToValueAtTime(110, context.currentTime + 1.4)
        bellGain.gain.setValueAtTime(0.0001, context.currentTime)
        bellGain.gain.exponentialRampToValueAtTime(0.018, context.currentTime + 0.02)
        bellGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.5)
        bell.connect(bellGain).connect(output)
        bell.start()
        bell.stop(context.currentTime + 1.55)
      }, 24000)
    }
    window.addEventListener('pointerdown', start, { once: true })
    return () => {
      window.removeEventListener('pointerdown', start)
      if (bellTimer.current) window.clearInterval(bellTimer.current)
      if (audio.current) void audio.current.close()
    }
  }, [])
  useEffect(() => {
    if (!audio.current || !master.current || !choir.current) return
    const now = audio.current.currentTime
    const sealAwake = realm.storyRead.length >= 2
    master.current.gain.setTargetAtTime(0.045 + realm.storyRead.length * 0.004, now, 1.5)
    choir.current.gain.setTargetAtTime(sealAwake ? 0.035 : 0.0001, now, 2.2)
  }, [realm.storyRead.length])
  return null
}

function StoryThread() {
  const points = story.map((_, index) => {
    const angle = -Math.PI / 2 + (index / story.length) * Math.PI * 2
    return [Math.cos(angle) * 10, 2.4 + (index % 2) * 0.6, Math.sin(angle) * 10] as [number, number, number]
  })
  return (
    <>
      <Line points={[...points, points[0]]} color="#7f8999" transparent opacity={0.28} lineWidth={1} />
      {points.map((position, index) => (
        <Float key={story[index].id} speed={0.45} floatIntensity={0.25}>
          <group position={position}>
            <mesh>
              <icosahedronGeometry args={[0.3, 1]} />
              <meshStandardMaterial color="#b78d5a" emissive="#b78d5a" emissiveIntensity={2.2} />
            </mesh>
            <pointLight color="#b78d5a" intensity={1.2} distance={3} />
          </group>
        </Float>
      ))}
    </>
  )
}

const albumImages = Array.from({ length: 14 }, (_, index) => `/album/good-day-${String(index + 1).padStart(2, '0')}.jpg`)
const throwbackImages = Array.from({ length: 41 }, (_, index) => `/throwbacks/throwback-${String(index + 1).padStart(2, '0')}.jpg`)

function memoryPosition(index: number): [number, number, number] {
  const positions: [number, number, number][] = [
    [-4.8, 2.25, 8.2],
    [4.8, 2.25, 8.2],
    [-4.9, 2.45, 4.5],
    [4.9, 2.45, 4.5],
    [-5.1, 2.65, -2.8],
    [5.1, 2.65, -2.8],
    [-5.1, 2.65, -6.4],
    [5.1, 2.65, -6.4],
    [0, 3.2, -9.5],
    [-8.2, 3.2, -3.2],
    [8.2, 3.2, -3.2],
    [-8.2, 3.2, -9.2],
    [8.2, 3.2, -9.2],
    [0, 4.1, -14],
  ]
  return positions[index]
}

function memoryRotation(index: number): number {
  const [x, , z] = memoryPosition(index)
  return Math.atan2(-x, -z)
}

function throwbackPosition(index: number): [number, number, number] {
  const lane = index % 4
  const row = Math.floor(index / 4)
  const side = lane % 2 === 0 ? -1 : 1
  const depth = 11 - row * 2.45
  const spread = lane < 2 ? 7.3 : 10.1
  return [side * spread, 2.25 + (lane % 2) * 0.24, depth]
}

function throwbackRotation(index: number): number {
  const [x, , z] = throwbackPosition(index)
  return Math.atan2(-x, -z)
}

function MemoryGallery({ onOpen }: { onOpen: (index: number) => void }) {
  const textures = useLoader(THREE.TextureLoader, albumImages)
  return (
    <group>
      <Float speed={0.28} floatIntensity={0.12}>
        <group position={[0, 4.1, -14]}>
          <mesh rotation-y={Math.PI}>
            <torusGeometry args={[2.2, 0.035, 8, 64]} />
            <meshStandardMaterial color="#b78d5a" emissive="#80521f" emissiveIntensity={2.2} />
          </mesh>
          <Text position={[0, 0, 0.08]} rotation-y={Math.PI} fontSize={0.32} color="#e8e1d2" anchorX="center" anchorY="middle">
            GOOD DAYS
          </Text>
          <Text position={[0, -0.5, 0.08]} rotation-y={Math.PI} fontSize={0.13} color="#73e6df" anchorX="center" anchorY="middle">
            MEMORY RELIQUARY
          </Text>
        </group>
      </Float>
      {textures.map((texture, index) => {
        const [x, y, z] = memoryPosition(index)
        const landscape = index >= 9
        const width = landscape ? 2.05 : 1.48
        const height = landscape ? 1.16 : 1.98
        return (
          <group key={albumImages[index]} position={[x, y, z]} rotation={[0, memoryRotation(index), 0]} onClick={(event) => { event.stopPropagation(); onOpen(index) }}>
            <mesh position={[0, 0, -0.06]}>
              <planeGeometry args={[width + 0.18, height + 0.18]} />
              <meshStandardMaterial color="#b78d5a" metalness={0.72} roughness={0.32} emissive="#4c321b" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[width, height]} />
              <meshBasicMaterial map={texture} toneMapped={false} />
            </mesh>
            <mesh position={[0, -height / 2 - 0.18, 0.04]}>
              <boxGeometry args={[width * 0.72, 0.035, 0.025]} />
              <meshStandardMaterial color="#73e6df" emissive="#73e6df" emissiveIntensity={2.4} />
            </mesh>
            <pointLight position={[0, 0, 0.2]} color="#d3a25c" intensity={0.28} distance={3.5} />
          </group>
        )
      })}
    </group>
  )
}

function ThrowbackGallery({ onOpen }: { onOpen: (index: number) => void }) {
  const textures = useLoader(THREE.TextureLoader, throwbackImages)
  return (
    <group>
      <group position={[0, 3.9, 12.8]}>
        <mesh rotation-y={Math.PI}>
          <torusGeometry args={[1.5, 0.03, 8, 48]} />
          <meshStandardMaterial color="#6f7d90" emissive="#34475c" emissiveIntensity={2} />
        </mesh>
        <Text position={[0, 0, 0.08]} rotation-y={Math.PI} fontSize={0.25} color="#d3d5dc" anchorX="center" anchorY="middle">
          THROWBACK ARCHIVE
        </Text>
        <Text position={[0, -0.38, 0.08]} rotation-y={Math.PI} fontSize={0.11} color="#73e6df" anchorX="center" anchorY="middle">
          BEFORE THE FOG
        </Text>
      </group>
      {textures.map((texture, index) => {
        const [x, y, z] = throwbackPosition(index)
        const landscape = index === 0 || index === 10 || index === 17 || index === 18 || index === 19 || index === 21
        const width = landscape ? 1.5 : 1.08
        const height = landscape ? 0.86 : 1.44
        return (
          <group key={throwbackImages[index]} position={[x, y, z]} rotation={[0, throwbackRotation(index), 0]} onClick={(event) => { event.stopPropagation(); onOpen(index) }}>
            <mesh position={[0, 0, -0.05]}>
              <planeGeometry args={[width + 0.14, height + 0.14]} />
              <meshStandardMaterial color="#68768b" metalness={0.62} roughness={0.4} emissive="#27384c" emissiveIntensity={0.7} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[width, height]} />
              <meshBasicMaterial map={texture} toneMapped={false} />
            </mesh>
            <mesh position={[0, -height / 2 - 0.14, 0.04]}>
              <boxGeometry args={[width * 0.65, 0.025, 0.02]} />
              <meshStandardMaterial color="#73e6df" emissive="#73e6df" emissiveIntensity={1.8} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function Scene({ onChairSelect, onStarSelect }: { onChairSelect: (district: District) => void; onStarSelect: (district: District) => void }) {
  const realm = useRealm()
  const chairs = districts.slice(0, 10).map((district, index) => ({
    district,
    position: [index % 2 ? 3.6 : -3.6, 0, -8 + Math.floor(index / 2) * 3.6] as [number, number, number],
    rotation: index % 2 ? Math.PI / 2 : -Math.PI / 2,
  }))
  const stars = districts.slice(10).map((district, index) => ({ district, position: [starPosition(index).x, starPosition(index).y, starPosition(index).z] as [number, number, number] }))
  const unreadStar = stars.filter(({ district }) => !realm.storyRead.includes(district.id)).sort((a, b) => playerPosition.distanceTo(new THREE.Vector3(...a.position)) - playerPosition.distanceTo(new THREE.Vector3(...b.position)))[0]
  return (
    <div className="scene" aria-hidden="true">
      <Canvas camera={{ position: [0, 1.6, 15], fov: 72 }} dpr={[1, 1.5]}>
        <color attach="background" args={['#8a8fa3']} />
        <fogExp2 attach="fog" args={['#8a8fa3', 0.035]} />
        <MoodAtmosphere />
        <GroundMist />
        <DriftingBanks />
        <CeilingSky aurora={fogMood(realm.storyRead.length).aurora} />
        <DistantSilhouettes />
        <FogTendrils />
        <AmbientSound />
        <ambientLight intensity={0.5} color="#c4c6d1" />
        <hemisphereLight intensity={0.42} color="#d5d6dd" groundColor="#14172a" />
        <pointLight position={[0, 5, 3]} intensity={18} distance={16} color="#73e6df" />
        <mesh rotation-x={-Math.PI / 2} position-y={-0.18}><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#555b70" roughness={1} /></mesh>
        <ArrivalArchitecture active={realm.arrival} />
        <LongTable />
        {chairs.map((item) => <Chair key={item.district.id} {...item} onSelect={onChairSelect} />)}
        <SpectralCouncil activeId={realm.activeAttendee} sittingId={realm.sitting} />
        <StarPath target={unreadStar ? new THREE.Vector3(...unreadStar.position) : null} drifting={playerPosition.y > 0.3} />
        {stars.map((item) => <StarDestination key={`destination-${item.district.id}`} {...item} open={realm.starOpen === item.district.id} onOpen={onStarSelect} />)}
        {stars.map((item) => {
          const linked = story.find((node) => node.linkedStars.includes(item.district.id))
          return linked?.linkedChairs.map((chairId) => <Line key={`${item.district.id}-${chairId}`} points={[[item.position[0], item.position[1], item.position[2]], [chairPosition(chairId).x, 0.9, chairPosition(chairId).z]]} color={item.district.color} transparent opacity={realm.starOpen === item.district.id ? 0.72 : 0.2} lineWidth={1} dashed dashScale={2} dashSize={0.3} gapSize={0.2} />)
        })}
        <CompassWisp target={unreadStar ? new THREE.Vector3(...unreadStar.position) : null} visible={realm.compass} />
        <StoryThread />
        <MemoryGallery onOpen={(index) => realm.set({ memoryOpen: index, memoryAlbum: 'good-days' })} />
        <ThrowbackGallery onOpen={(index) => realm.set({ memoryOpen: index, memoryAlbum: 'throwbacks' })} />
        <Float speed={0.3} rotationIntensity={0.15} floatIntensity={0.5}>
          <mesh position={[0, 5.2, -10.5]}><torusKnotGeometry args={[1.3, 0.14, 128, 16, 2, 3]} /><meshStandardMaterial color="#b78d5a" emissive="#80521f" emissiveIntensity={3} metalness={0.75} roughness={0.2} /></mesh>
        </Float>
        <Sparkles count={220} scale={[42, 7, 42]} position={[0, 3.2, 0]} size={2.3} speed={0.08} color="#e2e4ed" opacity={0.32} />
        <Controller />
        <EffectComposer><Bloom luminanceThreshold={0.6} intensity={1.9} mipmapBlur /><Vignette eskil={false} offset={0.1} darkness={0.84} /></EffectComposer>
      </Canvas>
      <div className="mist mist-a" /><div className="mist mist-b" />
    </div>
  )
}

function playArrivalBell() {
  const context = new AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(164.8, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(82.4, context.currentTime + 1.8)
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.13, context.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 2.2)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 2.25)
  window.setTimeout(() => void context.close(), 2500)
}

function ArrivalOverlay({ onSkip }: { onSkip: () => void }) {
  const [visibleText, setVisibleText] = useState('')
  const copy = 'Beyond the last road there is a place where the fog keeps every unfinished thing. You are the Fool. Walk the table.'
  useEffect(() => {
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setVisibleText(copy.slice(0, index))
      if (index >= copy.length) window.clearInterval(timer)
    }, 34)
    return () => window.clearInterval(timer)
  }, [])
  return <motion.div className="arrival-overlay" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="arrival-subtitle">{visibleText}<span className="type-cursor">▌</span></div><button className="arrival-skip" onClick={onSkip}>Skip arrival <b>Space</b></button></motion.div>
}

function CouncilInteraction({ district, sitting, onTake, onReturn }: { district: District; sitting: boolean; onTake: () => void; onReturn: () => void }) {
  return <motion.aside className="council-interaction" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }}><p className="eyebrow">The council speaks</p><h2>{district.name}</h2><p className="council-subtitle">{district.guide[0] ?? district.question}</p><p className="council-copy">{district.did}</p><div className="council-actions">{!sitting && <button className="primary-button" onClick={onTake}>Take this chair</button>}<button className="secondary-button" onClick={onReturn}>{sitting ? 'Stand up' : 'Return'}</button></div>{sitting && <small className="council-hint">Press E or Esc to stand</small>}</motion.aside>
}

function StarPanel({ district, onClose }: { district: District; onClose: () => void }) {
  const linked = story.find((node) => node.linkedStars.includes(district.id))
  const copy = linked?.paragraphs[0] ?? district.did
  return <motion.aside className="star-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }}><button className="panel-close" onClick={onClose}>Close ×</button><p className="eyebrow">A star in the fog</p><h2>{district.name}</h2><p className="star-copy">{copy}</p><div className="star-waveform">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ height: `${18 + Math.abs(Math.sin(index * 1.7)) * 38}%` }} />)}</div><button className="primary-button" onClick={onClose}>Let the star return</button></motion.aside>
}

function MemoryPanel({ index, album, onClose }: { index: number; album: 'good-days' | 'throwbacks'; onClose: () => void }) {
  const images = album === 'good-days' ? albumImages : throwbackImages
  const title = album === 'good-days' ? 'Good days' : 'Throwback archive'
  return (
    <motion.aside className="memory-panel" initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 18 }}>
      <button className="panel-close" onClick={onClose}>Close ×</button>
      <p className="eyebrow">{title} · memory reliquary</p>
      <div className="memory-image-wrap"><img src={images[index]} alt={`${title} memory ${index + 1}`} /></div>
      <p className="memory-caption">A photograph held by the fog, returned to the table as part of the journey.</p>
      <div className="memory-controls">
        <button className="secondary-button" onClick={() => onClose()}>Return to the fog</button>
        <span>{index + 1} of {images.length}</span>
      </div>
    </motion.aside>
  )
}

function CompassWisp({ target, visible }: { target: THREE.Vector3 | null; visible: boolean }) {
  const wisp = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!wisp.current || !target) return
    const direction = target.clone().sub(playerPosition).normalize()
    wisp.current.position.copy(playerPosition).add(direction.multiplyScalar(2.2)).add(new THREE.Vector3(0, 1.2 + Math.sin(clock.elapsedTime * 2) * 0.12, 0))
    wisp.current.lookAt(target.x, target.y, target.z)
  })
  return <group ref={wisp} visible={visible}><mesh><sphereGeometry args={[0.1, 10, 8]} /><meshStandardMaterial color="#d3a25c" emissive="#73e6df" emissiveIntensity={8} /></mesh><pointLight color="#73e6df" intensity={2} distance={4} /></group>
}

function App() {
  const realm = useRealm()
  const [query, setQuery] = useState('')
  const [asked, setAsked] = useState(false)
  const [askOpen, setAskOpen] = useState(false)
  const selected = districts.find((district) => district.id === realm.selected)
  const results = query.trim() ? districts.filter((district) => `${district.name} ${district.did} ${district.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())).slice(0, 3) : []
  const rank = ranks[Math.min(ranks.length - 1, Math.floor(realm.visited.length / 2))]
  const enter = (storyMode: boolean) => {
    playArrivalBell()
    realm.set({ entered: true, arrival: true, arrivalComplete: false, storyMode, reader: null })
  }
  const openDistrict = (district: District) => realm.set({ selected: district.id, visited: realm.visited.includes(district.id) ? realm.visited : [...realm.visited, district.id] })
  const openStory = (node: StoryNode) => realm.set({ reader: node.id, storyRead: realm.storyRead.includes(node.id) ? realm.storyRead : [...realm.storyRead, node.id] })

  if (realm.classic) return <ClassicView onBack={() => realm.set({ classic: false })} />
  return (
    <main className="app-shell">
      <Scene onChairSelect={openDistrict} onStarSelect={(district) => realm.set({ starOpen: district.id, storyRead: realm.storyRead.includes(district.id) ? realm.storyRead : [...realm.storyRead, district.id] })} />
      <div className="grain" />
      <header className="topbar">
        <button className="wordmark" onClick={() => realm.set({ entered: false, selected: null })}><span className="wordmark-mark">◌</span><span>Project Ouroboros</span></button>
        <div className="top-actions"><button className="quiet-button" onClick={() => realm.set({ classic: true })}>Classic View</button></div>
      </header>
      <AnimatePresence mode="wait">
        {!realm.entered ? (
          <motion.section className="entrance" key="entrance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="entrance-copy"><p className="eyebrow">The Grey Concourse · A portfolio realm</p><h1>Project Ouroboros:<br /><em>The Story of Hridyansh Sandilya.</em></h1><p className="legend">{legend}</p><p className="seal-line">Experience. Disruption. Reflection. Rebuilding.</p><div className="entrance-actions"><button className="primary-button" onClick={() => enter(true)}>Step into the Fog <span>↗</span></button><button className="secondary-button" onClick={() => enter(false)}>Explore freely</button><button className="secondary-button" onClick={() => realm.set({ classic: true })}>Classic View</button></div></div>
          </motion.section>
        ) : (
          <motion.section className="walk-hud" key="walk" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="hud-title"><span>THE FOOL · {rank}</span><small>{realm.firstPerson ? 'First person' : 'Over the shoulder'} · V to toggle</small></div>
            <aside className="walk-rail">
              <div className="rail-block"><span className="eyebrow">The Lamplighter</span><p>{selected?.guide[0] ?? 'The council has been waiting.'}</p><small>Subtitles on · guide nearby</small></div>
              <div className="rail-block"><span className="eyebrow">Wayfarer tools</span><button onClick={() => realm.set({ pathwayOpen: true })}>Pathway constellation <b>Tab</b></button><button onClick={() => realm.set({ bookOpen: true })}>Book of the Loop <b>Read</b></button><button onClick={() => realm.set({ paused: true })}>Pause menu <b>Esc</b></button><button onClick={() => realm.set({ classic: true })}>Classic View</button></div>
            </aside>
            <div className="crosshair">+</div>
            <div className="walk-controls">Click the fog to look · WASD walk · Shift slow · Space drift · Q / E rise · E read · H debug</div>
            <div className="hud-actions"><button className="quiet-button" onClick={() => realm.set({ pathwayOpen: true })}>Pathways</button><button className={`quiet-button ${askOpen ? 'active' : ''}`} onClick={() => setAskOpen((open) => !open)}>Ask the fog</button></div>
            <section className="walk-options" aria-label="Portfolio options"><div className="options-heading"><span>Chairs in the fog</span><small>Choose a story to approach</small></div><div className="option-strip">{districts.slice(0, 10).map((district) => <button key={district.id} onClick={() => openDistrict(district)}><i style={{ background: district.color, boxShadow: `0 0 12px ${district.color}` }} />{district.shortName}</button>)}</div></section>
            <section className="story-strip" aria-label="Story thread"><div className="options-heading"><span>Story thread</span><small>{realm.storyRead.length ? 'The ribbon is filling' : 'A life in motion'}</small></div><div className="option-strip">{story.map((node) => <button key={node.id} onClick={() => openStory(node)} className={realm.storyRead.includes(node.id) ? 'read' : ''}><i />{node.title}</button>)}</div></section>
            <AnimatePresence>{askOpen && <motion.div className="ask-panel walk-ask" initial={{ opacity: 0, y: 12 }} animate={{ opacity: .92, y: 0 }} exit={{ opacity: 0, y: 12 }}><div className="panel-title"><span>Ask the fog</span><button className="panel-dismiss" onClick={() => setAskOpen(false)} aria-label="Close Ask the Fog">Close ×</button></div><div className="question-row"><input id="question" autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setAsked(false) }} placeholder="What has he built?" /><button className="ask-button" onClick={() => setAsked(true)}>Ask</button></div>{asked && <div className="answer">{results.length ? <div className="answer-links">{results.map((result) => <button key={result.id} onClick={() => openDistrict(result)}>{result.shortName} ↗</button>)}</div> : <p>The fog does not know. <a href={`mailto:${contact.email}`}>Write a letter.</a></p>}</div>}</motion.div>}</AnimatePresence>
          </motion.section>
        )}
      </AnimatePresence>
      <AnimatePresence>{realm.arrival && <ArrivalOverlay onSkip={() => realm.set({ arrival: false, arrivalComplete: true })} />}</AnimatePresence>
      <AnimatePresence>{realm.activeAttendee && <CouncilInteraction district={districts.find((district) => district.id === realm.activeAttendee)!} sitting={Boolean(realm.sitting)} onTake={() => realm.set({ sitting: realm.activeAttendee })} onReturn={() => realm.set({ activeAttendee: null, sitting: null })} />}</AnimatePresence>
      <AnimatePresence>{realm.starOpen && <StarPanel district={districts.find((district) => district.id === realm.starOpen)!} onClose={() => realm.set({ starOpen: null })} />}</AnimatePresence>
      <AnimatePresence>{realm.memoryOpen !== null && <MemoryPanel index={realm.memoryOpen} album={realm.memoryAlbum} onClose={() => realm.set({ memoryOpen: null })} />}</AnimatePresence>
      <AnimatePresence>{realm.pathwayOpen && <PathwayOverlay onClose={() => realm.set({ pathwayOpen: false })} onSelect={openDistrict} />}</AnimatePresence>
      <AnimatePresence>{realm.paused && <PauseOverlay onClose={() => realm.set({ paused: false })} onClassic={() => realm.set({ paused: false, classic: true })} />}</AnimatePresence>
      <AnimatePresence>{realm.reader && <StoryReader node={story.find((item) => item.id === realm.reader)!} onClose={() => realm.set({ reader: null })} onOpen={openStory} />}</AnimatePresence>
      <AnimatePresence>{realm.bookOpen && <BookOfLoop onClose={() => realm.set({ bookOpen: false })} onOpen={openStory} />}</AnimatePresence>
      <AnimatePresence>{selected && <DistrictPanel district={selected} onClose={() => realm.set({ selected: null })} />}</AnimatePresence>
    </main>
  )
}

function PathwayOverlay({ onClose, onSelect }: { onClose: () => void; onSelect: (district: District) => void }) {
  return <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><section className="constellation-panel"><button className="panel-close" onClick={onClose}>Close ×</button><p className="eyebrow">The constellation</p><h2>Pathways through the fog.</h2><p className="overlay-intro">Each path is a way of reading the same person from a different angle. Choose a sigil and the chairs it touches will glow.</p><div className="pathway-grid">{pathways.map((path) => <button key={path.name} className="pathway-card" onClick={() => onSelect(districts.find((district) => district.id === path.ids[0])!)}><span className="pathway-sigil">✦</span><strong>{path.name}</strong><small>{path.ids.map((id) => districts.find((district) => district.id === id)?.shortName).join(' · ')}</small></button>)}</div></section></motion.div>
}

function PauseOverlay({ onClose, onClassic }: { onClose: () => void; onClassic: () => void }) {
  return <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><section className="pause-panel"><p className="eyebrow">The fog is held</p><h2>Pause the walk.</h2><button className="primary-button" onClick={onClose}>Return to the table</button><button className="secondary-button" onClick={onClassic}>Open Classic View</button><button className="secondary-button" onClick={onClose}>Reveal all paths</button></section></motion.div>
}

function StoryReader({ node, onClose, onOpen }: { node: StoryNode; onClose: () => void; onOpen: (node: StoryNode) => void }) {
  const [paragraph, setParagraph] = useState(0)
  const next = story[(story.findIndex((item) => item.id === node.id) + 1) % story.length]
  return <motion.div className={`story-reader mood-${node.mood}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="reader-orbit" /><section className="reader-card"><button className="panel-close" onClick={onClose}>Close ×</button><p className="eyebrow">{node.subtitle}</p><h2>{node.title}</h2><div className="reader-copy"><p>{node.paragraphs[paragraph]}</p></div><div className="reader-controls"><button onClick={() => setParagraph(Math.max(0, paragraph - 1))}>Back</button><span>Continue when ready</span><button onClick={() => setParagraph(Math.min(node.paragraphs.length - 1, paragraph + 1))}>Continue</button></div><blockquote>{paragraph === node.paragraphs.length - 1 ? node.pullQuote : 'The fog keeps the next sentence.'}</blockquote><div className="reader-actions"><button className="secondary-button" onClick={() => onOpen(next)}>Continue the story</button><button className="secondary-button" onClick={onClose}>See the evidence</button><button className="quiet-button" onClick={onClose}>Read as a page</button></div></section></motion.div>
}

function BookOfLoop({ onClose, onOpen }: { onClose: () => void; onOpen: (node: StoryNode) => void }) {
  return <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><section className="book-panel"><button className="panel-close" onClick={onClose}>Close ×</button><p className="eyebrow">The Book of the Loop</p><h2>The whole story,<br /><em>in one place.</em></h2>{story.map((node) => <article key={node.id} className="book-entry"><button onClick={() => onOpen(node)}><span className="eyebrow">{node.subtitle}</span><strong>{node.title}</strong></button>{node.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<blockquote>{node.pullQuote}</blockquote></article>)}</section></motion.div>
}

function DistrictPanel({ district, onClose }: { district: District; onClose: () => void }) {
  const linked = story.find((node) => node.linkedChairs.includes(district.id))
  return <motion.aside className="district-panel" initial={{ x: '105%' }} animate={{ x: 0 }} exit={{ x: '105%' }}><button className="panel-close" onClick={onClose}>Close ×</button><div className="district-mark" style={{ color: district.color, borderColor: district.color }}>◌</div><p className="eyebrow" style={{ color: district.color }}>{district.subtitle}</p><h2>{district.name}</h2>{linked && <div className="from-story">From the story: {linked.pullQuote}</div>}<p className="district-question">“{district.question}”</p>{district.concept && <span className="status-pill">Concept · Exploring</span>}<div className="panel-section"><span>The question</span><p>{district.question}</p></div><div className="panel-section"><span>What I did</span><p>{district.did}</p></div><div className="panel-section"><span>What it taught me</span><p>{district.taught}</p></div><div className="panel-section"><span>Evidence</span><ul>{district.evidence.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="panel-section"><span>Pathways</span><div className="path-tags">{district.pathways.map((path) => <span key={path}>{path}</span>)}</div></div></motion.aside>
}

function ClassicView({ onBack }: { onBack: () => void }) {
  return <main className="classic-view"><header className="classic-header"><button className="wordmark" onClick={onBack}><span className="wordmark-mark">◌</span> Project Ouroboros</button><button className="quiet-button" onClick={onBack}>Return to the fog</button></header><section className="classic-intro"><p className="eyebrow">A complete, scannable reading route</p><h1>The Grey Concourse,<br /><em>without the walking.</em></h1><p>{legend}</p></section><section className="classic-story">{story.map((node) => <article key={node.id}><p className="eyebrow">{node.subtitle}</p><h2>{node.title}</h2>{node.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<blockquote>{node.pullQuote}</blockquote></article>)}</section><section className="classic-grid">{districts.map((district) => <article key={district.id} className="classic-district"><div className="classic-orb" style={{ background: district.color, boxShadow: `0 0 24px ${district.color}` }} /><p className="eyebrow">{district.subtitle}</p><h2>{district.name}</h2><p className="classic-question">“{district.question}”</p><p>{district.did}</p><p><strong>It taught me:</strong> {district.taught}</p><div className="classic-evidence">{district.evidence.map((item) => <span key={item}>{item}</span>)}</div></article>)}</section><footer className="classic-footer"><p>Experience. Disruption. Reflection. Rebuilding.</p><a href={`mailto:${contact.email}`}>Begin the next loop →</a></footer></main>
}

export default App
