const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const authMiddleware = require('./middleware/auth');
const { Parser } = require('json2csv')

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor do SIA-QME está no ar!');
});

// 👇👇👇 ADICIONE ESTE BLOCO DE CÓDIGO AQUI 👇👇👇
app.get('/api/status', (req, res) => {
  res.send('O servidor mínimo está funcionando!');
});

// 2. Crie uma rota "catch-all" (*)
// Se nenhuma rota de API for correspondida, envie o arquivo principal do frontend (index.html)
// Isso permite que o React cuide do roteamento da página.
//app.get('*', (req, res) => {
  //res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
//});//

  // --- ROTAS DE AUTENTICAÇÃO ---
  
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    try {
      const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Este e-mail já está em uso.' });
      }
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const newUserResult = await db.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
        [name, email, passwordHash, role]
      );
      const newUser = newUserResult.rows[0];
      if (newUser.role === 'PILOT') {
          await db.query('INSERT INTO pilot_profiles (user_id) VALUES ($1)', [newUser.id]);
      } else if (newUser.role === 'HEALTH_PROFESSIONAL') {
          await db.query('INSERT INTO health_professional_profiles (user_id) VALUES ($1)', [newUser.id]);
      }
      const payload = { id: newUser.id, name: newUser.name, role: newUser.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
      return res.status(201).json({ user: newUser, token });
    } catch (error) {
      console.error('Erro no registro:', error);
      return res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
          return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }
      try {
          const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
          if (userResult.rows.length === 0) {
              return res.status(401).json({ error: 'Credenciais inválidas.' });
          }
          const user = userResult.rows[0];
          const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
          if (!isPasswordCorrect) {
              return res.status(401).json({ error: 'Credenciais inválidas.' });
          }
          const payload = { id: user.id, name: user.name, role: user.role };
          const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
          return res.status(200).json({ token, user: payload });
      } catch (error) {
          console.error('Erro no login:', error);
          return res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
      }
  });

