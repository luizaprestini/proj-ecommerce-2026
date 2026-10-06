## 🛍️ Projeto E-commerce 
---

### Contas
Cada pessoa cria uma conta com seu nome, e-mail e senha na página **Criar conta**. A senha é armazenada com hash; cada conta vê e gerencia apenas os restaurantes e pratos que cadastrou. Para iniciar o servidor, configure uma chave de sessão no PowerShell:
```powershell
$env:SESSION_SECRET = "uma-chave-aleatoria-longa"
npm start
```
As contas ficam no banco de dados, e a sessão termina ao sair ou após oito horas. Restaurantes antigos sem proprietário não são atribuídos automaticamente a novas contas.

Este é o guia para o projeto de site de E-commerce, que será a avaliação do 3º trimestre.

O projeto será divido em etapas com prazos e entregas bem definidos.

### 📅 1ª etapa - Área Administrativa
Para **1ª etapa** será desenvolvida a *Área Administrativa* do site de e-commerce. Essa área administrativa é uma espécie de "sistema interno" ao site, onde é gerenciada toda a parte de cadastro de produtos que serão comercializados no site, e possui o acesso é restrito aos funcionários da empresa.

Funcionalidades mínimas:
- Contas individuais com cadastro e login
- Cadastro de restaurantes e criação automática de uma categoria para cada restaurante
- Cadastro e listagem de pratos e marmitas fit classificados por restaurante, com preço, foto, informações nutricionais por porção, etiquetas alimentares, peso da porção e disponibilidade diária
- Remoção de produtos (v2)

O sistema encontra-se parcialmente desenvolvido neste Github. Faça o download do projeto completo, e leia as informações abaixo para conhecer em detalhe o projeto e saber o que deve ser feito.

Detalhamento do projeto:
* Pastas:
```
banco\ -  contém o JS de criação do banco (SQL) e o arquivo do banco de dados (.db) propriamente dito.
```
```
public\ -  contém arquivo(s) css e a subpasta uploads\ para onde são enviados as imagens cadastradas
```
```
rotas\ - contém as rotas de autenticação e do painel administrativo (admin.js).
```
```
util\ - contém o script para fazer upload de arquivos (não é necessário mexer neste arquivo (ou pasta))
```
```
views\ - contém as páginas EJS organizadas por área (admin, admin/restaurantes, admin/produtos) e as partes compartilhadas (admin/partials).
```

O primeiro passo é **alterar a tabela** (banco/database.js) acrescentando novos campos, deixando os produtos mais completos de informações.

**Prazo de entrega:** +- 02 semanas
**Forma de entrega:** github


### 📅 2ª etapa - Página Inicial
Página inicial do site...