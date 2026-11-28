const { Cultura, Talhao } = require('../models');


 const culturaService = {
     create: async (culturaData) => {
         try {
             const novaCultura = await Cultura.create(culturaData);
             return novaCultura;
         } catch (error) {
             throw new Error('Erro ao criar cultura: ' + error.message);
         }
     },

     findAll: async () => {
         return await Cultura.findAll();
     },
     findById: async (id) => {
         return await Cultura.findByPk(id);
     },
      update: async (id, culturaData) => {
         const cultura = await Cultura.findByPk(id);
         if (!cultura) {
             throw new Error('Cultura não encontrada');
         }
         await cultura.update(culturaData);
         return cultura;
      },
      delete: async (id) => {
         const cultura = await Cultura.findByPk(id);
          if (!cultura) {
              throw new Error('Cultura não encontrada');
          }
          // Verifica se existem talhões associados à cultura antes de excluir
          const talhaoCount = await Talhao.count({ where: { culturaId: id } });
          if (talhaoCount > 0) {
              throw new Error('Não é possível excluir a cultura, existem talhões associados a ela.');
          }
          await cultura.destroy();
          return { message: 'Cultura excluída com sucesso' };
      }

 };

 module.exports = culturaService;