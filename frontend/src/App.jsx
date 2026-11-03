import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import OverviewPage from './pages/OverviewPage';
import SocialMediaPage from './pages/SocialMediaPage';
import AcademicPage from './pages/AcademicPage';
import WellBeingPage from './pages/WellBeingPage';
import InsightsPage from './pages/InsightsPage';
import ReportsPage from './pages/ReportsPage';
import UploadPage from './pages/UploadPage';
import { 
  fetchFilterOptions, 
  fetchOverview, 
  fetchDatasets, 
  switchActiveDataset 
} from './services/api';

const DEFAULT_FILTERS = {
  gender: 'all',
  platform: 'all',
  age_min: 13,
  age_max: 19,
  social_media_max: 8.0,
  dataset_id: 'original'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [datasetsList, setDatasetsList] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState('original');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] = useState(null);
  const [totalRecords, setTotalRecords] = useState(1200);
  const [filteredRecords, setFilteredRecords] = useState(1200);

  // Load dataset catalog
  const loadDatasets = useCallback(async () => {
    try {
      const data = await fetchDatasets();
      if (data && data.datasets) {
        setDatasetsList(data.datasets);
        if (data.active_id) {
          setActiveDatasetId(data.active_id);
          return data.active_id;
        }
      }
    } catch (err) {
      console.error("Error loading datasets:", err);
    }
    return 'original';
  }, []);

  // Load filter options for active dataset
  const loadFilterOptions = useCallback(async (dId) => {
    try {
      const opts = await fetchFilterOptions(dId);
      setFilterOptions(opts);
      if (opts.total_records !== undefined) setTotalRecords(opts.total_records);
      
      // Calibrate filters to dataset boundaries
      const aMin = opts.age?.min ?? 13;
      const aMax = opts.age?.max ?? 19;
      const smMax = opts.social_media_hours?.max ?? 8.0;

      setFilters(prev => ({
        ...prev,
        dataset_id: dId,
        age_min: aMin,
        age_max: aMax,
        social_media_max: smMax,
        gender: 'all',
        platform: 'all'
      }));
    } catch (err) {
      console.error("Error fetching filter options:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDatasets().then((curActiveId) => {
      loadFilterOptions(curActiveId);
    });
  }, [loadDatasets, loadFilterOptions]);

  // Update cohort record count when filters change
  useEffect(() => {
    fetchOverview(filters)
      .then((kpis) => {
        if (kpis && kpis.total_records !== undefined) {
          setFilteredRecords(kpis.total_records);
        }
      })
      .catch((err) => console.error("Error fetching overview counts:", err));
  }, [filters]);

  const handleSwitchDataset = async (newDatasetId) => {
    try {
      await switchActiveDataset(newDatasetId);
      setActiveDatasetId(newDatasetId);
      await loadDatasets();
      await loadFilterOptions(newDatasetId);
    } catch (err) {
      console.error("Failed to switch dataset:", err);
    }
  };

  const handleDatasetUpdated = async () => {
    await loadDatasets();
    setActiveDatasetId('uploaded');
    await loadFilterOptions('uploaded');
  };

  const handleResetFilters = () => {
    const aMin = filterOptions?.age?.min ?? 13;
    const aMax = filterOptions?.age?.max ?? 19;
    const smMax = filterOptions?.social_media_hours?.max ?? 8.0;
    setFilters({
      dataset_id: activeDatasetId,
      gender: 'all',
      platform: 'all',
      age_min: aMin,
      age_max: aMax,
      social_media_max: smMax
    });
  };

  const activeDatasetInfo = datasetsList.find(d => d.id === activeDatasetId) || datasetsList[0] || {
    id: 'original',
    name: 'Original Sample Dataset',
    records: totalRecords,
    scale: { name: '4.00 GPA', label: '/ 4.00 GPA' }
  };

  const defaultAgeMin = filterOptions?.age?.min ?? 13;
  const defaultAgeMax = filterOptions?.age?.max ?? 19;
  const defaultSmMax = filterOptions?.social_media_hours?.max ?? 8.0;

  const isFiltered = (
    filters.gender !== 'all' ||
    filters.platform !== 'all' ||
    (filters.age_min !== undefined && filters.age_min > defaultAgeMin) ||
    (filters.age_max !== undefined && filters.age_max < defaultAgeMax) ||
    (filters.social_media_max !== undefined && filters.social_media_max < defaultSmMax)
  );

  return (
    <div className="flex h-screen bg-slate-100/70 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeDatasetInfo={activeDatasetInfo}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header 
          totalRecords={totalRecords} 
          filteredRecords={filteredRecords}
          onResetFilters={handleResetFilters}
          isFiltered={isFiltered}
          datasetsList={datasetsList}
          activeDatasetId={activeDatasetId}
          onSwitchDataset={handleSwitchDataset}
          onOpenUpload={() => setActiveTab('upload')}
          academicScale={activeDatasetInfo?.scale}
        />

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Show interactive filters only on analytics module pages */}
            {activeTab !== 'upload' && (
              <FilterBar
                filterOptions={filterOptions}
                filters={filters}
                setFilters={setFilters}
                onReset={handleResetFilters}
              />
            )}

            {/* Dynamic Page Views */}
            {activeTab === 'upload' && (
              <UploadPage 
                activeDatasetId={activeDatasetId}
                datasetsList={datasetsList}
                onDatasetUpdated={handleDatasetUpdated}
                onNavigateOverview={() => setActiveTab('overview')}
              />
            )}
            {activeTab === 'overview' && <OverviewPage filters={filters} />}
            {activeTab === 'social_media' && <SocialMediaPage filters={filters} />}
            {activeTab === 'academic' && <AcademicPage filters={filters} />}
            {activeTab === 'wellbeing' && <WellBeingPage filters={filters} />}
            {activeTab === 'insights' && <InsightsPage filters={filters} />}
            {activeTab === 'reports' && <ReportsPage filters={filters} />}
          </div>
        </main>
      </div>
    </div>
  );
}

