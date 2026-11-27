const usuarioService = require('./usuario.service');

const usuarioController = {

  async create(req, res) {
    try {
      // Se quem esta criando for um MEEIRO, ele so pode cadastrar um AJUDANTE (nunca ADMIN ou outro MEEIRO)
      if (req.usuario.perfil === 'MEEIRO') {
        if (req.body.perfil && req.body.perfil !== 'AJUDANTE') {
          return res.status(403).json({ error: 'Meeiros só podem cadastrar usuários com perfil AJUDANTE.' });
        }
        req.body.perfil = 'AJUDANTE';
      }

      const result = await usuarioService.create(req.body, req.usuario);
      res.status(201).json(result);
    } catch (error) {
      if (error.message.includes('próprios talhões')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  },

  async findById(req, res) {
    try {
      const result = await usuarioService.findByIdPublico(req.params.id);
      if (!result) return res.status(404).json({ error: 'Usuário não encontrado' });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async findAll(req,res) {
    try {
      const usuarios = await usuarioService.findAll();
      res.status(200).json(usuarios);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }, 

  async findArquivados(req, res) {
    try {
      const arquivados = await usuarioService.findArquivados();
      res.status(200).json(arquivados);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async findByEmail(req, res) {
    try {
      const usuario = await usuarioService.findByEmail(req.params.email);
      if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
      res.status(200).json(usuario);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req,res) {
    try {
      const atualizaUsuario = await usuarioService.update(req.params.id, req.body);
      if (!atualizaUsuario) return res.status(404).json({error: 'usuario não encontrado'});
      res.status(200).json(atualizaUsuario);
    } catch (error) {
      res.status(400).json({error: error.message});
    }
  },
  async toggleAtivo(req, res) {
    try {
      const { ativo } = req.body;
      if (ativo === undefined) {
        return res.status(400).json({ error: 'O campo ativo é obrigatório' });
      }
      const updatedUsuario = await usuarioService.toggleAtivo(req.params.id, ativo);
      res.json(updatedUsuario);
    } catch (error) {
      if (error.message.includes('possui acertos pendentes')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      await usuarioService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      if (error.message.includes('possui acertos pendentes')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }
}


module.exports = usuarioController;