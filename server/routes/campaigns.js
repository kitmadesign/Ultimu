// server/routes/campaigns.js
// Rotas HTTP para gerenciamento de campanhas

const express = require('express');
const router = express.Router();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { verifyTokenMiddleware } = require('../middleware/auth');
const fs = require('fs');

// =============================================
// CONEXÃO COM O BANCO DE DADOS
// =============================================
const Database = require('better-sqlite3');
const DB_FILE = path.join(__dirname, '..', '..', 'data', 'database.sqlite');
const db = new Database(DB_FILE);

// Desativar foreign keys para resolver problema do mestre
db.pragma('foreign_keys = OFF');

// Inserir usuário do mestre no banco
db.exec(`
INSERT OR IGNORE INTO users (id, username, password_hash, display_name, created_at) 
VALUES ('mestre_system', 'mestre', 'mestre_fix', 'Mestre do Sistema', datetime('now'));
`);

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

function nowISO() { 
  return new Date().toISOString(); 
}

function isCampaignOwner(campaignId, userId) {
  const row = db.prepare('SELECT owner_id FROM campaigns WHERE id = ?').get(campaignId);
  return row && row.owner_id === userId;
}

function getMemberRole(campaignId, userId) {
  const row = db.prepare('SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ?').get(campaignId, userId);
  return row ? row.role : null;
}

function isMember(campaignId, userId) {
  return !!getMemberRole(campaignId, userId);
}

function isGM(campaignId, userId) {
  const role = getMemberRole(campaignId, userId);
  return role === 'gm' || role === 'owner';
}

// =============================================
// ROTAS DE CAMPANHAS
// =============================================

// Criar campanha
router.post('/campaigns', verifyTokenMiddleware, (req, res) => {
  try {
    const user = req.user;
    const { name, description } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    
    const id = uuidv4();
    const now = nowISO();
    
    db.prepare('INSERT INTO campaigns(id, name, description, owner_id, created_at) VALUES(?,?,?,?,?)')
      .run(id, name, description || '', user.id, now);
    
    // Adicionar owner como membro
    db.prepare('INSERT INTO campaign_members(campaign_id, user_id, role, joined_at) VALUES(?,?,?,?)')
      .run(id, user.id, 'owner', now);
    
    return res.json({ id, name, description, owner_id: user.id, created_at: now });
  } catch (err) {
    console.error('campaign create error', err);
    return res.status(500).json({ error: 'Erro ao criar campanha' });
  }
});

// Listar campanhas do usuário
router.get('/campaigns', verifyTokenMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const rows = db.prepare(`
      SELECT c.id, c.name, c.description, c.owner_id, cm.role
      FROM campaigns c
      JOIN campaign_members cm ON c.id = cm.campaign_id
      WHERE cm.user_id = ?
    `).all(userId);
    return res.json(rows);
  } catch (err) {
    console.error('campaigns list error', err);
    return res.status(500).json({ error: 'Erro ao listar campanhas' });
  }
});

// Detalhes da campanha
router.get('/campaigns/:id', verifyTokenMiddleware, (req, res) => {
  try {
    const campaignId = req.params.id;
    const userId = req.user.id;
    
    if (!isMember(campaignId, userId)) {
      return res.status(403).json({ error: 'Você não é membro desta campanha' });
    }
    
    const c = db.prepare('SELECT id, name, description, owner_id, created_at FROM campaigns WHERE id = ?').get(campaignId);
    const members = db.prepare('SELECT user_id, role, joined_at FROM campaign_members WHERE campaign_id = ?').all(campaignId);
    
    return res.json({ campaign: c, members });
  } catch (err) {
    console.error('campaign detail error', err);
    return res.status(500).json({ error: 'Erro ao obter campanha' });
  }
});

