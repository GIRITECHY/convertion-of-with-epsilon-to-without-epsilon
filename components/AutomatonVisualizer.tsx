
import React, { useEffect, useRef, useMemo } from 'react';
import { 
  select, 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCenter, 
  forceCollide, 
  drag,
  SimulationNodeDatum,
  SimulationLinkDatum
} from 'd3';
import { Automaton } from '../types';

interface Props {
  automaton: Automaton;
  id: string;
  title: string;
}

interface NodeData extends SimulationNodeDatum {
  id: string;
}

interface LinkData extends SimulationLinkDatum<NodeData> {
  source: string | NodeData;
  target: string | NodeData;
  symbols: string[];
}

const SYMBOL_COLORS: Record<string, string> = {
  '0': '#1e293b', 
  '1': '#10b981', 
  'a': '#6366f1', 
  'b': '#f43f5e', 
  'ε': '#64748b',
  '': '#64748b',
};

const getSymbolColor = (s: string) => SYMBOL_COLORS[s] || '#64748b';

const AutomatonVisualizer: React.FC<Props> = ({ automaton, id, title }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Use a ref to store node positions across re-renders to prevent "exploding" graph
  const nodesRef = useRef<NodeData[]>([]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 900;
    const height = 600;
    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    // Prepare Data
    // We try to keep existing positions if the state names match
    const newNodes: NodeData[] = automaton.states.map(s => {
      const existing = nodesRef.current.find(n => n.id === s);
      return existing ? { ...existing } : { id: s, x: width / 2 + (Math.random() - 0.5) * 100, y: height / 2 + (Math.random() - 0.5) * 100 };
    });
    nodesRef.current = newNodes;

    const linkMap = new Map<string, string[]>();
    automaton.transitions.forEach(t => {
      const key = `${t.from}->${t.to}`;
      if (!linkMap.has(key)) linkMap.set(key, []);
      linkMap.get(key)!.push(t.symbol || "ε");
    });

    const links: LinkData[] = Array.from(linkMap.entries()).map(([key, symbols]) => {
      const [source, target] = key.split("->");
      return { source, target, symbols };
    });

    // Define Arrow Marker
    const defs = svg.append("defs");
    defs.append("marker")
      .attr("id", `arrowhead-${id}`)
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 32) // Distance from center of target node
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#94a3b8");

    // Force Simulation
    const simulation = forceSimulation<NodeData>(newNodes)
      .force("link", forceLink<NodeData, LinkData>(links).id(d => d.id).distance(180))
      .force("charge", forceManyBody().strength(-1000))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collision", forceCollide().radius(60));

    // Link Elements
    const linkGroup = svg.append("g").attr("class", "links");
    
    const link = linkGroup.selectAll("path")
      .data(links)
      .enter().append("path")
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      .attr("marker-end", `url(#arrowhead-${id})`);

    const linkLabel = svg.append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(links)
      .enter().append("text")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .attr("text-anchor", "middle")
      .each(function(d) {
        const el = select(this as any);
        d.symbols.forEach((s, i) => {
          el.append("tspan")
            .text(s)
            .attr("fill", getSymbolColor(s))
            .style("font-weight", "800");
          if (i < d.symbols.length - 1) {
            el.append("tspan").text(", ").attr("fill", "#cbd5e1");
          }
        });
      });

    // Node Elements
    const nodeGroup = svg.append("g").attr("class", "nodes");
    
    const node = nodeGroup.selectAll("g")
      .data(newNodes)
      .enter().append("g")
      .call(drag<any, NodeData>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Circle styling matching the "right" screenshot
    node.each(function(d) {
      const g = select(this as any);
      const isInitial = d.id === automaton.initialState;
      const isFinal = automaton.finalStates.includes(d.id);

      if (isFinal) {
        // Double circle for final state
        g.append("circle")
          .attr("r", 32)
          .attr("fill", isInitial ? "#dcfce7" : "#fff")
          .attr("stroke", isInitial ? "#10b981" : "#475569")
          .attr("stroke-width", 2);
        
        g.append("circle")
          .attr("r", 26)
          .attr("fill", "none")
          .attr("stroke", isInitial ? "#10b981" : "#475569")
          .attr("stroke-width", 1.5);
      } else {
        g.append("circle")
          .attr("r", 32)
          .attr("fill", isInitial ? "#dcfce7" : "#fff")
          .attr("stroke", isInitial ? "#10b981" : "#475569")
          .attr("stroke-width", 2.5);
      }
    });

    node.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#1e293b")
      .attr("font-size", "18px")
      .attr("font-weight", "700")
      .text(d => d.id);

    // Update positions on each tick
    simulation.on("tick", () => {
      link.attr("d", d => {
        const source = d.source as any;
        const target = d.target as any;
        if (source.id === target.id) {
          const x = source.x;
          const y = source.y;
          const dr = 30; 
          return `M${x + 20},${y - 20} C${x + 60},${y - 60} ${x - 20},${y - 60} ${x - 20},${y - 20}`;
        }
        const dx = target.x - source.x,
              dy = target.y - source.y,
              dr = Math.sqrt(dx * dx + dy * dy);
        return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
      });

      linkLabel.attr("transform", d => {
        const source = d.source as any;
        const target = d.target as any;
        if (source.id === target.id) {
           return `translate(${source.x + 20}, ${source.y - 70})`;
        }
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const angle = Math.atan2(dy, dx);
        const offset = -35;
        return `translate(${midX + Math.cos(angle + Math.PI/2) * offset}, ${midY + Math.sin(angle + Math.PI/2) * offset})`;
      });

      node.attr("transform", d => `translate(${d.x}, ${d.y})`);
    });

    // Fix: d3.Simulation.stop() returns the simulation instance. 
    // React's EffectCallback Destructor must return void.
    return () => {
      simulation.stop();
    };
  }, [automaton, id]);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">{title}</h3>
        <div className="flex gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-100 border-2 border-green-500"></div>
            <span>Start</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white border-2 border-slate-600 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full border border-slate-600"></div>
            </div>
            <span>Final</span>
          </div>
        </div>
      </div>
      
      <div className="relative border border-slate-100 rounded-2xl overflow-hidden bg-[#f8fafc] shadow-inner cursor-move group">
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-400 border border-slate-200 pointer-events-none">
          DRAG TO REARRANGE
        </div>
        <svg 
          ref={svgRef} 
          width="100%" 
          height="600" 
          viewBox="0 0 900 600" 
          preserveAspectRatio="xMidYMid meet" 
          className="w-full h-full"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-8">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
             <div className="w-2 h-2 rounded-full bg-blue-600"></div> Symbol '0'
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Symbol '1'
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
             <div className="w-2 h-2 rounded-full bg-slate-400"></div> Symbol 'ε'
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomatonVisualizer;
