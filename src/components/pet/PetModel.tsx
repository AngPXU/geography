import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Float, Sparkles, Trail } from '@react-three/drei';
import * as THREE from 'three';

interface PetProps {
  stage: number; // 1: Baby, 2: Adult, 3: Epic
  isFeeding: boolean;
}

export default function PetModel({ stage, isFeeding }: PetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const [targetScale] = useState(() => new THREE.Vector3(1, 1, 1));

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Hiệu ứng thở (bouncing/squash & stretch)
    const time = state.clock.getElapsedTime();
    const bounceSpeed = isFeeding ? 15 : (stage === 1 ? 5 : 3);
    const bounceHeight = isFeeding ? 0.5 : 0.1;
    
    groupRef.current.position.y = Math.sin(time * bounceSpeed) * bounceHeight;

    // Squashing
    const stretch = 1 - Math.sin(time * bounceSpeed) * 0.1;
    groupRef.current.scale.set(1 / stretch, stretch, 1 / stretch);

    // Kích thước dựa theo Stage
    const baseScale = stage === 1 ? 0.6 : (stage === 2 ? 0.9 : 1.2);
    targetScale.setScalar(baseScale);
    groupRef.current.scale.lerp(targetScale, delta * 2);

    // Xoay nhẹ
    if (stage >= 2 && headRef.current && !isFeeding) {
      headRef.current.rotation.y = Math.sin(time * 2) * 0.2;
    }
  });

  const mainColor = stage === 1 ? '#38BDF8' : stage === 2 ? '#34D399' : stage === 3 ? '#FBBF24' : '#E879F9'; // Stage 4: Hồng/Tím Thần thánh

  return (
    <group ref={groupRef}>
      {/* Hào quang khi đạt cấp 3, 4 */}
      {stage >= 3 && (
        <Sparkles 
          count={stage === 4 ? 100 : 50} 
          scale={stage === 4 ? 4 : 3} 
          size={stage === 4 ? 3 : 2} 
          color={stage === 4 ? '#E879F9' : '#FBBF24'} 
          speed={0.5} 
          opacity={0.6} 
        />
      )}

      {/* Thân (Body) */}
      <Box args={[1, 1, 1]} position={[0, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={mainColor} roughness={0.5} metalness={stage === 4 ? 0.6 : 0.1} />
      </Box>

      {/* Mắt (Eyes) */}
      <Sphere args={[0.08, 16, 16]} position={[-0.25, 0.6, 0.51]}>
        <meshBasicMaterial color="#082F49" />
      </Sphere>
      <Sphere args={[0.08, 16, 16]} position={[0.25, 0.6, 0.51]}>
        <meshBasicMaterial color="#082F49" />
      </Sphere>

      {/* Mũi/Miệng (Snout) */}
      <Box args={[0.3, 0.2, 0.2]} position={[0, 0.4, 0.55]} castShadow>
        <meshStandardMaterial color="#FFFFFF" />
      </Box>

      {/* Trang bị khi tiến hóa */}
      {stage >= 2 && (
        <group ref={headRef} position={[0, 1, 0]}>
          {/* Tai (Ears) */}
          <Box args={[0.3, 0.6, 0.3]} position={[-0.4, 0.2, 0]} castShadow>
            <meshStandardMaterial color={mainColor} />
          </Box>
          <Box args={[0.3, 0.6, 0.3]} position={[0.4, 0.2, 0]} castShadow>
            <meshStandardMaterial color={mainColor} />
          </Box>
        </group>
      )}

      {/* Đuôi hoặc Vây khi cấp 3, 4 */}
      {stage >= 3 && (
        <Float speed={5} rotationIntensity={1} floatIntensity={1}>
          <Box args={[0.4, 0.4, 0.4]} position={[0, 0.5, -0.6]} castShadow>
            <meshStandardMaterial color={stage === 4 ? '#A855F7' : '#EF4444'} />
          </Box>
        </Float>
      )}
      
      {/* Vương miện thần thú (Chỉ Stage 4) */}
      {stage === 4 && (
        <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
          <Box args={[0.6, 0.1, 0.6]} position={[0, 1.8, 0]} castShadow>
            <meshStandardMaterial color="#FBBF24" emissive="#FBBF24" emissiveIntensity={0.5} />
          </Box>
        </Float>
      )}

      {/* Tim bay khi được cho ăn */}
      {isFeeding && (
        <Float speed={10} floatIntensity={2} position={[0, 1.5, 0]}>
          <Sphere args={[0.2]} castShadow>
            <meshStandardMaterial color="#EF4444" emissive="#EF4444" />
          </Sphere>
        </Float>
      )}
    </group>
  );
}
