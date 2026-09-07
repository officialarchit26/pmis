// PMIS Authentication Routes
// Login, logout, and current user endpoints

const express = require('express');
const router = express.Router();
const { getSupabase } = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

// ============ LOGIN ============
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password required' }
      });
    }

    // Demo login - accepts any password for demo accounts in demo mode
    const demoUsers = {
      'worker@pmis.demo': { role: 'worker', department_id: 'dept-001', district_id: 'dist-001', full_name: 'John Worker' },
      'official@pmis.demo': { role: 'official', department_id: 'dept-001', district_id: 'dist-001', full_name: 'Jane Official' },
      'senior@pmis.demo': { role: 'senior_official', department_id: null, district_id: null, full_name: 'Robert Senior' },
      'admin@pmis.demo': { role: 'admin', department_id: null, district_id: null, full_name: 'Sarah Admin' },
    };

    const demoUser = demoUsers[email.toLowerCase()];
    if (demoUser) {
      // Return demo session with role-encoded token
      return res.json({
        success: true,
        data: {
          session: {
            access_token: `demo-${demoUser.role}-${Date.now()}`,
            user: {
              id: 'demo-' + demoUser.role,
              email,
              role: demoUser.role,
              department_id: demoUser.department_id,
              district_id: demoUser.district_id,
              full_name: demoUser.full_name,
              is_demo: true
            }
          }
        }
      });
    }

    const supabase = getSupabase();

    if (!supabase) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Real Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role, department_id, district_id, is_active')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not configured' }
      });
    }

    if (!profile.is_active) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: 'Account has been disabled' }
      });
    }

    res.json({
      success: true,
      data: {
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user: {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            department_id: profile.department_id,
            district_id: profile.district_id,
          }
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Login failed' }
    });
  }
});

// ============ LOGOUT ============
router.post('/logout', authenticateUser, async (req, res) => {
  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Logout failed' }
    });
  }
});

// ============ CURRENT USER ============
router.get('/me', authenticateUser, async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

module.exports = router;