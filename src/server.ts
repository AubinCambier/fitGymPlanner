import app from './app.js';
import pool from './config/db.js';

const PORT = process.env.PORT ?? 3000;

pool.query('SELECT NOW()').then(() => {
  console.log('Base de données connectée');
}).catch((err) => {
  console.error('Erreur de connexion BDD :', err);
});

app.listen(PORT, () => {
  console.log(`FitGym Planner running on http://localhost:${PORT}`);
});
