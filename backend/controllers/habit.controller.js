const Habit = require('../models/Habit');
const moment = require('moment');

exports.createHabit = async (req, res) => {
  try {
    const { name, description, reminderTime, category } = req.body;

    const habit = new Habit({
      userId: req.userId,
      name,
      description,
      reminderTime,
      category: category || 'health',
      entries: []
    });

    await habit.save();
    res.status(201).json({ message: 'Habit created successfully', habit });
  } catch (error) {
    res.status(500).json({ message: 'Error creating habit' });
  }
};

exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId }).sort({ createdAt: -1 });

    // Check and update streaks
    const updatedHabits = await Promise.all(
      habits.map(async (habit) => {
        const today = moment().format('YYYY-MM-DD');
        const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
        
        const todayEntry = habit.entries.find(entry => 
          moment(entry.date).format('YYYY-MM-DD') === today
        );
        
        const yesterdayEntry = habit.entries.find(entry => 
          moment(entry.date).format('YYYY-MM-DD') === yesterday
        );

        // Reset streak if missed yesterday
        if (!todayEntry && !yesterdayEntry && habit.streakCount > 0) {
          habit.streakCount = 0;
          await habit.save();
        }

        return habit;
      })
    );

    res.json({ habits: updatedHabits });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching habits' });
  }
};

exports.completeHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const habit = await Habit.findOne({ _id: id, userId: req.userId });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const today = moment().startOf('day');
    const todayEntry = habit.entries.find(entry => 
      moment(entry.date).isSame(today, 'day')
    );

    if (todayEntry) {
      todayEntry.completed = !todayEntry.completed;
    } else {
      habit.entries.push({
        date: today.toDate(),
        completed: true
      });
    }

    // Update streak
    if (!todayEntry || !todayEntry.completed) {
      const yesterday = moment().subtract(1, 'day').startOf('day');
      const yesterdayEntry = habit.entries.find(entry => 
        moment(entry.date).isSame(yesterday, 'day')
      );

      if (yesterdayEntry && yesterdayEntry.completed) {
        habit.streakCount += 1;
      } else {
        habit.streakCount = 1;
      }

      if (habit.streakCount > habit.bestStreak) {
        habit.bestStreak = habit.streakCount;
      }
    }

    await habit.save();
    res.json({ message: 'Habit updated successfully', habit });
  } catch (error) {
    res.status(500).json({ message: 'Error completing habit' });
  }
};

exports.updateHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, reminderTime, category } = req.body;

    const habit = await Habit.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { name, description, reminderTime, category },
      { new: true }
    );

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    res.json({ message: 'Habit updated successfully', habit });
  } catch (error) {
    res.status(500).json({ message: 'Error updating habit' });
  }
};

exports.deleteHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const habit = await Habit.findOneAndDelete({ _id: id, userId: req.userId });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting habit' });
  }
};

exports.getStreaks = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId });
    
    const totalStreaks = habits.reduce((sum, habit) => sum + habit.streakCount, 0);
    const bestStreak = Math.max(...habits.map(h => h.bestStreak), 0);
    const completedToday = habits.filter(habit => {
      const today = moment().format('YYYY-MM-DD');
      return habit.entries.some(entry => 
        moment(entry.date).format('YYYY-MM-DD') === today && entry.completed
      );
    }).length;

    res.json({
      totalStreaks,
      bestStreak,
      completedToday,
      totalHabits: habits.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching streaks' });
  }
};