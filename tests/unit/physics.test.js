import SpringAnimator from '../../src/js/spring-animator';

describe('Physics - SpringAnimator.physicalParameters', () => {
  test('should return stiffness, damping, and mass', () => {
    const params = SpringAnimator.physicalParameters(1.0, 0.4);

    expect(params).toHaveProperty('stiffness');
    expect(params).toHaveProperty('damping');
    expect(params).toHaveProperty('mass');
  });

  test('should always return mass of 1', () => {
    expect(SpringAnimator.physicalParameters(1.0, 0.4).mass).toBe(1);
    expect(SpringAnimator.physicalParameters(0.5, 0.2).mass).toBe(1);
  });

  test('should return correct stiffness for response=0.4', () => {
    // stiffness = (2π / 0.4)² ≈ 246.74
    expect(SpringAnimator.physicalParameters(1.0, 0.4).stiffness).toBeCloseTo(246.74, 1);
  });

  test('should return correct damping for dampingRatio=1.0, response=0.4', () => {
    // damping = 4π * 1.0 / 0.4 ≈ 31.42
    expect(SpringAnimator.physicalParameters(1.0, 0.4).damping).toBeCloseTo(31.42, 1);
  });

  test('should return correct damping for dampingRatio=0.8, response=0.4', () => {
    // damping = 4π * 0.8 / 0.4 ≈ 25.13
    expect(SpringAnimator.physicalParameters(0.8, 0.4).damping).toBeCloseTo(25.13, 1);
  });

  test('stiffness should not depend on dampingRatio', () => {
    const p1 = SpringAnimator.physicalParameters(1.0, 0.4);
    const p2 = SpringAnimator.physicalParameters(0.5, 0.4);

    expect(p1.stiffness).toBeCloseTo(p2.stiffness, 10);
  });

  test('larger response should produce lower stiffness (slower spring)', () => {
    const fast = SpringAnimator.physicalParameters(1.0, 0.2);
    const slow = SpringAnimator.physicalParameters(1.0, 0.8);

    expect(fast.stiffness).toBeGreaterThan(slow.stiffness);
  });

  test('higher dampingRatio should produce higher damping', () => {
    const low = SpringAnimator.physicalParameters(0.5, 0.4);
    const high = SpringAnimator.physicalParameters(1.0, 0.4);

    expect(high.damping).toBeGreaterThan(low.damping);
  });

  test('minimum springResponse = 0.1 should produce very high stiffness', () => {
    const params = SpringAnimator.physicalParameters(0.8, 0.1);
    // stiffness = (2π / 0.1)² ≈ 3947.8
    expect(params.stiffness).toBeCloseTo(3947.8, 0);
    // damping = 4π * 0.8 / 0.1 ≈ 100.5
    expect(params.damping).toBeCloseTo(100.5, 0);
    expect(params.mass).toBe(1);
  });

  test('maximum springResponse = 1.0 should produce low stiffness (slow spring)', () => {
    const params = SpringAnimator.physicalParameters(1.0, 1.0);
    // stiffness = (2π / 1)² ≈ 39.48
    expect(params.stiffness).toBeCloseTo(39.48, 1);
    // damping = 4π * 1.0 / 1.0 ≈ 12.57
    expect(params.damping).toBeCloseTo(12.57, 1);
  });

  test('dampingRatio > 1 should produce overdamped system (damping > critical)', () => {
    const params = SpringAnimator.physicalParameters(2.0, 0.4);
    const criticalDamping = 2 * Math.sqrt(params.stiffness * params.mass);
    expect(params.damping).toBeGreaterThan(criticalDamping);
  });

  test('dampingRatio < 1 should produce underdamped system (damping < critical)', () => {
    const params = SpringAnimator.physicalParameters(0.2, 0.4);
    const criticalDamping = 2 * Math.sqrt(params.stiffness * params.mass);
    expect(params.damping).toBeLessThan(criticalDamping);
  });
});