// Excluir campanha
router.delete('/campaigns/:id', verifyTokenMiddleware, (req, res) => {
  try {
    const campaignId = req.params.id;
    const userId = req.user.id;
    
    const campanha = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    if (!campanha) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    if (campanha.owner_id !== userId && userId !== 'mestre_system') {
      return res.status(403).json({ error: 'Apenas o dono da campanha pode excluí-la' });
    }
    
    db.transaction(() => {
      db.prepare('DELETE FROM activity_logs WHERE campaign_id = ?').run(campaignId);
      db.prepare('DELETE FROM invites WHERE campaign_id = ?').run(campaignId);
      db.prepare('DELETE FROM campaign_members WHERE campaign_id = ?').run(campaignId);
      db.prepare('DELETE FROM campaigns WHERE id = ?').run(campaignId);
    })();
    
    return res.json({ success: true, message: `Campanha "${campanha.name}" excluída com sucesso` });
  } catch (err) {
    console.error('delete campaign error', err);
    return res.status(500).json({ error: 'Erro ao excluir campanha: ' + err.message });
  }
});

// =============================================
// ROTAS DE CONVITES
// =============================================

// Criar convite
router.post('/campaigns/:id/invites', verifyTokenMiddleware, (req, res) => {
  try {
    const campaignId = req.params.id;
    const userId = req.user.id;
    
    // Permitir mestre criar convites
    if (userId === 'mestre_system' || req.user.role === 'mestre') {
      console.log('✅ Mestre criando convite');
    } else if (!isCampaignOwner(campaignId, userId) && !isGM(campaignId, userId)) {
      return res.status(403).json({ error: 'Somente GM/Owner pode criar convites' });
    }

    const { invited_username, role, expires_at, generateToken } = req.body || {};
    
    const inviteRole = role === 'gm' ? 
      (isCampaignOwner(campaignId, userId) || userId === 'mestre_system' ? 'gm' : 'player') : 
      'player';
    
    const id = uuidv4();
    const token = generateToken ? uuidv4() : null;
    const now = nowISO();
    
    db.prepare('INSERT INTO invites(id, campaign_id, invited_username, token, role, created_by, created_at, expires_at, status) VALUES(?,?,?,?,?,?,?,?,?)')
      .run(id, campaignId, invited_username || null, token, inviteRole, userId, now, expires_at || null, 'open');

    db.prepare('INSERT INTO activity_logs(id, campaign_id, user_id, action, payload, created_at) VALUES(?,?,?,?,?,?)')
      .run(uuidv4(), campaignId, userId, 'invite:create', JSON.stringify({ inviteId: id, invited_username, token }), now);

    return res.json({ id, campaignId, invited_username, token, role: inviteRole, created_at: now });
  } catch (err) {
    console.error('create invite error', err);
    return res.status(500).json({ error: 'Erro ao criar convite: ' + err.message });
  }
});

// Listar convites disponíveis
router.get('/invites', verifyTokenMiddleware, (req, res) => {
  try {
    const username = req.user.username;
    const rows = db.prepare('SELECT * FROM invites WHERE status = ? AND (invited_username = ? OR invited_username IS NULL)').all('open', username);
    return res.json(rows);
  } catch (err) {
    console.error('list invites error', err);
    return res.status(500).json({ error: 'Erro ao listar convites' });
  }
});

// Listar convites criados pelo usuário
router.get('/campaigns/invites/created', verifyTokenMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    
    const rows = db.prepare(`
      SELECT i.*, c.name as campaign_name 
      FROM invites i
      JOIN campaigns c ON i.campaign_id = c.id
      WHERE i.created_by = ? AND i.status = 'open'
      ORDER BY i.created_at DESC
    `).all(userId);
    
    return res.json(rows);
  } catch (err) {
    console.error('list created invites error', err);
    return res.status(500).json({ error: 'Erro ao listar convites criados' });
  }
});

// Buscar convite por token
router.get('/invites/token/:token', verifyTokenMiddleware, (req, res) => {
  try {
    const token = req.params.token;
    
    const invite = db.prepare(`
      SELECT i.*, c.name as campaign_name, c.description as campaign_description,
             u.username as created_by_username
      FROM invites i
      JOIN campaigns c ON i.campaign_id = c.id
      JOIN users u ON i.created_by = u.id
      WHERE i.token = ? AND i.status = 'open'
    `).get(token);
    
    if (!invite) {
      return res.status(404).json({ error: 'Convite não encontrado ou expirado' });
    }
    
    return res.json(invite);
  } catch (err) {
    console.error('get invite by token error', err);
    return res.status(500).json({ error: 'Erro ao buscar convite' });
  }
});

