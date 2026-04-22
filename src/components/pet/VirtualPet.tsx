'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import PetModel from './PetModel';
import { Suspense } from 'react';

interface Props {
  stage: number;
  isFeeding: boolean;
}

export default function VirtualPet({ stage, isFeeding }: Props) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [2, 2, 3], fov: 45 }} shadows>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={1} 
            castShadow 
            shadow-mapSize={1024}
          />
          <Environment preset="city" />

          {/* Vị trí thú cưng */}
          <group position={[0, -0.5, 0]}>
            <PetModel stage={stage} isFeeding={isFeeding} />
            
            {/* Bóng đổ trên mặt đất */}
            <ContactShadows 
              position={[0, 0, 0]} 
              opacity={0.4} 
              scale={5} 
              blur={2} 
              far={2} 
            />
          </group>

          {/* Cho phép xoay camera quanh thú cưng */}
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 2.1} 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
