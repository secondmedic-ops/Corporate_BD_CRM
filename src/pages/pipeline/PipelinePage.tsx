import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsApi } from '../../api/endpoints';
import { PipelineResponse, PipelineStage, LeadDto } from '../../types/api';
import { KanbanSquare, ArrowRight, DollarSign, Building, AlertCircle } from 'lucide-react';
import { toast } from '../../utils/errors';

export const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPipeline = async () => {
    setLoading(true);
    try {
      const data = await leadsApi.getPipeline();
      setPipeline(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  if (loading || !pipeline) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <KanbanSquare className="w-5 h-5 text-teal-600" /> Pipeline Stage Board
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Pipeline Value:{' '}
            <strong className="text-teal-700 font-bold">
              ₹{pipeline.totalPipelineValue.toLocaleString('en-IN')}
            </strong>{' '}
            across {pipeline.totalLeads} active corporate opportunities.
          </p>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {pipeline.stages.map((stg) => (
          <div
            key={stg.stage}
            className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col min-w-[240px] max-h-[75vh]"
          >
            {/* Column Header */}
            <div className="pb-3 mb-2 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                  {stg.stage.replace('L', 'Stage ').replace(/_/g, ' ')}
                </span>
                <span className="px-2 py-0.5 bg-white rounded-full text-[10px] font-bold text-slate-600 border shadow-xs">
                  {stg.count}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-teal-700 mt-1">
                ₹{(stg.totalValue / 100000).toFixed(1)} Lakhs
              </div>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {stg.leads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-400 cursor-pointer transition-all space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-teal-600 font-semibold">{lead.leadCode}</span>
                    <span className="text-[10px] text-slate-400">{lead.source.replace('_', ' ')}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs leading-snug">{lead.companyName}</h4>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500 text-[11px]">{lead.ownerName}</span>
                    <span className="font-bold text-slate-900">
                      ₹{lead.expectedValue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