// Aceitar convite por ID
router.post('/invites/:id/accept', verifyTokenMiddleware, (req, res) => {
  try {
    const inviteId = req.params.id;
    const user = req.user;
    const bodyToken = req.body && req.body.token;
    
    const invite = db.prepare('SELECT * FROM invites WHERE id = ?').get(inviteId);
    if (!invite) return res.status(404).json({ error: 'Invite não encontrado' });
    if (invite.status !== 'open') return res.status(400).json({ error: 'Invite não está aberto' });
    
    if (invite.invited_username && invite.invited_username !== user.username) {
      return res.status(403).json({ error: 'Este convite não é para este usuário' });
    }
    
    if (invite.token && invite.token !== bodyToken && invite.invited_username == null) {
      return res.status(403).json({ error: 'Token inválido para este convite' });
    }
    
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invite expirado' });
    }
    
    const now = nowISO();
    db.prepare('INSERT OR REPLACE INTO campaign_members(campaign_id, user_id, role, joined_at) VALUES(?,?,?,?)')
      .run(invite.campaign_id, user.id, invite.role || 'player', now);
    
    db.prepare('UPDATE invites SET status = ? WHERE id = ?').run('accepted', inviteId);
    
    db.prepare('INSERT INTO activity_logs(id, campaign_id, user_id, action, payload, created_at) VALUES(?,?,?,?,?,?)')
      .run(uuidv4(), invite.campaign_id, user.id, 'invite:accepted', JSON.stringify({ inviteId }), now);

    const campaign = db.prepare('SELECT id, name, description, owner_id, created_at FROM campaigns WHERE id = ?').get(invite.campaign_id);
    return res.json({ success: true, campaign });
  } catch (err) {
    console.error('accept invite error', err);
    return res.status(500).json({ error: 'Erro ao aceitar convite' });
  }
});

// Aceitar convite por token
router.post('/invites/accept-by-token', verifyTokenMiddleware, (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;
    
    if (!token) {
      return res.status(400).json({ error: 'Token é obrigatório' });
    }

    const invite = db.prepare('SELECT * FROM invites WHERE token = ? AND status = ?').get(token, 'open');
    if (!invite) {
      return res.status(404).json({ error: 'Convite não encontrado ou expirado' });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Convite expirado' });
    }

    if (invite.invited_username && invite.invited_username !== user.username) {
      return res.status(403).json({ error: 'Este convite não é para este usuário' });
    }

    const now = nowISO();
    db.prepare('INSERT OR REPLACE INTO campaign_members(campaign_id, user_id, role, joined_at) VALUES(?,?,?,?)')
      .run(invite.campaign_id, user.id, invite.role || 'player', now);
    
    db.prepare('UPDATE invites SET status = ? WHERE token = ?').run('accepted', token);
    
    db.prepare('INSERT INTO activity_logs(id, campaign_id, user_id, action, payload, created_at) VALUES(?,?,?,?,?,?)')
      .run(uuidv4(), invite.campaign_id, user.id, 'invite:accepted', JSON.stringify({ token }), now);

    const campaign = db.prepare('SELECT id, name, description, owner_id, created_at FROM campaigns WHERE id = ?').get(invite.campaign_id);
    return res.json({ success: true, campaign });

  } catch (err) {
    console.error('accept invite by token error', err);
    return res.status(500).json({ error: 'Erro ao aceitar convite' });
  }
});

