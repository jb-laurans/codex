import type { ForegroundLayer } from '@/data/story';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';

// Intensités prédéfinies
const INTENSITY = {
  subtle: { rotate: 1.5, translate: 3, duration: 4000 },
  medium: { rotate: 3,   translate: 6, duration: 3000 },
  strong: { rotate: 5,   translate: 10, duration: 2200 },
};

export function AnimatedLayer({
  layer,
  containerHeight,
}: {
  layer: ForegroundLayer;
  containerHeight: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const { rotate, translate, duration } =
    INTENSITY[layer.animationIntensity ?? 'subtle'];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Calcule la transform selon le type d'animation
  const getTransform = () => {
    switch (layer.animation) {
      case 'sway':
        // Balancement gauche-droite (plante, rideau)
        return [{
          rotate: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [`-${rotate}deg`, `${rotate}deg`],
          }),
        }];

      case 'float':
        // Flottement vertical (brume, poussière)
        return [{
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [-translate, translate],
          }),
        }];

      case 'drift':
        // Dérive lente diagonale (fumée, brume)
        return [
          {
            translateX: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-translate, translate],
            }),
          },
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-translate / 2, translate / 2],
            }),
          },
        ];

      case 'breathe':
      default:
        // Légère pulsation d'opacité (bougies, reflets)
        return [];
    }
  };

  // Opacité animée pour 'breathe', fixe sinon
  const animatedOpacity =
    layer.animation === 'breathe'
      ? anim.interpolate({
          inputRange: [0, 1],
          outputRange: [
            (layer.opacity ?? 0.7) * 0.7,
            layer.opacity ?? 0.7,
          ],
        })
      : layer.opacity ?? 0.7;

  return (
    <Animated.View
      pointerEvents="none"  // ← CRUCIAL : les taps passent au travers
      style={[
        styles.layer,
        {
          top:    layer.top    !== undefined ? `${layer.top}%`    : undefined,
          left:   layer.left   !== undefined ? `${layer.left}%`   : undefined,
          right:  layer.right  !== undefined ? `${layer.right}%`  : undefined,
          bottom: layer.bottom !== undefined ? `${layer.bottom}%` : undefined,
          width:  layer.width  !== undefined ? `${layer.width}%`  : '100%',
          height: layer.height !== undefined ? `${layer.height}%` : '100%',
          opacity: animatedOpacity,
          transform: getTransform(),
        },
      ]}
    >
      <Image
        source={layer.imageUri}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        blurRadius={layer.blurRadius ?? 0}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    overflow: 'hidden',
  },
});