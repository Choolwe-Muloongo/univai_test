export function pressure(forceNewtons: number, areaMetersSquared: number) {
  return forceNewtons / areaMetersSquared;
}

export function hydrostaticPressure(densityKgPerMeterCubed: number, gravity: number, depthMeters: number) {
  return densityKgPerMeterCubed * gravity * depthMeters;
}

export function hydraulicOutputForce(inputForceNewtons: number, smallPistonArea: number, largePistonArea: number) {
  return (inputForceNewtons * largePistonArea) / smallPistonArea;
}

export function flowRate(areaMetersSquared: number, velocityMetersPerSecond: number) {
  return areaMetersSquared * velocityMetersPerSecond;
}

export function continuityVelocity(areaOne: number, velocityOne: number, areaTwo: number) {
  return (areaOne * velocityOne) / areaTwo;
}

export function bernoulliTotalPressure(pressurePa: number, densityKgPerMeterCubed: number, velocity: number, gravity: number, height: number) {
  return pressurePa + 0.5 * densityKgPerMeterCubed * velocity ** 2 + densityKgPerMeterCubed * gravity * height;
}

export function buoyantForce(fluidDensityKgPerMeterCubed: number, displacedVolumeMetersCubed: number, gravity = 9.81) {
  return fluidDensityKgPerMeterCubed * displacedVolumeMetersCubed * gravity;
}
