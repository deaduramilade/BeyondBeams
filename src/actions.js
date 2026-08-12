'use strict';

const ACTIONS = Object.freeze({
  'realtime.defense.breach.detect': {
    scope: 'action:realtime.defense.breach.detect',
    fields: {
      breachId: { type: 'string', required: true, maxLength: 128 },
      affectedRecords: { type: 'integer', required: true, min: 0, max: 1000000000 },
      dataFlow: { type: 'string', required: true, maxLength: 256 }
    }
  },
  'compliance.automation.dpia.generate': {
    scope: 'action:compliance.automation.dpia.generate',
    fields: {
      projectName: { type: 'string', required: true, maxLength: 256 },
      riskLevel: { type: 'string', required: true, enum: ['Low', 'Medium', 'High', 'Critical'] }
    }
  },
  'predictive.analytics.risk.model': {
    scope: 'action:predictive.analytics.risk.model',
    fields: {
      dataFlow: { type: 'string', required: true, maxLength: 256 },
      riskScore: { type: 'string', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }
    }
  },
  'regulatory.oversight.perform': {
    scope: 'action:regulatory.oversight.perform',
    fields: {
      controller: { type: 'string', required: true, maxLength: 256 }
    }
  },
  'rights.management.exercise': {
    scope: 'action:rights.management.exercise',
    fields: {
      rightType: { type: 'string', required: true, maxLength: 128 },
      subjectId: { type: 'string', required: true, maxLength: 128 }
    }
  }
});

function validateExecuteRequest(value) {
  if (!isPlainObject(value)) return invalid('request body must be an object');
  if (Object.keys(value).some(key => !['actionType', 'payload', 'authorization'].includes(key))) {
    return invalid('request contains unknown fields');
  }
  if (typeof value.actionType !== 'string' || !ACTIONS[value.actionType]) {
    return invalid('actionType is not supported');
  }
  if (!isPlainObject(value.payload)) return invalid('payload must be an object');
  const payloadError = validatePayload(value.payload, ACTIONS[value.actionType].fields);
  return payloadError ? invalid(payloadError) : { valid: true };
}

function validatePayload(payload, fields) {
  const unknown = Object.keys(payload).find(key => !fields[key]);
  if (unknown) return `payload contains unknown field: ${unknown}`;

  for (const [name, rule] of Object.entries(fields)) {
    const value = payload[name];
    if (value === undefined) {
      if (rule.required) return `payload.${name} is required`;
      continue;
    }
    if (rule.type === 'string') {
      if (typeof value !== 'string' || value.length === 0 || value.length > (rule.maxLength || Infinity)) {
        return `payload.${name} is invalid`;
      }
      if (rule.enum && !rule.enum.includes(value)) return `payload.${name} is invalid`;
    } else if (rule.type === 'integer') {
      if (!Number.isInteger(value) || value < rule.min || value > rule.max) return `payload.${name} is invalid`;
    }
  }
  return null;
}

function hasActionScope(scopes, actionType) {
  return scopes.includes('action:*') || scopes.includes(ACTIONS[actionType].scope);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
}

function invalid(message) {
  return { valid: false, message };
}

module.exports = { ACTIONS, hasActionScope, validateExecuteRequest };