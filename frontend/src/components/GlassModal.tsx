import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Dimensions, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const FEATHER_SIZE = 32; // Gradual opacity transition over 32px

interface GlassModalProps {
  children: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  style?: ViewStyle;
  blurIntensity?: number;
}

/**
 * GlassModal — Advanced glassmorphism modal with feathered edges.
 * 
 * Creates a "floating glass" effect by:
 * 1. Using a soft backdrop with layered alpha (no hard cutoff)
 * 2. BlurView for the frosted glass effect
 * 3. LinearGradient overlay to create the feathered/fading edge illusion
 * 
 * The gradient transitions from transparent at the top edge to the
 * modal's background color, creating a smooth "melting into" effect.
 */
export function GlassModal({
  children,
  visible,
  onClose,
  style,
  blurIntensity = 50,
}: GlassModalProps) {
  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Soft backdrop — layered alpha for gradual darkening */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Multiple layers create soft vignette instead of hard rgba overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.35)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </TouchableOpacity>

      {/* Modal container — positioned at bottom */}
      <View style={styles.modalContainer} pointerEvents="box-none">
        <View style={[styles.modalWrapper, style]}>
          {/* Feathered top edge — gradient from transparent to white/card color */}
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,1)']}
            locations={[0, 0.5, 1]}
            style={styles.featherTop}
            pointerEvents="none"
          />

          {/* Blur layer for glass effect */}
          {Platform.OS !== 'web' ? (
            <BlurView
              intensity={blurIntensity}
              tint="light"
              style={styles.blurContainer}
            >
              <View style={styles.glassContent}>
                {children}
              </View>
            </BlurView>
          ) : (
            <View style={styles.webGlassContainer}>
              <View style={styles.glassContent}>
                {children}
              </View>
            </View>
          )}

          {/* Side feathers — left and right edges */}
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.featherLeft}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.featherRight}
            pointerEvents="none"
          />
        </View>
      </View>
    </View>
  );
}

/**
 * GlassSheet — Bottom sheet variant with glassmorphism.
 * Simplified version for direct use without Modal wrapper.
 */
export function GlassSheet({
  children,
  style,
  blurIntensity = 45,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  blurIntensity?: number;
}) {
  return (
    <View style={[styles.sheetWrapper, style]}>
      {/* Top feather gradient */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.85)']}
        locations={[0, 0.4, 1]}
        style={styles.sheetFeatherTop}
        pointerEvents="none"
      />

      {Platform.OS !== 'web' ? (
        <BlurView intensity={blurIntensity} tint="light" style={styles.sheetBlur}>
          <View style={styles.sheetContent}>{children}</View>
        </BlurView>
      ) : (
        <View style={styles.sheetWebGlass}>
          <View style={styles.sheetContent}>{children}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    position: 'relative',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    // Soft outer shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.08,
    shadowRadius: 48,
    elevation: 32,
  },
  featherTop: {
    position: 'absolute',
    top: -FEATHER_SIZE,
    left: 0,
    right: 0,
    height: FEATHER_SIZE + 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 10,
  },
  featherLeft: {
    position: 'absolute',
    top: 0,
    left: -24,
    bottom: 0,
    width: 24,
    zIndex: 10,
  },
  featherRight: {
    position: 'absolute',
    top: 0,
    right: -24,
    bottom: 0,
    width: 24,
    zIndex: 10,
  },
  blurContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderBottomWidth: 0,
  },
  webGlassContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderBottomWidth: 0,
    // @ts-ignore — web only
    backdropFilter: 'blur(32px) saturate(180%)',
    WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  },
  glassContent: {
    backgroundColor: 'rgba(255,255,255,0.88)',
  },

  // Sheet styles
  sheetWrapper: {
    position: 'relative',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 24,
  },
  sheetFeatherTop: {
    position: 'absolute',
    top: -FEATHER_SIZE,
    left: -8,
    right: -8,
    height: FEATHER_SIZE + 8,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: 5,
  },
  sheetBlur: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderBottomWidth: 0,
  },
  sheetWebGlass: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderBottomWidth: 0,
    // @ts-ignore
    backdropFilter: 'blur(28px) saturate(160%)',
    WebkitBackdropFilter: 'blur(28px) saturate(160%)',
  },
  sheetContent: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
