import * as SQLite from 'expo-sqlite';

const DB_NAME = 'homework_management.db';

export async function getDbConnection() {
  // Abre uma nova conexao assincrona com o banco local do app.
  return SQLite.openDatabaseAsync(DB_NAME);
}

export function createId(prefix = 'id') {
  // Gera IDs simples para evitar colisao entre registros criados no dispositivo.
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

export async function initializeDatabase() {
  const db = await getDbConnection();
  try {
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Cria a estrutura principal usada para alunos, trabalhos, vinculos e atividades.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        registration TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS works (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        due_date TEXT NOT NULL,
        estimated_hours REAL NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS work_students (
        id TEXT PRIMARY KEY NOT NULL,
        work_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_work_students_unique
      ON work_students(work_id, student_id);

      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY NOT NULL,
        work_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        description TEXT NOT NULL,
        estimated_hours REAL NOT NULL,
        completed_hours REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      );
    `);
  } finally {
    await db.closeAsync();
  }
}

export async function getStudents() {
  const db = await getDbConnection();
  try {
    return await db.getAllAsync(
      'SELECT id, name, registration FROM students ORDER BY name ASC'
    );
  } finally {
    await db.closeAsync();
  }
}

export async function insertStudent(student) {
  const db = await getDbConnection();
  try {
    const result = await db.runAsync(
      'INSERT INTO students (id, name, registration) VALUES (?, ?, ?)',
      [student.id, student.name, student.registration]
    );
    return result.changes === 1;
  } finally {
    await db.closeAsync();
  }
}

export async function updateStudent(student) {
  const db = await getDbConnection();
  try {
    const result = await db.runAsync(
      'UPDATE students SET name = ?, registration = ? WHERE id = ?',
      [student.name, student.registration, student.id]
    );
    return result.changes === 1;
  } finally {
    await db.closeAsync();
  }
}

export async function deleteStudent(id) {
  const db = await getDbConnection();
  try {
    await db.runAsync('DELETE FROM activities WHERE student_id = ?', [id]);
    await db.runAsync('DELETE FROM work_students WHERE student_id = ?', [id]);
    const result = await db.runAsync('DELETE FROM students WHERE id = ?', [id]);
    return result.changes === 1;
  } finally {
    await db.closeAsync();
  }
}

export async function getWorks() {
  const db = await getDbConnection();
  try {
    return await db.getAllAsync(`
      SELECT
        w.id,
        w.name,
        w.due_date,
        w.estimated_hours,
        w.status,
        COUNT(DISTINCT ws.student_id) AS students_count,
        COUNT(DISTINCT a.id) AS activities_count
      FROM works w
      LEFT JOIN work_students ws ON ws.work_id = w.id
      LEFT JOIN activities a ON a.work_id = w.id
      GROUP BY w.id, w.name, w.due_date, w.estimated_hours, w.status
      ORDER BY w.due_date ASC, w.name ASC
    `);
  } finally {
    await db.closeAsync();
  }
}

export async function insertWork(work) {
  const db = await getDbConnection();
  try {
    const result = await db.runAsync(
      'INSERT INTO works (id, name, due_date, estimated_hours, status) VALUES (?, ?, ?, ?, ?)',
      [work.id, work.name, work.due_date, work.estimated_hours, work.status]
    );
    return result.changes === 1;
  } finally {
    await db.closeAsync();
  }
}

export async function updateWork(work) {
  const db = await getDbConnection();
  try {
    const result = await db.runAsync(
      'UPDATE works SET name = ?, due_date = ?, estimated_hours = ?, status = ? WHERE id = ?',
      [work.name, work.due_date, work.estimated_hours, work.status, work.id]
    );
    return result.changes === 1;
  } finally {
    await db.closeAsync();
  }
}

export async function deleteWork(id) {
  const db = await getDbConnection();
  try {
    await db.runAsync('DELETE FROM activities WHERE work_id = ?', [id]);
    await db.runAsync('DELETE FROM work_students WHERE work_id = ?', [id]);
    const result = await db.runAsync('DELETE FROM works WHERE id = ?', [id]);
    return result.changes === 1;
  } finally {
    await db.closeAsync();
  }
}

export async function getWorkStudentIds(workId) {
  const db = await getDbConnection();
  try {
    const rows = await db.getAllAsync(
      'SELECT student_id FROM work_students WHERE work_id = ? ORDER BY student_id',
      [workId]
    );
    return rows.map((row) => row.student_id);
  } finally {
    await db.closeAsync();
  }
}

export async function getWorkStudents(workId) {
  const db = await getDbConnection();
  try {
    return await db.getAllAsync(
      `SELECT s.id, s.name, s.registration
       FROM students s
       INNER JOIN work_students ws ON ws.student_id = s.id
       WHERE ws.work_id = ?
       ORDER BY s.name ASC`,
      [workId]
    );
  } finally {
    await db.closeAsync();
  }
}

export async function replaceWorkStudents(workId, studentIds) {
  const db = await getDbConnection();
  try {
    await db.runAsync('DELETE FROM work_students WHERE work_id = ?', [workId]);

    // Recria os vinculos do trabalho com os alunos selecionados no formulario.
    for (const studentId of studentIds) {
      await db.runAsync(
        'INSERT INTO work_students (id, work_id, student_id) VALUES (?, ?, ?)',
        [createId('ws'), workId, studentId]
      );
    }

    if (studentIds.length > 0) {
      const placeholders = studentIds.map(() => '?').join(',');
      await db.runAsync(
        `DELETE FROM activities WHERE work_id = ? AND student_id NOT IN (${placeholders})`,
        [workId, ...studentIds]
      );
    } else {
      await db.runAsync('DELETE FROM activities WHERE work_id = ?', [workId]);
    }

    return true;
  } finally {
    await db.closeAsync();
  }
}

export async function getActivitiesByWork(workId) {
  const db = await getDbConnection();
  try {
    return await db.getAllAsync(
      `SELECT
        a.id,
        a.work_id,
        a.student_id,
        a.description,
        a.estimated_hours,
        a.completed_hours,
        a.status,
        s.name AS student_name
       FROM activities a
       LEFT JOIN students s ON s.id = a.student_id
       WHERE a.work_id = ?
       ORDER BY a.description ASC`,
      [workId]
    );
  } finally {
    await db.closeAsync();
  }
}

export async function insertActivity(activity) {
  const db = await getDbConnection();
  try {
    const result = await db.runAsync(
      `INSERT INTO activities
        (id, work_id, student_id, description, estimated_hours, completed_hours, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        activity.id,
        activity.work_id,
        activity.student_id,
        activity.description,
        activity.estimated_hours,
        activity.completed_hours,
        activity.status,
      ]
    );
    return result.changes === 1;
  } finally {
    await db.closeAsync();
  }
}

export async function updateActivity(activity) {
  const db = await getDbConnection();
  try {
    const result = await db.runAsync(
      `UPDATE activities
       SET description = ?, student_id = ?, estimated_hours = ?, completed_hours = ?, status = ?
       WHERE id = ?`,
      [
        activity.description,
        activity.student_id,
        activity.estimated_hours,
        activity.completed_hours,
        activity.status,
        activity.id,
      ]
    );
    return result.changes === 1;
  } finally {
    await db.closeAsync();
  }
}

export async function updateActivityProgress(activityId, completedHours, status) {
  const db = await getDbConnection();
  try {
    const result = await db.runAsync(
      'UPDATE activities SET completed_hours = ?, status = ? WHERE id = ?',
      [completedHours, status, activityId]
    );
    return result.changes === 1;
  } finally {
    await db.closeAsync();
  }
}

export async function deleteActivity(id) {
  const db = await getDbConnection();
  try {
    const result = await db.runAsync('DELETE FROM activities WHERE id = ?', [id]);
    return result.changes === 1;
  } finally {
    await db.closeAsync();
  }
}

export async function getWorkChartData(workId) {
  const activities = await getActivitiesByWork(workId);
  const estimatedTotal = activities.reduce((sum, item) => sum + Number(item.estimated_hours || 0), 0);
  const completedTotal = activities.reduce((sum, item) => sum + Number(item.completed_hours || 0), 0);

  // Entrega os dados ja agregados para facilitar a renderizacao do grafico.
  return {
    activities,
    estimatedTotal,
    completedTotal,
    completionPercent: estimatedTotal > 0
      ? Math.min((completedTotal / estimatedTotal) * 100, 100)
      : 0,
  };
}