// Excluir convite
router.delete('/invites/:id', verifyTokenMiddleware, (req, res) => {
  try {
    const inviteId = req.params.id;
    const userId = req.user.id;
    
    const invite = db.prepare('SELECT * FROM invites WHERE id = ?').get(inviteId);
    if (!invite) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }
    
    if (invite.created_by !== userId && userId !== 'mestre_system') {
      return res.status(403).json({ error: 'Apenas o criador do convite pode excluí-lo' });
    }
    
    db.prepare('DELETE FROM invites WHERE id = ?').run(inviteId);
    
    return res.json({ success: true, message: 'Convite excluído com sucesso' });
  } catch (err) {
    console.error('delete invite error', err);
    return res.status(500).json({ error: 'Erro ao excluir convite: ' + err.message });
  }
});

// =============================================
// ROTAS DE MEMBROS
// =============================================

// Listar membros com detalhes
router.get('/campaigns/:id/members-detailed', verifyTokenMiddleware, (req, res) => {
  try {
    const campaignId = req.params.id;
    const userId = req.user.id;
    
    if (!isMember(campaignId, userId)) {
      return res.status(403).json({ error: 'Você não é membro desta campanha' });
    }
    
    const members = db.prepare(`
      SELECT cm.user_id, cm.role, cm.joined_at, u.username, u.display_name
      FROM campaign_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.campaign_id = ?
      ORDER BY 
        CASE cm.role 
          WHEN 'owner' THEN 1
          WHEN 'gm' THEN 2
          ELSE 3 
        END,
        cm.joined_at
    `).all(campaignId);
    
    return res.json(members);
  } catch (err) {
    console.error('list detailed members error', err);
    return res.status(500).json({ error: 'Erro ao listar membros' });
  }
});

// Expulsar membro
router.delete('/campaigns/:campaignId/members/:userId', verifyTokenMiddleware, (req, res) => {
  try {
    const { campaignId, userId: targetUserId } = req.params;
    const currentUserId = req.user.id;
    
    const campanha = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    if (!campanha) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    const membro = db.prepare('SELECT * FROM campaign_members WHERE campaign_id = ? AND user_id = ?')
      .get(campaignId, targetUserId);
    if (!membro) {
      return res.status(404).json({ error: 'Membro não encontrado na campanha' });
    }
    
    const currentUserRole = getMemberRole(campaignId, currentUserId);
    const isOwner = campanha.owner_id === currentUserId;
    const isGMUser = currentUserRole === 'gm' || currentUserRole === 'owner';
    
    if (!isGMUser && currentUserId !== 'mestre_system') {
      return res.status(403).json({ error: 'Apenas GMs podem expulsar membros' });
    }
    
    if (targetUserId === campanha.owner_id) {
      return res.status(403).json({ error: 'Não é possível expulsar o dono da campanha' });
    }
    
    const targetUserRole = getMemberRole(campaignId, targetUserId);
    if (targetUserRole === 'gm' && !isOwner && currentUserId !== 'mestre_system') {
      return res.status(403).json({ error: 'Apenas o dono pode expulsar outros mestres' });
    }
    
    db.prepare('DELETE FROM campaign_members WHERE campaign_id = ? AND user_id = ?')
      .run(campaignId, targetUserId);
    
    const now = nowISO();
    db.prepare('INSERT INTO activity_logs(id, campaign_id, user_id, action, payload, created_at) VALUES(?,?,?,?,?,?)')
      .run(uuidv4(), campaignId, currentUserId, 'member:kicked', JSON.stringify({ 
        kickedUserId: targetUserId, 
        kickedUserRole: targetUserRole 
      }), now);
    
    return res.json({ success: true, message: 'Membro expulso da campanha com sucesso' });
  } catch (err) {
    console.error('kick member error', err);
    return res.status(500).json({ error: 'Erro ao expulsar membro: ' + err.message });
  }
});

