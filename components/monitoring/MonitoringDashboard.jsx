/**
 * Monitoring Dashboard Component
 * Real-time system monitoring with health status, metrics, and alerts
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMonitoring } from '../../lib/hooks/useApi';

const MonitoringDashboard = () => {
  const { getMonitoringData, getAlerts, loading, error } = useMonitoring();
  const [monitoringData, setMonitoringData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [autoRefresh, setAutoRefresh] = useState(false); // Start with auto-refresh OFF
  const [selectedView, setSelectedView] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastManualRefresh, setLastManualRefresh] = useState(0);
  
  // Use refs to track if component is mounted and prevent race conditions
  const mounted = useRef(true);
  const currentIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // Stable fetch function for manual refresh only
  const fetchData = useCallback(async (skipLoading = false) => {
    // Prevent multiple simultaneous requests using ref instead of state
    if (isRefreshingRef.current && !skipLoading) return;
    
    if (!skipLoading) {
      isRefreshingRef.current = true;
      setIsRefreshing(true);
    }

    try {
      // Fetch both data types in parallel but don't overwhelm the API
      const [monitoringResponse, alertsResponse] = await Promise.allSettled([
        getMonitoringData(selectedView, selectedView !== 'overview'),
        getAlerts()
      ]);

      if (!mounted.current) return;

      if (monitoringResponse.status === 'fulfilled') {
        setMonitoringData(monitoringResponse.value);
      } else {
        console.error('Failed to fetch monitoring data:', monitoringResponse.reason);
      }

      if (alertsResponse.status === 'fulfilled') {
        setAlerts(alertsResponse.value.alerts || []);
      } else {
        console.error('Failed to fetch alerts:', alertsResponse.reason);
      }

      // Update last updated timestamp
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      if (mounted.current && !skipLoading) {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      }
    }
  }, [selectedView]); // Only depend on selectedView, not the API functions

  // Initial data fetch - separate from auto-refresh
  useEffect(() => {
    // Create a separate initial fetch that doesn't depend on unstable API functions
    const initialFetch = async () => {
      if (isRefreshingRef.current) return;
      
      isRefreshingRef.current = true;
      setIsRefreshing(true);

      try {
        const [monitoringResponse, alertsResponse] = await Promise.allSettled([
          getMonitoringData(selectedView, selectedView !== 'overview'),
          getAlerts()
        ]);

        if (!mounted.current) return;

        if (monitoringResponse.status === 'fulfilled') {
          setMonitoringData(monitoringResponse.value);
        }

        if (alertsResponse.status === 'fulfilled') {
          setAlerts(alertsResponse.value.alerts || []);
        }

        setLastUpdated(new Date());
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      } finally {
        if (mounted.current) {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        }
      }
    };

    initialFetch();
  }, [selectedView]); // Only depend on selectedView, not the API functions

  // Auto-refresh effect - separate and stable
  useEffect(() => {
    // Clear any existing interval
    if (currentIntervalRef.current) {
      clearInterval(currentIntervalRef.current);
    }

    if (autoRefresh && refreshInterval >= 10000) { // Minimum 10 seconds
      const performRefresh = async () => {
        if (!mounted.current || isRefreshingRef.current) return;

        try {
          const [monitoringResponse, alertsResponse] = await Promise.allSettled([
            getMonitoringData(selectedView, selectedView !== 'overview'),
            getAlerts()
          ]);

          if (!mounted.current) return;

          if (monitoringResponse.status === 'fulfilled') {
            setMonitoringData(monitoringResponse.value);
          }

          if (alertsResponse.status === 'fulfilled') {
            setAlerts(alertsResponse.value.alerts || []);
          }

          setLastUpdated(new Date());
        } catch (err) {
          console.error('Failed to refresh data:', err);
        }
      };

      currentIntervalRef.current = setInterval(performRefresh, refreshInterval);
    }

    return () => {
      if (currentIntervalRef.current) {
        clearInterval(currentIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, selectedView]); // Only depend on state values, not functions

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
      isRefreshingRef.current = false;
      if (currentIntervalRef.current) {
        clearInterval(currentIntervalRef.current);
      }
    };
  }, []);

  // Manual refresh handler with cooldown
  const handleManualRefresh = useCallback(() => {
    const now = Date.now();
    const cooldownPeriod = 2000; // 2 seconds cooldown
    
    if (isRefreshingRef.current) {
      console.log('Refresh already in progress');
      return;
    }
    
    if (now - lastManualRefresh < cooldownPeriod) {
      console.log('Please wait before refreshing again');
      return;
    }
    
    setLastManualRefresh(now);
    fetchData();
  }, [fetchData, lastManualRefresh]);

  // Format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format uptime
  const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get alert severity color
  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (loading && !monitoringData && !isRefreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading monitoring dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="border rounded px-3 py-1"
              disabled={!autoRefresh}
            >
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
            </select>
            <button
              onClick={handleManualRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={loading || isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* View Selector */}
        <div className="flex space-x-2">
          {['overview', 'health', 'metrics', 'cache'].map((view) => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-4 py-2 rounded capitalize ${
                selectedView === view
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Indicator */}
      {(loading || isRefreshing) && (
        <div className="mb-4 flex items-center text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          {loading ? 'Loading dashboard...' : 'Refreshing data...'}
        </div>
      )}

      {/* Status Indicator */}
      {!loading && !isRefreshing && (
        <div className="mb-4 flex items-center text-green-600">
          <div className="h-2 w-2 bg-green-600 rounded-full mr-2"></div>
          Dashboard ready
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mb-4 text-sm text-gray-600">
          Last updated: {lastUpdated.toLocaleTimeString()}
          {autoRefresh && (
            <span className="ml-2 text-green-600">
              • Auto-refresh enabled ({refreshInterval / 1000}s)
            </span>
          )}
          {!autoRefresh && (
            <span className="ml-2 text-gray-500">
              • Auto-refresh disabled (manual mode)
            </span>
          )}
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Active Alerts</h2>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${getAlertColor(alert.severity)}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{alert.type.replace('_', ' ').toUpperCase()}</span>
                  <span className="text-sm capitalize">{alert.severity}</span>
                </div>
                <p className="text-sm mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded text-red-700">
          Error loading monitoring data: {error.message}
        </div>
      )}

      {/* Monitoring Data */}
      {monitoringData && (
        <div className="space-y-6">
          {/* Overview Cards */}
          {selectedView === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* System Health */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">System Health</h3>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(monitoringData.health?.status)}`}>
                  {monitoringData.health?.status?.toUpperCase() || 'UNKNOWN'}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {monitoringData.health?.healthPercentage?.toFixed(1) || 0}% healthy
                </p>
                <p className="text-sm text-gray-600">
                  Uptime: {formatUptime(monitoringData.health?.uptime || 0)}
                </p>
              </div>

              {/* Request Metrics */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Requests</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {monitoringData.metrics?.requests || 0}
                </p>
                <p className="text-sm text-gray-600">API requests</p>
                <p className="text-sm text-red-600">
                  {monitoringData.metrics?.errors || 0} errors
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  * Monitoring calls excluded
                </p>
              </div>

              {/* Memory Usage */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Memory</h3>
                <p className="text-lg font-bold">
                  {formatBytes(monitoringData.metrics?.memory?.used || 0)}
                </p>
                <p className="text-sm text-gray-600">
                  of {formatBytes(monitoringData.metrics?.memory?.total || 0)}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (monitoringData.metrics?.memory?.used || 0) / (monitoringData.metrics?.memory?.total || 1) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Cache Performance */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Cache</h3>
                <p className="text-lg font-bold text-green-600">
                  {(monitoringData.cache?.hitRate * 100 || 0).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Hit rate</p>
                <p className="text-sm text-gray-600">
                  {monitoringData.cache?.totalHits || 0} hits, {monitoringData.cache?.totalMisses || 0} misses
                </p>
              </div>
            </div>
          )}

          {/* Detailed Views */}
          {selectedView !== 'overview' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 capitalize">{selectedView} Details</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(monitoringData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard; 