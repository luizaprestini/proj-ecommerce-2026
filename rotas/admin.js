const express = require('express');
const appAdmin = express();
const db = require('../banco/database');
const upload = require('../util/imagens');
const categoriasPrato = ['Marmita', 'Bowl', 'Salada', 'Lanche', 'Sobremesa fit'];


//================== ROTAS DE LOGIN/INDEX ==================//
appAdmin.get('/index', (req, res) => {
    res.render('admin/index-admin');
});

appAdmin.get('/', (req, res) => {
    res.render('admin/login');
});

appAdmin.post('/login', (req, res) => {
    //algoritmo de autenticação do usuário - FUTURO
    res.redirect('/admin/index');
});


//================== ROTAS DE RESTAURANTES ==================//
appAdmin.get('/restaurantes', (req, res) => {
    db.all(
        'SELECT * FROM restaurantes',
        [],
        function (erro, restaurantes) {
            if (erro) {
                console.log(erro.message);
                return res.send('Erro ao consultar restaurantes.');
            }
            res.render('admin/restaurantes/lista', { restaurantes });
        }
    );
});

appAdmin.get('/restaurantes/form-cadastrar', (req, res) => {
    res.render('admin/restaurantes/cadastro');
});

appAdmin.post('/restaurantes/cadastrar', (req, res) => {
    const { nome, descricao } = req.body;

    db.run('BEGIN TRANSACTION', (erroInicio) => {
        if (erroInicio) {
            console.error('Erro ao iniciar cadastro do restaurante:', erroInicio.message);
            return res.status(500).send('Não foi possível iniciar o cadastro do restaurante.');
        }

        db.run(
            'INSERT INTO categorias (nome, descricao) VALUES (?, ?)',
            [nome, descricao],
            function (erroCategoria) {
                if (erroCategoria) {
                    console.error('Erro ao cadastrar categoria do restaurante:', erroCategoria.message);
                    return db.run('ROLLBACK', (erroRollback) => {
                        if (erroRollback) {
                            console.error('Erro ao desfazer cadastro do restaurante:', erroRollback.message);
                        }
                        res.status(500).send('O restaurante não foi salvo porque também não foi possível cadastrá-lo em categorias.');
                    });
                }

                const categoriaId = this.lastID;
                db.run(
                    'INSERT INTO restaurantes (nome, descricao, categoria_id) VALUES (?, ?, ?)',
                    [nome, descricao, categoriaId],
                    (erroRestaurante) => {
                        if (erroRestaurante) {
                            console.error('Erro ao cadastrar restaurante:', erroRestaurante.message);
                            return db.run('ROLLBACK', (erroRollback) => {
                                if (erroRollback) {
                                    console.error('Erro ao desfazer cadastro do restaurante:', erroRollback.message);
                                }
                                res.status(500).send('Não foi possível cadastrar o restaurante.');
                            });
                        }

                        db.run('COMMIT', (erroCommit) => {
                            if (erroCommit) {
                                console.error('Erro ao concluir cadastro do restaurante:', erroCommit.message);
                                return db.run('ROLLBACK', (erroRollback) => {
                                    if (erroRollback) {
                                        console.error('Erro ao desfazer cadastro do restaurante:', erroRollback.message);
                                    }
                                    res.status(500).send('Não foi possível concluir o cadastro do restaurante.');
                                });
                            }
                            res.redirect('/admin/restaurantes');
                        });
                    }
                );
            }
        );
    });
});

appAdmin.get('/restaurantes/:id/editar', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).send('Identificador de restaurante inválido.');
    }

    db.get(
        'SELECT id, nome, descricao FROM restaurantes WHERE id = ?',
        [id],
        (erro, restaurante) => {
            if (erro) {
                console.error('Erro ao consultar restaurante para edição:', erro.message);
                return res.status(500).send('Não foi possível carregar o restaurante para edição.');
            }
            if (!restaurante) {
                return res.status(404).send('Restaurante não encontrado.');
            }
            res.render('admin/restaurantes/editar', { restaurante });
        }
    );
});

