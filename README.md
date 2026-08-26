# 🖥️ OS Process Lifecycle & CPU Scheduling Simulator

An interactive, full-featured **Operating System Process Lifecycle & CPU Scheduling Simulator** built with **React**, **Vite**, and **Tailwind CSS**.

Visualize discrete operating system states (5-State Machine), real-time Process Control Block (PCB) tracking, dynamic Execution Gantt Charts, time-travel execution stepping, and comprehensive scheduling performance metrics.

---

## ✨ Features

- 🔄 **5-State Process Lifecycle Visualization**: Real-time visual tracking across `NEW`, `READY`, `RUNNING`, `WAITING`, and `TERMINATED` states.
- ⚙️ **6 Core CPU Scheduling Algorithms**:
  - **First-Come, First-Served (FCFS)**
  - **Round Robin (RR)** with custom Time Quantum ($Q$)
  - **Shortest Job First (SJF - Non-Preemptive)**
  - **Shortest Remaining Time First (SRTF - Preemptive)**
  - **Priority Scheduling (Non-Preemptive)**
  - **Priority Scheduling (Preemptive)**
- 📋 **Active Processes PCB Table with Inline Editing**:
  - Directly edit **Process Name**, **Priority**, **Arrival Time (AT)**, and **Burst Time (BT)** in-place inside the table.
  - Context-aware column indicators (`Active` vs `Ignored` based on the selected scheduler).
- 📊 **Dynamic Execution Gantt Chart**:
  - Visual time boundaries, process color palettes, and IDLE CPU representation.
- ⏪ **Time-Travel Simulation Controls**:
  - **Start / Pause** continuous automatic execution.
  - **Step Forward** ($T+1$) and **Step Back** ($T-1$) through state snapshots.
  - **Reset** to $T=0$ while preserving your custom process dataset.
- 📥 **Direct CSV Import & Export**:
  - One-click file upload for `.csv` and `.txt` files with smart header detection.
  - Export custom process tables to CSV.
  - Built-in sample CSV templates for quick testing.
- 🔍 **Focused PCB Inspector**:
  - Inspect Hardware Registers (`PC`, `SP`, `R0`, `R1`), Memory footprint, and execution metrics for any selected process.
- 📈 **Performance Evaluation Report**:
  - Calculates Average Turnaround Time (**ATAT**), Average Waiting Time (**AWT**), Average Response Time (**ART**), and **Throughput**.

---

## 📐 Scheduling Algorithms & Metrics

| Algorithm | Preemptive? | Decision Criteria | Priority Column |
| :--- | :---: | :--- | :---: |
| **FCFS** | ❌ No | Earliest Arrival Time ($AT$) | Ignored |
| **Round Robin (RR)** | ✅ Yes | FIFO Ready Queue + Time Quantum ($Q$) | Ignored |
| **SJF** | ❌ No | Shortest Total Burst Time ($BT$) | Ignored |
| **SRTF** | ✅ Yes | Shortest Remaining Burst Time ($BT_{\text{rem}}$) | Ignored |
| **Priority (NP)** | ❌ No | Lowest Priority Number (Lvl 0/1 > Lvl 2) | **Active** |
| **Priority (Preemptive)** | ✅ Yes | Highest Priority with active preemption | **Active** |

### Formulas:
$$\text{Turnaround Time (TAT)} = \text{Completion Time (CT)} - \text{Arrival Time (AT)}$$
$$\text{Waiting Time (WT)} = \text{Turnaround Time (TAT)} - \text{Total Burst Time (BT)}$$
$$\text{Response Time (RT)} = \text{First CPU Start Time} - \text{Arrival Time (AT)}$$

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `yarn` or `pnpm`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/os-process-lifecycle-simulator.git
   cd os-process-lifecycle-simulator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```text
├── public/
│   ├── favicon.svg
│   ├── sample_processes.csv
│   └── round_robin_test.csv
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Navbar.jsx            # Top controls, clock, scheduler dropdown, step back/forward
│   │   ├── LifecycleView.jsx     # 5-State machine grid diagram
│   │   ├── GanttChart.jsx        # Execution Gantt chart timeline
│   │   ├── ProcessTable.jsx      # Interactive PCB table with inline editing & CSV I/O
│   │   ├── PCBInspector.jsx      # Detailed single-process hardware registers & metrics
│   │   ├── EventTimeline.jsx     # Discrete event history log
│   │   ├── NewProcessModal.jsx   # Modal process creator
│   │   └── FinalReportModal.jsx  # Comprehensive performance metrics modal
│   ├── engine/
│   │   ├── simulationEngine.js   # Discrete execution engine & state transition logic
│   │   └── scheduler.js          # Schedulers & queue helpers
│   ├── types/
│   │   ├── constants.js          # OS constants & color configurations
│   │   └── process.js            # PCB data structures & process factory
│   ├── App.jsx                   # Main simulation state coordinator & history stack
│   ├── main.jsx                  # React application entry point
│   └── index.css                 # Tailwind CSS styles
├── package.json
├── vite.config.js
└── README.md
```

---

## 📄 CSV Import Format

You can import CSV files with or without headers:

```csv
PID,Name,AT,BT,Priority
1,P1,0,6,3
2,P2,1,8,1
3,P3,2,3,4
4,P4,3,4,2
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
