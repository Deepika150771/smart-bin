import React, { useState } from 'react';
import { X, Copy, Check, Cpu, Wifi, Radio, Zap } from 'lucide-react';

export default function FirmwareModal({ isOpen, onClose, esp32Code }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(esp32Code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl h-[85vh] p-6 relative flex flex-col shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-100">ESP32 Firmware Code (.ino)</h3>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Arduino C++
                </span>
              </div>
              <p className="text-xs text-slate-400">Ultrasonic Sensor + SSD1306 OLED + SG90 Servo Lid + WiFi HTTP POST</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center space-x-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pinout Table Header */}
        <div className="my-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs shrink-0">
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-slate-500 block text-[10px]">Ultrasonic</span>
              <span className="font-mono text-slate-200 font-semibold">TRIG: GPIO 5 | ECHO: 18</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-slate-500 block text-[10px]">SG90 Servo Lid</span>
              <span className="font-mono text-slate-200 font-semibold">PWM: GPIO 13</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-slate-500 block text-[10px]">OLED SSD1306</span>
              <span className="font-mono text-slate-200 font-semibold">SDA: GPIO 21 | SCL: 22</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center space-x-2">
            <Wifi className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-slate-500 block text-[10px]">Telemetry API</span>
              <span className="font-mono text-slate-200 font-semibold">POST /api/telemetry</span>
            </div>
          </div>
        </div>

        {/* Code Viewer Container */}
        <div className="flex-1 min-h-0 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
          <pre className="h-full overflow-y-auto p-4 font-mono text-xs text-slate-300 leading-relaxed select-all">
            <code>{esp32Code}</code>
          </pre>
        </div>

      </div>
    </div>
  );
}
