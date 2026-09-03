// Districts routes
const express = require('express');
const router = express.Router();
const { getSupabase, isUsingMemoryStore, memoryStore } = require('../config/database');

// GET /api/districts
router.get('/', async (req, res) => {
  try {
    let districts;

    if (isUsingMemoryStore()) {
      districts = memoryStore.districts.map(d => ({
        ...d,
        project_count: memoryStore.projects.filter(p => p.district_id === d.id).length
      }));
    } else {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('districts').select('*');
      if (error) throw error;
      districts = data || [];
    }

    res.json({
      success: true,
      data: districts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;
