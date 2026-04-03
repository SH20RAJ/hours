# ⏳ Hours

**Measure your time. Keep your promises. Improve your life.**

Hours is a powerful time-tracking and task accountability app that helps you understand **how you actually spend your time vs how you planned to spend it**.

---

## 🚀 Overview

Hours is not just another task manager.

It is a **Time Accountability System** that:

* Tracks your work with a live timer
* Compares **planned vs actual effort**
* Shows **overperformance and underperformance**
* Helps you analyze your life through time

---

## ✨ Features

### 🧱 Task Management

* Create tasks with:

  * Daily / Weekly / Monthly time goals
  * Optional schedules (e.g., 7–9 PM)
* Edit tasks anytime
* Organize tasks using tags

### ⏱️ Smart Timer

* Start / Pause / Stop timer per task
* Runs in background
* Automatically logs sessions

### 🎯 Goal Tracking

* Example:

  * “DSA → 2 hours daily”
* Behavior:

  * Completes when target reached
  * Tracks extra time if exceeded

### 🆓 Free Tasks

* No time limit required
* Just track what you do
* Perfect for flexible activities

### 🏷️ Tag System

* Add tags like:

  * #study
  * #health
  * #waste
* Analyze time by category

### 📊 Analytics Dashboard

* Planned vs actual time
* Task-wise breakdown
* Tag-wise insights
* Untracked / unrecognized time

### 📈 Weekly Insights

* Compare performance week-by-week
* Track improvements
* Identify patterns

### 🧠 Self Accountability

* See:

  * How much you promised
  * How much you delivered
* Build discipline through data

---

## 🧠 Core Philosophy

> “You don’t improve your life by planning better.
> You improve it by measuring honestly.”

Hours focuses on:

* Awareness
* Consistency
* Self-accountability

---

## 🏗️ Tech Stack

* **Frontend:** Next.js (App Router)
* **Styling:** Tailwind CSS
* **State Management:** Zustand / Redux
* **Backend:** Next.js API / Node.js
* **Database:** PostgreSQL / MongoDB
* **Mobile (planned):** React Native

---

## 📦 Project Structure (Example)

```
/app
  /dashboard
  /tasks
  /analytics

/components
  Timer.tsx
  TaskCard.tsx

/lib
  db.ts
  utils.ts

/api
  /tasks
  /sessions
```

---

## 🧩 Data Models

### Task

```json
{
  "id": "string",
  "name": "DSA",
  "type": "structured | free",
  "target_hours": 2,
  "target_type": "daily | weekly | monthly",
  "tags": ["study"],
  "schedule_time": "19:00"
}
```

### Session

```json
{
  "id": "string",
  "task_id": "string",
  "start_time": "timestamp",
  "end_time": "timestamp",
  "duration": 120
}
```

---

## ⚙️ How It Works

1. Create a task (with or without time goal)
2. Start the timer when you begin
3. Stop when done
4. Hours logs your session
5. Analytics updates automatically

---

## 🛠️ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/hours.git
cd hours
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the app

```bash
npm run dev
```

---

## 🔥 Future Features

* AI productivity coach
* Habit scoring system
* Public accountability sharing
* Deep analytics (life insights)
* Idle detection
* Smart recommendations

---

## 💡 Use Cases

* Students tracking study hours
* Developers tracking coding time
* Creators managing content time
* Anyone improving time discipline

---

## 🧪 MVP Scope

* Task creation
* Timer system
* Session logging
* Basic analytics dashboard

---

## 🤝 Contributing

Contributions are welcome!

* Fork the repo
* Create a feature branch
* Submit a pull request

---

## 📜 License

MIT License

---

## 💭 Final Thought

Hours is designed to answer one simple question:

> **“Are you spending your time the way you think you are?”**
