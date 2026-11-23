const {Insumo} = require('./insumo.model');


const insumoService = {
    create: async (insumoData) => {
        try {
            return await Insumo.create(insumoData);
        } catch (error) {
            throw new Error('Erro ao criar insumo: ' + error.message);
        }
    },

    findAll: async () => {
        try {
            return await Insumo.findAll();
        } catch (error) {
            throw new Error('Erro ao buscar insumos: ' + error.message);
        }
    },

    findById: async (id) => {
        try {
            const insumo = await Insumo.findByPk(id);
            if (!insumo) {
                throw new Error('Insumo não encontrado');
            }
            return insumo;
        } catch (error) {
            throw new Error('Erro ao buscar insumo: ' + error.message);
        }
    },
    update: async (id, insumoData) => {
        try {
            const [updated] = await Insumo.update(insumoData, {
                where: { id }
            });
            if (!updated) {
                throw new Error('Insumo não encontrado');
            }
            return updated;
        } catch (error) {
            throw new Error('Erro ao atualizar insumo: ' + error.message);
        }
    },
    delete: async (id) => {
        try {
            const deleted = await Insumo.destroy({
                where: { id }
            });
            if (!deleted) {
                throw new Error('Insumo não encontrado');
            }
            return deleted;
        } catch (error) {
            throw new Error('Erro ao excluir insumo: ' + error.message);
        }
    }
};

module.exports = insumoService;