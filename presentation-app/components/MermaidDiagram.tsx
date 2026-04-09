'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  id: string;
  themeId?: string;
  scale?: number;
}

export default function MermaidDiagram({ chart, id, themeId = 'default', scale = 1.0 }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Determine Mermaid theme based on presentation theme
    const isDarkTheme = ['dark', 'night', 'forest'].includes(themeId);
    const mermaidTheme = isDarkTheme ? 'dark' : 'default';

    // Initialize mermaid with configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      securityLevel: 'loose',
      fontFamily: 'inherit',
      fontSize: 16,
      themeVariables: isDarkTheme ? {
        primaryColor: '#4a9eff',
        primaryTextColor: '#fff',
        primaryBorderColor: '#7CB9E8',
        lineColor: '#B0C4DE',
        secondaryColor: '#7CB9E8',
        tertiaryColor: '#333',
        background: '#1a1a1a',
        mainBkg: '#2a2a2a',
        secondBkg: '#3a3a3a',
        edgeLabelBackground: '#1a1a1a',
        textColor: '#ffffff',
        nodeBorder: '#7CB9E8',
        clusterBkg: '#2a2a2a',
        clusterBorder: '#7CB9E8',
        defaultLinkColor: '#B0C4DE',
        titleColor: '#ffffff',
        nodeTextColor: '#ffffff',
      } : {},
    });

    const renderDiagram = async () => {
      try {
        // Generate unique ID for this diagram
        const diagramId = `mermaid-${id}`;

        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(diagramId, chart);
        setSvg(renderedSvg);
        setError('');
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Fehler beim Rendern des Diagramms');
      }
    };

    renderDiagram();
  }, [chart, id, themeId]);

  if (error) {
    return (
      <div className="mermaid-error p-4 bg-red-50 border border-red-300 rounded text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-diagram flex justify-center items-center my-8"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
