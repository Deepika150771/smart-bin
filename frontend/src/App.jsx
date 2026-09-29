import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatCard from './components/StatCard';
import BinCard from './components/BinCard';
import HistoricalChart from './components/HistoricalChart';
import AlertBanner from './components/AlertBanner';
import MapView from './components/MapView';
import AddBinModal from './components/AddBinModal';
import BinDetailModal from './components/BinDetailModal';
import FirmwareModal from './components/FirmwareModal';
import SimulationControls from './components/SimulationControls';
import { esp32ArduinoCode } from './data/esp32Code';

import { 
  Trash2, 
  ShieldAlert, 
  TrendingUp, 
  BellRing, 
  Cpu, 
  Scale, 
  Grid, 
  Compass, 
  LineChart as LineChartIcon,
  RefreshCw 
} from 'lucide-react';

export default function App() {
  const [bins, setBins] = useState([]);
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [readings, setReadings] = useState([]);
  
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'analytics' | 'map'
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isAddBinOpen, setIsAddBinOpen] = useState(false);
  const [isFirmwareOpen, setIsFirmwareOpen] = useState(false);
  const [selectedBin, setSelectedBin] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch bins & stats
      const binRes = await fetch('/api/bins');
      const binData = await binRes.json();
      if (binData.success) {
        setBins(binData.data || []);
        setStats(binData.stats || {});
      }

      // Fetch alerts
      const alertRes = await fetch('/api/alerts');
      const alertData = await alertRes.json();
      if (alertData.success) {
        setAlerts(alertData.data || []);
      }

      // Fetch readings history
      const historyRes = await fetch('/api/telemetry/history?limit=60');
      const historyData = await historyRes.json();
      if (historyData.success) {
        setReadings(historyData.data || []);
      }

      // Fetch simulation status
      const simRes = await fetch('/api/simulation/status');
      const simData = await simRes.json();
      if (simData.success) {
        setSimulationRunning(simData.isRunning);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleToggleSimulation = async () => {
    try {
      const res = await fetch('/api/simulation/toggle', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSimulationRunning(data.isRunning);
      }
    } catch (error) {
      console.error('Toggle simulation error:', error);
    }
  };

  const handleAddBin = async (newBinData) => {
    try {
      const res = await fetch('/api/bins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBinData)
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error registering bin:', error);
    }
  };

  const handleEmptyBin = async (binId) => {
    try {
      const res = await fetch(`/api/bins/${binId}/empty`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error emptying bin:', error);
    }
  };

  const handleDeleteBin = async (binId) => {
    if (!window.confirm(`Are you sure you want to remove ${binId}?`)) return;
    try {
      const res = await fetch(`/api/bins/${binId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error deleting bin:', error);
    }
  };

  const handleSimulateWasteAdd = async (binId) => {
    const bin = bins.find(b => b.binId === binId);
    if (!bin) return;

    // Reduce distance by ~15cm (increases fill level)
    const newDist = Math.max(5, bin.currentLevelCm - 15);
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          binId,
          distanceCm: newDist,
          servoActivated: true
        })
      });
      fetchDashboardData();
    } catch (e) {
      console.error('Simulate waste add error:', e);
    }
  };

  const handleEmptyAllBins = async () => {
    for (const b of bins) {
      await handleEmptyBin(b.binId);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      }
    } catch (e) {
      console.error('Resolve alert error:', e);
    }
  };

  const activeAlertCount = alerts.filter(a => a.status === 'Active').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Navbar */}
      <Navbar
        stats={stats}
        simulationRunning={simulationRunning}
        onToggleSimulation={handleToggleSimulation}
        onOpenAddBin={() => setIsAddBinOpen(true)}
        onOpenFirmware={() => setIsFirmwareOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        activeAlertCount={activeAlertCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Full-Bin Alert Banners */}
        <AlertBanner
          alerts={alerts}
          onResolve={handleResolveAlert}
        />

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            title="Total Bins"
            value={stats.totalBins || bins.length}
            subtitle="Registered Nodes"
            icon={Trash2}
            color="emerald"
          />
          <StatCard
            title="Full Bins"
            value={stats.fullBins || 0}
            subtitle="Needs Clearance"
            icon={ShieldAlert}
            color="red"
          />
          <StatCard
            title="Avg Fill %"
            value={`${stats.avgFillPercentage || 0}%`}
            subtitle="Overall Capacity"
            icon={TrendingUp}
            color="amber"
          />
          <StatCard
            title="Active Alerts"
            value={stats.activeAlertCount || activeAlertCount}
            subtitle="Pending Action"
            icon={BellRing}
            color="cyan"
          />
          <StatCard
            title="Lid Servo Ops"
            value={stats.totalServoOps || 0}
            subtitle="Auto Lid Opens"
            icon={Cpu}
            color="purple"
          />
          <StatCard
            title="Est. Waste"
            value={`${stats.estimatedWasteKg || 0} kg`}
            subtitle="Volume Collected"
            icon={Scale}
            color="emerald"
          />
        </div>

        {/* Simulator Control Toolbar */}
        <SimulationControls
          simulationRunning={simulationRunning}
          onToggle={handleToggleSimulation}
          onTriggerFillAll={() => {
            bins.forEach(b => handleSimulateWasteAdd(b.binId));
          }}
          onEmptyAll={handleEmptyAllBins}
        />

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'grid'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Smart Bins ({bins.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChartIcon className="w-4 h-4" />
              <span>Historical Trends</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'map'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>GIS Location Map</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Polling sensor telemetry live</span>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'grid' && (
          <div>
            {bins.length === 0 ? (
              <div className="glass-panel p-12 text-center border border-dashed border-slate-800 rounded-2xl">
                <Trash2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300">No Smart Bins Registered</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Register your first ESP32 garbage monitoring bin to start receiving live ultrasonic fill level telemetry.
                </p>
                <button
                  onClick={() => setIsAddBinOpen(true)}
                  className="mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  Register First Bin
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bins.map(bin => (
                  <BinCard
                    key={bin._id || bin.binId}
                    bin={bin}
                    onSelect={(b) => setSelectedBin(b)}
                    onEmpty={handleEmptyBin}
                    onDelete={handleDeleteBin}
                    onSimulateAdd={handleSimulateWasteAdd}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <HistoricalChart readings={readings} bins={bins} />
        )}

        {activeTab === 'map' && (
          <MapView bins={bins} onSelectBin={(b) => setSelectedBin(b)} />
        )}

      </main>

      {/* Modals */}
      <AddBinModal
        isOpen={isAddBinOpen}
        onClose={() => setIsAddBinOpen(false)}
        onAddBin={handleAddBin}
      />

      <BinDetailModal
        bin={selectedBin}
        isOpen={Boolean(selectedBin)}
        onClose={() => setSelectedBin(null)}
        onEmpty={handleEmptyBin}
        onSimulateAdd={handleSimulateWasteAdd}
      />

      <FirmwareModal
        isOpen={isFirmwareOpen}
        onClose={() => setIsFirmwareOpen(false)}
        esp32Code={esp32ArduinoCode}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>SmartBin IoT Smart Garbage Monitoring System &copy; 2026 | Powered by ESP32, React, Node.js & MongoDB</p>
      </footer>

    </div>
  );
}
