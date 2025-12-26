/**
 * GEO Visualizations Module
 *
 * Provides "wow factor" visualizations for GEO analysis:
 * - AI Visibility Radar: Shows visibility across AI platforms
 * - What AI Sees: Shows how AI parses and evaluates content
 * - E-E-A-T Dashboard: Experience, Expertise, Authority, Trust signals
 * - Freshness Timeline: Content freshness visualization
 */

// ═══════════════════════════════════════════════════════════════════════════════
// AI VISIBILITY RADAR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AI Visibility Radar Visualization
 * Shows predicted visibility across different AI platforms
 */
export class AIVisibilityRadar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.platforms = [
      { name: 'ChatGPT', angle: -90, color: '#10a37f', icon: '\uD83E\uDD16' },
      { name: 'Perplexity', angle: -18, color: '#5436DA', icon: '\uD83D\uDD2E' },
      { name: 'Claude', angle: 54, color: '#d97706', icon: '\uD83E\uDDE0' },
      { name: 'Gemini', angle: 126, color: '#4285f4', icon: '\u2728' },
      { name: 'Copilot', angle: 198, color: '#0078d4', icon: '\uD83D\uDCA1' },
    ];
    this.size = 320;
    this.center = this.size / 2;
    this.maxRadius = this.center - 50;
  }

  /**
   * Calculate platform-specific scores from GEO results
   */
  calculatePlatformScores(geoResults, crawlAccess) {
    const baseScore = (geoResults.score / 800) * 100;
    const botAccess = crawlAccess || {};

    return {
      chatgpt: this.calculatePlatformScore(baseScore, botAccess.oaiSearchBot?.allowed !== false, 1.0),
      perplexity: this.calculatePlatformScore(baseScore, botAccess.perplexityBot?.allowed !== false, 0.95),
      claude: this.calculatePlatformScore(baseScore, botAccess.claudeBot?.allowed !== false, 0.9),
      gemini: this.calculatePlatformScore(baseScore, botAccess.googleExtended?.allowed !== false, 0.85),
      copilot: this.calculatePlatformScore(baseScore, botAccess.gptBot?.allowed !== false, 0.88),
    };
  }

  calculatePlatformScore(baseScore, isAllowed, multiplier) {
    if (!isAllowed) return Math.round(baseScore * 0.1); // Blocked = very low
    return Math.round(baseScore * multiplier);
  }

  /**
   * Render the radar visualization
   */
  render(geoResults, crawlAccess) {
    if (!this.container) return;

    const scores = this.calculatePlatformScores(geoResults, crawlAccess);
    const svg = this.createSVG();

    // Draw background circles (grid)
    for (let i = 1; i <= 4; i++) {
      svg.appendChild(this.createCircle(
        this.center, this.center,
        (this.maxRadius / 4) * i,
        'none',
        'rgba(201, 169, 110, 0.2)',
        1
      ));
    }

    // Draw score labels
    [25, 50, 75, 100].forEach((score, i) => {
      const y = this.center - ((this.maxRadius / 4) * (i + 1));
      const label = this.createText(this.center + 5, y + 4, score.toString(), 'rgba(45, 42, 38, 0.4)', 10);
      svg.appendChild(label);
    });

    // Draw axes and labels
    this.platforms.forEach((platform, i) => {
      const endpoint = this.polarToCartesian(platform.angle, this.maxRadius);
      svg.appendChild(this.createLine(
        this.center, this.center,
        endpoint.x, endpoint.y,
        'rgba(45, 42, 38, 0.1)'
      ));

      // Platform label
      const labelRadius = this.maxRadius + 30;
      const labelPos = this.polarToCartesian(platform.angle, labelRadius);
      const labelGroup = this.createPlatformLabel(platform, labelPos, scores[platform.name.toLowerCase()]);
      svg.appendChild(labelGroup);
    });

    // Draw optimal polygon (100% for all)
    const optimalPoints = this.platforms.map(platform =>
      this.polarToCartesian(platform.angle, this.maxRadius)
    );
    svg.appendChild(this.createPolygon(optimalPoints, 'none', 'rgba(201, 169, 110, 0.3)', 1, '4,4'));

    // Draw actual score polygon
    const actualPoints = this.platforms.map(platform => {
      const score = scores[platform.name.toLowerCase()] || 0;
      const radius = (score / 100) * this.maxRadius;
      return this.polarToCartesian(platform.angle, radius);
    });
    svg.appendChild(this.createPolygon(actualPoints, 'rgba(201, 169, 110, 0.25)', '#c9a96e', 2));

    // Draw score dots
    actualPoints.forEach((point, i) => {
      const platform = this.platforms[i];
      svg.appendChild(this.createCircle(
        point.x, point.y, 6,
        platform.color, '#fff', 2
      ));
    });

    // Clear and render
    this.container.innerHTML = '';
    this.container.appendChild(svg);

    // Add legend
    this.container.appendChild(this.createLegend(scores));
  }

  polarToCartesian(angleDeg, radius) {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: this.center + radius * Math.cos(angleRad),
      y: this.center + radius * Math.sin(angleRad),
    };
  }

  createSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
    svg.setAttribute('class', 'ai-radar-svg');
    svg.style.width = '100%';
    svg.style.maxWidth = `${this.size}px`;
    return svg;
  }

  createCircle(cx, cy, r, fill, stroke, strokeWidth) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', fill || 'none');
    circle.setAttribute('stroke', stroke || 'none');
    circle.setAttribute('stroke-width', strokeWidth || 1);
    return circle;
  }

  createLine(x1, y1, x2, y2, stroke) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', 1);
    return line;
  }

  createPolygon(points, fill, stroke, strokeWidth, dashArray) {
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '));
    polygon.setAttribute('fill', fill);
    polygon.setAttribute('stroke', stroke);
    polygon.setAttribute('stroke-width', strokeWidth);
    if (dashArray) polygon.setAttribute('stroke-dasharray', dashArray);
    polygon.classList.add('radar-polygon');
    return polygon;
  }

  createText(x, y, text, fill, fontSize) {
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', x);
    textEl.setAttribute('y', y);
    textEl.setAttribute('fill', fill || '#2d2a26');
    textEl.setAttribute('font-size', fontSize || 12);
    textEl.setAttribute('font-family', 'system-ui, sans-serif');
    textEl.textContent = text;
    return textEl;
  }

  createPlatformLabel(platform, pos, score) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Adjust text anchor based on position
    let anchor = 'middle';
    let dx = 0;
    if (pos.x < this.center - 20) {
      anchor = 'end';
      dx = -5;
    } else if (pos.x > this.center + 20) {
      anchor = 'start';
      dx = 5;
    }

    const text = this.createText(pos.x + dx, pos.y, `${platform.icon} ${platform.name}`, platform.color, 11);
    text.setAttribute('text-anchor', anchor);
    text.setAttribute('font-weight', '500');
    group.appendChild(text);

    // Score below
    const scoreText = this.createText(pos.x + dx, pos.y + 14, `${score}%`, platform.color, 10);
    scoreText.setAttribute('text-anchor', anchor);
    scoreText.setAttribute('font-weight', '600');
    group.appendChild(scoreText);

    return group;
  }

  createLegend(scores) {
    const legend = document.createElement('div');
    legend.className = 'radar-legend';

    const avgScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length);

    legend.innerHTML = `
      <div class="legend-header">
        <span class="legend-title">Average AI Visibility</span>
        <span class="legend-avg-score" style="color: ${this.getScoreColor(avgScore)}">${avgScore}%</span>
      </div>
      <div class="legend-items">
        ${this.platforms.map(p => {
          const score = scores[p.name.toLowerCase()];
          return `
            <div class="legend-item">
              <span class="legend-icon">${p.icon}</span>
              <span class="legend-name">${p.name}</span>
              <span class="legend-score" style="color: ${this.getScoreColor(score)}">${score}%</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
    return legend;
  }

  getScoreColor(score) {
    if (score >= 70) return '#22c55e';
    if (score >= 50) return '#eab308';
    return '#ef4444';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHAT AI SEES VIEW
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * What AI Sees Visualization
 * Shows how AI parses and evaluates page content
 */
export class WhatAISeesView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  /**
   * Render the visualization
   */
  render(contentAnalysis) {
    if (!this.container || !contentAnalysis) return;

    const quotables = contentAnalysis.quotableSentences || [];
    const uncitables = contentAnalysis.uncitableContent || [];
    const freshness = contentAnalysis.freshness || {};
    const depth = contentAnalysis.depth || {};

    this.container.innerHTML = `
      <div class="what-ai-sees">
        <div class="ai-sees-header">
          <h3>What AI Sees</h3>
          <span class="ai-sees-help" title="How AI search engines parse and evaluate your content">?</span>
        </div>

        <div class="ai-sees-metrics">
          <div class="metric-card">
            <div class="metric-value">${depth.wordCount || 0}</div>
            <div class="metric-label">Words</div>
            <div class="metric-status ${depth.status === 'comprehensive' || depth.status === 'thorough' ? 'good' : depth.status === 'substantial' ? 'fair' : 'poor'}">
              ${depth.status || 'Unknown'}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${quotables.length}</div>
            <div class="metric-label">Quotables</div>
            <div class="metric-status ${quotables.length >= 5 ? 'good' : quotables.length >= 2 ? 'fair' : 'poor'}">
              ${quotables.length >= 5 ? 'Strong' : quotables.length >= 2 ? 'Fair' : 'Weak'}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${freshness.daysSinceUpdate || '?'}</div>
            <div class="metric-label">Days Old</div>
            <div class="metric-status ${freshness.isWithin30Days ? 'good' : freshness.isWithin90Days ? 'fair' : 'poor'}">
              ${freshness.status || 'Unknown'}
            </div>
          </div>
        </div>

        ${quotables.length > 0 ? `
          <div class="quotable-section">
            <h4>Quotable Sentences</h4>
            <p class="section-desc">AI systems are likely to cite these sentences</p>
            <div class="quotable-list">
              ${quotables.slice(0, 5).map(q => `
                <div class="quotable-item">
                  <span class="quote-icon">\u275D</span>
                  <div class="quote-content">
                    <span class="quote-text">${this.escapeHtml(q.text)}</span>
                    <div class="quote-reasons">
                      ${(q.reasons || []).map(r => `<span class="quote-reason">${r}</span>`).join('')}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="quotable-section empty">
            <h4>No Quotable Sentences Found</h4>
            <p class="section-desc">Add specific facts, statistics, or citations to create quotable content</p>
          </div>
        `}

        ${uncitables.length > 0 ? `
          <div class="uncitable-section">
            <h4>Uncitable Content</h4>
            <p class="section-desc">Vague phrases that AI won't quote</p>
            <div class="uncitable-tags">
              ${uncitables.slice(0, 10).map(u => `
                <span class="uncitable-tag">"${this.escapeHtml(u)}"</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// E-E-A-T DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * E-E-A-T Dashboard
 * Shows Experience, Expertise, Authority, Trust signals
 */
export class EEATDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.dimensions = ['experience', 'expertise', 'authority', 'trust'];
    this.colors = {
      experience: '#22c55e',
      expertise: '#3b82f6',
      authority: '#8b5cf6',
      trust: '#f59e0b',
    };
  }

  /**
   * Render the E-E-A-T dashboard
   */
  render(eeatData) {
    if (!this.container) return;

    const scores = this.calculateScores(eeatData);

    this.container.innerHTML = `
      <div class="eeat-dashboard">
        <h3 class="eeat-title">E-E-A-T Signals</h3>
        <div class="eeat-cards">
          ${this.dimensions.map(dim => this.renderCard(dim, scores[dim], eeatData?.[dim])).join('')}
        </div>
      </div>
    `;
  }

  calculateScores(eeatData) {
    const scores = {};
    this.dimensions.forEach(dim => {
      const data = eeatData?.[dim];
      if (data && data.count !== undefined) {
        // Scale count to percentage (max 5 signals = 100%)
        scores[dim] = Math.min(100, (data.count / 5) * 100);
      } else {
        scores[dim] = 0;
      }
    });
    return scores;
  }

  renderCard(dimension, score, data) {
    const displayName = dimension.charAt(0).toUpperCase() + dimension.slice(1);
    const signals = data?.signals || [];

    return `
      <div class="eeat-card">
        <div class="eeat-card-header">
          <span class="eeat-card-title">${displayName}</span>
          <span class="eeat-card-score" style="color: ${this.getScoreColor(score)}">${Math.round(score)}%</span>
        </div>
        <div class="eeat-bar">
          <div class="eeat-bar-fill" style="width: ${score}%; background: ${this.colors[dimension]}"></div>
        </div>
        <div class="eeat-signals">
          ${signals.length > 0 ? signals.slice(0, 3).map(s => `
            <div class="eeat-signal pass">
              <span class="signal-icon">\u2713</span>
              <span class="signal-text">${s.name}</span>
            </div>
          `).join('') : `
            <div class="eeat-signal empty">
              <span class="signal-icon">\u2717</span>
              <span class="signal-text">No signals detected</span>
            </div>
          `}
        </div>
      </div>
    `;
  }

  getScoreColor(score) {
    if (score >= 60) return '#22c55e';
    if (score >= 30) return '#eab308';
    return '#ef4444';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FRESHNESS TIMELINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Freshness Timeline
 * Shows content freshness relative to 30-day citation window
 */
export class FreshnessTimeline {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  /**
   * Render the freshness timeline
   */
  render(freshnessData) {
    if (!this.container || !freshnessData) return;

    const daysOld = freshnessData.daysSinceUpdate || null;
    const status = freshnessData.status || 'unknown';
    const position = daysOld ? Math.min(100, (daysOld / 180) * 100) : 100;

    this.container.innerHTML = `
      <div class="freshness-timeline">
        <h4 class="freshness-title">Content Freshness</h4>

        <div class="timeline-container">
          <div class="timeline-track">
            <div class="timeline-zone fresh" style="width: 16.67%"></div>
            <div class="timeline-zone recent" style="width: 33.33%"></div>
            <div class="timeline-zone stale" style="width: 50%"></div>
          </div>
          <div class="timeline-labels">
            <span>Today</span>
            <span>30 days</span>
            <span>90 days</span>
            <span>180+ days</span>
          </div>
          ${daysOld !== null ? `
            <div class="timeline-marker" style="left: ${position}%">
              <div class="marker-dot"></div>
              <div class="marker-label">${daysOld} days</div>
            </div>
          ` : ''}
        </div>

        <div class="freshness-insight ${status}">
          <span class="insight-icon">${status === 'fresh' ? '\uD83D\uDFE2' : status === 'recent' ? '\uD83D\uDFE1' : '\uD83D\uDD34'}</span>
          <div class="insight-content">
            <strong>${this.getStatusMessage(status)}</strong>
            <p>${freshnessData.benchmark || '76.4% of top-cited pages updated within 30 days'}</p>
          </div>
        </div>

        ${freshnessData.recommendation ? `
          <div class="freshness-tip">
            <span class="tip-icon">\uD83D\uDCA1</span>
            <span class="tip-text">${freshnessData.recommendation}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  getStatusMessage(status) {
    switch (status) {
      case 'fresh': return 'Content is fresh - within optimal 30-day window';
      case 'recent': return 'Content is recent but aging';
      case 'aging': return 'Content is aging - consider updating';
      case 'stale': return 'Content is stale - update recommended';
      default: return 'Freshness unknown - add visible dates';
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  AIVisibilityRadar,
  WhatAISeesView,
  EEATDashboard,
  FreshnessTimeline,
};
