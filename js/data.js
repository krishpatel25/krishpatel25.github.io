/* ==========================================================================
   Project data
   One record per project. Everything the project pages render comes from
   here, so copy and figures live in one place rather than in the markup.
   Figures marked `drawn` are SVG authored for this site; `shots` are images
   from the original project write-ups.
   ========================================================================== */

window.KP = window.KP || {};

KP.WIX = 'https://static.wixstatic.com/media/';

KP.PROJECTS = {
  os391: {
    title: '391 Operating System',
    where: 'ECE 391 · UNIVERSITY OF ILLINOIS · C AND x86 ASSEMBLY',
    lead: 'A Unix-like kernel written from an empty file. It boots, drives the hardware, runs a read-only file system, and keeps <b>three terminals</b> alive at once.',
    demo: 'https://krishpatel25.github.io/unix-operating-system/',
    tryLabel: 'Run 391OS in your browser',
    facts: [
      ['TERMINALS', '3', true],
      ['MAX PROCESSES', '6'],
      ['SCHEDULER', 'Round-robin'],
      ['PAGING', '4KB / 4MB'],
      ['FILE SYSTEM', 'Read-only']
    ],
    stack: ['C', 'x86 Assembly', 'QEMU', 'gdb'],
    sections: [
      { key: 'HOW IT BOOTS',
        text: ['The kernel sets up its own <b>GDT and IDT</b> before anything else can run — the tables that tell the processor how memory is segmented and which handler to jump to when an interrupt fires. Paging comes next, mapping the kernel into a 4MB page and giving each user program its own 4KB-paged view of memory.',
               'From there it is a normal operating system problem: initialise the devices, set up the system call table, and hand control to a shell.'] },
      { key: 'DRIVERS',
        text: ['Three device drivers, all interrupt-driven rather than polled. The <b>keyboard</b> handler decodes scancodes and feeds a line buffer with backspace and tab completion. The <b>RTC</b> gives programs a periodic tick, which is what the animations use for timing. The <b>terminal</b> driver owns the video memory and swaps which of the three buffers is on screen.'] },
      { key: 'SCHEDULING',
        text: ['Each terminal keeps its own process control block, saved and restored through assembly linkage on every switch. A round-robin scheduler rotates between them fast enough that all three appear to run at once, and the shell on each terminal can nest programs up to <b>six deep</b>.'] }
    ],
    commands: [
      ['shell', 'The root program on each terminal. Can execute up to 6 programs.'],
      ['ls', 'Lists every file and directory stored in the VM.'],
      ['cat', 'Reads the contents of any file in the directory.'],
      ['grep', 'Searches for the given text across every file in the directory.'],
      ['hello', 'User-interactive program. Each terminal keeps its own interaction.'],
      ['counter', 'Counts to 100, 1,000 or 10,000.'],
      ['pingpong', 'RTC-driven animation. Cannot be exited.'],
      ['fish', 'Fish animation, driven by user video memory and the RTC.']
    ],
    keys: [
      ['Ctrl + L', 'Clears the screen'],
      ['Tab', 'Auto-completes the command'],
      ['Alt + F1 / F2 / F3', 'Swap between the three terminals'],
      ['Option + fn + F1 / F2 / F3', 'Swap terminals on macOS']
    ]
  },

  ooo: {
    title: 'Out-of-Order RISC-V Processor',
    where: 'ECE 411 · SYSTEMVERILOG · FLAGSHIP',
    flagship: true,
    lead: 'A five-stage out-of-order RISC-V core built on <b>Tomasulo’s algorithm</b>. Instructions issue when their operands are ready rather than in program order, and the reorder buffer puts the results back in order at commit.',
    facts: [
      ['IPC ON COREMARK', '0.7', true],
      ['BRANCH ACCURACY', 'up to 75%'],
      ['EARLY RECOVERY', '+20% IPC', true],
      ['STORE BUFFER', '+8.6% IPC'],
      ['AREA COST', '+20%'],
      ['POWER COST', '+4%']
    ],
    stack: ['SystemVerilog', 'VCS', 'Verilator', 'Verdi', 'CoreMark'],
    drawn: ['pipeline', 'gains'],
    sections: [
      { key: 'WHY OUT OF ORDER',
        text: ['An in-order pipeline stalls the moment an instruction is waiting on something — a cache miss, a slow multiply — even when the instructions behind it have everything they need. Tomasulo’s algorithm removes that constraint: instructions wait in <b>reservation stations</b> until their operands arrive on the common data bus, then issue.',
               'The cost is that results now finish out of order, and software cannot be allowed to see that. A <b>reorder buffer</b> holds completed results and retires them in program order, so from the outside the machine still looks sequential.'] },
      { key: 'SPECULATION AND RECOVERY',
        text: ['Branches are predicted with <b>GShare</b>, which indexes a table of two-bit counters by the branch address XORed with a global history register. On control-heavy workloads it reaches <b>up to 75%</b> accuracy.',
               'When a prediction is wrong the work behind it has to be thrown away. Doing that at commit is simple but slow; doing it <b>early</b>, as soon as the branch resolves, was worth <b>20% IPC</b> and is the single largest optimisation in the design.'] },
      { key: 'MEMORY',
        text: ['Split instruction and data caches, both four-way set associative with <b>PLRU</b> replacement. Stores are the awkward case: they cannot be allowed to change memory until they are known to be non-speculative. A <b>post-commit store buffer</b> lets committed stores drain in the background instead of blocking the commit stage, worth a further <b>8.6% IPC</b>.'] },
      { key: 'VERIFICATION',
        text: ['Directed tests for each hazard class, randomised instruction streams for everything else, and coverage points to show which corners had actually been reached. Benchmarked against <b>CoreMark, AES-SHA, FFT, mergesort and compression</b>, with Verdi waveforms whenever the model and the RTL disagreed.'] }
    ],
    shots: [
      [KP.WIX + '843f1e_7a0cd3025a83462583cf583b2ee8dc43~mv2.png/v1/fill/w_820,h_860,al_c,q_90/block.png', 'ORIGINAL MICROARCHITECTURE DIAGRAM'],
      [KP.WIX + '843f1e_f3eeeff67d7c4e1289b41275dd5ef9d9~mv2.png/v1/fill/w_900,h_556,al_c,q_90/benchmark.png', 'BENCHMARK RESULTS']
    ]
  },

  ohlc: {
    title: 'Hardware OHLC Generator',
    where: 'FPGA · SYSTEMVERILOG · AXI',
    lead: 'Open-High-Low-Close candles computed in hardware instead of software, for the part of trading where the latency budget is measured in microseconds.',
    facts: [
      ['INTERFACE', 'AXI'],
      ['STYLE', 'Streaming', true],
      ['OUTPUT', 'O/H/L/C']
    ],
    stack: ['SystemVerilog', 'AXI', 'FPGA'],
    drawn: ['ohlc'],
    sections: [
      { key: 'THE IDEA',
        text: ['A candle is the open, high, low and close of a price over a window. Computing one in software means buffering the window and walking it afterwards. In hardware you never have to: each message updates the four running values as it arrives, so the candle is finished the instant the window closes.'] },
      { key: 'STRUCTURE',
        text: ['A <b>parser</b> decodes incoming market messages in the stream, a <b>control unit</b> tracks the aggregation window and decides when to emit and reset, and the <b>compute path</b> holds the four values, comparing and replacing on every tick. A custom <b>AXI testbench</b> drives realistic traffic through it.'] }
    ]
  },

  mk: {
    title: 'Mortal Kombat on FPGA',
    where: 'FPGA · SoC DESIGN · SYSTEMVERILOG AND VIVADO',
    lead: 'A two-player fighting game built as a system-on-chip: custom RTL for the parts that must hit frame rate, a <b>MicroBlaze</b> soft processor for the parts that do not.',
    facts: [
      ['ON-CHIP MEMORY', '213 KiB', true],
      ['PLAYERS', '2'],
      ['DISPLAY', 'HDMI'],
      ['INPUT', 'USB keyboard'],
      ['PROCESSOR', 'MicroBlaze']
    ],
    stack: ['SystemVerilog', 'Vivado', 'Xilinx', 'MicroBlaze', 'SPI', 'AXI UART'],
    sections: [
      { key: 'WHERE THE LINE GOES',
        text: ['The interesting decision in an SoC is which half of the problem belongs in hardware. Drawing sprites and driving a display at frame rate is hardware work — it has a deadline every frame. Game state, input handling and match logic are comfortable in software on the MicroBlaze. Getting that split right is most of the project.'] },
      { key: 'GETTING INPUT IN',
        text: ['Reading a USB keyboard from an FPGA is not free. A <b>MAX3421E</b> USB host controller does the USB side, and the MicroBlaze talks to it over <b>SPI</b>. An <b>AXI UART</b> interface connects the processor to the rest of the peripherals — HDMI output, USB and GPIO.'] },
      { key: 'FITTING IT ON',
        text: ['All of it lives in <b>213 KiB</b> of on-chip memory: sprite data, animation frames, and the game state for two fighters, plus health tracking and a match timer.'] }
    ],
    shots: [
      [KP.WIX + '843f1e_c94c80e131634eb39fe2cc48600227f5~mv2.jpeg/v1/fill/w_1000,h_558,al_c,q_85/IMG_4001.jpeg', 'RUNNING ON THE BOARD']
    ]
  },

  tvm: {
    title: 'Tensor Compiler Research',
    where: 'IBM-ILLINOIS DISCOVERY ACCELERATOR INSTITUTE · MAY 2024 — PRESENT',
    lead: 'A machine-learning compiler has to decide how to map a computation onto hardware. The number of legal mappings is enormous, and searching them is where the time goes.',
    facts: [
      ['FRAMEWORK', 'TVM'],
      ['RESULT VARIANCE', '< 2%', true],
      ['DURATION', '12+ months']
    ],
    stack: ['TVM', 'Python', 'NLP', 'Autotuning'],
    sections: [
      { key: 'SHRINKING THE SEARCH',
        text: ['Autotuning explores a space of schedules — tiling, unrolling, vectorising, thread binding — looking for the fastest version of a kernel on a given target. Most of that space is not worth measuring. I applied <b>NLP-based search-space reduction</b> to discard unpromising candidates before they cost a compile, which cut AI compilation time and improved multi-platform compatibility.'] },
      { key: 'MOVING IT WITHOUT BREAKING IT',
        text: ['The second half was a migration: legacy pipelines onto an upgraded <b>TVM</b> framework. The bar for that work is not that it runs, it is that it produces the same answers. I reproduced the original results to <b>within 2% variance</b> across the migration, and wrote the posters and abstracts that presented it.'] }
    ]
  },

  pnr: {
    title: 'Datapath Design & Place-and-Route',
    where: 'FULL ASIC FLOW · CADENCE · 45 nm',
    lead: 'A RISC-V datapath taken the whole way — Verilog RTL, gate-level synthesis, then placement and routing into a real <b>45 nm</b> layout.',
    facts: [
      ['PROCESS NODE', '45 nm', true],
      ['SYNTHESIS', 'Cadence Genus'],
      ['PLACE & ROUTE', 'Cadence Innovus'],
      ['SIGN-OFF', 'DRC · LVS'],
      ['TIMING', 'Closed']
    ],
    stack: ['Cadence Genus', 'Cadence Innovus', '45 nm', 'DRC', 'LVS', 'Standard cells'],
    sections: [
      { key: 'FROM LOGIC TO CELLS',
        text: ['Synthesis is where an idea meets a <b>standard cell library</b> and negotiates. The library supplies the physical abstractions and design rules for every gate and flip-flop available, and Genus maps the RTL onto them. What comes out is no longer logic — it is a specific set of cells with real area, real delay and real drive strength.'] },
      { key: 'PUTTING IT SOMEWHERE',
        text: ['Innovus then has to place those cells on a die and route the wires between them. This is where the constraints stop being logical: a net that was free in simulation now has length, and length costs time. Most of the work was reading timing reports, resolving <b>congestion</b>, and deciding what to give up to close timing.'] },
      { key: 'SIGN-OFF',
        text: ['<b>DRC</b> checks the layout against the manufacturing rules of the process. <b>LVS</b> checks that what was drawn is still the circuit that was designed. Passing both is the difference between a design and a manufacturable design.'] }
    ],
    shots: [
      [KP.WIX + '843f1e_5a1bee73d2304851befcd99b98c3b3c2~mv2.jpg/v1/fill/w_900,h_540,al_c,q_85/cpu1.jpg', 'PLACED AND ROUTED'],
      [KP.WIX + '843f1e_4d07afcf287f455c9f14147286aa5852~mv2.jpg/v1/fill/w_900,h_496,al_c,q_85/cpu2.jpg', 'LAYOUT DETAIL']
    ]
  }
};
