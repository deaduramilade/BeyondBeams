// mobile/App.js
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View, Button, TextInput, ScrollView, Alert } from 'react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

export default function App() {
  const [output, setOutput] = useState('Ready to test Oblivion-AI on mobile');

  const runAction = async (actionType, payload) => {
    if (!API_URL || !API_KEY) {
      Alert.alert('Configuration required', 'Set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_API_KEY in your local environment.');
      return;
    }
    setOutput('Executing...');
    try {
      const res = await axios.post(API_URL, { actionType, payload }, {
        headers: { 'x-api-key': API_KEY }
      });
      setOutput(JSON.stringify(res.data, null, 2));
    } catch (err) {
      setOutput('ERROR: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🚀 Oblivion-AI Mobile</Text>
      <Text style={styles.subtitle}>NDPR/NDPA 2023 • A2SPA Protected</Text>

      <View style={styles.buttonGroup}>
        <Button title="Real-Time Defense" onPress={() => runAction('realtime.defense.breach.detect', {breachId:'MOBILE-001',affectedRecords:800,dataFlow:'mobile-app'})} />
        <Button title="Generate DPIA" onPress={() => runAction('compliance.automation.dpia.generate', {projectName:'Mobile v1',riskLevel:'Medium'})} />
        <Button title="Run Risk Model" onPress={() => runAction('predictive.analytics.risk.model', {dataFlow:'Mobile Portal'})} />
        <Button title="Regulatory Oversight" onPress={() => runAction('regulatory.oversight.perform', {controller:'NDPC'})} />
        <Button title="Exercise Right" onPress={() => runAction('rights.management.exercise', {rightType:'Right to be Forgotten',subjectId:'NG-987654321'})} />
      </View>

      <Text style={styles.output}>{output}</Text>
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#0f172a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#3b82f6', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 30 },
  buttonGroup: { gap: 12, marginBottom: 30 },
  output: { backgroundColor: '#1e2937', padding: 20, borderRadius: 12, fontSize: 14, lineHeight: 22, color: '#e2e8f0' }
});