// Sair da campanha
router.delete('/campaigns/:campaignId/leave', verifyTokenMiddleware, (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    const userId = req.user.id;
    
    const campanha = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    if (!campanha) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    const membro = db.prepare('SELECT * FROM campaign_members WHERE campaign_id = ? AND user_id = ?')
      .get(campaignId, userId);
    if (!membro) {
      return res.status(404).json({ error: 'Você não é membro desta campanha' });
    }
    
    if (campanha.owner_id === userId) {
      return res.status(403).json({ 
        error: 'O dono não pode sair da campanha. Transfira a propriedade ou exclua a campanha.' 
      });
    }
    
    db.prepare('DELETE FROM campaign_members WHERE campaign_id = ? AND user_id = ?')
      .run(campaignId, userId);
    
    const now = nowISO();
    db.prepare('INSERT INTO activity_logs(id, campaign_id, user_id, action, payload, created_at) VALUES(?,?,?,?,?,?)')
      .run(uuidv4(), campaignId, userId, 'member:left', JSON.stringify({}), now);
    
    return res.json({ success: true, message: 'Você saiu da campanha com sucesso' });
  } catch (err) {
    console.error('leave campaign error', err);
    return res.status(500).json({ error: 'Erro ao sair da campanha: ' + err.message });
  }
});

// =============================================
// ROTAS DE ESTATÍSTICAS E FICHAS
// =============================================

// Estatísticas da campanha
router.get('/campaigns/:id/stats', verifyTokenMiddleware, (req, res) => {
  try {
    const campaignId = req.params.id;
    const userId = req.user.id;
    
    if (!isGM(campaignId, userId)) {
      return res.status(403).json({ error: 'Apenas GMs podem ver estatísticas' });
    }
    
    const memberStats = db.prepare(`
      SELECT role, COUNT(*) as count 
      FROM campaign_members 
      WHERE campaign_id = ? 
      GROUP BY role
    `).all(campaignId);
    
    const activeInvites = db.prepare(`
      SELECT COUNT(*) as count 
      FROM invites 
      WHERE campaign_id = ? AND status = 'open'
    `).get(campaignId);
    
    const recentActivities = db.prepare(`
      SELECT action, created_at 
      FROM activity_logs 
      WHERE campaign_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(campaignId);
    
    return res.json({
      memberStats,
      activeInvites: activeInvites.count,
      recentActivities
    });
  } catch (err) {
    console.error('campaign stats error', err);
    return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Fichas do usuário
router.get('/user/fichas', verifyTokenMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    
    const fichas = db.prepare('SELECT playerId, ficha_json FROM fichas').all()
      .map(row => {
        try {
          const ficha = JSON.parse(row.ficha_json);
          if (ficha.jogadorId === userId || ficha.jogador === req.user.username) {
            return {
              playerId: row.playerId,
              nome: ficha.nome || 'Ficha sem nome',
              nex: ficha.nex || 0,
              nivel: ficha.nivel || 1,
              classe: ficha.classe || '',
              origem: ficha.origem || '',
              campanha: ficha.campanhaId || null
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      })
      .filter(ficha => ficha !== null);
    
    return res.json(fichas);
  } catch (err) {
    console.error('get user fichas error', err);
    return res.status(500).json({ error: 'Erro ao buscar fichas do usuário' });
  }
});

// Vincular ficha a campanha
router.post('/fichas/:playerId/link-campaign', verifyTokenMiddleware, (req, res) => {
  try {
    const { playerId } = req.params;
    const { campaignId } = req.body;
    const userId = req.user.id;
    
    const fichaRow = db.prepare('SELECT ficha_json FROM fichas WHERE playerId = ?').get(playerId);
    if (!fichaRow) {
      return res.status(404).json({ error: 'Ficha não encontrada' });
    }
    
    const ficha = JSON.parse(fichaRow.ficha_json);
    
    if (ficha.jogadorId !== userId && ficha.jogador !== req.user.username) {
      return res.status(403).json({ error: 'Esta ficha não pertence a você' });
    }
    
    if (!isMember(campaignId, userId)) {
      return res.status(403).json({ error: 'Você não é membro desta campanha' });
    }
    
    ficha.campanhaId = campaignId;
    
    db.prepare('UPDATE fichas SET ficha_json = ? WHERE playerId = ?')
      .run(JSON.stringify(ficha), playerId);
    
    return res.json({ success: true, message: 'Ficha vinculada à campanha com sucesso' });
  } catch (err) {
    console.error('link ficha to campaign error', err);
    return res.status(500).json({ error: 'Erro ao vincular ficha à campanha' });
  }
});

module.exports = router;