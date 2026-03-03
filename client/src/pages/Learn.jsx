import { useEffect, useState } from 'react';
import { useScore } from '../context/ScoreContext';
import { CheckCircle, PlayCircle, FileText, X, ExternalLink, ChevronRight } from 'lucide-react';

function ProgressBar({ percent, className = '' }) {
  const color =
    percent >= 70 ? 'bg-green-500' : percent >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div
        className={`h-2.5 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

function SystemCard({ system, onClick }) {
  const percent =
    system.totalResources > 0
      ? Math.round((system.completedResources / system.totalResources) * 100)
      : 0;
  const videoCount = system.resources.filter((r) => r.type === 'video').length;
  const pdfCount = system.resources.filter((r) => r.type === 'pdf').length;
  const hasContent = system.totalResources > 0;

  let borderClass = 'border-gray-200';
  if (system.isComplete) borderClass = 'border-green-400 bg-green-50/30';
  else if (system.completedResources > 0) borderClass = 'border-blue-300';

  return (
    <button
      onClick={onClick}
      className={`text-left flex flex-col justify-between p-4 rounded-lg border-2 ${borderClass} hover:shadow-md transition-all duration-200 min-w-[220px] w-full ${!hasContent ? 'opacity-60' : ''}`}
    >
      <div>
        <div className="flex items-start justify-between mb-2">
          {system.isComplete && (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          )}
        </div>
        <h3 className="font-semibold text-sm text-gray-800 mb-1 line-clamp-2">
          {system.name}
        </h3>
        {!hasContent && (
          <span className="text-xs text-gray-400 italic">No content yet</span>
        )}
      </div>
      {hasContent && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-1">
            {system.completedResources} of {system.totalResources} resources done
          </p>
          <ProgressBar percent={percent} />
          <div className="flex gap-2 mt-2">
            {videoCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                <PlayCircle className="w-3 h-3" />
                {videoCount} video{videoCount > 1 ? 's' : ''}
              </span>
            )}
            {pdfCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">
                <FileText className="w-3 h-3" />
                {pdfCount} PDF{pdfCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="flex items-center justify-end mt-2 text-xs text-gray-400">
        Open <ChevronRight className="w-3 h-3 ml-0.5" />
      </div>
    </button>
  );
}

function SystemModal({ system, onClose, markComplete, unmarkComplete }) {
  if (!system) return null;
  const percent =
    system.totalResources > 0
      ? Math.round((system.completedResources / system.totalResources) * 100)
      : 0;
  const videos = system.resources.filter((r) => r.type === 'video');
  const pdfs = system.resources.filter((r) => r.type === 'pdf');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{system.name}</h2>
            <p className="text-xs text-gray-500">{system.categoryName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          {system.isComplete && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <span className="text-lg">🎉</span>
              <p className="font-semibold text-green-700">System Complete! Score: 10</p>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Your Progress</span>
              <span className="font-medium">
                {percent}% ({system.completedResources} of {system.totalResources} done)
              </span>
            </div>
            <ProgressBar percent={percent} />
          </div>

          {videos.length > 0 && (
            <>
              <h3 className="font-semibold text-sm text-gray-700 mb-2 border-b pb-1">
                Videos
              </h3>
              <div className="space-y-3 mb-4">
                {videos.map((r) => (
                  <ResourceRow
                    key={r._id}
                    resource={r}
                    markComplete={markComplete}
                    unmarkComplete={unmarkComplete}
                  />
                ))}
              </div>
            </>
          )}

          {pdfs.length > 0 && (
            <>
              <h3 className="font-semibold text-sm text-gray-700 mb-2 border-b pb-1">
                PDFs
              </h3>
              <div className="space-y-3 mb-4">
                {pdfs.map((r) => (
                  <ResourceRow
                    key={r._id}
                    resource={r}
                    markComplete={markComplete}
                    unmarkComplete={unmarkComplete}
                  />
                ))}
              </div>
            </>
          )}

          {system.totalResources === 0 && (
            <p className="text-center text-gray-400 py-6">
              No resources have been added to this system yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ResourceRow({ resource, markComplete, unmarkComplete }) {
  const [toggling, setToggling] = useState(false);
  const Icon = resource.type === 'video' ? PlayCircle : FileText;
  const actionLabel = resource.type === 'video' ? 'Mark as Watched' : 'Mark as Read';
  const completedLabel = resource.type === 'video' ? 'Watched' : 'Read';

  const handleToggle = async () => {
    setToggling(true);
    try {
      if (resource.isCompleted) {
        await unmarkComplete(resource._id);
      } else {
        await markComplete(resource._id);
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <Icon
        className={`w-5 h-5 flex-shrink-0 ${
          resource.type === 'video' ? 'text-blue-500' : 'text-orange-500'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{resource.title}</p>
        {resource.description && (
          <p className="text-xs text-gray-500 truncate">{resource.description}</p>
        )}
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-0.5"
        >
          Open <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {resource.isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
            resource.isCompleted
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
          } disabled:opacity-50`}
        >
          {resource.isCompleted ? `✓ ${completedLabel}` : actionLabel}
        </button>
      </div>
    </div>
  );
}

export default function Learn() {
  const {
    categories,
    totalScore,
    healthPercent,
    completedSystems,
    totalSystems,
    loading,
    fetchLearnData,
    markComplete,
    unmarkComplete,
  } = useScore();

  const [selectedSystem, setSelectedSystem] = useState(null);

  useEffect(() => {
    fetchLearnData();
  }, [fetchLearnData]);

  // Keep modal system in sync with categories state
  useEffect(() => {
    if (selectedSystem) {
      for (const cat of categories) {
        const found = cat.systems.find((s) => s._id === selectedSystem._id);
        if (found) {
          setSelectedSystem((prev) => {
            if (!prev) return { ...found, categoryName: cat.name };
            // Only update if data actually changed
            const resourcesChanged = found.resources.some((r, i) =>
              !prev.resources[i] || prev.resources[i].isCompleted !== r.isCompleted
            );
            if (!resourcesChanged && prev.completedResources === found.completedResources
                && prev.isComplete === found.isComplete) return prev;
            return { ...found, categoryName: cat.name };
          });
          break;
        }
      }
    }
  }, [categories, selectedSystem?._id]);

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const healthColor =
    healthPercent >= 70
      ? 'text-green-600'
      : healthPercent >= 40
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top bar: Overall progress */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Business Health Score</h1>
        <div className="flex items-center gap-4 mb-2">
          <span className={`text-3xl font-bold ${healthColor}`}>
            {totalScore} / {totalSystems * 10}
          </span>
          <span className={`text-lg font-semibold ${healthColor}`}>
            ({healthPercent}%)
          </span>
        </div>
        <ProgressBar percent={healthPercent} className="mb-2" />
        <p className="text-sm text-gray-500">
          {completedSystems} of {totalSystems} systems completed
        </p>
      </div>

      {/* Category sections */}
      {categories.map((cat) => {
        const completedInCat = cat.systems.filter((s) => s.isComplete).length;
        return (
          <div key={cat.name} className="mb-8" id={`category-${cat.name.replace(/\s+/g, '-')}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800">{cat.name}</h2>
              <span className="text-sm text-gray-500">
                {cat.categoryPercent}% — {completedInCat}/{cat.systems.length} complete
              </span>
            </div>
            <ProgressBar percent={cat.categoryPercent} className="mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cat.systems.map((sys) => (
                <SystemCard
                  key={sys._id}
                  system={sys}
                  onClick={() => setSelectedSystem({ ...sys, categoryName: cat.name })}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* System detail modal */}
      {selectedSystem && (
        <SystemModal
          system={selectedSystem}
          onClose={() => setSelectedSystem(null)}
          markComplete={markComplete}
          unmarkComplete={unmarkComplete}
        />
      )}
    </div>
  );
}