describe('Physics - SpringAnimator.solve', () => {
  const underdampedParams = SpringAnimator.physicalParameters(0.8, 0.4); // default
  const criticalParams = SpringAnimator.physicalParameters(1.0, 0.4); // critically damped
  const overdampedParams = SpringAnimator.physicalParameters(1.5, 0.4); // overdamped

  test('should not change state at equilibrium', () => {
    const state = { position: 0, velocity: 0 };
    const result = SpringAnimator.solve(state, 0, underdampedParams, 0.016);
    expect(result.position).toBeCloseTo(0, 10);
    expect(result.velocity).toBeCloseTo(0, 10);
  });

  test('should not mutate input state', () => {
    const state = { position: 100, velocity: 0 };
    SpringAnimator.solve(state, 0, underdampedParams, 0.016);
    expect(state.position).toBe(100);
    expect(state.velocity).toBe(0);
  });

  test('should return correct state at dt = 0', () => {
    const state = { position: 100, velocity: -50 };
    const result = SpringAnimator.solve(state, 0, underdampedParams, 0);
    expect(result.position).toBeCloseTo(100, 6);
    expect(result.velocity).toBeCloseTo(-50, 6);
  });

  test('should move position toward target (underdamped)', () => {
    const state = { position: 100, velocity: 0 };
    const result = SpringAnimator.solve(state, 0, underdampedParams, 0.016);
    expect(result.position).toBeLessThan(state.position);
  });

  test('should move position toward target (critically damped)', () => {
    const state = { position: 100, velocity: 0 };
    const result = SpringAnimator.solve(state, 0, criticalParams, 0.016);
    expect(result.position).toBeLessThan(state.position);
    expect(result.position).toBeGreaterThan(0);
  });

  test('should move position toward target (overdamped)', () => {
    const state = { position: 100, velocity: 0 };
    const result = SpringAnimator.solve(state, 0, overdampedParams, 0.016);
    expect(result.position).toBeLessThan(state.position);
    expect(result.position).toBeGreaterThan(0);
  });

  test('should converge underdamped spring over many steps', () => {
    let state = { position: 100, velocity: 0 };
    for (let i = 0; i < 200; i++) {
      state = SpringAnimator.solve(state, 0, underdampedParams, 0.016);
    }
    expect(SpringAnimator.isSettled(state, 0)).toBe(true);
  });

  test('should converge critically damped spring over many steps', () => {
    let state = { position: 100, velocity: 0 };
    for (let i = 0; i < 200; i++) {
      state = SpringAnimator.solve(state, 0, criticalParams, 0.016);
    }
    expect(SpringAnimator.isSettled(state, 0)).toBe(true);
  });

  test('should converge overdamped spring over many steps', () => {
    let state = { position: 100, velocity: 0 };
    for (let i = 0; i < 200; i++) {
      state = SpringAnimator.solve(state, 0, overdampedParams, 0.016);
    }
    expect(SpringAnimator.isSettled(state, 0)).toBe(true);
  });

  test('should converge with aggressive springResponse = 0.1 in a single 60fps step', () => {
    // Key regression: numerical Euler integration diverges here (ω₀·dt ≈ 1.05),
    // but SpringAnimator.solve is exact and stable regardless of stiffness.
    const aggressiveParams = SpringAnimator.physicalParameters(0.8, 0.1);
    let state = { position: 500, velocity: 0 };
    for (let i = 0; i < 60; i++) {
      state = SpringAnimator.solve(state, 0, aggressiveParams, 1 / 60);
    }
    expect(SpringAnimator.isSettled(state, 0)).toBe(true);
  });

  test('should work with a non-zero target', () => {
    let state = { position: 0, velocity: 0 };
    for (let i = 0; i < 200; i++) {
      state = SpringAnimator.solve(state, 300, underdampedParams, 0.016);
    }
    expect(SpringAnimator.isSettled(state, 300)).toBe(true);
  });

  test('should incorporate initial velocity toward target into trajectory', () => {
    const atRest = SpringAnimator.solve(
      { position: 100, velocity: 0 },
      0,
      underdampedParams,
      0.016,
    );
    const withVel = SpringAnimator.solve(
      { position: 100, velocity: -500 },
      0,
      underdampedParams,
      0.016,
    );
    expect(withVel.position).toBeLessThan(atRest.position);
  });

  test('should handle initial velocity away from target', () => {
    // Velocity pushes position further from target first, then spring pulls back.
    // This mirrors gesture release with downward velocity (spring snaps back upward).
    const result = SpringAnimator.solve(
      { position: 100, velocity: 500 },
      0,
      underdampedParams,
      0.016,
    );
    // One frame away: position moves further from target before spring wins
    expect(result.position).toBeGreaterThan(100);
    // But over many frames it must still converge
    let state = { position: 100, velocity: 500 };
    for (let i = 0; i < 300; i++) {
      state = SpringAnimator.solve(state, 0, underdampedParams, 0.016);
    }
    expect(SpringAnimator.isSettled(state, 0)).toBe(true);
  });

  test('should return near-settled state for very large dt (unique advantage over numerical integration)', () => {
    // A 2-second dt would cause numerical methods to explode,
    // but SpringAnimator.solve computes the exact position at t+2s.
    const result = SpringAnimator.solve({ position: 500, velocity: 0 }, 0, underdampedParams, 2);
    expect(SpringAnimator.isSettled(result, 0)).toBe(true);
  });

  test('should converge for very bouncy spring (ζ = 0.1, slider minimum)', () => {
    const bouncyParams = SpringAnimator.physicalParameters(0.1, 0.4);
    let state = { position: 100, velocity: 0 };
    for (let i = 0; i < 600; i++) {
      state = SpringAnimator.solve(state, 0, bouncyParams, 0.016);
    }
    expect(SpringAnimator.isSettled(state, 0)).toBe(true);
  });

  test('should produce numerically accurate result for critically damped spring', () => {
    // Hand-computed: ω₀ = 2π/0.4 ≈ 15.708, dt = 0.1
    // rateCoeff = 0 + 15.708 * 100 = 1570.8
    // envelope  = e^(-15.708 * 0.1) ≈ 0.20788
    // newDisplacement = (100 + 1570.8 * 0.1) * 0.20788 ≈ 53.44
    // newVelocity     = (1570.8 - 15.708 * 257.08) * 0.20788 ≈ -513.2
    const result = SpringAnimator.solve({ position: 100, velocity: 0 }, 0, criticalParams, 0.1);
    expect(result.position).toBeCloseTo(53.44, 1);
    expect(result.velocity).toBeCloseTo(-513.2, 0);
  });

  test('should produce numerically accurate result for underdamped spring', () => {
    // ω₀ ≈ 15.708, ζ = 0.8, ωd = 9.4248, dt = 0.1
    // sineCoeff = (0 + 0.8 * 15.708 * 100) / 9.4248 ≈ 133.33
    // envelope  = e^(-0.8 * 15.708 * 0.1) ≈ 0.2844
    // cos(0.94248) ≈ 0.5878,  sin(0.94248) ≈ 0.8090
    // newDisplacement ≈ 47.4,  newVelocity ≈ -602.8
    const result = SpringAnimator.solve({ position: 100, velocity: 0 }, 0, underdampedParams, 0.1);
    expect(result.position).toBeCloseTo(47.4, 0);
    expect(result.velocity).toBeCloseTo(-602.8, 0);
  });
});

