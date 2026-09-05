/* ==========================================================================
   Figures drawn for this site
   These are authored rather than screenshotted, so they inherit the theme
   and stay sharp at any size. Every number in them comes from the project
   write-ups, not from illustration.
   ========================================================================== */

window.KP = window.KP || {};

KP.FIGURES = {

  /* The out-of-order datapath, redrawn from the project's own block diagram. */
  pipeline: () => `
  <figure class="figure">
    <svg viewBox="0 0 900 300" role="img"
         aria-label="Out-of-order pipeline: fetch and decode feed reservation stations, which issue to execution units, broadcast on the common data bus, and retire in order through the reorder buffer">
      <defs>
        <marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0 0l6 3-6 3z" fill="currentColor"/>
        </marker>
      </defs>

      <rect class="dg-box" x="16"  y="120" width="96" height="52" rx="3"/>
      <rect class="dg-box" x="146" y="120" width="106" height="52" rx="3"/>

      <rect class="dg-box" x="292" y="34"  width="120" height="44" rx="3"/>
      <rect class="dg-box" x="292" y="122" width="120" height="44" rx="3"/>
      <rect class="dg-box" x="292" y="210" width="120" height="44" rx="3"/>

      <rect class="dg-box" x="452" y="34"  width="86" height="44" rx="3"/>
      <rect class="dg-box" x="452" y="122" width="86" height="44" rx="3"/>
      <rect class="dg-box" x="452" y="210" width="86" height="44" rx="3"/>

      <rect class="dg-box--hot" x="640" y="86" width="104" height="122" rx="3"/>
      <rect class="dg-box" x="782" y="120" width="102" height="52" rx="3"/>

      <g class="dg-line" marker-end="url(#ar)" color="var(--mid)">
        <path d="M112 146h26"/>
        <path d="M252 146h14v-90h18"/><path d="M252 146h32"/><path d="M252 146h14v98h18"/>
        <path d="M412 56h32"/><path d="M412 144h32"/><path d="M412 232h32"/>
      </g>
      <g class="dg-line--hot" marker-end="url(#ar)" color="var(--red)">
        <path d="M538 56h60v90h34"/><path d="M538 144h94"/><path d="M538 232h60v-86h34"/>
        <path d="M744 146h30"/>
      </g>

      <path class="dg-line--hot" d="M692 208v58H210v-88" marker-end="url(#ar)" color="var(--red)"
            stroke-dasharray="5 4"/>
      <text class="dg-text--hot" x="452" y="282" text-anchor="middle">early branch recovery — flush before commit</text>

      <path class="dg-line" d="M64 120V72h520v14" stroke-dasharray="4 4"/>
      <text class="dg-text--dim" x="324" y="66" text-anchor="middle">common data bus — results broadcast to waiting stations</text>

      <g class="dg-text" text-anchor="middle">
        <text x="64"  y="150">FETCH</text>
        <text x="199" y="143">DECODE</text><text x="199" y="157">+ RENAME</text>
        <text x="352" y="60">RESERVATION</text><text x="352" y="148">RESERVATION</text><text x="352" y="236">RESERVATION</text>
        <text x="495" y="60">ALU</text><text x="495" y="148">MUL</text><text x="495" y="236">LSU</text>
        <text x="692" y="143" fill="var(--red)">REORDER</text><text x="692" y="157" fill="var(--red)">BUFFER</text>
        <text x="833" y="150">COMMIT</text>
      </g>
      <g class="dg-text--dim" text-anchor="middle">
        <text x="64" y="190">GShare</text>
        <text x="692" y="226">in order</text>
        <text x="833" y="190">architectural state</text>
      </g>
    </svg>
    <figcaption>ISSUE OUT OF ORDER, RETIRE IN ORDER — REDRAWN FROM THE PROJECT'S BLOCK DIAGRAM</figcaption>
  </figure>`,

  /* What each optimisation actually bought, and what it cost. */
  gains: () => {
    const bars = [
      ['Early branch recovery', 20,  'IPC', true],
      ['Post-commit store buffer', 8.6, 'IPC', true],
      ['Area overhead', 20,  'AREA', false],
      ['Power overhead', 4,   'POWER', false]
    ];
    const max = 24, w = 560, x0 = 210, rowH = 46;
    const rows = bars.map(([label, val, , gain], i) => {
      const y = 40 + i * rowH;
      const len = (val / max) * w;
      return `
        <text class="dg-text" x="196" y="${y + 15}" text-anchor="end">${label}</text>
        <rect class="${gain ? 'dg-bar' : 'dg-bar--muted'}" x="${x0}" y="${y}" width="${len}" height="20" rx="2"/>
        <text class="dg-text${gain ? '--hot' : '--dim'}" x="${x0 + len + 10}" y="${y + 15}">${gain ? '+' : '+'}${val}%</text>`;
    }).join('');
    const ticks = [0, 5, 10, 15, 20].map((t) => {
      const x = x0 + (t / max) * w;
      return `<line class="dg-grid" x1="${x}" y1="30" x2="${x}" y2="${40 + bars.length * rowH - 12}"/>
              <text class="dg-text--dim" x="${x}" y="24" text-anchor="middle">${t}%</text>`;
    }).join('');
    return `
    <figure class="figure">
      <svg viewBox="0 0 840 ${60 + bars.length * rowH}" role="img"
           aria-label="Early branch recovery gained 20% IPC and the post-commit store buffer 8.6%, against 20% area and 4% power overhead">
        ${ticks}${rows}
      </svg>
      <figcaption>WHAT EACH OPTIMISATION BOUGHT (RED) AGAINST WHAT IT COST (GREY)</figcaption>
    </figure>`;
  },

  /* One pass over a price stream, updating four running values. */
  ohlc: () => `
  <figure class="figure">
    <svg viewBox="0 0 860 240" role="img"
         aria-label="Market messages stream through a parser into a compute path holding open, high, low and close, emitted when the window closes">
      <defs>
        <marker id="ar2" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0 0l6 3-6 3z" fill="currentColor"/>
        </marker>
      </defs>
      <g class="dg-line" color="var(--mid)">
        <path d="M20 60h44M84 60h44M148 60h44M212 60h44" marker-end="url(#ar2)"/>
      </g>
      <text class="dg-text--dim" x="20" y="44">market messages</text>

      <rect class="dg-box" x="272" y="34" width="104" height="52" rx="3"/>
      <rect class="dg-box" x="272" y="112" width="104" height="52" rx="3"/>
      <rect class="dg-box--hot" x="440" y="34" width="180" height="130" rx="3"/>
      <rect class="dg-box" x="684" y="72" width="150" height="52" rx="3"/>

      <g class="dg-line--hot" color="var(--red)" marker-end="url(#ar2)">
        <path d="M376 60h56"/><path d="M376 138h34v-70h22"/><path d="M620 98h56"/>
      </g>

      <g class="dg-text" text-anchor="middle">
        <text x="324" y="64">PARSER</text>
        <text x="324" y="142">CONTROL</text>
        <text x="530" y="60" fill="var(--red)">COMPUTE PATH</text>
        <text x="759" y="102">CANDLE OUT</text>
      </g>
      <g class="dg-text--dim" text-anchor="middle">
        <text x="530" y="86">open — first tick of the window</text>
        <text x="530" y="106">high — max so far</text>
        <text x="530" y="126">low — min so far</text>
        <text x="530" y="146">close — latest tick</text>
        <text x="324" y="182">window open / close</text>
      </g>
      <text class="dg-text--dim" x="430" y="222" text-anchor="middle">nothing is buffered — every value updates as the message arrives</text>
    </svg>
    <figcaption>ONE PASS, FOUR RUNNING VALUES, NO WINDOW BUFFER</figcaption>
  </figure>`
};