appAdmin.post('/restaurantes/:id/editar', (req, res) => {
    const id = Number(req.params.id);
    const { nome, descricao } = req.body;

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).send('Identificador de restaurante inválido.');
    }
    if (typeof nome !== 'string' || !nome.trim()) {
        return res.status(400).send('O nome do restaurante é obrigatório.');
    }

    db.get('SELECT categoria_id FROM restaurantes WHERE id = ?', [id], (erroConsulta, restaurante) => {
        if (erroConsulta) {
            console.error('Erro ao consultar restaurante para edição:', erroConsulta.message);
            return res.status(500).send('Não foi possível carregar o restaurante.');
        }
        if (!restaurante) {
            return res.status(404).send('Restaurante não encontrado.');
        }

        const nomeLimpo = nome.trim();
        const descricaoLimpa = typeof descricao === 'string' ? descricao.trim() : '';
        db.run('BEGIN TRANSACTION', (erroInicio) => {
            if (erroInicio) {
                console.error('Erro ao iniciar edição do restaurante:', erroInicio.message);
                return res.status(500).send('Não foi possível iniciar a edição do restaurante.');
            }

            db.run(
                'UPDATE restaurantes SET nome = ?, descricao = ? WHERE id = ?',
                [nomeLimpo, descricaoLimpa, id],
                function (erroAtualizacao) {
                    if (erroAtualizacao) {
                        console.error('Erro ao editar restaurante:', erroAtualizacao.message);
                        return db.run('ROLLBACK', (erroRollback) => {
                            if (erroRollback) console.error('Erro ao desfazer edição do restaurante:', erroRollback.message);
                            res.status(500).send('Não foi possível salvar as alterações do restaurante.');
                        });
                    }

                    const atualizarCategoria = (callback) => {
                        if (!restaurante.categoria_id) return callback();
                        db.run(
                            'UPDATE categorias SET nome = ?, descricao = ? WHERE id = ?',
                            [nomeLimpo, descricaoLimpa, restaurante.categoria_id],
                            (erroCategoria) => {
                                if (erroCategoria) {
                                    console.error('Erro ao atualizar categoria vinculada ao restaurante:', erroCategoria.message);
                                    return db.run('ROLLBACK', (erroRollback) => {
                                        if (erroRollback) console.error('Erro ao desfazer edição do restaurante:', erroRollback.message);
                                        res.status(500).send('Não foi possível atualizar a categoria vinculada ao restaurante.');
                                    });
                                }
                                callback();
                            }
                        );
                    };

                    atualizarCategoria(() => {
                        db.run('COMMIT', (erroCommit) => {
                            if (erroCommit) {
                                console.error('Erro ao concluir edição do restaurante:', erroCommit.message);
                                return db.run('ROLLBACK', (erroRollback) => {
                                    if (erroRollback) console.error('Erro ao desfazer edição do restaurante:', erroRollback.message);
                                    res.status(500).send('Não foi possível concluir a edição do restaurante.');
                                });
                            }
                            res.redirect('/admin/restaurantes');
                        });
                    });
                }
            );
        });
    });
});

appAdmin.post('/restaurantes/:id/excluir', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).send('Identificador de restaurante inválido.');
    }

    db.run('BEGIN TRANSACTION', (erroInicio) => {
        if (erroInicio) {
            console.error('Erro ao iniciar exclusão do restaurante:', erroInicio.message);
            return res.status(500).send('Não foi possível iniciar a exclusão do restaurante.');
        }

        const rollback = (status, mensagem) => {
            db.run('ROLLBACK', (erroRollback) => {
                if (erroRollback) {
                    console.error('Erro ao desfazer exclusão do restaurante:', erroRollback.message);
                }
                res.status(status).send(mensagem);
            });
        };

        db.get('SELECT categoria_id FROM restaurantes WHERE id = ?', [id], (erroConsulta, restaurante) => {
            if (erroConsulta) {
                console.error('Erro ao localizar restaurante para exclusão:', erroConsulta.message);
                return rollback(500, 'Não foi possível localizar o restaurante para exclusão.');
            }
            if (!restaurante) {
                return rollback(404, 'Restaurante não encontrado.');
            }

            db.get('SELECT COUNT(*) AS quantidade FROM produtos WHERE restaurante_id = ?', [id], (erroProdutos, resultado) => {
                if (erroProdutos) {
                    console.error('Erro ao verificar produtos do restaurante:', erroProdutos.message);
                    return rollback(500, 'Não foi possível verificar os produtos deste restaurante.');
                }
                if (resultado.quantidade > 0) {
                    return rollback(409, 'Não é possível excluir este restaurante enquanto ele tiver produtos cadastrados.');
                }

            const removerRestaurante = () => {
                db.run('DELETE FROM restaurantes WHERE id = ?', [id], function (erroRestaurante) {
                    if (erroRestaurante) {
                        console.error('Erro ao excluir restaurante:', erroRestaurante.message);
                        return rollback(500, 'Não foi possível excluir o restaurante.');
                    }
                    if (this.changes === 0) {
                        return rollback(404, 'Restaurante não encontrado.');
                    }

                    db.run('COMMIT', (erroCommit) => {
                        if (erroCommit) {
                            console.error('Erro ao concluir exclusão do restaurante:', erroCommit.message);
                            return rollback(500, 'Não foi possível concluir a exclusão do restaurante.');
                        }
                        res.redirect('/admin/restaurantes');
                    });
                });
            };

            if (!restaurante.categoria_id) {
                return removerRestaurante();
            }

            db.run(
                `DELETE FROM categorias
                 WHERE id = ?
                   AND NOT EXISTS (
                       SELECT 1 FROM restaurantes
                       WHERE categoria_id = ? AND id <> ?
                   )`,
                [restaurante.categoria_id, restaurante.categoria_id, id],
                (erroCategoria) => {
                    if (erroCategoria) {
                        console.error('Erro ao excluir categoria vinculada ao restaurante:', erroCategoria.message);
                        return rollback(500, 'Não foi possível excluir a categoria do restaurante.');
                    }
                    removerRestaurante();
                }
            );
            });
        });
    });
});


