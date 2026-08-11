// src/OblivionAI.js
const RealTimeDefenseAgent = require('./a2spa-crypto/RealTimeDefenseAgent');
const ComplianceAutomationAgent = require('./a2spa-crypto/ComplianceAutomationAgent');
const PredictiveAnalyticsAgent = require('./a2spa-crypto/PredictiveAnalyticsAgent');
const RegulatoryOversightAgent = require('./a2spa-crypto/RegulatoryOversightAgent');
const RightsManagementAgent = require('./a2spa-crypto/RightsManagementAgent');

class OblivionAI {
  constructor() {
    console.log('🚀 Oblivion-AI Central Orchestrator initialised');
    console.log('   A2SPA Zero-Trust enforcement active for ALL agents');
    this.agents = {
      realTimeDefense: RealTimeDefenseAgent,
      complianceAutomation: ComplianceAutomationAgent,
      predictiveAnalytics: PredictiveAnalyticsAgent,
      regulatoryOversight: RegulatoryOversightAgent,
      rightsManagement: RightsManagementAgent
    };
  }

  async execute(actionType, payload) {
    console.log(`\n🔐 A2SPA check for action: ${actionType}`);

    if (actionType.startsWith('realtime.defense.')) return await this.agents.realTimeDefense.executeBreachDetection(payload);
    if (actionType.startsWith('compliance.automation.')) return await this.agents.complianceAutomation.generateDPIA(payload);
    if (actionType.startsWith('predictive.analytics.')) return await this.agents.predictiveAnalytics.runRiskModel(payload);
    if (actionType.startsWith('regulatory.oversight.')) return await this.agents.regulatoryOversight.performOversight(payload);
    if (actionType.startsWith('rights.management.')) return await this.agents.rightsManagement.exerciseRight(payload);

    throw new Error(`Unknown action type: ${actionType}`);
  }
}

module.exports = new OblivionAI();