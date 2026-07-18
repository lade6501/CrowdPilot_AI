import React, { useState, useRef } from "react";
import { useCrowdPilot } from "../hooks/useCrowdPilot";
import { translations } from "../utils/translations";
import { Upload, FileSpreadsheet, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

export const UploadPanel: React.FC = () => {
  const { uploadCSV, uploadLoading, uploadResult, clearUpload, appLanguage } =
    useCrowdPilot();
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[appLanguage] || translations.en;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadCSV(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadCSV(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const loadSampleData = () => {
    const csvContent =
      "gate,occupancy,queue\n" +
      "Gate A,82,7\n" +
      "Gate B,95,28\n" +
      "Gate C,41,3\n" +
      "Gate D,60,9\n" +
      "Gate E,89,14\n";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const file = new File([blob], "fifa_stadium_snapshot.csv", {
      type: "text/csv",
    });
    uploadCSV(file);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-wide text-gray-100 flex items-center gap-2 mb-2">
          <FileSpreadsheet className="h-5 w-5 text-fifa-gold" />
          {t.upload_title}
        </h2>
        <p className="text-xs text-gray-400 mb-4">{t.upload_desc}</p>

        {!uploadLoading && !uploadResult && (
          <div className="space-y-4">
            {}
            <div className="p-3 bg-slate-900/60 border border-white/5 rounded-xl text-[11px] text-gray-400">
              <span className="font-bold text-gray-200 block mb-1">
                CSV Format Requirements:
              </span>
              <code className="block bg-slate-950 p-1.5 rounded font-mono text-[10px] text-fifa-gold select-all">
                gate,occupancy,queue
                <br />
                Gate A,82,7
                <br />
                Gate B,94,21
                <br />
                Gate C,41,3
              </code>
            </div>

            {}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-fifa-gold bg-slate-900/50 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                  : "border-white/10 hover:border-white/20 bg-slate-950/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleChange}
                className="hidden"
              />
              <Upload className="h-8 w-8 text-gray-500 mx-auto mb-2 group-hover:text-fifa-gold transition-colors" />
              <span className="text-xs font-semibold text-gray-300 block">
                {t.upload_drop}
              </span>
            </div>

            {}
            <button
              type="button"
              onClick={loadSampleData}
              className="w-full py-2 bg-slate-900 border border-white/5 hover:border-fifa-gold text-xs font-bold text-gray-300 hover:text-gray-100 rounded-xl transition-all"
            >
              Load Sample Operational Snapshot
            </button>
          </div>
        )}

        {uploadLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fifa-gold mb-3"></div>
            <p className="text-xs">{t.upload_uploading}</p>
            <p className="text-[10px] opacity-75 mt-0.5">
              {t.upload_analyzing}
            </p>
          </div>
        )}

        {}
        {!uploadLoading && uploadResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-900/40 p-2 rounded-lg border border-white/5">
                <span className="text-[9px] text-gray-500 uppercase block">
                  {t.twin_mode}
                </span>
                <span
                  className={`font-bold capitalize ${
                    uploadResult.analysis.overall_status === "critical"
                      ? "text-red-400"
                      : uploadResult.analysis.overall_status === "warning"
                        ? "text-amber-400"
                        : "text-emerald-400"
                  }`}
                >
                  {uploadResult.analysis.overall_status}
                </span>
              </div>
              <div className="bg-slate-900/40 p-2 rounded-lg border border-white/5">
                <span className="text-[9px] text-gray-500 uppercase block">
                  {t.rec_safety}
                </span>
                <span className="font-extrabold text-gray-200">
                  {uploadResult.analysis.safety_index}/10
                </span>
              </div>
              <div className="bg-slate-900/40 p-2 rounded-lg border border-white/5">
                <span className="text-[9px] text-gray-500 uppercase block">
                  {t.rec_efficiency}
                </span>
                <span className="font-extrabold text-gray-200">
                  {uploadResult.analysis.efficiency_score}%
                </span>
              </div>
            </div>

            {}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">
                {t.upload_results}
              </span>
              <div className="max-h-27.5 overflow-y-auto border border-white/5 rounded-lg bg-slate-950/60">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-900 text-gray-400 text-[10px] uppercase font-bold sticky top-0">
                    <tr>
                      <th className="p-2">Gate</th>
                      <th className="p-2">{t.inspector_current}</th>
                      <th className="p-2">{t.inspector_queue}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {Object.entries(uploadResult.parsed_gates).map(
                      ([gName, gate]: [string, any]) => (
                        <tr key={gName}>
                          <td className="p-2 font-medium">{gName}</td>
                          <td className="p-2">
                            <span
                              className={
                                gate.occupancy >= 90
                                  ? "text-red-400 font-bold"
                                  : gate.occupancy >= 75
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                              }
                            >
                              {gate.occupancy}%
                            </span>
                          </td>
                          <td className="p-2">{gate.queue}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {}
      {!uploadLoading && uploadResult && (
        <button
          onClick={clearUpload}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 mt-4"
        >
          <RotateCcw className="h-3.5 w-3.5" /> {t.upload_reset}
        </button>
      )}
    </div>
  );
};