//================== ROTAS DE PRODUTOS ==================//


//ROTA PARA CONSULTAR TODOS OS PRODUTOS
appAdmin.get('/produtos', (req, res) => {
    db.all(
        `SELECT p.*, r.nome AS restaurante
         FROM produtos p
         LEFT JOIN restaurantes r ON r.id = p.restaurante_id`,
        [],
        function (erro, produtos) {
            if (erro) {
                console.log(erro.message);
                return res.send('Erro ao consultar produtos.');
            }
            res.render('admin/produtos/lista', { produtos });
        }
    );
});

//ROTA PARA EXIBIR O FORMULÁRIO DE CADASTRO DE PRODUTOS
//Precisa consultar os restaurantes para popular o select do formulário
appAdmin.get('/produtos/form-cadastrar', (req, res) => {
    db.all(
        'SELECT id, nome FROM restaurantes ORDER BY nome',
        [],
        function (erro, restaurantes) {
            if (erro) {
                console.log(erro.message);
                return res.send('Erro ao consultar restaurantes.');
            }
            res.render('admin/produtos/cadastro', { restaurantes });
        }
    );
});

appAdmin.post('/produtos/cadastrar', upload.single('imagem'), (req, res) => {
    const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
    const restauranteId = Number(req.body.restaurante_id);
    const camposNumericos = [
        req.body.valor,
        req.body.calorias,
        req.body.proteina,
        req.body.carboidrato,
        req.body.gordura,
        req.body.porcao_gramas
    ];
    const categoria = req.body.categoria;
    const valor = Number(req.body.valor);
    const calorias = Number(req.body.calorias);
    const proteina = Number(req.body.proteina);
    const carboidrato = Number(req.body.carboidrato);
    const gordura = Number(req.body.gordura);
    const porcaoGramas = Number(req.body.porcao_gramas);
    const descricao = typeof req.body.descricao === 'string' ? req.body.descricao.trim() : '';
    const imagem = req.file ? req.file.filename : null;

    if (!nome) {
        return res.status(400).send('Informe o nome do prato.');
    }
    if (!Number.isInteger(restauranteId) || restauranteId < 1) {
        return res.status(400).send('Selecione um restaurante válido para o produto.');
    }
    if (!categoriasPrato.includes(categoria)) {
        return res.status(400).send('Selecione uma categoria válida para o prato.');
    }
    if (camposNumericos.some((campo) => typeof campo !== 'string' || campo.trim() === '')) {
        return res.status(400).send('Preencha o preço, os dados nutricionais e o peso da porção.');
    }
    if (!Number.isFinite(valor) || valor < 0) {
        return res.status(400).send('Informe um preço válido.');
    }
    if (![calorias, proteina, carboidrato, gordura].every((valorNutricional) => Number.isFinite(valorNutricional) && valorNutricional >= 0)) {
        return res.status(400).send('Informe valores nutricionais válidos e não negativos.');
    }
    if (!Number.isInteger(porcaoGramas) || porcaoGramas <= 0) {
        return res.status(400).send('Informe o peso da porção em gramas.');
    }
    if (!imagem) {
        return res.status(400).send('Envie uma foto do prato.');
    }

    db.get('SELECT id FROM restaurantes WHERE id = ?', [restauranteId], (erroRestaurante, restaurante) => {
        if (erroRestaurante) {
            console.error('Erro ao validar restaurante do produto:', erroRestaurante.message);
            return res.status(500).send('Não foi possível validar o restaurante selecionado.');
        }
        if (!restaurante) {
            return res.status(400).send('O restaurante selecionado não existe.');
        }

        db.run(
            `INSERT INTO produtos (
                nome, categoria, valor, estoque, descricao, imagem, restaurante_id,
                calorias, proteina, carboidrato, gordura, vegano, sem_gluten,
                sem_lactose, low_carb, porcao_gramas, disponivel_hoje
             ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome,
                categoria,
                valor,
                descricao,
                imagem,
                restauranteId,
                calorias,
                proteina,
                carboidrato,
                gordura,
                req.body.vegano === 'on' ? 1 : 0,
                req.body.sem_gluten === 'on' ? 1 : 0,
                req.body.sem_lactose === 'on' ? 1 : 0,
                req.body.low_carb === 'on' ? 1 : 0,
                porcaoGramas,
                req.body.disponivel_hoje === 'on' ? 1 : 0
            ],
            function (erro) {
                if (erro) {
                    console.error('Erro ao cadastrar produto:', erro.message);
                    return res.status(500).send('Não foi possível cadastrar o produto.');
                }
                res.redirect('/admin/produtos');
            }
        );
    });
});
module.exports = appAdmin;