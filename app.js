/**
 * app.js
 * Main controller logic, timer engine, visualization renderers, and calendar manager.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // --- APPLICATION STATE ---
  const state = {
    skills: [],
    sessions: [],
    currentDateStr: getLocalDateString(new Date()), // YYYY-MM-DD
    activeDateStr: getLocalDateString(new Date()),  // Dashboard viewed date YYYY-MM-DD
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(), // 0-11
    selectedCalendarDateStr: getLocalDateString(new Date()),
    
    // Timer state
    timer: {
      skillId: null,
      startTime: null,
      elapsedSeconds: 0,
      intervalId: null,
      isPaused: false,
      pausedElapsed: 0
    },
    
    // Pomodoro state
    pomodoro: {
      enabled: false,
      workMinutes: 25,
      breakMinutes: 5,
      state: 'work', // 'work' or 'break'
      phaseSecondsLeft: 25 * 60,
      totalPhaseSeconds: 25 * 60
    }
  };

  // --- MOTIVATIONAL QUOTES ---
  const quotes = {
    start: [
      "Starting is the hardest step.",
      "One session at a time.",
      "Let's build momentum.",
      "Small progress is still progress.",
      "Focus your mind, block out the noise."
    ],
    nearComplete: [
      "You're almost there!",
      "Just a little more.",
      "Push through the last stretch!",
      "Finish strong!",
      "Focus! 90% completed."
    ],
    completed: [
      "Well done, Champ!",
      "Today's target completed.",
      "Consistency is key. Great job!",
      "You did it! Feel proud of this session.",
      "Skill upgraded! Goal achieved."
    ]
  };

  // State flags to prevent duplicate quotes during a single session
  let quoteNearCompleteFired = false;
  let quoteCompletedFired = false;

  // --- DOM ELEMENTS ---
  const els = {
    navDashboard: document.getElementById('nav-dashboard'),
    navCalendar: document.getElementById('nav-calendar'),
    navSkills: document.getElementById('nav-skills'),
    
    viewDashboard: document.getElementById('view-dashboard-section'),
    viewCalendar: document.getElementById('view-calendar-section'),
    viewSkills: document.getElementById('view-skills-section'),
    
    themeToggle: document.getElementById('theme-toggle'),
    donateTrigger: document.getElementById('donate-trigger'),
    donateDialog: document.getElementById('donate-dialog'),
    
    // Timer Elements
    timerSkillSelect: document.getElementById('timer-skill-select'),
    timerTime: document.getElementById('timer-time'),
    timerTargetStatus: document.getElementById('timer-target-status'),
    timerRingProgress: document.getElementById('timer-ring-progress'),
    pomoEnable: document.getElementById('pomo-enable'),
    pomoPresets: document.getElementById('pomo-presets'),
    pomoPhaseIndicator: document.getElementById('pomo-phase-indicator'),
    pomoPhaseText: document.getElementById('pomo-phase-text'),
    motivationalBanner: document.getElementById('motivational-banner'),
    timerStartBtn: document.getElementById('timer-start-btn'),
    timerPauseBtn: document.getElementById('timer-pause-btn'),
    timerStopBtn: document.getElementById('timer-stop-btn'),
    
    // Dashboard Navigation & Stats
    prevDayBtn: document.getElementById('prev-day-btn'),
    nextDayBtn: document.getElementById('next-day-btn'),
    selectedDayTitle: document.getElementById('selected-day-title'),
    statTotalTime: document.getElementById('stat-total-time'),
    statGoalsCompleted: document.getElementById('stat-goals-completed'),
    statStreak: document.getElementById('stat-streak'),
    
    // Dashboard Tabs
    tabDonut: document.getElementById('tab-donut'),
    tabBar: document.getElementById('tab-bar'),
    tabTimeline: document.getElementById('tab-timeline'),
    paneDonut: document.getElementById('pane-donut'),
    paneBar: document.getElementById('pane-bar'),
    paneTimeline: document.getElementById('pane-timeline'),
    addManualBtn: document.getElementById('add-manual-btn'),
    manualLogDialog: document.getElementById('manual-log-dialog'),
    manualLogForm: document.getElementById('manual-log-form'),
    manualSkillSelect: document.getElementById('manual-skill-select'),
    manualDate: document.getElementById('manual-date'),
    manualStartTime: document.getElementById('manual-start-time'),
    manualEndTime: document.getElementById('manual-end-time'),
    
    // Panes container content
    donutChartWrapper: document.getElementById('donut-chart-wrapper'),
    donutLegendList: document.getElementById('donut-legend-list'),
    goalProgressList: document.getElementById('goal-progress-list'),
    barChartWrapper: document.getElementById('bar-chart-wrapper'),
    timelineList: document.getElementById('timeline-list'),
    
    // Calendar Elements
    calPrevMonth: document.getElementById('cal-prev-month'),
    calNextMonth: document.getElementById('cal-next-month'),
    calMonthTitle: document.getElementById('cal-month-title'),
    calendarDays: document.getElementById('calendar-days'),
    detailDateLabel: document.getElementById('detail-date-label'),
    detailTotalHours: document.getElementById('detail-total-hours'),
    detailGoalsList: document.getElementById('detail-goals-list'),
    detailTimelineList: document.getElementById('detail-timeline-list'),
    
    // Skills Elements
    createSkillForm: document.getElementById('create-skill-form'),
    skillNameInput: document.getElementById('skill-name-input'),
    goalTypeSelect: document.getElementById('goal-type-select'),
    goalValueLabel: document.getElementById('goal-value-label'),
    goalValueInput: document.getElementById('goal-value-input'),
    skillsListGrid: document.getElementById('skills-list-grid'),
    customColorPicker: document.getElementById('custom-color-picker')
  };

  // --- AUDIO SYNTHESIZER ---
  const audio = {
    ctx: null,
    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    },
    playChime(type) {
      this.init();
      if (!this.ctx) return;
      
      const now = this.ctx.currentTime;
      
      if (type === 'work-complete') {
        // High pleasant chimes (C5, then E5)
        this.playTone(523.25, 0.15, now);
        this.playTone(659.25, 0.3, now + 0.15);
      } else if (type === 'break-complete') {
        // Gentle warm chimes (A4, then C#5)
        this.playTone(440.00, 0.15, now);
        this.playTone(554.37, 0.3, now + 0.15);
      } else if (type === 'session-complete') {
        // Triad chime (C5, E5, G5)
        this.playTone(523.25, 0.1, now);
        this.playTone(659.25, 0.1, now + 0.1);
        this.playTone(783.99, 0.4, now + 0.2);
      }
    },
    playTone(freq, duration, startTime) {
      try {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0.15, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      } catch (err) {
        console.error('Audio synthesis failed:', err);
      }
    }
  };

  // --- INITIALIZATION ---
  async function initApp() {
    // Load setting: Theme preference
    const savedTheme = await window.db.getSetting('theme', 'dark');
    if (savedTheme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    }

    // Load skills
    await refreshSkillsData();
    
    // Set manual date input default to today
    els.manualDate.value = state.currentDateStr;
    els.manualDate.max = state.currentDateStr;

    // Load active dashboard day sessions
    await loadDashboardDay(state.activeDateStr);
    
    // Render initial Calendar
    renderCalendar();
    
    // Set detail date to today
    await selectCalendarDate(state.currentDateStr);

    // Setup dialog close click-dismiss handlers (fallback for older browsers)
    setupDialogDismiss(els.manualLogDialog);
    setupDialogDismiss(els.donateDialog);

    // Check for running session recovery
    recoverTimerState();

    // Attach event listeners
    attachEventListeners();
  }

  // --- THEME & POPUPS ---
  els.themeToggle.addEventListener('click', async () => {
    const isDark = document.body.classList.contains('dark-theme');
    if (isDark) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      await window.db.setSetting('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      await window.db.setSetting('theme', 'dark');
    }
  });

  els.donateTrigger.addEventListener('click', () => {
    audio.init();
    els.donateDialog.showModal();
  });

  function setupDialogDismiss(dialog) {
    if (!dialog) return;
    
    // Support closedby="any" natively if available
    if ('closedBy' in HTMLDialogElement.prototype) {
      dialog.setAttribute('closedby', 'any');
    }

    // Fallback light-dismiss boundary checker
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      
      const rect = dialog.getBoundingClientRect();
      const isInside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      
      if (!isInside) {
        dialog.close();
      }
    });
  }

  // --- NAVIGATION CONTROLLER ---
  function switchView(viewName) {
    els.navDashboard.classList.remove('active');
    els.navCalendar.classList.remove('active');
    els.navSkills.classList.remove('active');
    
    els.viewDashboard.classList.remove('active');
    els.viewCalendar.classList.remove('active');
    els.viewSkills.classList.remove('active');

    if (viewName === 'dashboard') {
      els.navDashboard.classList.add('active');
      els.viewDashboard.classList.add('active');
      loadDashboardDay(state.activeDateStr);
    } else if (viewName === 'calendar') {
      els.navCalendar.classList.add('active');
      els.viewCalendar.classList.add('active');
      renderCalendar();
      selectCalendarDate(state.selectedCalendarDateStr);
    } else if (viewName === 'skills') {
      els.navSkills.classList.add('active');
      els.viewSkills.classList.add('active');
      renderSkillsList();
    }
  }

  function attachEventListeners() {
    els.navDashboard.addEventListener('click', () => switchView('dashboard'));
    els.navCalendar.addEventListener('click', () => switchView('calendar'));
    els.navSkills.addEventListener('click', () => switchView('skills'));
    
    // Dashboard Pagination
    els.prevDayBtn.addEventListener('click', () => navigateDay(-1));
    els.nextDayBtn.addEventListener('click', () => navigateDay(1));
    
    // Dashboard Tabs
    els.tabDonut.addEventListener('click', () => switchDashboardTab('donut'));
    els.tabBar.addEventListener('click', () => switchDashboardTab('bar'));
    els.tabTimeline.addEventListener('click', () => switchDashboardTab('timeline'));
    
    // Add Manual Log
    els.addManualBtn.addEventListener('click', () => {
      populateSkillDropdowns();
      els.manualLogDialog.showModal();
    });
    
    els.manualLogForm.addEventListener('submit', handleManualLogSubmit);

    // Timer controls
    els.timerSkillSelect.addEventListener('change', handleTimerSkillChange);
    els.timerStartBtn.addEventListener('click', startTimer);
    els.timerPauseBtn.addEventListener('click', pauseTimer);
    els.timerStopBtn.addEventListener('click', stopTimer);
    
    // Pomodoro toggles
    els.pomoEnable.addEventListener('change', handlePomodoroToggle);
    els.pomoPresets.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', handlePomodoroPresetChange);
    });

    // Skill Creation Color presets
    const colorSwatches = els.createSkillForm.querySelectorAll('.color-swatch');
    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      });
    });

    els.customColorPicker.addEventListener('input', () => {
      colorSwatches.forEach(s => s.classList.remove('active'));
    });

    els.goalTypeSelect.addEventListener('change', handleGoalTypeChange);
    els.createSkillForm.addEventListener('submit', handleSkillCreateSubmit);
    
    // Calendar month control
    els.calPrevMonth.addEventListener('click', () => changeCalendarMonth(-1));
    els.calNextMonth.addEventListener('click', () => changeCalendarMonth(1));
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    const container = els.toastContainer || document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Apply styling based on type
    if (type === 'success') {
      toast.style.borderLeftColor = 'var(--accent-green)';
    } else if (type === 'warning') {
      toast.style.borderLeftColor = 'var(--accent-gold)';
    } else if (type === 'danger') {
      toast.style.borderLeftColor = 'var(--accent-red)';
    }

    toast.innerHTML = `
      <div class="toast-content">${message}</div>
      <button class="toast-close" aria-label="Dismiss message">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);
    
    // Auto dismiss after 5s
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  // --- SKILLS MANAGERS ---
  async function refreshSkillsData() {
    state.skills = await window.db.getSkills();
    populateSkillDropdowns();
  }

  function populateSkillDropdowns() {
    // Timer Selector
    const activeSkillSelect = els.timerSkillSelect;
    const selectedVal = activeSkillSelect.value;
    activeSkillSelect.innerHTML = '<option value="">-- Select a Skill --</option>';
    
    // Manual Log Selector
    const manualSkillSelect = els.manualSkillSelect;
    manualSkillSelect.innerHTML = '<option value="" disabled selected>-- Select a Skill --</option>';

    state.skills.forEach(skill => {
      const option1 = new Option(skill.name, skill.id);
      activeSkillSelect.add(option1);
      
      const option2 = new Option(skill.name, skill.id);
      manualSkillSelect.add(option2);
    });

    if (selectedVal && state.skills.find(s => s.id == selectedVal)) {
      activeSkillSelect.value = selectedVal;
    }
  }

  function handleGoalTypeChange() {
    const val = els.goalTypeSelect.value;
    if (val === 'daily-hours') {
      els.goalValueLabel.textContent = "Hours per day";
      els.goalValueInput.value = "2";
      els.goalValueInput.min = "0.1";
      els.goalValueInput.step = "0.1";
    } else if (val === 'weekly-times') {
      els.goalValueLabel.textContent = "Times per week";
      els.goalValueInput.value = "3";
      els.goalValueInput.min = "1";
      els.goalValueInput.step = "1";
    } else if (val === 'weekly-hours') {
      els.goalValueLabel.textContent = "Hours per week";
      els.goalValueInput.value = "12";
      els.goalValueInput.min = "0.5";
      els.goalValueInput.step = "0.5";
    }
  }

  async function handleSkillCreateSubmit(e) {
    e.preventDefault();
    const name = els.skillNameInput.value.trim();
    if (!name) return;

    // Check duplicate
    if (state.skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      showToast(`A skill named "${name}" already exists!`, 'warning');
      return;
    }

    // Get color
    let color = els.customColorPicker.value;
    const activeSwatch = els.createSkillForm.querySelector('.color-swatch.active');
    if (activeSwatch) {
      color = activeSwatch.getAttribute('data-color');
    }

    const goalType = els.goalTypeSelect.value;
    const goalValue = parseFloat(els.goalValueInput.value);

    const newSkill = {
      name,
      color,
      goalType,
      goalValue,
      createdAt: Date.now()
    };

    try {
      await window.db.addSkill(newSkill);
      showToast(`Skill "${name}" created successfully!`, 'success');
      els.createSkillForm.reset();
      
      // Reset active swatch
      const swatches = els.createSkillForm.querySelectorAll('.color-swatch');
      swatches.forEach(s => s.classList.remove('active'));
      swatches[0].classList.add('active');
      handleGoalTypeChange();

      await refreshSkillsData();
      renderSkillsList();
    } catch (err) {
      console.error(err);
      showToast("Error creating skill.", 'danger');
    }
  }

  async function renderSkillsList() {
    const grid = els.skillsListGrid;
    grid.innerHTML = '';

    if (state.skills.length === 0) {
      grid.innerHTML = '<div class="empty-state">No skills created yet. Add one on the left!</div>';
      return;
    }

    // For calculations we need all sessions
    const allSessions = await window.db.getAllSessions();

    state.skills.forEach(skill => {
      const card = document.createElement('div');
      card.className = 'skill-card';
      card.style.setProperty('--skill-theme-color', skill.color);
      
      // Calculate total stats for this skill
      const skillSessions = allSessions.filter(s => s.skillId === skill.id);
      const totalSeconds = skillSessions.reduce((acc, curr) => acc + curr.duration, 0);
      const totalHoursStr = formatHoursMins(totalSeconds);
      const sessionCount = skillSessions.length;

      let goalStr = '';
      if (skill.goalType === 'daily-hours') goalStr = `${skill.goalValue} hrs / day`;
      else if (skill.goalType === 'weekly-times') goalStr = `${skill.goalValue} times / week`;
      else if (skill.goalType === 'weekly-hours') goalStr = `${skill.goalValue} hrs / week`;

      card.innerHTML = `
        <div class="skill-card-header">
          <div>
            <h3 class="skill-card-name">${skill.name}</h3>
            <span class="skill-card-goal">${goalStr}</span>
          </div>
          <button class="delete-skill-btn" data-id="${skill.id}" aria-label="Delete ${skill.name}">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
        <div class="skill-card-stats">
          <div class="skill-stat">
            <span class="skill-stat-label">Total Time</span>
            <span class="skill-stat-val">${totalHoursStr}</span>
          </div>
          <div class="skill-stat">
            <span class="skill-stat-label">Sessions</span>
            <span class="skill-stat-val">${sessionCount}</span>
          </div>
        </div>
      `;

      card.querySelector('.delete-skill-btn').addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const skillName = skill.name;
        if (confirm(`Are you sure you want to delete "${skillName}"? This will delete all associated logs and history.`)) {
          // If timer is running on this skill, stop it first
          if (state.timer.skillId == id) {
            stopTimer(false); // Stop without saving
          }
          await window.db.deleteSkill(id);
          showToast(`Deleted skill "${skillName}" and its logs.`, 'warning');
          await refreshSkillsData();
          renderSkillsList();
        }
      });

      grid.appendChild(card);
    });
  }

  // --- TIMER & POMODORO SYSTEM ---
  function handleTimerSkillChange() {
    const skillId = els.timerSkillSelect.value;
    if (!skillId) {
      els.timerStartBtn.disabled = true;
      els.timerStopBtn.disabled = true;
      els.timerTargetStatus.textContent = "Select a skill to begin";
      updateProgressRing(0);
      return;
    }

    els.timerStartBtn.disabled = false;
    
    // Calculate remaining target time
    updateTimerStatus(skillId);
  }

  async function updateTimerStatus(skillId) {
    const skill = state.skills.find(s => s.id == skillId);
    if (!skill) return;

    // Get today's total for this skill
    const todaySessions = state.sessions.filter(s => s.skillId == skillId);
    const todaySeconds = todaySessions.reduce((acc, curr) => acc + curr.duration, 0);

    if (skill.goalType === 'daily-hours') {
      const targetSeconds = skill.goalValue * 3600;
      const completedPercent = Math.min((todaySeconds / targetSeconds) * 100, 100);
      
      updateProgressRing(completedPercent, skill.color);
      
      const remainingSeconds = Math.max(targetSeconds - todaySeconds, 0);
      if (remainingSeconds === 0) {
        els.timerTargetStatus.textContent = "Daily goal achieved!";
      } else {
        els.timerTargetStatus.textContent = `${formatShortDuration(remainingSeconds)} remaining today`;
      }
    } else if (skill.goalType === 'weekly-hours') {
      // Get weekly sessions
      const weekSessions = await getSessionsForCurrentWeek(skillId);
      const weekSeconds = weekSessions.reduce((acc, curr) => acc + curr.duration, 0);
      const targetSeconds = skill.goalValue * 3600;
      const completedPercent = Math.min((weekSeconds / targetSeconds) * 100, 100);
      
      updateProgressRing(completedPercent, skill.color);

      const remainingSeconds = Math.max(targetSeconds - weekSeconds, 0);
      if (remainingSeconds === 0) {
        els.timerTargetStatus.textContent = "Weekly goal achieved!";
      } else {
        els.timerTargetStatus.textContent = `${formatShortDuration(remainingSeconds)} remaining this week`;
      }
    } else if (skill.goalType === 'weekly-times') {
      const weekSessions = await getSessionsForCurrentWeek(skillId);
      // Group by date to find unique days practiced
      const uniqueDays = new Set(weekSessions.map(s => s.date)).size;
      const targetTimes = skill.goalValue;
      const completedPercent = Math.min((uniqueDays / targetTimes) * 100, 100);
      
      updateProgressRing(completedPercent, skill.color);
      
      const remainingTimes = Math.max(targetTimes - uniqueDays, 0);
      if (remainingTimes === 0) {
        els.timerTargetStatus.textContent = "Weekly times goal achieved!";
      } else {
        els.timerTargetStatus.textContent = `${remainingTimes} practices remaining this week`;
      }
    }
  }

  function updateProgressRing(percent, color = 'var(--accent-cyan)') {
    const ring = els.timerRingProgress;
    const radius = ring.r.baseVal.value;
    const circumference = 2 * Math.PI * radius; // ~596.9
    const offset = circumference - (percent / 100) * circumference;
    
    ring.style.stroke = color;
    ring.style.strokeDashoffset = offset;
  }

  function handlePomodoroToggle() {
    state.pomodoro.enabled = els.pomoEnable.checked;
    
    if (state.pomodoro.enabled) {
      els.pomoPresets.classList.remove('disabled');
      resetPomodoroState();
    } else {
      els.pomoPresets.classList.add('disabled');
      els.pomoPhaseIndicator.classList.add('hide');
    }
  }

  function handlePomodoroPresetChange(e) {
    els.pomoPresets.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    state.pomodoro.workMinutes = parseInt(e.currentTarget.getAttribute('data-work'));
    state.pomodoro.breakMinutes = parseInt(e.currentTarget.getAttribute('data-break'));
    
    resetPomodoroState();
  }

  function resetPomodoroState() {
    state.pomodoro.state = 'work';
    state.pomodoro.totalPhaseSeconds = state.pomodoro.workMinutes * 60;
    state.pomodoro.phaseSecondsLeft = state.pomodoro.totalPhaseSeconds;
    
    updatePomodoroUI();
  }

  function updatePomodoroUI() {
    if (!state.pomodoro.enabled) return;
    
    els.pomoPhaseIndicator.classList.remove('hide');
    if (state.pomodoro.state === 'work') {
      els.pomoPhaseIndicator.className = 'pomo-phase-indicator';
      els.pomoPhaseText.textContent = `Focus Phase (${formatTimeStr(state.pomodoro.phaseSecondsLeft)})`;
    } else {
      els.pomoPhaseIndicator.className = 'pomo-phase-indicator break';
      els.pomoPhaseText.textContent = `Break Phase (${formatTimeStr(state.pomodoro.phaseSecondsLeft)})`;
    }
  }

  // Timer Start
  function startTimer() {
    const skillId = els.timerSkillSelect.value;
    if (!skillId) return;

    audio.init();

    // Reset quotes trigger
    quoteNearCompleteFired = false;
    quoteCompletedFired = false;

    // Toggle DOM elements
    els.timerSkillSelect.disabled = true;
    els.timerStartBtn.classList.add('hide');
    els.timerPauseBtn.classList.remove('hide');
    els.timerStopBtn.disabled = false;
    
    state.timer.skillId = skillId;
    
    if (state.timer.isPaused) {
      // Resume
      state.timer.startTime = Date.now() - (state.timer.pausedElapsed * 1000);
      state.timer.isPaused = false;
    } else {
      // New start
      state.timer.startTime = Date.now();
      state.timer.elapsedSeconds = 0;
      
      // Randomized start message
      els.motivationalBanner.textContent = `"${getRandomQuote('start')}"`;
    }

    state.timer.intervalId = setInterval(tickTimer, 1000);

    // Save timer state locally in case of window close
    saveTimerStateToLocal();
  }

  // Timer Pause
  function pauseTimer() {
    if (!state.timer.intervalId) return;
    
    clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
    state.timer.isPaused = true;
    state.timer.pausedElapsed = state.timer.elapsedSeconds;
    
    els.timerStartBtn.classList.remove('hide');
    els.timerPauseBtn.classList.add('hide');
    
    els.motivationalBanner.textContent = `"Session paused. Let's resume soon!"`;

    // Clear local storage timer state
    clearTimerStateFromLocal();
  }

  // Timer Tick
  function tickTimer() {
    state.timer.elapsedSeconds = Math.floor((Date.now() - state.timer.startTime) / 1000);
    els.timerTime.textContent = formatTimeStr(state.timer.elapsedSeconds);

    // If Pomodoro is enabled
    if (state.pomodoro.enabled) {
      state.pomodoro.phaseSecondsLeft--;
      updatePomodoroUI();
      
      if (state.pomodoro.phaseSecondsLeft <= 0) {
        // Toggle Pomodoro state
        if (state.pomodoro.state === 'work') {
          state.pomodoro.state = 'break';
          state.pomodoro.totalPhaseSeconds = state.pomodoro.breakMinutes * 60;
          state.pomodoro.phaseSecondsLeft = state.pomodoro.totalPhaseSeconds;
          
          audio.playChime('work-complete');
          showToast("Work interval complete! Take a break.", 'success');
          els.motivationalBanner.textContent = `"Nice focus! Go grab some water."`;
        } else {
          state.pomodoro.state = 'work';
          state.pomodoro.totalPhaseSeconds = state.pomodoro.workMinutes * 60;
          state.pomodoro.phaseSecondsLeft = state.pomodoro.totalPhaseSeconds;
          
          audio.playChime('break-complete');
          showToast("Break over. Back to focus!", 'success');
          els.motivationalBanner.textContent = `"Break ended. Let's build momentum!"`;
        }
      }
    }

    // Check goal-based motivational quotes
    checkMotivationalTriggers();

    // Save state on every tick to local storage (durability)
    saveTimerStateToLocal();
  }

  async function checkMotivationalTriggers() {
    const skill = state.skills.find(s => s.id == state.timer.skillId);
    if (!skill || skill.goalType !== 'daily-hours') return;

    // Get baseline seconds
    const targetSeconds = skill.goalValue * 3600;
    const todaySessions = state.sessions.filter(s => s.skillId == state.timer.skillId);
    const loggedSeconds = todaySessions.reduce((acc, curr) => acc + curr.duration, 0);

    const totalSessionSeconds = loggedSeconds + state.timer.elapsedSeconds;
    const pct = totalSessionSeconds / targetSeconds;

    if (pct >= 0.9 && pct < 1.0 && !quoteNearCompleteFired) {
      quoteNearCompleteFired = true;
      els.motivationalBanner.textContent = `"${getRandomQuote('nearComplete')}"`;
      showToast("You're almost there! Just 10% left.", 'warning');
    }

    if (pct >= 1.0 && !quoteCompletedFired) {
      quoteCompletedFired = true;
      els.motivationalBanner.textContent = `"${getRandomQuote('completed')}"`;
      audio.playChime('session-complete');
      showToast("Goal completed! Well done, Champ!", 'success');
    }
  }

  // Timer Stop
  async function stopTimer(shouldSave = true) {
    if (state.timer.intervalId) {
      clearInterval(state.timer.intervalId);
    }
    
    const elapsed = state.timer.elapsedSeconds;
    const skillId = state.timer.skillId;
    const startTimeStamp = state.timer.startTime;
    const endTimeStamp = Date.now();

    // Reset timer state
    state.timer.intervalId = null;
    state.timer.skillId = null;
    state.timer.startTime = null;
    state.timer.elapsedSeconds = 0;
    state.timer.isPaused = false;
    state.timer.pausedElapsed = 0;

    // Reset Pomodoro
    if (state.pomodoro.enabled) {
      resetPomodoroState();
    }

    // Reset UI
    els.timerSkillSelect.disabled = false;
    els.timerSkillSelect.value = "";
    els.timerTime.textContent = "00:00:00";
    els.timerStartBtn.classList.remove('hide');
    els.timerPauseBtn.classList.add('hide');
    els.timerStartBtn.disabled = true;
    els.timerStopBtn.disabled = true;
    els.timerTargetStatus.textContent = "Select a skill to begin";
    els.motivationalBanner.textContent = "Starting is the hardest step. Click play to begin.";
    updateProgressRing(0);

    clearTimerStateFromLocal();

    // Save to DB
    if (shouldSave && elapsed >= 1) { // Only log if at least 1 second passed
      const session = {
        skillId: Number(skillId),
        startTime: startTimeStamp,
        endTime: endTimeStamp,
        duration: elapsed,
        isManual: false,
        date: getLocalDateString(new Date(startTimeStamp))
      };

      try {
        await window.db.addSession(session);
        showToast(`Logged session of ${formatShortDuration(elapsed)}!`, 'success');
        
        // Refresh dashboard
        await loadDashboardDay(state.activeDateStr);
      } catch (err) {
        console.error(err);
        showToast("Error saving session to database.", 'danger');
      }
    }
  }

  // --- TIMER OFFLINE RECOVERY ---
  function saveTimerStateToLocal() {
    if (!state.timer.skillId) return;
    
    const timerState = {
      skillId: state.timer.skillId,
      startTime: state.timer.startTime,
      elapsedSeconds: state.timer.elapsedSeconds,
      isPaused: state.timer.isPaused,
      pausedElapsed: state.timer.pausedElapsed,
      pomoEnabled: state.pomodoro.enabled,
      pomoPresetWork: state.pomodoro.workMinutes,
      pomoPresetBreak: state.pomodoro.breakMinutes,
      pomoState: state.pomodoro.state,
      pomoSecondsLeft: state.pomodoro.phaseSecondsLeft
    };
    localStorage.setItem('houry_active_timer', JSON.stringify(timerState));
  }

  function clearTimerStateFromLocal() {
    localStorage.removeItem('houry_active_timer');
  }

  function recoverTimerState() {
    const saved = localStorage.getItem('houry_active_timer');
    if (!saved) return;

    try {
      const s = JSON.parse(saved);
      if (s.isPaused) {
        // Recover paused state
        els.timerSkillSelect.value = s.skillId;
        state.timer.skillId = s.skillId;
        state.timer.elapsedSeconds = s.pausedElapsed;
        state.timer.isPaused = true;
        state.timer.pausedElapsed = s.pausedElapsed;
        
        els.timerTime.textContent = formatTimeStr(s.pausedElapsed);
        
        els.timerSkillSelect.disabled = true;
        els.timerStartBtn.classList.remove('hide');
        els.timerPauseBtn.classList.add('hide');
        els.timerStartBtn.disabled = false;
        els.timerStopBtn.disabled = false;
        
        // Recover Pomodoro settings
        els.pomoEnable.checked = s.pomoEnabled;
        state.pomodoro.enabled = s.pomoEnabled;
        if (s.pomoEnabled) {
          els.pomoPresets.classList.remove('disabled');
          state.pomodoro.workMinutes = s.pomoPresetWork;
          state.pomodoro.breakMinutes = s.pomoPresetBreak;
          state.pomodoro.state = s.pomoState;
          state.pomodoro.phaseSecondsLeft = s.pomoSecondsLeft;
          updatePomodoroUI();
        }
        
        updateTimerStatus(s.skillId);
        showToast("Recovered paused timer session.", 'info');
      } else {
        // Recalculate elapsed seconds if was running
        const elapsedSinceStart = Math.floor((Date.now() - s.startTime) / 1000);
        
        els.timerSkillSelect.value = s.skillId;
        state.timer.skillId = s.skillId;
        state.timer.startTime = s.startTime;
        state.timer.elapsedSeconds = elapsedSinceStart;
        
        // Start running
        els.timerSkillSelect.disabled = true;
        els.timerStartBtn.classList.add('hide');
        els.timerPauseBtn.classList.remove('hide');
        els.timerStopBtn.disabled = false;

        // Pomodoro recovery
        els.pomoEnable.checked = s.pomoEnabled;
        state.pomodoro.enabled = s.pomoEnabled;
        if (s.pomoEnabled) {
          els.pomoPresets.classList.remove('disabled');
          state.pomodoro.workMinutes = s.pomoPresetWork;
          state.pomodoro.breakMinutes = s.pomoPresetBreak;
          
          // Re-evaluate pomo cycles elapsed since window closed
          const totalCycleSeconds = (s.pomoPresetWork + s.pomoPresetBreak) * 60;
          const secondsDifference = Math.floor((Date.now() - s.startTime) / 1000) - s.elapsedSeconds;
          
          // Adjust remaining phase seconds
          let remaining = s.pomoSecondsLeft - secondsDifference;
          let currentPhase = s.pomoState;
          
          while (remaining <= 0) {
            if (currentPhase === 'work') {
              currentPhase = 'break';
              remaining += s.pomoPresetBreak * 60;
            } else {
              currentPhase = 'work';
              remaining += s.pomoPresetWork * 60;
            }
          }
          
          state.pomodoro.state = currentPhase;
          state.pomodoro.phaseSecondsLeft = remaining;
          updatePomodoroUI();
        }

        state.timer.intervalId = setInterval(tickTimer, 1000);
        showToast("Recovered active timer session.", 'info');
      }
    } catch (err) {
      console.error("Timer recovery failed:", err);
      clearTimerStateFromLocal();
    }
  }

  // --- MANUAL ENTRY MODAL ---
  async function handleManualLogSubmit(e) {
    e.preventDefault();

    const skillId = els.manualSkillSelect.value;
    const date = els.manualDate.value;
    const startTimeStr = els.manualStartTime.value;
    const endTimeStr = els.manualEndTime.value;

    if (!skillId || !date || !startTimeStr || !endTimeStr) return;

    // Convert start and end times to timestamps
    const startParts = startTimeStr.split(':');
    const endParts = endTimeStr.split(':');

    const start = new Date(date);
    start.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0);

    const end = new Date(date);
    end.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);

    let durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);

    if (durationSeconds <= 0) {
      // Handles overnight logging or error
      showToast("End time must be strictly after start time.", 'warning');
      return;
    }

    const session = {
      skillId: Number(skillId),
      startTime: start.getTime(),
      endTime: end.getTime(),
      duration: durationSeconds,
      isManual: true,
      date: date
    };

    try {
      await window.db.addSession(session);
      showToast("Manual log logged successfully!", 'success');
      
      els.manualLogForm.reset();
      els.manualLogDialog.close();

      // Refresh dashboard view if it matches the log date
      if (state.activeDateStr === date) {
        await loadDashboardDay(date);
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving manual entry.", 'danger');
    }
  }

  // --- DASHBOARD NAVIGATION & STATS ---
  async function loadDashboardDay(dateStr) {
    state.activeDateStr = dateStr;

    // Retrieve sessions for this date
    state.sessions = await window.db.getSessionsByDate(dateStr);

    // Update Title Label
    const todayStr = getLocalDateString(new Date());
    const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000));
    
    if (dateStr === todayStr) {
      els.selectedDayTitle.textContent = "Today";
    } else if (dateStr === yesterdayStr) {
      els.selectedDayTitle.textContent = "Yesterday";
    } else {
      els.selectedDayTitle.textContent = formatDateLabel(dateStr);
    }

    // Refresh display
    updateDashboardStats();
    renderActiveTabVisualization();
    
    // Update active timer status text (if timer is loaded on a skill)
    if (els.timerSkillSelect.value) {
      updateTimerStatus(els.timerSkillSelect.value);
    }
  }

  function navigateDay(direction) {
    const current = new Date(state.activeDateStr + 'T00:00:00');
    current.setDate(current.getDate() + direction);
    loadDashboardDay(getLocalDateString(current));
  }

  async function updateDashboardStats() {
    // 1. Total practice hours
    const totalSeconds = state.sessions.reduce((acc, curr) => acc + curr.duration, 0);
    els.statTotalTime.textContent = formatHoursMins(totalSeconds);

    // 2. Goals Met
    // We need to check daily/weekly goals for all active skills
    let goalsMet = 0;
    let totalGoalsActive = 0;

    for (const skill of state.skills) {
      if (skill.goalType === 'daily-hours') {
        totalGoalsActive++;
        const skillSeconds = state.sessions.filter(s => s.skillId == skill.id).reduce((acc, curr) => acc + curr.duration, 0);
        if (skillSeconds >= skill.goalValue * 3600) {
          goalsMet++;
        }
      } else if (skill.goalType === 'weekly-hours') {
        totalGoalsActive++;
        // Get week sessions
        const weekSessions = await getSessionsForWeekOfDate(state.activeDateStr, skill.id);
        const weekSeconds = weekSessions.reduce((acc, curr) => acc + curr.duration, 0);
        if (weekSeconds >= skill.goalValue * 3600) {
          goalsMet++;
        }
      } else if (skill.goalType === 'weekly-times') {
        totalGoalsActive++;
        const weekSessions = await getSessionsForWeekOfDate(state.activeDateStr, skill.id);
        const uniqueDays = new Set(weekSessions.map(s => s.date)).size;
        if (uniqueDays >= skill.goalValue) {
          goalsMet++;
        }
      }
    }

    els.statGoalsCompleted.textContent = `${goalsMet} / ${totalGoalsActive}`;

    // 3. Productive Score
    let score = "B";
    if (totalGoalsActive === 0) {
      score = totalSeconds > 0 ? "A" : "B";
    } else {
      const pct = goalsMet / totalGoalsActive;
      if (pct === 1) score = "A+";
      else if (pct >= 0.7) score = "A";
      else if (pct >= 0.4) score = "B+";
      else if (pct > 0) score = "B";
      else score = totalSeconds > 0 ? "B" : "C";
    }
    els.statStreak.textContent = score;
  }

  // --- VISUALIZERS TAB SWITCHER ---
  function switchDashboardTab(tabName) {
    els.tabDonut.classList.remove('active');
    els.tabBar.classList.remove('active');
    els.tabTimeline.classList.remove('active');
    
    els.paneDonut.classList.remove('active');
    els.paneBar.classList.remove('active');
    els.paneTimeline.classList.remove('active');

    if (tabName === 'donut') {
      els.tabDonut.classList.add('active');
      els.paneDonut.classList.add('active');
    } else if (tabName === 'bar') {
      els.tabBar.classList.add('active');
      els.paneBar.classList.add('active');
    } else if (tabName === 'timeline') {
      els.tabTimeline.classList.add('active');
      els.paneTimeline.classList.add('active');
    }

    renderActiveTabVisualization();
  }

  function renderActiveTabVisualization() {
    if (els.tabDonut.classList.contains('active')) {
      renderDonutChart();
    } else if (els.tabBar.classList.contains('active')) {
      renderBarChart();
    } else if (els.tabTimeline.classList.contains('active')) {
      renderTimelineList();
    }
  }

  // --- CUSTOM SVG CHARTS DRAWING ---
  
  // Donut Chart Renderer (Tab 1)
  function renderDonutChart() {
    const wrapper = els.donutChartWrapper;
    const legendList = els.donutLegendList;
    const progressList = els.goalProgressList;

    wrapper.innerHTML = '';
    legendList.innerHTML = '';
    progressList.innerHTML = '';

    if (state.sessions.length === 0) {
      wrapper.innerHTML = `
        <div class="empty-state" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:100%;">
          No activity today.
        </div>`;
      legendList.innerHTML = '<div class="empty-state">No legend available.</div>';
      renderGoalsProgressList();
      return;
    }

    // Group duration by skill
    const skillTotals = {};
    let totalDaySeconds = 0;

    state.sessions.forEach(sess => {
      skillTotals[sess.skillId] = (skillTotals[sess.skillId] || 0) + sess.duration;
      totalDaySeconds += sess.duration;
    });

    // Build segment data
    const segments = [];
    Object.keys(skillTotals).forEach(skillId => {
      const skill = state.skills.find(s => s.id == skillId);
      if (skill) {
        segments.push({
          skillId,
          name: skill.name,
          color: skill.color,
          duration: skillTotals[skillId],
          percentage: (skillTotals[skillId] / totalDaySeconds) * 100
        });
      }
    });

    // Draw SVG Donut
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'donut-chart-svg');
    svg.setAttribute('viewBox', '0 0 200 200');

    let accumulatedPercentage = 0;
    const radius = 70;
    const circumference = 2 * Math.PI * radius; // ~439.8

    segments.forEach(seg => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', 'donut-segment');
      circle.setAttribute('cx', '100');
      circle.setAttribute('cy', '100');
      circle.setAttribute('r', radius.toString());
      circle.setAttribute('stroke', seg.color);
      
      const offset = circumference - (seg.percentage / 100) * circumference;
      const rotation = (accumulatedPercentage / 100) * 360;

      circle.setAttribute('stroke-dasharray', `${circumference} ${circumference}`);
      circle.setAttribute('stroke-dashoffset', offset.toString());
      circle.setAttribute('transform', `rotate(${rotation - 90} 100 100)`);
      
      // Hover effects
      circle.style.cursor = 'pointer';
      circle.style.transition = 'stroke-width 0.2s';
      circle.addEventListener('mouseenter', () => circle.setAttribute('stroke-width', '24'));
      circle.addEventListener('mouseleave', () => circle.setAttribute('stroke-width', '18'));

      svg.appendChild(circle);

      accumulatedPercentage += seg.percentage;

      // Populate Legend list
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML = `
        <span class="legend-key">
          <span class="legend-dot" style="background-color: ${seg.color};"></span>
          <span>${seg.name}</span>
        </span>
        <span class="legend-value">${formatHoursMins(seg.duration)}</span>
      `;
      legendList.appendChild(legendItem);
    });

    wrapper.appendChild(svg);

    // Center display texts
    const centerDiv = document.createElement('div');
    centerDiv.className = 'donut-center-text';
    centerDiv.innerHTML = `
      <span class="donut-center-hours">${formatHoursMinsShort(totalDaySeconds)}</span>
      <span class="donut-center-label">Productive</span>
    `;
    wrapper.appendChild(centerDiv);

    // Render Goals progress below
    renderGoalsProgressList(skillTotals);
  }

  async function renderGoalsProgressList(skillTotals = {}) {
    const progressList = els.goalProgressList;
    progressList.innerHTML = '';

    if (state.skills.length === 0) {
      progressList.innerHTML = '<div class="empty-state">No skills available. Create one to set targets!</div>';
      return;
    }

    for (const skill of state.skills) {
      const todaySeconds = skillTotals[skill.id] || 0;
      let completedPercent = 0;
      let valuesText = '';

      if (skill.goalType === 'daily-hours') {
        const targetSeconds = skill.goalValue * 3600;
        completedPercent = Math.min((todaySeconds / targetSeconds) * 100, 100);
        valuesText = `${formatHoursMins(todaySeconds)} / ${skill.goalValue} hrs`;
      } else if (skill.goalType === 'weekly-hours') {
        const weekSessions = await getSessionsForWeekOfDate(state.activeDateStr, skill.id);
        const weekSeconds = weekSessions.reduce((acc, curr) => acc + curr.duration, 0);
        const targetSeconds = skill.goalValue * 3600;
        completedPercent = Math.min((weekSeconds / targetSeconds) * 100, 100);
        valuesText = `${formatHoursMins(weekSeconds)} / ${skill.goalValue} hrs`;
      } else if (skill.goalType === 'weekly-times') {
        const weekSessions = await getSessionsForWeekOfDate(state.activeDateStr, skill.id);
        const uniqueDays = new Set(weekSessions.map(s => s.date)).size;
        const targetTimes = skill.goalValue;
        completedPercent = Math.min((uniqueDays / targetTimes) * 100, 100);
        valuesText = `${uniqueDays} / ${targetTimes} times`;
      }

      const item = document.createElement('div');
      item.className = 'goal-progress-item';
      item.innerHTML = `
        <div class="goal-progress-header">
          <span class="goal-progress-name">${skill.name}</span>
          <span class="goal-progress-values">${valuesText} (${Math.round(completedPercent)}%)</span>
        </div>
        <div class="goal-progress-bar-bg">
          <div class="goal-progress-bar-fill" style="background-color: ${skill.color}; width: ${completedPercent}%;"></div>
        </div>
      `;
      progressList.appendChild(item);
    }
  }

  // Bar Chart Renderer (Tab 2)
  function renderBarChart() {
    const wrapper = els.barChartWrapper;
    wrapper.innerHTML = '';

    if (state.sessions.length === 0) {
      wrapper.innerHTML = '<div class="empty-state">No activity logged today.</div>';
      return;
    }

    // Accumulate time per skill
    const skillTotals = {};
    state.sessions.forEach(sess => {
      skillTotals[sess.skillId] = (skillTotals[sess.skillId] || 0) + sess.duration;
    });

    // Find max duration for scaling
    let maxSeconds = 0;
    Object.keys(skillTotals).forEach(skillId => {
      if (skillTotals[skillId] > maxSeconds) {
        maxSeconds = skillTotals[skillId];
      }
    });

    if (maxSeconds === 0) maxSeconds = 3600;

    Object.keys(skillTotals).forEach(skillId => {
      const skill = state.skills.find(s => s.id == skillId);
      if (skill) {
        const durationSeconds = skillTotals[skillId];
        const pct = (durationSeconds / maxSeconds) * 100;
        const hours = (durationSeconds / 3600).toFixed(2);

        const row = document.createElement('div');
        row.className = 'bar-row';
        row.innerHTML = `
          <span class="bar-label" title="${skill.name}">${skill.name}</span>
          <div class="bar-outer">
            <div class="bar-inner" style="width: ${pct}%; background-color: ${skill.color};"></div>
          </div>
          <span class="bar-value-text">${hours}h</span>
        `;
        wrapper.appendChild(row);
      }
    });
  }

  // Timeline list (Tab 3)
  function renderTimelineList() {
    const list = els.timelineList;
    list.innerHTML = '';

    if (state.sessions.length === 0) {
      list.innerHTML = '<div class="empty-state">No activity blocks logged today.</div>';
      return;
    }

    // Sort chronologically (latest first, or earliest first? Earliest first is standard for timelines)
    const sorted = [...state.sessions].sort((a, b) => a.startTime - b.startTime);

    sorted.forEach(sess => {
      const skill = state.skills.find(s => s.id == sess.skillId);
      const skillName = skill ? skill.name : 'Unknown Skill';
      const skillColor = skill ? skill.color : 'var(--text-secondary)';

      const startTimeStr = formatTimeOfDay(sess.startTime);
      const endTimeStr = formatTimeOfDay(sess.endTime);
      
      const item = document.createElement('div');
      item.className = 'timeline-item';
      item.innerHTML = `
        <div class="timeline-item-info">
          <span class="timeline-item-time">${startTimeStr} – ${endTimeStr}</span>
          <span class="timeline-item-skill">
            <span class="skill-dot" style="background-color: ${skillColor};"></span>
            <span>${skillName}</span>
            ${sess.isManual ? '<span class="badge" style="padding:2px 6px; font-size:0.7rem; margin-left:4px;">Manual</span>' : ''}
          </span>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="timeline-item-duration">${formatShortDuration(sess.duration)}</span>
          <button class="delete-session-btn" data-id="${sess.id}" aria-label="Delete log">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      `;

      item.querySelector('.delete-session-btn').addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm("Are you sure you want to delete this session log?")) {
          await window.db.deleteSession(id);
          showToast("Session log deleted.", 'warning');
          await loadDashboardDay(state.activeDateStr);
        }
      });

      list.appendChild(item);
    });
  }

  // --- CALENDAR RENDERER ---
  async function renderCalendar() {
    const year = state.calendarYear;
    const month = state.calendarMonth;

    // Month Names
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    els.calMonthTitle.textContent = `${monthNames[month]} ${year}`;

    const calendarGrid = els.calendarDays;
    calendarGrid.innerHTML = '';

    // First day of month (0 = Sunday, 1 = Monday, etc.)
    // Standard calendar grid uses Monday as first column. Let's adjust:
    let firstDayIndex = new Date(year, month, 1).getDay();
    // Adjust Sunday index from 0 to 6, and Monday index from 1 to 0
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Number of days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Number of days in previous month
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    // Fetch all sessions for this month to check productivity indicators
    const allSessions = await window.db.getAllSessions();

    // 1. Render days of previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayCell = document.createElement('div');
      dayCell.className = 'cal-day-cell other-month';
      dayCell.innerHTML = `<span class="cal-day-num">${prevMonthTotalDays - i}</span>`;
      calendarGrid.appendChild(dayCell);
    }

    // 2. Render current month days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateStr = getLocalDateString(date);

      const dayCell = document.createElement('div');
      dayCell.className = 'cal-day-cell';
      if (dateStr === state.currentDateStr) {
        dayCell.classList.add('today');
      }
      if (dateStr === state.selectedCalendarDateStr) {
        dayCell.classList.add('selected');
      }

      // Calculate productivity percentage for this day
      const daySessions = allSessions.filter(s => s.date === dateStr);
      const totalSeconds = daySessions.reduce((acc, curr) => acc + curr.duration, 0);

      // We determine productivity score relative to goals
      let goalsMet = 0;
      let totalGoalsActive = 0;

      state.skills.forEach(skill => {
        if (skill.goalType === 'daily-hours') {
          totalGoalsActive++;
          const skillSec = daySessions.filter(s => s.skillId == skill.id).reduce((acc, curr) => acc + curr.duration, 0);
          if (skillSec >= skill.goalValue * 3600) {
            goalsMet++;
          }
        }
        // Weekly goal calculation is complex for individual calendar cells, 
        // so we check if there was positive practice time (intensity)
      });

      let percentComplete = 0;
      if (totalGoalsActive > 0) {
        percentComplete = (goalsMet / totalGoalsActive) * 100;
      } else {
        // If no daily goals, map intensity: 2 hours is 100%
        percentComplete = Math.min((totalSeconds / (2 * 3600)) * 100, 100);
      }

      // Draw SVG Ring progress indicators
      const ringCircumference = 62.8; // 2 * PI * 10
      const ringOffset = ringCircumference - (percentComplete / 100) * ringCircumference;

      dayCell.innerHTML = `
        <span class="cal-day-num">${day}</span>
        ${totalSeconds > 0 ? `
          <svg class="cal-prod-indicator" viewBox="0 0 24 24">
            <circle class="cal-ring-bg" cx="12" cy="12" r="10"></circle>
            <circle class="cal-ring-fill" cx="12" cy="12" r="10" 
              style="stroke-dashoffset: ${ringOffset}; stroke: ${percentComplete === 100 ? 'var(--accent-green)' : 'var(--accent-cyan)'};">
            </circle>
          </svg>
        ` : ''}
      `;

      dayCell.addEventListener('click', () => selectCalendarDate(dateStr));

      calendarGrid.appendChild(dayCell);
    }

    // 3. Render next month trailing days to complete standard 42-day layout
    const totalRendered = firstDayIndex + totalDays;
    const remainingDays = 42 - totalRendered;
    for (let i = 1; i <= remainingDays; i++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'cal-day-cell other-month';
      dayCell.innerHTML = `<span class="cal-day-num">${i}</span>`;
      calendarGrid.appendChild(dayCell);
    }
  }

  function changeCalendarMonth(direction) {
    state.calendarMonth += direction;
    if (state.calendarMonth > 11) {
      state.calendarMonth = 0;
      state.calendarYear += 1;
    } else if (state.calendarMonth < 0) {
      state.calendarMonth = 11;
      state.calendarYear -= 1;
    }
    renderCalendar();
  }

  async function selectCalendarDate(dateStr) {
    state.selectedCalendarDateStr = dateStr;
    
    // Rerender active selection cell
    document.querySelectorAll('.calendar-days .cal-day-cell').forEach(cell => {
      cell.classList.remove('selected');
    });
    
    renderCalendar();

    // Update Detail Sidebar panel
    els.detailDateLabel.textContent = formatDateLabel(dateStr);
    
    const daySessions = await window.db.getSessionsByDate(dateStr);
    const totalSeconds = daySessions.reduce((acc, curr) => acc + curr.duration, 0);
    els.detailTotalHours.textContent = `Total: ${(totalSeconds / 3600).toFixed(1)}h`;

    // 1. Goal checklist
    const goalsList = els.detailGoalsList;
    goalsList.innerHTML = '';

    if (state.skills.length === 0) {
      goalsList.innerHTML = '<li class="empty-state">No skills available.</li>';
    } else {
      for (const skill of state.skills) {
        let isCompleted = false;
        let details = '';

        if (skill.goalType === 'daily-hours') {
          const skillSec = daySessions.filter(s => s.skillId == skill.id).reduce((acc, curr) => acc + curr.duration, 0);
          isCompleted = skillSec >= skill.goalValue * 3600;
          details = `Goal: ${skill.goalValue}h/day (${(skillSec/3600).toFixed(1)}h done)`;
        } else if (skill.goalType === 'weekly-hours') {
          const weekSessions = await getSessionsForWeekOfDate(dateStr, skill.id);
          const weekSeconds = weekSessions.reduce((acc, curr) => acc + curr.duration, 0);
          isCompleted = weekSeconds >= skill.goalValue * 3600;
          details = `Goal: ${skill.goalValue}h/week (${(weekSeconds/3600).toFixed(1)}h done)`;
        } else if (skill.goalType === 'weekly-times') {
          const weekSessions = await getSessionsForWeekOfDate(dateStr, skill.id);
          const uniqueDays = new Set(weekSessions.map(s => s.date)).size;
          isCompleted = uniqueDays >= skill.goalValue;
          details = `Goal: ${skill.goalValue} times/week (${uniqueDays} days done)`;
        }

        const li = document.createElement('li');
        li.className = `detail-goal-item ${isCompleted ? 'completed' : ''}`;
        li.innerHTML = `
          <span class="goal-checkbox" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </span>
          <div>
            <div class="goal-name" style="font-weight:600;">${skill.name}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary);">${details}</div>
          </div>
        `;
        goalsList.appendChild(li);
      }
    }

    // 2. Timeline detail list
    const timelineList = els.detailTimelineList;
    timelineList.innerHTML = '';

    if (daySessions.length === 0) {
      timelineList.innerHTML = '<div class="empty-state">No timeline logs for this day.</div>';
    } else {
      const sorted = [...daySessions].sort((a,b) => a.startTime - b.startTime);
      sorted.forEach(sess => {
        const skill = state.skills.find(s => s.id == sess.skillId);
        const name = skill ? skill.name : 'Unknown Skill';
        const color = skill ? skill.color : 'var(--text-secondary)';
        
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
          <div class="timeline-item-info">
            <span class="timeline-item-time">${formatTimeOfDay(sess.startTime)} – ${formatTimeOfDay(sess.endTime)}</span>
            <span class="timeline-item-skill">
              <span class="skill-dot" style="background-color: ${color};"></span>
              <span>${name}</span>
            </span>
          </div>
          <span class="timeline-item-duration">${formatShortDuration(sess.duration)}</span>
        `;
        timelineList.appendChild(item);
      });
    }
  }

  // --- HELPER UTILITIES ---
  function getLocalDateString(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDateLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatTimeStr(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].join(':');
  }

  function formatHoursMins(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  function formatHoursMinsShort(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  }

  function formatShortDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) {
      return s > 0 ? `${m}m ${s}s` : `${m}m`;
    }
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
  }

  function formatTimeOfDay(timestamp) {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    return `${hours}:${minutes} ${ampm}`;
  }

  function getRandomQuote(category) {
    const arr = quotes[category];
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
  }

  // Retrieve sessions for the current calendar week (Monday to Sunday) of skillId
  async function getSessionsForCurrentWeek(skillId) {
    const today = new Date();
    // Monday is start of week
    const currentDay = today.getDay();
    const distanceToMon = currentDay === 0 ? 6 : currentDay - 1;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMon);
    monday.setHours(0,0,0,0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    const allSessions = await window.db.getSessionsBySkill(skillId);
    
    return allSessions.filter(sess => {
      const time = sess.startTime;
      return time >= monday.getTime() && time <= sunday.getTime();
    });
  }

  // Retrieve sessions for the calendar week containing dateStr of skillId
  async function getSessionsForWeekOfDate(dateStr, skillId) {
    const date = new Date(dateStr + 'T00:00:00');
    const currentDay = date.getDay();
    const distanceToMon = currentDay === 0 ? 6 : currentDay - 1;
    
    const monday = new Date(date);
    monday.setDate(date.getDate() - distanceToMon);
    monday.setHours(0,0,0,0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    const allSessions = await window.db.getSessionsBySkill(skillId);
    
    return allSessions.filter(sess => {
      const time = sess.startTime;
      return time >= monday.getTime() && time <= sunday.getTime();
    });
  }

  // Save state on page close / refresh
  window.addEventListener('beforeunload', () => {
    saveTimerStateToLocal();
  });

  // Initialize
  await initApp();
});
