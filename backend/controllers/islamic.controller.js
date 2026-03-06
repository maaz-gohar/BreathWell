const path = require('path');
const fs = require('fs');

const sleepDataPath = path.join(__dirname, '../data/sleep-modules.json');
const relationshipDataPath = path.join(__dirname, '../data/relationship-modules.json');

const loadJson = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading JSON:', err);
    return null;
  }
};

exports.getModules = async (req, res) => {
  try {
    const { type } = req.query;
    if (!type || !['sleep', 'relationship'].includes(type)) {
      return res.status(400).json({ message: 'Invalid or missing type. Use type=sleep or type=relationship' });
    }

    const filePath = type === 'sleep' ? sleepDataPath : relationshipDataPath;
    const data = loadJson(filePath);
    if (!data || !data.modules) {
      return res.status(500).json({ message: 'Content not available' });
    }

    const modules = data.modules
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((m, i) => ({ ...m, id: `module-${type}-${i}` }));

    res.json({ success: true, data: modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Error fetching Islamic modules' });
  }
};

exports.getModuleById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !id.startsWith('module-')) {
      return res.status(400).json({ message: 'Invalid module ID' });
    }

    const parts = id.replace('module-', '').split('-');
    const type = parts[0];
    const index = parseInt(parts[1], 10);

    if (!['sleep', 'relationship'].includes(type) || isNaN(index)) {
      return res.status(400).json({ message: 'Invalid module ID' });
    }

    const filePath = type === 'sleep' ? sleepDataPath : relationshipDataPath;
    const data = loadJson(filePath);
    if (!data || !data.modules || !data.modules[index]) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const module = { ...data.modules[index], id };
    res.json({ success: true, data: module });
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ message: 'Error fetching module' });
  }
};

exports.getSleepRituals = async (req, res) => {
  try {
    const data = loadJson(sleepDataPath);
    if (!data || !data.rituals) {
      return res.status(500).json({ message: 'Content not available' });
    }
    res.json({ success: true, data: data.rituals });
  } catch (error) {
    console.error('Error fetching sleep rituals:', error);
    res.status(500).json({ message: 'Error fetching sleep rituals' });
  }
};

exports.getMorningAdhkar = async (req, res) => {
  try {
    const data = loadJson(sleepDataPath);
    if (!data || !data.morningAdhkar) {
      return res.status(500).json({ message: 'Content not available' });
    }
    res.json({ success: true, data: data.morningAdhkar });
  } catch (error) {
    console.error('Error fetching morning adhkar:', error);
    res.status(500).json({ message: 'Error fetching morning adhkar' });
  }
};

exports.getTahajjudContent = async (req, res) => {
  try {
    const data = loadJson(sleepDataPath);
    if (!data || !data.tahajjud) {
      return res.status(500).json({ message: 'Content not available' });
    }
    res.json({ success: true, data: data.tahajjud });
  } catch (error) {
    console.error('Error fetching tahajjud content:', error);
    res.status(500).json({ message: 'Error fetching tahajjud content' });
  }
};

exports.getRuqyahVerses = async (req, res) => {
  try {
    const data = loadJson(sleepDataPath);
    if (!data || !data.ruqyah) {
      return res.status(500).json({ message: 'Content not available' });
    }
    res.json({ success: true, data: data.ruqyah });
  } catch (error) {
    console.error('Error fetching ruqyah verses:', error);
    res.status(500).json({ message: 'Error fetching ruqyah verses' });
  }
};
