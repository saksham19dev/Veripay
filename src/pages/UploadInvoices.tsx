import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Download,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const UploadInvoices: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentStepName, setCurrentStepName] = useState('');
  const [results, setResults] = useState<{
    total: number;
    clean: number;
    exceptions: number;
  } | null>(null);

  const steps = [
    'File uploaded',
    'Records detected',
    'Data normalized',
    'Validation completed',
    'Duplicate detection completed',
    'Results generated',
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      showToast('Invalid file format. Please upload CSV or XLSX.', 'error');
      return;
    }

    setSelectedFile(file);
    startProcessing(file);
  };

  const startProcessing = async (file: File) => {
    setIsProcessing(true);
    setResults(null);
    setCurrentStepIndex(1);
    setCurrentStepName(steps[0]);

    try {
      const outcome = await api.uploadInvoices(file, (stepNum, stepName) => {
        setCurrentStepIndex(stepNum);
        setCurrentStepName(stepName);
      });

      setResults({
        total: outcome.total,
        clean: outcome.clean,
        exceptions: outcome.exceptions,
      });
      showToast(`Batch processing complete: ${outcome.clean} auto-passed, ${outcome.exceptions} exceptions detected.`, 'success');
    } catch {
      showToast('Something went wrong while processing the invoice file.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      'Invoice_Number,Supplier,Amount,Date,GSTIN,Department,Payment_Terms\n' +
      'INV-00123,ABC Trading Co.,245000,10 Sep 2025,29ABCDE1234F1Z5,Procurement,Net 30\n' +
      'INV-00124,Global Supplies Ltd.,120500,09 Sep 2025,27GLOBL9876K1Z2,Operations,Net 30\n' +
      'INV-00125,Tech Solutions,87650,08 Sep 2025,29TECHS5432B1Z8,IT Infrastructure,Immediate\n' +
      'INV-00126,XYZ Traders,450000,08 Sep 2025,07XYZTR1122C1Z4,Capital Works,Net 45\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'veriflow_ap_invoices_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sample template downloaded', 'info');
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setResults(null);
    setCurrentStepIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload CSV or Excel files to automatically validate your invoices.
          </p>
        </div>

        <button
          onClick={downloadSampleTemplate}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors self-start sm:self-center"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Download Sample CSV</span>
        </button>
      </div>

      {/* Main Upload Card */}
      {!results && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 sm:p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>

            <p className="text-base font-bold text-slate-800">
              Drag & drop your file here
            </p>
            <p className="text-sm text-blue-600 font-medium mt-1">
              or browse files
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Supported formats: CSV, XLSX</span>
            </div>
          </div>

          {/* Quick Demo Pre-load Trigger */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>Want to test immediately?</span>
            <button
              onClick={() => {
                const dummyFile = new File(['Invoice data demo'], 'September_AP_Batch_128.csv', {
                  type: 'text/csv',
                });
                handleFileSelected(dummyFile);
              }}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Load standard demo batch (128 records)</span>
            </button>
          </div>
        </div>
      )}

      {/* Processing Animation Card */}
      {isProcessing && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Processing Invoices...
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedFile?.name || 'Batch file'}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
              Step {currentStepIndex} of {steps.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStepIndex / steps.length) * 100}%` }}
            />
          </div>

          {/* Steps checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {steps.map((step, idx) => {
              const stepNumber = idx + 1;
              const isDone = currentStepIndex > stepNumber;
              const isCurrent = currentStepIndex === stepNumber;

              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium transition-all ${
                    isDone
                      ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                      : isCurrent
                      ? 'bg-blue-50/50 border-blue-200 text-blue-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                  )}
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Card */}
      {results && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 sm:p-8 space-y-6 animate-in fade-in-50 zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {results.total} records processed
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Batch validation completed for {selectedFile?.name || 'Uploaded batch'}.
              </p>
            </div>
          </div>

          {/* Breakdown summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-800">
                    {results.clean}
                  </div>
                  <div className="text-xs font-semibold text-emerald-700">Auto-Passed</div>
                </div>
              </div>
              <span className="text-xs text-emerald-600 font-medium">Ready for ERP Sync</span>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-rose-800">
                    {results.exceptions}
                  </div>
                  <div className="text-xs font-semibold text-rose-700">Exceptions</div>
                </div>
              </div>
              <span className="text-xs text-rose-600 font-medium">Action Needed</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => navigate('/exceptions')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <span>View Exceptions</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={resetUpload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Upload Another File</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
