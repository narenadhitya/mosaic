import React, { useState, useEffect, useMemo } from 'react';
import TransactionDetailModal from '../components/TransactionDetailModal';
import { formatPaiseToRupees } from '../utils/formatters';
import { 
  Network, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  RotateCcw, 
  Activity, 
  Info, 
  Users, 
  ArrowRight,
  Eye,
  CheckCircle2
} from 'lucide-react';

export default function GraphView() {
  const [fraudActive, setFraudActive] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  const fetchGraph = (fraud) => {
    setLoading(true);
    fetch(`/api/graph?fraud_scenario=${fraud}`)
      .then(res => res.json())
      .then(data => {
        setGraphData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGraph(fraudActive);
  }, [fraudActive]);

  // Compute 2D coordinates for SVG Star / Twin-Hub Network Layout
  const layout = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };

    const width = 800;
    const height = 480;
    const nodeCoords = new Map();

    const trustedVpa = 'sunrise.society@hdfcbank';
    const attackerVpa = 'maintenance.sunrise@icici';

    if (!fraudActive) {
      // 1. Single Star Topology
      // Trusted VPA at center (400, 240)
      nodeCoords.set(trustedVpa, { x: 400, y: 240 });

      // Resident nodes in outer orbit (radius 180)
      const residents = graphData.nodes.filter(n => n.type === 'resident');
      residents.forEach((r, idx) => {
        const angle = (idx / residents.length) * 2 * Math.PI - Math.PI / 2;
        const x = 400 + Math.cos(angle) * 190;
        const y = 240 + Math.sin(angle) * 170;
        nodeCoords.set(r.id, { x, y });
      });

      // Payment nodes in mid orbit (radius 100)
      const payments = graphData.nodes.filter(n => n.type.startsWith('payment'));
      payments.forEach((p, idx) => {
        const angle = (idx / Math.max(payments.length, 1)) * 2 * Math.PI - Math.PI / 3;
        const x = 400 + Math.cos(angle) * 105;
        const y = 240 + Math.sin(angle) * 95;
        nodeCoords.set(p.id, { x, y });
      });
    } else {
      // 2. Twin-Hub Fraud Topology (Split Star & Attack Convergence)
      // Trusted Hub at (240, 240)
      nodeCoords.set(trustedVpa, { x: 230, y: 240 });
      // Attacker Hub at (570, 240)
      nodeCoords.set(attackerVpa, { x: 570, y: 240 });

      // Separate payments into legit vs fraud
      const legitPayments = graphData.nodes.filter(n => n.type === 'payment' && !n.is_anomaly);
      legitPayments.forEach((p, idx) => {
        const angle = Math.PI * 0.5 + (idx * 0.8);
        const x = 230 + Math.cos(angle) * 90;
        const y = 240 + Math.sin(angle) * 85;
        nodeCoords.set(p.id, { x, y });
      });

      const fraudPayments = graphData.nodes.filter(n => n.is_anomaly && n.type.startsWith('payment'));
      fraudPayments.forEach((p, idx) => {
        const angle = (idx / Math.max(fraudPayments.length, 1)) * 2 * Math.PI - Math.PI / 2;
        const x = 570 + Math.cos(angle) * 110;
        const y = 240 + Math.sin(angle) * 100;
        nodeCoords.set(p.id, { x, y });
      });

      // Residents positioned on periphery
      const residents = graphData.nodes.filter(n => n.type === 'resident');
      residents.forEach((r, idx) => {
        const isAffected = graphData.anomalies.some(a => a.affected_nodes?.includes(r.id));
        if (isAffected) {
          // Cluster around attacker right
          const angle = (idx / residents.length) * 2 * Math.PI;
          const x = 570 + Math.cos(angle) * 185;
          const y = 240 + Math.sin(angle) * 170;
          nodeCoords.set(r.id, { x, y });
        } else {
          // Cluster on left around trusted
          const angle = Math.PI * 0.6 + (idx * 0.5);
          const x = 230 + Math.cos(angle) * 180;
          const y = 240 + Math.sin(angle) * 150;
          nodeCoords.set(r.id, { x, y });
        }
      });
    }

    const positionedNodes = graphData.nodes.map(n => ({
      ...n,
      ...(nodeCoords.get(n.id) || { x: 400, y: 240 })
    }));

    const positionedLinks = graphData.links.map(l => {
      const source = nodeCoords.get(l.source) || { x: 400, y: 240 };
      const target = nodeCoords.get(l.target) || { x: 400, y: 240 };
      return {
        ...l,
        x1: source.x,
        y1: source.y,
        x2: target.x,
        y2: target.y
      };
    });

    return { nodes: positionedNodes, links: positionedLinks };
  }, [graphData, fraudActive]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-500/30">
              Innovation 1
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Payment Knowledge Graph
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Structural network intelligence: Treats financial transactions as graph topology (Resident &rarr; Payment &rarr; VPA).
          </p>
        </div>

        {/* Fraud Scenario Trigger Button */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-xl">
          <div className="text-xs">
            <div className="font-semibold text-slate-200">Demo Scenario Mode</div>
            <div className="text-[11px] text-slate-400">
              {fraudActive ? '6 Payee Spoofs Injected' : 'Healthy Star Topology'}
            </div>
          </div>
          <button
            onClick={() => setFraudActive(!fraudActive)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 ${
              fraudActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 ring-2 ring-rose-400/40 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {fraudActive ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Clean Star
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                Trigger Fraud Scenario
              </>
            )}
          </button>
        </div>
      </div>

      {/* Network Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="text-slate-400 uppercase tracking-wider text-[10px] mb-1">Topology Health</div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${fraudActive ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`}></span>
            <span className={`font-bold ${fraudActive ? 'text-rose-400' : 'text-emerald-400'}`}>
              {graphData?.metrics?.topology_status || 'ANALYZING...'}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="text-slate-400 uppercase tracking-wider text-[10px] mb-1">Structural Anomalies</div>
          <div className="text-lg font-bold text-white">
            {graphData?.anomalies?.length || 0}
            <span className="text-xs font-normal text-slate-400 ml-1">detected</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="text-slate-400 uppercase tracking-wider text-[10px] mb-1">Network Density</div>
          <div className="text-lg font-bold text-slate-200">
            {layout.nodes.length} <span className="text-xs font-normal text-slate-400">nodes</span> / {layout.links.length} <span className="text-xs font-normal text-slate-400">edges</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="text-slate-400 uppercase tracking-wider text-[10px] mb-1">Confidence Score</div>
          <div className="text-lg font-bold text-emerald-400">
            {graphData?.metrics?.health_score || 100}%
          </div>
        </div>
      </div>

      {/* Interactive Graph Canvas Area */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 overflow-hidden relative shadow-2xl">
        {/* Graph Canvas Header & Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2 px-2 text-xs">
          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300"></span>
              <span>Trusted VPA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500 border border-indigo-300"></span>
              <span>Resident</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300"></span>
              <span>Payment</span>
            </div>
            {fraudActive && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-300 animate-pulse"></span>
                <span className="text-rose-400 font-semibold">Attacker VPA / Compromised Edge</span>
              </div>
            )}
          </div>
          <div className="text-[11px] text-slate-400 italic">
            Click any payment node to inspect transaction trace & ledger
          </div>
        </div>

        {/* SVG Visualization */}
        <div className="w-full flex justify-center items-center py-2">
          <svg
            viewBox="0 0 800 480"
            className="w-full max-w-4xl h-auto select-none"
            style={{ minHeight: '400px' }}
          >
            <defs>
              {/* Arrow Markers */}
              <marker id="arrow-normal" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
              </marker>
              <marker id="arrow-anomaly" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
              </marker>

              {/* Glowing Filters */}
              <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
            <rect width="800" height="480" fill="url(#grid)" />

            {/* Directed Edges */}
            {layout.links.map((link, idx) => (
              <g key={idx}>
                <line
                  x1={link.x1}
                  y1={link.y1}
                  x2={link.x2}
                  y2={link.y2}
                  stroke={link.is_anomaly ? '#f43f5e' : '#475569'}
                  strokeWidth={link.is_anomaly ? 2 : 1.2}
                  strokeDasharray={link.is_anomaly ? '4 2' : 'none'}
                  strokeOpacity={link.is_anomaly ? 0.9 : 0.6}
                  markerEnd={link.is_anomaly ? 'url(#arrow-anomaly)' : 'url(#arrow-normal)'}
                  className={link.is_anomaly ? 'animate-pulse' : ''}
                />
              </g>
            ))}

            {/* Nodes */}
            {layout.nodes.map((node) => {
              const isVpa = node.type.startsWith('vpa');
              const isResident = node.type === 'resident';
              const isPayment = node.type.startsWith('payment');
              const isAnom = node.is_anomaly;

              let fillColor = '#6366f1'; // blue resident
              let radius = 16;
              let filter = 'none';

              if (node.id === 'sunrise.society@hdfcbank') {
                fillColor = '#10b981'; // green trusted
                radius = 28;
                filter = 'url(#glow-green)';
              } else if (node.id === 'maintenance.sunrise@icici') {
                fillColor = '#f43f5e'; // red attacker
                radius = 28;
                filter = 'url(#glow-red)';
              } else if (isPayment) {
                fillColor = isAnom ? '#e11d48' : '#f59e0b'; // red vs amber payment
                radius = 14;
              } else if (isResident) {
                fillColor = isAnom ? '#fb7185' : '#4f46e5';
                radius = 16;
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => {
                    if (node.payment_id) setSelectedTxId(node.payment_id);
                  }}
                >
                  {/* Outer Pulsing Ring for Anomalies */}
                  {isAnom && (
                    <circle
                      r={radius + 8}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      strokeOpacity="0.4"
                      className="animate-ping"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={radius}
                    fill={fillColor}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    filter={filter}
                    className="shadow-md"
                  />

                  {/* Node Label Text */}
                  <text
                    y={radius + 14}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize={isVpa ? '11px' : '9px'}
                    fontWeight={isVpa ? 'bold' : 'normal'}
                    fontFamily="monospace"
                    className="pointer-events-none drop-shadow"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover Tooltip Card */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 z-30 pointer-events-none max-w-xs backdrop-blur-md">
            <div className="font-bold text-white flex items-center gap-1.5">
              {hoveredNode.is_anomaly ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              {hoveredNode.label}
            </div>
            <div className="text-slate-400 font-mono text-[11px]">{hoveredNode.id}</div>
            {hoveredNode.payment_id && (
              <div className="text-[11px] text-indigo-300 font-medium">
                Amount: {formatPaiseToRupees(hoveredNode.amount_paise, true)} &bull; Click to view trace
              </div>
            )}
            {hoveredNode.is_anomaly && (
              <div className="text-[10px] text-rose-400 font-semibold bg-rose-500/10 px-1.5 py-0.5 rounded">
                Structural Anomaly In Network Path
              </div>
            )}
          </div>
        )}
      </div>

      {/* Structural Anomaly Findings Panel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400" />
            Graph Structural Intelligence Findings
          </h2>
          <span className="text-xs text-slate-400">
            {graphData?.anomalies?.length || 0} findings detected
          </span>
        </div>

        {graphData?.anomalies?.length === 0 ? (
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
            <div>
              <div className="font-bold text-sm">Star Topology Intact & Verified</div>
              <div className="text-xs text-emerald-200/80 mt-0.5">
                All resident payment edges converge directly onto registered trusted society VPA ({graphData?.metrics?.trusted_vpa}). Zero payee substitution detected.
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {graphData?.anomalies?.map((a, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-rose-500/30 space-y-2 shadow-lg relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      a.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {a.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{a.type}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {a.affected_payers_count} affected
                  </span>
                </div>

                <div className="font-bold text-sm text-white">{a.title}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{a.description}</p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Destination: <span className="text-rose-400 font-semibold">{a.affected_vpa}</span></span>
                  <span className="text-slate-500">IS 19671 Target Rule</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Trace Modal */}
      {selectedTxId && (
        <TransactionDetailModal
          paymentId={selectedTxId}
          onClose={() => setSelectedTxId(null)}
        />
      )}
    </div>
  );
}
