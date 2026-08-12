'use strict';

const RealTimeDefenseAgent = require('./a2spa-crypto/RealTimeDefenseAgent');
const ComplianceAutomationAgent = require('./a2spa-crypto/ComplianceAutomationAgent');
const PredictiveAnalyticsAgent = require('./a2spa-crypto/PredictiveAnalyticsAgent');
const RegulatoryOversightAgent = require('./a2spa-crypto/RegulatoryOversightAgent');
const RightsManagementAgent = require('./a2spa-crypto/RightsManagementAgent');

const ROUTES = Object.freeze({
  'realtime.defense.breach.detect': payload => RealTimeDefenseAgent.executeBreachDetection(payload),
  'compliance.automation.dpia.generate': payload => ComplianceAutomationAgent.generateDPIA(payload),
  'predictive.analytics.risk.model': payload => PredictiveAnalyticsAgent.runRiskModel(payload),
  'regulatory.oversight.perform': payload => RegulatoryOversightAgent.performOversight(payload),
  'rights.management.exercise': payload => RightsManagementAgent.exerciseRight(payload)
});

class OblivionAI {
  async execute(actionType, payload) {
    const route = ROUTES[actionType];
    if (!route) {
      const error = new Error('Unknown action type');
      error.code = 'UNKNOWN_ACTION';
      throw error;
    }
    return route(payload);
  }
}

module.exports = new OblivionAI();