describe('Physics - SpringAnimator.isSettled', () => {
  test('should return true when at exact target with zero velocity', () => {
    expect(SpringAnimator.isSettled({ position: 0, velocity: 0 }, 0)).toBe(true);
  });

  test('should return true when within default position threshold', () => {
    expect(SpringAnimator.isSettled({ position: 0.49, velocity: 0 }, 0)).toBe(true);
    expect(SpringAnimator.isSettled({ position: -0.49, velocity: 0 }, 0)).toBe(true);
  });

  test('should return false when outside default position threshold', () => {
    expect(SpringAnimator.isSettled({ position: 0.5, velocity: 0 }, 0)).toBe(false);
    expect(SpringAnimator.isSettled({ position: 1, velocity: 0 }, 0)).toBe(false);
  });

  test('should return true when within default velocity threshold', () => {
    expect(SpringAnimator.isSettled({ position: 0, velocity: 0.49 }, 0)).toBe(true);
    expect(SpringAnimator.isSettled({ position: 0, velocity: -0.49 }, 0)).toBe(true);
  });

  test('should return false when outside default velocity threshold', () => {
    expect(SpringAnimator.isSettled({ position: 0, velocity: 0.5 }, 0)).toBe(false);
    expect(SpringAnimator.isSettled({ position: 0, velocity: -1 }, 0)).toBe(false);
  });

  test('should return false when both position and velocity are outside threshold', () => {
    expect(SpringAnimator.isSettled({ position: 1, velocity: 1 }, 0)).toBe(false);
  });

  test('should measure position relative to target', () => {
    expect(SpringAnimator.isSettled({ position: 100.3, velocity: 0 }, 100)).toBe(true);
    expect(SpringAnimator.isSettled({ position: 100.6, velocity: 0 }, 100)).toBe(false);
  });

  test('should respect custom thresholds', () => {
    expect(SpringAnimator.isSettled({ position: 1.5, velocity: 1.5 }, 0, 2, 2)).toBe(true);
    expect(SpringAnimator.isSettled({ position: 2, velocity: 0 }, 0, 2, 2)).toBe(false);
    expect(SpringAnimator.isSettled({ position: 0, velocity: 2 }, 0, 2, 2)).toBe(false);
  });
});
