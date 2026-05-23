export function force(massKg: number, accelerationMetersPerSecondSquared: number) {
  return massKg * accelerationMetersPerSecondSquared;
}

export function weight(massKg: number, gravity = 9.81) {
  return massKg * gravity;
}

export function momentum(massKg: number, velocityMetersPerSecond: number) {
  return massKg * velocityMetersPerSecond;
}

export function kineticEnergy(massKg: number, velocityMetersPerSecond: number) {
  return 0.5 * massKg * velocityMetersPerSecond ** 2;
}

export function impulse(forceNewtons: number, timeSeconds: number) {
  return forceNewtons * timeSeconds;
}

export function torque(forceNewtons: number, momentArmMeters: number, angleDegrees = 90) {
  return forceNewtons * momentArmMeters * Math.sin((angleDegrees * Math.PI) / 180);
}

export function springForce(stiffnessNewtonsPerMeter: number, extensionMeters: number) {
  return stiffnessNewtonsPerMeter * extensionMeters;
}

export function projectileRange(initialVelocity: number, launchAngleDegrees: number, gravity = 9.81) {
  return (initialVelocity ** 2 * Math.sin((2 * launchAngleDegrees * Math.PI) / 180)) / gravity;
}

export function centripetalForce(massKg: number, velocityMetersPerSecond: number, radiusMeters: number) {
  return (massKg * velocityMetersPerSecond ** 2) / radiusMeters;
}
