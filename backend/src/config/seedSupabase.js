// Database Seeding Script for PMIS Supabase
// Populates departments, districts, users, projects, milestones, budgets, alerts, progress_updates

require('dotenv').config();
const { getSupabase } = require('./database');
const departmentsData = require('../../../data/seed/departments.json');
const districtsData = require('../../../data/seed/districts.json');
const projectsData = require('../../../data/seed/projects.json');
const milestonesData = require('../../../data/seed/milestones.json');
const budgetsData = require('../../../data/seed/budgets.json');

const crypto = require('crypto');

// Generate deterministic unique UUIDs from seed IDs using MD5
function stringToUUID(str) {
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

async function seed() {
  const supabase = getSupabase();
  if (!supabase) {
    console.error('Supabase client not initialized. Check .env');
    process.exit(1);
  }

  console.log('Seeding Supabase database...');

  // Clean existing tables in reverse dependency order
  console.log('Cleaning old data...');
  await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('progress_updates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('budgets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('milestones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('departments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('districts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Map string IDs to UUIDs
  const deptMap = {};
  const distMap = {};
  const projMap = {};

  // 1. Departments
  console.log('Seeding departments...');
  const departments = departmentsData.map((d, i) => {
    const id = stringToUUID(`dept-${i + 1}`);
    deptMap[d.id] = id;
    return {
      id,
      name: d.name,
      code: d.code,
      description: d.description,
      contact_email: `${d.code.toLowerCase()}@pmis.gov`,
      head_name: `Director ${d.code}`
    };
  });

  const { error: deptErr } = await supabase.from('departments').upsert(departments, { onConflict: 'code' });
  if (deptErr) console.error('Error inserting departments:', deptErr);
  else console.log(`✓ Inserted ${departments.length} departments`);

  // 2. Districts
  console.log('Seeding districts...');
  const districts = districtsData.map((d, i) => {
    const id = stringToUUID(`dist-${i + 1}`);
    distMap[d.id] = id;
    return {
      id,
      name: d.name,
      state: d.state,
      region: d.region,
      latitude: d.latitude,
      longitude: d.longitude,
      population: d.population || 500000
    };
  });

  const { error: distErr } = await supabase.from('districts').upsert(districts, { onConflict: 'id' });
  if (distErr) console.error('Error inserting districts:', distErr);
  else console.log(`✓ Inserted ${districts.length} districts`);

  // 3. Demo Users
  console.log('Seeding demo users...');
  const users = [
    {
      id: stringToUUID('user-worker'),
      email: 'worker@pmis.demo',
      full_name: 'John Worker',
      role: 'viewer', // schema checks: admin, department_officer, district_officer, viewer
      department_id: departments[0].id,
      district_id: districts[0].id,
      is_active: true
    },
    {
      id: stringToUUID('user-official'),
      email: 'official@pmis.demo',
      full_name: 'Jane Official',
      role: 'department_officer',
      department_id: departments[0].id,
      district_id: districts[0].id,
      is_active: true
    },
    {
      id: stringToUUID('user-senior'),
      email: 'senior@pmis.demo',
      full_name: 'Robert Senior',
      role: 'admin',
      department_id: null,
      district_id: null,
      is_active: true
    },
    {
      id: stringToUUID('user-admin'),
      email: 'admin@pmis.demo',
      full_name: 'Sarah Admin',
      role: 'admin',
      department_id: null,
      district_id: null,
      is_active: true
    }
  ];

  const { error: userErr } = await supabase.from('users').upsert(users, { onConflict: 'email' });
  if (userErr) console.error('Error inserting users:', userErr);
  else console.log(`✓ Inserted ${users.length} users`);

  // 4. Projects with coordinates
  console.log('Seeding projects...');
  const projects = projectsData.map((p, i) => {
    const id = stringToUUID(`proj-${i + 1}`);
    projMap[p.id] = id;
    const deptId = deptMap[p.department_id] || departments[0].id;
    const distId = distMap[p.district_id] || districts[0].id;
    const dist = districts.find(d => d.id === distId) || districts[0];

    // Offset slightly from district center so multiple projects don't overlap exactly
    const latOffset = ((i % 5) - 2) * 0.08;
    const lonOffset = ((Math.floor(i / 2) % 5) - 2) * 0.08;

    return {
      id,
      name: p.name,
      description: p.description,
      department_id: deptId,
      district_id: distId,
      status: p.status,
      priority: p.priority || 'medium',
      start_date: p.start_date || '2025-01-01',
      end_date: p.end_date || '2026-12-31',
      progress_percent: p.progress_percent || 0,
      budget_total: p.budget_total || 1000000,
      budget_utilized: p.budget_utilized || 500000,
      risk_score: p.risk_score || 20,
      latitude: Number(dist.latitude) + latOffset,
      longitude: Number(dist.longitude) + lonOffset
    };
  });

  const { error: projErr } = await supabase.from('projects').upsert(projects, { onConflict: 'id' });
  if (projErr) console.error('Error inserting projects:', projErr);
  else console.log(`✓ Inserted ${projects.length} projects`);

  // 5. Milestones
  console.log('Seeding milestones...');
  const milestones = milestonesData.map((m, i) => {
    const id = stringToUUID(`mile-${i + 1}`);
    const projectId = projMap[m.project_id] || projects[0].id;
    return {
      id,
      project_id: projectId,
      title: m.title,
      description: m.description || '',
      due_date: m.due_date,
      status: m.status,
      order_num: m.order_num || i + 1
    };
  });

  const { error: mileErr } = await supabase.from('milestones').upsert(milestones, { onConflict: 'id' });
  if (mileErr) console.error('Error inserting milestones:', mileErr);
  else console.log(`✓ Inserted ${milestones.length} milestones`);

  // 6. Budgets
  console.log('Seeding budgets...');
  const budgets = budgetsData.map((b, i) => {
    const id = stringToUUID(`budg-${i + 1}`);
    const projectId = projMap[b.project_id] || projects[0].id;
    return {
      id,
      project_id: projectId,
      category: b.category,
      allocated: b.allocated,
      utilized: b.utilized,
      fiscal_year: b.fiscal_year
    };
  });

  const { error: budgErr } = await supabase.from('budgets').upsert(budgets, { onConflict: 'id' });
  if (budgErr) console.error('Error inserting budgets:', budgErr);
  else console.log(`✓ Inserted ${budgets.length} budgets`);

  // 7. Alerts
  console.log('Seeding alerts...');
  const alerts = [];
  projects.forEach((proj, idx) => {
    if (proj.status === 'delayed') {
      alerts.push({
        id: stringToUUID(`alert-delay-${idx}`),
        project_id: proj.id,
        type: 'delay',
        severity: 'critical',
        title: `Project "${proj.name}" is delayed`,
        message: `Physical progress is at ${proj.progress_percent}%, falling behind schedule.`,
        is_resolved: false
      });
    }
    if (proj.risk_score >= 60) {
      alerts.push({
        id: stringToUUID(`alert-risk-${idx}`),
        project_id: proj.id,
        type: 'risk',
        severity: proj.risk_score >= 75 ? 'critical' : 'high',
        title: `High risk detected for "${proj.name}"`,
        message: `Risk score assessed at ${proj.risk_score}/100. Immediate intervention advised.`,
        is_resolved: false
      });
    }
    if (proj.budget_utilized / proj.budget_total > 0.8) {
      alerts.push({
        id: stringToUUID(`alert-budget-${idx}`),
        project_id: proj.id,
        type: 'budget_overrun',
        severity: 'high',
        title: `Budget alert for "${proj.name}"`,
        message: `Budget utilization exceeded 80% (${Math.round((proj.budget_utilized / proj.budget_total) * 100)}%).`,
        is_resolved: false
      });
    }
  });

  const { error: alertErr } = await supabase.from('alerts').upsert(alerts, { onConflict: 'id' });
  if (alertErr) console.error('Error inserting alerts:', alertErr);
  else console.log(`✓ Inserted ${alerts.length} alerts`);

  // 8. Progress Updates
  console.log('Seeding progress updates...');
  const progressUpdates = [];
  projects.forEach((proj, pIdx) => {
    const numUpdates = 3;
    for (let u = 0; u < numUpdates; u++) {
      const daysAgo = (numUpdates - u) * 20;
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      progressUpdates.push({
        id: stringToUUID(`prog-${pIdx}-${u}`),
        project_id: proj.id,
        progress_percent: Math.min(100, Math.round(((proj.progress_percent / numUpdates) * (u + 1)) * 10) / 10),
        notes: `Phase ${u + 1} inspection and milestone review for ${proj.name}.`,
        created_at: d.toISOString()
      });
    }
  });

  const { error: progErr } = await supabase.from('progress_updates').upsert(progressUpdates, { onConflict: 'id' });
  if (progErr) console.error('Error inserting progress updates:', progErr);
  else console.log(`✓ Inserted ${progressUpdates.length} progress updates`);

  console.log('Seeding completed successfully!');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
