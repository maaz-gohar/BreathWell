const Mood = require('../models/Mood');
const moment = require('moment');

exports.addMood = async (req, res) => {
  try {
    const { moodEmoji, moodScore, note, tags } = req.body;
    
    // Check if mood already logged today
    const today = moment().startOf('day');
    const existingMood = await Mood.findOne({
      userId: req.userId,
      date: {
        $gte: today.toDate(),
        $lte: moment(today).endOf('day').toDate()
      }
    });

    if (existingMood) {
      return res.status(400).json({ message: 'Mood already logged today' });
    }

    const mood = new Mood({
      userId: req.userId,
      moodEmoji,
      moodScore,
      note,
      tags: tags || []
    });

    await mood.save();
    res.status(201).json({ message: 'Mood logged successfully', mood });
  } catch (error) {
    res.status(500).json({ message: 'Error logging mood' });
  }
};

exports.getTodayMood = async (req, res) => {
  try {
    const today = moment().startOf('day');
    const mood = await Mood.findOne({
      userId: req.userId,
      date: {
        $gte: today.toDate(),
        $lte: moment(today).endOf('day').toDate()
      }
    });

    res.json({ mood });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching today\'s mood' });
  }
};

exports.getWeeklyMoods = async (req, res) => {
  try {
    const startOfWeek = moment().startOf('week');
    const endOfWeek = moment().endOf('week');

    const moods = await Mood.find({
      userId: req.userId,
      date: {
        $gte: startOfWeek.toDate(),
        $lte: endOfWeek.toDate()
      }
    }).sort({ date: 1 });

    res.json({ moods });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching weekly moods' });
  }
};

exports.getMoodAnalytics = async (req, res) => {
  try {
    const { weeks = 4 } = req.query;
    const startDate = moment().subtract(weeks, 'weeks').startOf('day');

    const moods = await Mood.find({
      userId: req.userId,
      date: { $gte: startDate.toDate() }
    }).sort({ date: 1 });

    // Calculate analytics
    const moodCounts = {};
    const weeklyAverages = [];
    const moodTrends = [];

    moods.forEach(mood => {
      const week = moment(mood.date).format('YYYY-[W]WW');
      if (!moodCounts[week]) {
        moodCounts[week] = { total: 0, count: 0 };
      }
      moodCounts[week].total += mood.moodScore;
      moodCounts[week].count += 1;
    });

    Object.keys(moodCounts).forEach(week => {
      weeklyAverages.push({
        week,
        average: moodCounts[week].total / moodCounts[week].count
      });
    });

    // Mood distribution
    const distribution = moods.reduce((acc, mood) => {
      acc[mood.moodEmoji] = (acc[mood.moodEmoji] || 0) + 1;
      return acc;
    }, {});

    res.json({
      weeklyAverages,
      distribution,
      totalMoods: moods.length,
      averageMood: moods.length > 0 ? 
        moods.reduce((sum, mood) => sum + mood.moodScore, 0) / moods.length : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mood analytics' });
  }
};

exports.updateMood = async (req, res) => {
  try {
    const { id } = req.params;
    const { moodEmoji, moodScore, note, tags } = req.body;

    const mood = await Mood.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { moodEmoji, moodScore, note, tags },
      { new: true }
    );

    if (!mood) {
      return res.status(404).json({ message: 'Mood not found' });
    }

    res.json({ message: 'Mood updated successfully', mood });
  } catch (error) {
    res.status(500).json({ message: 'Error updating mood' });
  }
};

exports.deleteMood = async (req, res) => {
  try {
    const { id } = req.params;
    
    const mood = await Mood.findOneAndDelete({ _id: id, userId: req.userId });
    
    if (!mood) {
      return res.status(404).json({ message: 'Mood not found' });
    }

    res.json({ message: 'Mood deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting mood' });
  }
};