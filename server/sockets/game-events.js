// server/sockets/game-events.js
// Gerenciamento de eventos em tempo real (Socket.IO)

const { verifyTokenSocket } = require('../middleware/auth');

/**
 * Configura todos os eventos Socket.IO do jogo
 * @param {Socket.IO.Server} io - Instância do Socket.IO
 * @param {Object} dbHelpers - Funções auxiliares do banco de dados
 */
function setupGameEvents(io, dbHelpers) {
  const {
    getFichaFromDb,
    saveFichaToDb,
    getAllFichasFromDb,
    getPreferenceFromDb,
    savePreferenceToDb
  } = dbHelpers;

  // Estado do servidor
  let mestre = null;
  let jogadores = {}; // playerId -> socket
  let sessoesAtivas = {}; // campaignId -> sessão info

  // =============================================
  // MIDDLEWARE DE AUTENTICAÇÃO SOCKET
  // =============================================
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('Token ausente'));
      
      const payload = verifyTokenSocket(token);
      socket.user = payload;
      return next();
    } catch (err) {
      console.error('Socket auth failed:', err.message || err);
      return next(new Error('Autenticação socket falhou'));
    }
  });

  // =============================================
  // GERENCIAMENTO DE CONEXÕES
  // =============================================
  io.on('connection', (socket) => {
    console.log('🟢 NOVA CONEXÃO Socket.IO:', socket.id);

    // Logger de eventos (debug)
    socket.onAny((eventName, ...args) => {
      console.log(`📨 [${socket.id}] Evento: ${eventName}`, args.length > 0 ? args[0] : '');
    });

    // =============================================
    // REGISTRO DE USUÁRIOS
    // =============================================
    socket.on('register', (data) => {
      console.log('👤 Registro recebido:', data);
      
      if (!data || !data.role) {
        socket.emit('register:error', { message: 'Dados de registro inválidos' });
        return;
      }

      if (data.role === 'mestre') {
        mestre = socket;
        socket.role = 'mestre';
        console.log('✅ Mestre conectado:', socket.id);

        // Enviar lista de jogadores ao mestre
        const all = getAllFichasFromDb().map(f => ({ 
          id: f.playerId, 
          nome: (f.ficha && f.ficha.jogador) || '---', 
          socketId: jogadores[f.playerId]?.id || null 
        }));
        socket.emit('jogadores:lista', all);
        socket.emit('register:success', { role: 'mestre' });

      } else if (data.role === 'jogador') {
        if (!data.playerId || !data.nome) {
          socket.emit('register:error', { message: 'Nome e ID são obrigatórios' });
          return;
        }
        
        socket.role = 'jogador';
        socket.playerId = data.playerId;
        socket.nome = data.nome;
        jogadores[data.playerId] = socket;

        console.log(`✅ Jogador conectado: ${data.nome} (${data.playerId})`);

        // Notificar mestre
        if (mestre) {
          mestre.emit('jogador:conectado', {
            id: data.playerId,
            nome: data.nome,
            socketId: socket.id
          });
        }

        socket.emit('register:success', {
          role: 'jogador',
          playerId: data.playerId,
          nome: data.nome
        });

        // Enviar tema salvo
        const pref = getPreferenceFromDb(data.playerId);
        if (pref && pref.theme) {
          socket.emit('theme:aplicar', { theme: pref.theme });
        }
      } else {
        socket.emit('register:error', { message: 'Role inválido' });
      }
    });

    // =============================================
    // GERENCIAMENTO DE ÁUDIO
    // =============================================
    
    // Enviar áudio para jogador específico
    socket.on('audio:enviar', (data) => {
      const { jogadorId, audioUrl, volume, nome } = data;
      const jogadorSocket = jogadores[jogadorId];
      
      if (jogadorSocket) {
        jogadorSocket.emit('audio:tocar', {
          url: audioUrl,
          volume: volume || 1.0,
          nome: nome || 'Áudio do Mestre'
        });
        socket.emit('audio:confirmado', { jogadorId, audioNome: nome });
        console.log(`🎵 Áudio enviado para ${jogadorSocket.nome}`);
      }
    });

    // Broadcast de áudio para todos
    socket.on('audio:broadcast', (data) => {
      const { audioUrl, volume, nome } = data;
      Object.values(jogadores).forEach(j => {
        j.emit('audio:tocar', {
          url: audioUrl,
          volume: volume || 1.0,
          nome: nome || 'Áudio Ambiente'
        });
      });
      console.log(`📢 Áudio broadcast para todos: ${nome}`);
    });

    // Parar áudio de jogador específico
    socket.on('audio:parar', (data) => {
      const { jogadorId } = data;
      const jogadorSocket = jogadores[jogadorId];
      if (jogadorSocket) {
        jogadorSocket.emit('audio:parar');
        console.log(`🛑 Áudio parado para ${jogadorSocket.nome}`);
      }
    });

    // =============================================
    // GERENCIAMENTO DE FICHAS
    // =============================================
    
    // Solicitar ficha
    socket.on('ficha:solicitar', (data) => {
      const { playerId } = data;
      const ficha = getFichaFromDb(playerId);
      socket.emit('ficha:carregar', ficha);
      console.log(`📋 Ficha carregada para ${playerId}`);
    });

    // Salvar ficha
    socket.on('ficha:salvar', (data) => {
      const { playerId, ficha } = data;
      try {
        saveFichaToDb(playerId, ficha);
        socket.emit('ficha:salva', { success: true });
        
        // Notificar mestre
        if (mestre) {
          const allFichas = getAllFichasFromDb();
          const fichasMap = {};
          allFichas.forEach(f => {
            fichasMap[f.playerId] = f.ficha;
          });
          mestre.emit('fichas:atualizar', fichasMap);
        }
        
        console.log(`💾 Ficha salva: ${playerId}`);
      } catch (err) {
        console.error('Erro ao salvar ficha:', err);
        socket.emit('ficha:salva:erro', { message: err.message });
      }
    });

    // =============================================
    // SISTEMA DE DADOS
    // =============================================
    
    socket.on('dado:rolar', (data) => {
      const { jogador, jogadorId, formula, resultados, total, modificador } = data;
      
      // Broadcast para todos
      io.emit('dado:resultado', {
        jogador,
        jogadorId,
        formula,
        resultados,
        total,
        modificador,
        timestamp: new Date().toISOString()
      });
      
      console.log(`🎲 ${jogador} rolou ${formula} = ${total}`);
    });

    // =============================================
    // SISTEMA DE MENSAGENS
    // =============================================
    
    socket.on('mensagem:enviar', (data) => {
      const { texto, tipo } = data;
      io.emit('mensagem:receber', {
        texto,
        tipo: tipo || 'info',
        de: socket.nome || 'Sistema',
        timestamp: new Date().toISOString()
      });
      console.log(`💬 Mensagem: ${texto}`);
    });

    // =============================================
    // SISTEMA DE TEMAS
    // =============================================
    
    socket.on('theme:set', (data) => {
      const { theme } = data;
      if (socket.playerId) {
        const pref = getPreferenceFromDb(socket.playerId) || {};
        pref.theme = theme;
        savePreferenceToDb(socket.playerId, pref);
        socket.emit('theme:salvo', { theme });
        console.log(`🎨 Tema salvo para ${socket.playerId}: ${theme}`);
      }
    });

    socket.on('theme:solicitar', () => {
      if (socket.playerId) {
        const pref = getPreferenceFromDb(socket.playerId);
        if (pref && pref.theme) {
          socket.emit('theme:aplicar', { theme: pref.theme });
        }
      }
    });

    // =============================================
    // GERENCIAMENTO DE SESSÕES ATIVAS
    // =============================================
    
    // Mestre inicia sessão
    socket.on('mestre:iniciar-sessao', (data) => {
      const { campaignId, campaignName } = data;
      
      sessoesAtivas[campaignId] = {
        mestre: socket.id,
        campanha: campaignName,
        jogadores: [],
        iniciadaEm: new Date().toISOString(),
        status: 'ativa'
      };
      
      console.log(`🎮 Sessão iniciada: ${campaignName} (${campaignId})`);
      
      socket.broadcast.emit('sessao:iniciada', {
        campaignId,
        campaignName,
        mestre: socket.user.username
      });
    });

    // Jogador entra na sessão
    socket.on('jogador:entrar-sessao', (data) => {
      const { campaignId, playerId, nome } = data;
      
      if (sessoesAtivas[campaignId]) {
        sessoesAtivas[campaignId].jogadores.push({
          socketId: socket.id,
          playerId,
          nome,
          conectadoEm: new Date().toISOString()
        });
        
        const mestreSocket = io.sockets.sockets.get(sessoesAtivas[campaignId].mestre);
        if (mestreSocket) {
          mestreSocket.emit('jogador:conectado-sessao', {
            playerId,
            nome,
            totalJogadores: sessoesAtivas[campaignId].jogadores.length
          });
        }
      }
    });

    // Mestre encerra sessão
    socket.on('mestre:encerrar-sessao', (data) => {
      const { campaignId } = data;
      
      if (sessoesAtivas[campaignId]) {
        socket.broadcast.emit('sessao:encerrada', {
          campaignId,
          motivo: 'encerrada_pelo_mestre'
        });
        
        delete sessoesAtivas[campaignId];
        console.log(`🔴 Sessão encerrada: ${campaignId}`);
      }
    });

    // =============================================
    // DESCONEXÃO
    // =============================================
    
    socket.on('disconnect', () => {
      console.log('🔴 Socket desconectado:', socket.id);
      
      if (socket.role === 'mestre') {
        mestre = null;
        console.log('❌ Mestre desconectado');
        
        // Encerrar todas as sessões ativas do mestre
        Object.keys(sessoesAtivas).forEach(campaignId => {
          if (sessoesAtivas[campaignId].mestre === socket.id) {
            socket.broadcast.emit('sessao:encerrada', {
              campaignId,
              motivo: 'mestre_desconectado'
            });
            delete sessoesAtivas[campaignId];
          }
        });
        
      } else if (socket.role === 'jogador' && socket.playerId) {
        delete jogadores[socket.playerId];
        
        if (mestre) {
          mestre.emit('jogador:desconectado', {
            id: socket.playerId,
            nome: socket.nome
          });
        }
        
        // Remover jogador de sessões ativas
        Object.keys(sessoesAtivas).forEach(campaignId => {
          const sessao = sessoesAtivas[campaignId];
          sessao.jogadores = sessao.jogadores.filter(j => j.socketId !== socket.id);
          
          const mestreSocket = io.sockets.sockets.get(sessao.mestre);
          if (mestreSocket) {
            mestreSocket.emit('jogador:desconectado-sessao', {
              playerId: socket.playerId,
              nome: socket.nome,
              totalJogadores: sessao.jogadores.length
            });
          }
        });
        
        console.log(`❌ Jogador desconectado: ${socket.nome}`);
      }
    });
  });

  console.log('✅ Eventos Socket.IO configurados com sucesso');
}

module.exports = { setupGameEvents };
