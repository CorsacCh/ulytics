const ROLE_SCOPE_TYPES = {
  ADMIN: "INSTITUCION",
  DIRECTOR: "PROGRAMA",
  DECANO: "FACULTAD",
  AUTORIDAD_CENTRAL: "INSTITUCION"
};

export function expectedScopeType(roleCode) {
  return ROLE_SCOPE_TYPES[roleCode] || null;
}

export function isRoleScopeCompatible(roleCode, scopeType) {
  return expectedScopeType(roleCode) === scopeType;
}

export function assertRoleScopeCompatibility(roleCode, scopeType) {
  const expectedType = expectedScopeType(roleCode);

  if (!expectedType || expectedType !== scopeType) {
    const error = new Error(
      `El rol ${roleCode} requiere un ámbito de tipo ${expectedType || "válido"}.`
    );
    error.statusCode = 422;
    error.code = "ROLE_SCOPE_MISMATCH";
    throw error;
  }
}