// --- ROTAS DE PERFIL ---

  app.get('/api/profile', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    try {
      let profileQuery;
      if (userRole === 'PILOT') {
        profileQuery = `SELECT u.name, u.email, u.role, pp.* FROM users u LEFT JOIN pilot_profiles pp ON u.id = pp.user_id WHERE u.id = $1;`;
      } else if (userRole === 'HEALTH_PROFESSIONAL') {
        profileQuery = `SELECT u.name, u.email, u.role, hpp.* FROM users u LEFT JOIN health_professional_profiles hpp ON u.id = hpp.user_id WHERE u.id = $1;`;
      } else {
        profileQuery = 'SELECT name, email, role FROM users WHERE id = $1';
      }
      const result = await db.query(profileQuery, [userId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Perfil não encontrado.' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({ error: 'Erro no servidor ao buscar perfil.' });
    }
  });

  app.put('/api/profile', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    try {
      let result;
      if (userRole === 'PILOT') {
        const { rank, aircraft_type, weight_kg, height_m, birth_date, saram, whatsapp, base_id } = req.body;
        const query = `UPDATE pilot_profiles SET rank = $1, aircraft_type = $2, weight_kg = $3, height_m = $4, birth_date = $5, saram = $6, whatsapp = $7, base_id = $8, updated_at = NOW() WHERE user_id = $9 RETURNING *;`;
        const values = [rank, aircraft_type, weight_kg, height_m, birth_date, saram, whatsapp, base_id, userId];
        result = await db.query(query, values);
      } else if (userRole === 'HEALTH_PROFESSIONAL') {
        const { crm_crefito, whatsapp, base_id } = req.body;
        const query = `UPDATE health_professional_profiles SET crm_crefito = $1, whatsapp = $2, base_id = $3, updated_at = NOW() WHERE user_id = $4 RETURNING *;`;
        const values = [crm_crefito, whatsapp, base_id, userId];
        result = await db.query(query, values);
      } else {
        return res.status(400).json({ error: 'Tipo de perfil inválido para atualização.' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({ error: 'Erro no servidor ao atualizar perfil.' });
    }
  });


  // --- ROTAS DE QUEIXAS, AVALIAÇÕES E RELATÓRIOS ---

  app.post('/api/complaints', authMiddleware, async (req, res) => {
    const pilot_user_id = req.user.id;
    const pilot_name = req.user.name;
    const { step2_location, step3_details, step4_history } = req.body;
    if (!step2_location || !step2_location.location) {
      return res.status(400).json({ error: 'A localização da queixa é um campo obrigatório.' });
    }
    const insertQuery = `INSERT INTO complaints (pilot_user_id, location, intensity, loss_of_movement, used_medication, onset, history) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`;
    const values = [pilot_user_id, step2_location.location, step3_details?.intensity, step3_details?.lossOfMovement ? 'Sim' : 'Não', step3_details?.medicationUsed ? 'Sim' : 'Não', step4_history?.onset, step4_history?.history];
    try {
      const result = await db.query(insertQuery, values);
      const newComplaint = result.rows[0];
      const pilotProfileResult = await db.query('SELECT base_id FROM pilot_profiles WHERE user_id = $1', [pilot_user_id]);
      if (pilotProfileResult.rows.length > 0) {
        const pilotBaseId = pilotProfileResult.rows[0].base_id;
        if (pilotBaseId) {
          const healthProfessionalsResult = await db.query(`SELECT hpp.user_id FROM health_professional_profiles hpp WHERE hpp.base_id = $1`, [pilotBaseId]);
          const professionalsToNotify = healthProfessionalsResult.rows;
          if (professionalsToNotify.length > 0) {
            const notificationMessage = `O piloto ${pilot_name} registrou uma nova queixa de ${newComplaint.location}.`;
            const notificationLink = `/complaint/${newComplaint.id}`;
            for (const prof of professionalsToNotify) {
              await db.query('INSERT INTO notifications (user_id, message, link) VALUES ($1, $2, $3)', [prof.user_id, notificationMessage, notificationLink]);
            }
          }
        }
      }
      res.status(201).json(newComplaint);
    } catch (error) {
      console.error('Erro detalhado ao salvar queixa:', error);
      res.status(500).json({ error: 'Ocorreu um erro ao salvar a queixa no banco de dados.' });
    }
  });

  app.get('/api/complaints', authMiddleware, async (req, res) => {
    if (req.user.role !== 'HEALTH_PROFESSIONAL' && req.user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Acesso não autorizado.' });
    }
    const { search, location } = req.query;
    let baseQuery = `SELECT complaints.id, complaints.location, complaints.intensity, users.name AS pilot_name, complaints.submission_date FROM complaints JOIN users ON complaints.pilot_user_id = users.id`;
    const whereClauses = [];
    const values = [];
    let paramIndex = 1;
    if (search) {
      whereClauses.push(`users.name ILIKE $${paramIndex}`);
      values.push(`%${search}%`);
      paramIndex++;
    }
    if (location) {
      whereClauses.push(`complaints.location = $${paramIndex}`);
      values.push(location);
      paramIndex++;
    }
    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    baseQuery += ` ORDER BY complaints.id DESC;`;
    try {
      const result = await db.query(baseQuery, values);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar queixas:', error);
      res.status(500).json({ error: 'Ocorreu um erro ao buscar os dados das queixas.' });
    }
  });

  app.get('/api/complaint-details/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'HEALTH_PROFESSIONAL' && req.user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Acesso não autorizado.' });
    }
    const { id } = req.params;
    try {
      const query = `
        SELECT
          c.*, u.name as pilot_name, u.email as pilot_email,
          pp.rank, pp.saram, pp.whatsapp, pp.birth_date, pp.aircraft_type, pp.weight_kg, pp.height_m,
          ipaq.vigorous_activity_days, ipaq.vigorous_activity_minutes, ipaq.moderate_activity_days, ipaq.moderate_activity_minutes, ipaq.walking_days, ipaq.walking_minutes,
          nasa.overall_score as nasa_tlx_score, nasa.mental_demand_rating, nasa.physical_demand_rating, nasa.temporal_demand_rating, nasa.performance_rating, nasa.effort_rating, nasa.frustration_rating
        FROM complaints c
        JOIN users u ON c.pilot_user_id = u.id
        LEFT JOIN pilot_profiles pp ON c.pilot_user_id = pp.user_id
        LEFT JOIN ipaq_assessments ipaq ON c.id = ipaq.complaint_id
        LEFT JOIN nasa_tlx_assessments nasa ON c.id = nasa.complaint_id
        WHERE c.id = $1;
      `;
      const result = await db.query(query, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Queixa não encontrada.' });
      const rawData = result.rows[0];

      // Cálculo do IMC
      let bmi = null, bmiClassification = 'Dados insuficientes';
      if (rawData.weight_kg && rawData.height_m && rawData.height_m > 0) {
        const weight = parseFloat(rawData.weight_kg);
        const height = parseFloat(rawData.height_m);
        bmi = parseFloat((weight / (height * height)).toFixed(2));
        if (bmi < 18.5) bmiClassification = 'Abaixo do peso';
        else if (bmi < 25) bmiClassification = 'Peso Normal';
        else if (bmi < 30) bmiClassification = 'Sobrepeso';
        else if (bmi < 35) bmiClassification = 'Obesidade Grau I';
        else if (bmi < 40) bmiClassification = 'Obesidade Grau II';
        else bmiClassification = 'Obesidade Grau III';
      }

      // Classificação do IPAQ
      let ipaqClassification = 'Não informado';
      if (rawData.moderate_activity_days !== null) {
        const vigorousMET = 8.0 * (rawData.vigorous_activity_days || 0) * (rawData.vigorous_activity_minutes || 0);
        const moderateMET = 4.0 * (rawData.moderate_activity_days || 0) * (rawData.moderate_activity_minutes || 0);
        const walkingMET = 3.3 * (rawData.walking_days || 0) * (rawData.walking_minutes || 0);
        const totalMET = vigorousMET + moderateMET + walkingMET;
        const totalDays = (rawData.vigorous_activity_days || 0) + (rawData.moderate_activity_days || 0) + (rawData.walking_days || 0);
        if ((rawData.vigorous_activity_days >= 3 && totalMET >= 1500) || totalDays >= 7 && totalMET >= 3000) ipaqClassification = 'Muito Ativo';
        else if ((rawData.vigorous_activity_days >= 3) || (rawData.moderate_activity_days >= 5) || (totalDays >= 5 && (vigorousMET + moderateMET) >= 600)) ipaqClassification = 'Ativo';
        else ipaqClassification = 'Insuficientemente Ativo';
      }
      
      // Cálculo do Índice de Fadiga Lesional (IFL)
      const getLocationWeight = (location) => {
        const weight3 = ['Tórax', 'Coluna Torácica', 'Coluna Lombar', 'Pelve e Nádegas', 'Quadril e virilha'];
        const weight2 = ['Cabeça', 'Ombro', 'Joelho', 'Coxa'];
        const weight1 = ['Punho e Mão', 'Antebraço', 'Perna, Tornozelo e Pé', 'Cotovelo'];
        if (weight3.includes(location)) return 3;
        if (weight2.includes(location)) return 2;
        if (weight1.includes(location)) return 1;
        return 0;
      };
      let fatigueInjuryIndex = null;
      if (rawData.intensity && rawData.nasa_tlx_score) {
        const intensity = parseFloat(rawData.intensity);
        const nasaTlx = parseFloat(rawData.nasa_tlx_score);
        const locationWeight = getLocationWeight(rawData.location);
        if (locationWeight > 0) {
            fatigueInjuryIndex = parseFloat((intensity * nasaTlx * locationWeight).toFixed(2));
        }
      }
      
      const responsePayload = {
        complaint: rawData,
        pilot: { name: rawData.pilot_name, email: rawData.pilot_email, rank: rawData.rank, saram: rawData.saram, whatsapp: rawData.whatsapp, birth_date: rawData.birth_date, aircraft_type: rawData.aircraft_type, weight: rawData.weight_kg, height: rawData.height_m, bmi: bmi, bmiClassification: bmiClassification },
        ipaq: { classification: ipaqClassification },
        nasa_tlx: { overall_score: rawData.nasa_tlx_score, ratings: { mental: rawData.mental_demand_rating, physical: rawData.physical_demand_rating, temporal: rawData.temporal_demand_rating, performance: rawData.performance_rating, effort: rawData.effort_rating, frustration: rawData.frustration_rating }},
        fatigueInjuryIndex: fatigueInjuryIndex
      };
      res.status(200).json(responsePayload);
    } catch (error) {
      console.error(`Erro ao buscar detalhes completos da queixa ${id}:`, error);
      res.status(500).json({ error: 'Erro no servidor ao buscar detalhes da queixa.' });
    }
  });

  app.post('/api/assessments/ipaq', authMiddleware, async (req, res) => {
      const { id: userId, role } = req.user;
      if (role !== 'PILOT') { return res.status(403).json({ error: 'Apenas pilotos podem registrar uma avaliação IPAQ.' }); }
      const { complaint_id, vigorous_activity_days, vigorous_activity_minutes, moderate_activity_days, moderate_activity_minutes, walking_days, walking_minutes } = req.body;
      if (!complaint_id) { return res.status(400).json({ error: 'O ID da queixa é obrigatório para salvar a avaliação IPAQ.' }); }
      const insertQuery = `INSERT INTO ipaq_assessments (user_id, complaint_id, vigorous_activity_days, vigorous_activity_minutes, moderate_activity_days, moderate_activity_minutes, walking_days, walking_minutes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;`;
      const values = [userId, complaint_id, vigorous_activity_days, vigorous_activity_minutes, moderate_activity_days, moderate_activity_minutes, walking_days, walking_minutes];
      try {
          const result = await db.query(insertQuery, values);
          return res.status(201).json({ message: 'Avaliação IPAQ salva com sucesso!', assessmentId: result.rows[0].id });
      } catch (error) {
          console.error('Erro ao salvar avaliação IPAQ:', error);
          return res.status(500).json({ error: 'Ocorreu um erro ao salvar a avaliação.' });
      }
  });

  app.post('/api/assessments/nasa-tlx', authMiddleware, async (req, res) => {
      const { id: userId, role } = req.user;
      if (role !== 'PILOT') { return res.status(403).json({ error: 'Apenas pilotos podem registrar uma avaliação NASA-TLX.' }); }
      const { complaint_id, mental_demand_rating, physical_demand_rating, temporal_demand_rating, performance_rating, effort_rating, frustration_rating, mental_demand_weight, physical_demand_weight, temporal_demand_weight, performance_weight, effort_weight, frustration_weight, overall_score } = req.body;
      if (!complaint_id) { return res.status(400).json({ error: 'O ID da queixa é obrigatório para salvar a avaliação NASA-TLX.' }); }
      const insertQuery = `INSERT INTO nasa_tlx_assessments (user_id, complaint_id, mental_demand_rating, physical_demand_rating, temporal_demand_rating, performance_rating, effort_rating, frustration_rating, mental_demand_weight, physical_demand_weight, temporal_demand_weight, performance_weight, effort_weight, frustration_weight, overall_score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id;`;
      const values = [userId, complaint_id, mental_demand_rating, physical_demand_rating, temporal_demand_rating, performance_rating, effort_rating, frustration_rating, mental_demand_weight, physical_demand_weight, temporal_demand_weight, performance_weight, effort_weight, frustration_weight, overall_score];
      try {
          const result = await db.query(insertQuery, values);
          return res.status(201).json({ message: 'Avaliação NASA-TLX salva com sucesso!', assessmentId: result.rows[0].id });
      } catch (error) {
          console.error('Erro ao salvar avaliação NASA-TLX:', error);
          return res.status(500).json({ error: 'Ocorreu um erro ao salvar a avaliação NASA-TLX.' });
      }
  });

  app.post('/api/assessments', authMiddleware, async (req, res) => {
    if (req.user.role !== 'HEALTH_PROFESSIONAL') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { complaint_id, diagnosis, treatment_plan, notes } = req.body;
    const assessing_professional_id = req.user.id;
    if (!complaint_id || !diagnosis || !treatment_plan) {
      return res.status(400).json({ error: 'ID da Queixa, Diagnóstico e Plano de Tratamento são obrigatórios.' });
    }
    const insertQuery = `INSERT INTO health_assessments (complaint_id, assessing_professional_id, diagnosis, treatment_plan, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *;`;
    const values = [complaint_id, assessing_professional_id, diagnosis, treatment_plan, notes || null];
    try {
      const result = await db.query(insertQuery, values);
      const complaintResult = await db.query('SELECT pilot_user_id, location FROM complaints WHERE id = $1', [complaint_id]);
      if (complaintResult.rows.length > 0) {
        const pilotUserId = complaintResult.rows[0].pilot_user_id;
        const complaintLocation = complaintResult.rows[0].location;
        const notificationMessage = `O parecer para sua queixa de ${complaintLocation} está disponível.`;
        const notificationLink = `/my-complaints/${complaint_id}`;
        await db.query('INSERT INTO notifications (user_id, message, link) VALUES ($1, $2, $3)', [pilotUserId, notificationMessage, notificationLink]);
      }
      res.status(201).json({ message: 'Parecer salvo com sucesso!', assessment: result.rows[0] });
    } catch (error) {
      console.error('Erro ao salvar parecer:', error);
      res.status(500).json({ error: 'Ocorreu um erro no servidor ao salvar o parecer.' });
    }
  });


  // --- ROTAS DE NOTIFICAÇÕES E DADOS DO PILOTO ---

  app.get('/api/my-complaints', authMiddleware, async (req, res) => {
      const pilotUserId = req.user.id; 
      if (req.user.role !== 'PILOT') {
          return res.status(403).json({ error: 'Acesso negado.' });
      }
      try {
          const query = `SELECT c.id, c.location as main_complaint, c.submission_date, CASE WHEN EXISTS (SELECT 1 FROM health_assessments ha WHERE ha.complaint_id = c.id) THEN 'Parecer Disponível' ELSE 'Aguardando Avaliação' END as assessment_status FROM complaints c WHERE c.pilot_user_id = $1 ORDER BY c.submission_date DESC;`;
          const { rows } = await db.query(query, [pilotUserId]);
          res.status(200).json(rows);
      } catch (error) {
          console.error('Erro ao buscar queixas do piloto:', error);
          res.status(500).json({ error: 'Erro interno do servidor ao buscar as queixas.' });
      }
  });

  // ROTA PARA UM PILOTO BUSCAR OS DETALHES DE UMA QUEIXA (VERSÃO FINAL com IFL e IMC)
  app.get('/api/my-complaints/:id', authMiddleware, async (req, res) => {
      const { id: complaintId } = req.params;
      const pilotUserId = req.user.id;

      if (req.user.role !== 'PILOT') {
          return res.status(403).json({ error: 'Acesso negado.' });
      }

      try {
          const query = `
              SELECT 
                  c.*, u.name as pilot_name, u.email as pilot_email,
                  pp.rank, pp.saram, pp.whatsapp, pp.birth_date, pp.aircraft_type, pp.weight_kg, pp.height_m,
                  ha.diagnosis, ha.treatment_plan, ha.notes AS assessment_notes, ha.assessment_date, ha.id AS assessment_id,
                  prof.name AS professional_name,
                  ipaq.vigorous_activity_days, ipaq.moderate_activity_days, ipaq.walking_days,
                  ipaq.vigorous_activity_minutes, ipaq.moderate_activity_minutes, ipaq.walking_minutes,
                  nasa.overall_score AS nasa_tlx_score
              FROM complaints c
              JOIN users u ON c.pilot_user_id = u.id
              LEFT JOIN pilot_profiles pp ON c.pilot_user_id = pp.user_id
              LEFT JOIN health_assessments ha ON c.id = ha.complaint_id
              LEFT JOIN users prof ON ha.assessing_professional_id = prof.id
              LEFT JOIN ipaq_assessments ipaq ON c.id = ipaq.complaint_id
              LEFT JOIN nasa_tlx_assessments nasa ON c.id = nasa.complaint_id
              WHERE c.id = $1 AND c.pilot_user_id = $2;
          `;
          
          const result = await db.query(query, [complaintId, pilotUserId]);

          if (result.rows.length === 0) {
              return res.status(404).json({ error: 'Queixa não encontrada ou acesso não permitido.' });
          }
          
          const rawData = result.rows[0];

          if (rawData.assessment_id) {
              await db.query('UPDATE health_assessments SET pilot_has_seen = TRUE WHERE id = $1', [rawData.assessment_id]);
          }

          // --- LÓGICA DE CÁLCULOS COMPLETA (IMC, IPAQ, IFL) ---

          let bmi = null, bmiClassification = 'Dados insuficientes';
          if (rawData.weight_kg && rawData.height_m && rawData.height_m > 0) {
              const weight = parseFloat(rawData.weight_kg);
              const height = parseFloat(rawData.height_m);
              bmi = parseFloat((weight / (height * height)).toFixed(2));
              if (bmi < 18.5) bmiClassification = 'Abaixo do peso';
              else if (bmi < 25) bmiClassification = 'Peso Normal';
              else if (bmi < 30) bmiClassification = 'Sobrepeso';
              else if (bmi < 35) bmiClassification = 'Obesidade Grau I';
              else if (bmi < 40) bmiClassification = 'Obesidade Grau II';
              else bmiClassification = 'Obesidade Grau III';
          }

          let ipaqClassification = 'Não informado';
          if (rawData.moderate_activity_days !== null) {
              const vigorousMET = 8.0 * (rawData.vigorous_activity_days || 0) * (rawData.vigorous_activity_minutes || 0);
              const moderateMET = 4.0 * (rawData.moderate_activity_days || 0) * (rawData.moderate_activity_minutes || 0);
              const walkingMET = 3.3 * (rawData.walking_days || 0) * (rawData.walking_minutes || 0);
              const totalMET = vigorousMET + moderateMET + walkingMET;
              const totalDays = (rawData.vigorous_activity_days || 0) + (rawData.moderate_activity_days || 0) + (rawData.walking_days || 0);
              if ((rawData.vigorous_activity_days >= 3 && totalMET >= 1500) || totalDays >= 7 && totalMET >= 3000) ipaqClassification = 'Muito Ativo';
              else if ((rawData.vigorous_activity_days >= 3) || (rawData.moderate_activity_days >= 5) || (totalDays >= 5 && (vigorousMET + moderateMET) >= 600)) ipaqClassification = 'Ativo';
              else ipaqClassification = 'Insuficientemente Ativo';
          }

          const getLocationWeight = (location) => {
              const weight3 = ['Tórax', 'Coluna Torácica', 'Coluna Lombar', 'Pelve e Nádegas', 'Quadril e virilha'];
              const weight2 = ['Cabeça', 'Ombro', 'Joelho', 'Coxa'];
              const weight1 = ['Punho e Mão', 'Antebraço', 'Perna, Tornozelo e Pé', 'Cotovelo'];
              if (weight3.includes(location)) return 3;
              if (weight2.includes(location)) return 2;
              if (weight1.includes(location)) return 1;
              return 0;
          };

          let fatigueInjuryIndex = null;
          if (rawData.intensity && rawData.nasa_tlx_score) {
              const intensity = parseFloat(rawData.intensity);
              const nasaTlx = parseFloat(rawData.nasa_tlx_score);
              const locationWeight = getLocationWeight(rawData.location);
              if (locationWeight > 0) {
                  fatigueInjuryIndex = parseFloat((intensity * nasaTlx * locationWeight).toFixed(2));
              }
          }

          // --- Montando a resposta final ---
          const responsePayload = {
              complaint: rawData,
              pilot: { weight: rawData.weight_kg, height: rawData.height_m, bmi: bmi, bmiClassification: bmiClassification },
              assessment: rawData.assessment_id ? { diagnosis: rawData.diagnosis, treatment_plan: rawData.treatment_plan, notes: rawData.assessment_notes, assessment_date: rawData.assessment_date, professional_name: rawData.professional_name } : null,
              ipaq: { classification: ipaqClassification },
              nasa_tlx: { overall_score: rawData.nasa_tlx_score },
              fatigueInjuryIndex: fatigueInjuryIndex
          };

          res.status(200).json(responsePayload);

      } catch (error) {
          console.error(`Erro ao buscar detalhes da queixa ${complaintId} para o piloto ${pilotUserId}:`, error);
          res.status(500).json({ error: 'Erro interno do servidor.' });
      }
  });

  /*
   * ROTA PARA BUSCAR O HISTÓRICO COMPLETO DE SAÚDE DE UM PILOTO (VERSÃO FINAL COM TODOS OS STATS)
   */
   app.get('/api/pilot-health-summary', authMiddleware, async (req, res) => {
    const pilotUserId = req.user.id;

    if (req.user.role !== 'PILOT') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    try {
      const historyQuery = `
        SELECT 
          c.id, c.location, c.intensity, c.onset, c.submission_date,
          nasa.overall_score as nasa_tlx_score,
          ipaq.vigorous_activity_days, ipaq.moderate_activity_days, ipaq.walking_days,
          ipaq.vigorous_activity_minutes, ipaq.moderate_activity_minutes, ipaq.walking_minutes
        FROM complaints c
        LEFT JOIN ipaq_assessments ipaq ON c.id = ipaq.complaint_id
        LEFT JOIN nasa_tlx_assessments nasa ON c.id = nasa.complaint_id
        WHERE c.pilot_user_id = $1
        ORDER BY c.submission_date ASC;
      `;
      const historyResult = await db.query(historyQuery, [pilotUserId]);
      const history = historyResult.rows;

      // --- LÓGICA DE PROCESSAMENTO DE DADOS ---
      
      // Calcula a média do NASA-TLX
      const nasaScores = history.map(h => h.nasa_tlx_score).filter(score => score !== null);
      const averageNasaTlx = nasaScores.length > 0
        ? (nasaScores.reduce((sum, score) => sum + parseFloat(score), 0) / nasaScores.length).toFixed(2)
        : 'N/A';

      // Calcula a classificação de IPAQ mais frequente
      const ipaqClassifications = history.map(h => {
          if (h.moderate_activity_days === null) return null;
          const vigorousMET = 8.0 * (h.vigorous_activity_days || 0) * (h.vigorous_activity_minutes || 0);
          const moderateMET = 4.0 * (h.moderate_activity_days || 0) * (h.moderate_activity_minutes || 0);
          const walkingMET = 3.3 * (h.walking_days || 0) * (h.walking_minutes || 0);
          const totalMET = vigorousMET + moderateMET + walkingMET;
          const totalDays = (h.vigorous_activity_days || 0) + (h.moderate_activity_days || 0) + (h.walking_days || 0);
          if ((h.vigorous_activity_days >= 3 && totalMET >= 1500) || totalDays >= 7 && totalMET >= 3000) return 'Muito Ativo';
          if ((h.vigorous_activity_days >= 3) || (h.moderate_activity_days >= 5) || (totalDays >= 5 && (vigorousMET + moderateMET) >= 600)) return 'Ativo';
          return 'Insuficientemente Ativo';
      }).filter(c => c !== null);

      const ipaqFrequency = ipaqClassifications.reduce((acc, classification) => {
          acc[classification] = (acc[classification] || 0) + 1;
          return acc;
      }, {});
      const mostFrequentIpaq = Object.keys(ipaqFrequency).reduce((a, b) => ipaqFrequency[a] > ipaqFrequency[b] ? a : b, 'N/A');

      // Outros cálculos que já tínhamos...
      const complaintIntensityOverTime = history.map(h => ({ x: new Date(h.submission_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), y: h.intensity }));
      const nasaTlxOverTime = history.map(h => ({ x: new Date(h.submission_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), y: h.nasa_tlx_score }));
      const locationCounts = history.reduce((acc, h) => { acc[h.location] = (acc[h.location] || 0) + 1; return acc; }, {});
      const mostAffectedRegion = Object.keys(locationCounts).reduce((a, b) => locationCounts[a] > locationCounts[b] ? a : b, 'Nenhuma');
      const totalIntensity = history.reduce((sum, h) => sum + parseInt(h.intensity, 10), 0);
      const averageIntensity = history.length > 0 ? (totalIntensity / history.length).toFixed(1) : 0;
      const bodymapData = history.map(h => ({ location: h.location, intensity: h.intensity, onset: h.onset }));

      const responsePayload = {
        summaryStats: {
          mostAffectedRegion: mostAffectedRegion,
          averageIntensity: averageIntensity,
          averageNasaTlx: averageNasaTlx, // ★★★ NOVO CAMPO ★★★
          mostFrequentIpaq: mostFrequentIpaq, // ★★★ NOVO CAMPO ★★★
        },
        timeSeries: { complaintIntensity: complaintIntensityOverTime, nasaTlx: nasaTlxOverTime },
        bodymap: bodymapData,
        timeline: history.map(h => ({ date: h.submission_date, text: `Registrou queixa de ${h.location} (Intensidade: ${h.intensity}/10)` })).reverse()
      };

      res.status(200).json(responsePayload);

    } catch (error) {
      console.error(`Erro ao buscar o sumário de saúde do piloto ${pilotUserId}:`, error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/bases', authMiddleware, async (req, res) => {
    try {
      const query = 'SELECT id, name FROM air_force_bases ORDER BY name ASC;';
      const result = await db.query(query);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar bases aéreas:', error);
      res.status(500).json({ error: 'Ocorreu um erro ao buscar a lista de bases.' });
    }
  });

  app.get('/api/reports/summary', authMiddleware, async (req, res) => {
    if (req.user.role !== 'HEALTH_PROFESSIONAL' && req.user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Acesso não autorizado.' });
    }
    try {
      const queries = [
        db.query(`SELECT COUNT(*) FROM users WHERE role = 'PILOT'`),
        db.query(`SELECT COUNT(*) FROM complaints`),
        db.query(`SELECT COALESCE(AVG(intensity), 0) as avg_intensity FROM complaints`),
        db.query(`SELECT location, COUNT(*) as count FROM complaints GROUP BY location`),
        db.query(`SELECT flight_performance_impact, COUNT(*) as count FROM complaints GROUP BY flight_performance_impact`),
        db.query(`SELECT TO_CHAR(submission_date, 'YYYY-MM') as month, COUNT(*) as count FROM complaints GROUP BY month ORDER BY month`),
        db.query(`SELECT loss_of_movement, COUNT(*) as count FROM complaints GROUP BY loss_of_movement`),
        db.query(`SELECT used_medication, COUNT(*) as count FROM complaints GROUP BY used_medication`),
        db.query(`SELECT onset, COUNT(*) as count FROM complaints GROUP BY onset`)
      ];
      const results = await Promise.all(queries);
      const [pilotsResult, complaintsResult, intensityResult, regionResult, impactResult, monthResult, lossOfMovementResult, medicationUseResult, onsetResult] = results;
      
      const impactMapping = { 0: 'Sem Impacto', 1: 'Impacto Leve', 2: 'Impacto Moderado', 3: 'Incapaz de Voar' };
      
      const formatForChart = (rows, keyField, valueField) => {
          if (!rows || rows.length === 0) return {};
          return rows.reduce((acc, row) => {
              if (row[keyField] !== null) {
                  acc[row[keyField]] = parseInt(row[valueField], 10);
              }
              return acc;
          }, {});
      };
      
      const summaryData = {
        totalPilots: parseInt(pilotsResult.rows[0].count, 10),
        totalComplaints: parseInt(complaintsResult.rows[0].count, 10),
        averageIntensity: parseFloat(intensityResult.rows[0].avg_intensity).toFixed(1),
        complaintsByRegion: formatForChart(regionResult.rows, 'location', 'count'),
        flightImpactDistribution: (impactResult.rows || []).reduce((acc, row) => {
            const key = impactMapping[row.flight_performance_impact] || 'Não Informado';
            acc[key] = parseInt(row.count, 10);
            return acc;
        }, {}),
        complaintsPerMonth: formatForChart(monthResult.rows, 'month', 'count'),
        lossOfMovement: formatForChart(lossOfMovementResult.rows, 'loss_of_movement', 'count'),
        medicationUse: formatForChart(medicationUseResult.rows, 'used_medication', 'count'),
        onsetDistribution: formatForChart(onsetResult.rows, 'onset', 'count')
      };
      res.json(summaryData);
    } catch (err) {
      console.error('Erro ao gerar o sumário de relatórios:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/notifications', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
      const notificationsQuery = `SELECT id, message, link, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC;`;
      const notificationsResult = await db.query(notificationsQuery, [userId]);
      const unreadCountQuery = `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE;`;
      const unreadCountResult = await db.query(unreadCountQuery, [userId]);
      res.status(200).json({ notifications: notificationsResult.rows, unreadCount: parseInt(unreadCountResult.rows[0].count, 10) });
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      res.status(500).json({ error: 'Ocorreu um erro ao buscar suas notificações.' });
    }
  });

  app.post('/api/notifications/:id/read', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { id: notificationId } = req.params;
    try {
      const result = await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id', [notificationId, userId]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Notificação não encontrada ou não pertence a este usuário.' });
      }
      res.status(200).json({ message: 'Notificação marcada como lida.' });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
  });

  /*
   * ROTA PARA ENVIAR UMA NOVA MENSAGEM EM UMA CONVERSA DE QUEIXA
   */
  app.post('/api/complaints/:id/messages', authMiddleware, async (req, res) => {
    const { id: complaintId } = req.params;
    const { id: senderId, name: senderName } = req.user;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'O conteúdo da mensagem não pode ser vazio.' });
    }

    try {
      // --- Lógica para encontrar ou criar a conversa ---
      let conversationResult = await db.query('SELECT id FROM conversations WHERE complaint_id = $1', [complaintId]);
      let conversationId;

      if (conversationResult.rows.length === 0) {
        // Se não existe conversa para esta queixa, cria uma nova
        console.log(`Nenhuma conversa encontrada para a queixa ${complaintId}. Criando uma nova...`);
        const newConversationResult = await db.query('INSERT INTO conversations (complaint_id) VALUES ($1) RETURNING id', [complaintId]);
        conversationId = newConversationResult.rows[0].id;
      } else {
        // Se já existe, usa o ID dela
        conversationId = conversationResult.rows[0].id;
      }
      // --- Fim da lógica da conversa ---

      // Insere a nova mensagem no banco de dados
      const messageQuery = 'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *';
      const messageResult = await db.query(messageQuery, [conversationId, senderId, content]);
      const newMessage = messageResult.rows[0];

      // --- Lógica para notificar o outro usuário ---
      // 1. Descobre quem é o piloto e quem é o profissional da queixa
      const complaintOwnerResult = await db.query('SELECT pilot_user_id FROM complaints WHERE id = $1', [complaintId]);
      const pilotUserId = complaintOwnerResult.rows[0].pilot_user_id;

      const healthProfessionalResult = await db.query('SELECT assessing_professional_id FROM health_assessments WHERE complaint_id = $1', [complaintId]);
      // Pode não haver um profissional ainda se o parecer não foi dado, mas tentamos pegar.
      const professionalUserId = healthProfessionalResult.rows.length > 0 ? healthProfessionalResult.rows[0].assessing_professional_id : null;

      // 2. Determina quem deve ser notificado
      let userToNotifyId = null;
      if (senderId === pilotUserId && professionalUserId) {
          userToNotifyId = professionalUserId; // Piloto enviou, notifica o profissional
      } else if (senderId === professionalUserId) {
          userToNotifyId = pilotUserId; // Profissional enviou, notifica o piloto
      }

      // 3. Cria a notificação
      if (userToNotifyId) {
          const notificationMessage = `Você tem uma nova mensagem de ${senderName} sobre a queixa #${complaintId}.`;
          const notificationLink = req.user.role === 'PILOT' ? `/complaint/${complaintId}` : `/my-complaints/${complaintId}`; // Link correto dependendo de quem recebe
          await db.query(
              'INSERT INTO notifications (user_id, message, link) VALUES ($1, $2, $3)',
              [userToNotifyId, notificationMessage, notificationLink]
          );
      }

      res.status(201).json(newMessage);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      res.status(500).json({ error: 'Erro no servidor ao enviar a mensagem.' });
    }
  });

  /**
   * ROTA PARA BUSCAR TODAS AS MENSAGENS DE UMA CONVERSA
   */
  app.get('/api/complaints/:id/messages', authMiddleware, async (req, res) => {
      const { id: complaintId } = req.params;
      const { id: userId, role } = req.user;

      try {
          // Primeiro, verifica se o usuário logado tem permissão para ver esta conversa
          const complaintResult = await db.query(
              `SELECT c.pilot_user_id, ha.assessing_professional_id 
              FROM complaints c 
              LEFT JOIN health_assessments ha ON c.id = ha.complaint_id
              WHERE c.id = $1`, [complaintId]
          );

          if (complaintResult.rows.length === 0) {
              return res.status(404).json({ error: 'Queixa não encontrada.' });
          }

          const pilotId = complaintResult.rows[0].pilot_user_id;
          const professionalId = complaintResult.rows[0].assessing_professional_id;

          if (userId !== pilotId && userId !== professionalId) {
              return res.status(403).json({ error: 'Você não tem permissão para ver esta conversa.' });
          }

          // Se o usuário tem permissão, busca as mensagens
          const messagesQuery = `
              SELECT m.*, u.name as sender_name 
              FROM messages m
              JOIN users u ON m.sender_id = u.id
              JOIN conversations c ON m.conversation_id = c.id
              WHERE c.complaint_id = $1
              ORDER BY m.created_at ASC;
          `;
          const messagesResult = await db.query(messagesQuery, [complaintId]);

          res.status(200).json(messagesResult.rows);

      } catch (error) {
          console.error('Erro ao buscar mensagens:', error);
          res.status(500).json({ error: 'Erro no servidor ao buscar mensagens.' });
      }
  });
  
// --- INÍCIO DO SERVIDOR ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

//fim do arquivo//