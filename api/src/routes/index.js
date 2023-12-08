const { Router } = require('express')
const { Sequelize } = require('sequelize')
const axios = require("axios")
const Op = Sequelize.Op

const { Videogame, Genre } = require('../db.js')

// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

/////////////////////////////////////////////////////////// ~ GET /videogames - 1
//////////////////////////////////////////////// ~ GET /videogames?name="..." - 21
router.get('/videogames', async (req, res) => {
    const videogames = []

    if (!req.query.name) {
        const apiUno = await axios.get("https://api.rawg.io/api/games?key=8afcf837a73d4fc08cb9a9c5928320bb&page=1&page_size=40")
        const apiDos = await axios.get("https://api.rawg.io/api/games?key=8afcf837a73d4fc08cb9a9c5928320bb&page=2&page_size=40")
        const apiTres = await axios.get("https://api.rawg.io/api/games?key=8afcf837a73d4fc08cb9a9c5928320bb&page=3&page_size=20")

        const database = await Videogame.findAll({
            include: [
                { model: Genre, attributes: ["name"], through: { attributes: [] } }
            ]
        })

        const data = [...apiUno.data.results, ...apiDos.data.results, ...apiTres.data.results, ...database]

        data.map(r => videogames.push({
            id: r.id,
            name: r.name,
            image: r.background_image ? r.background_image : null,
            genres: r.genres.map(r => {
                return {
                    name: r.name
                }
            })
        }))

        return res.send(videogames)
    } else {
        const api = await axios.get(`https://api.rawg.io/api/games?key=8afcf837a73d4fc08cb9a9c5928320bb&search=${req.query.name}&page=1&page_size=15`)

        api.data.results.map(r => videogames.push({
            id: r.id,
            name: r.name,
            image: r.background_image ? r.background_image : null,
            genres: r.genres.map(r => {
                return {
                    name: r.name
                }
            })
        }))

        return res.send(videogames)
    }
})

////////////////////////////////////////////// ~ GET /videogames/:idVideogame - 3
router.get('/videogames/:idVideogame', async (req, res) => {
    const { idVideogame } = req.params

    const api = await axios.get(`https://api.rawg.io/api/games/${idVideogame}?key=8afcf837a73d4fc08cb9a9c5928320bb`)

    const videogame = {
        id: api.data.id,
        name: api.data.name,
        image: api.data.background_image,
        genres: api.data.genres.map(r => {
            return {
                name: r.name
            }
        }),
        description: api.data.description,
        release: api.data.released,
        rating: api.data.rating,
        platforms: api.data.platforms.map(r => {
            return {
                name: r.platform.name
            }
        })
    }

    res.send(videogame)
})

//////////////////////////////////////////////////////////////// ~ GET/genres - 4
router.get('/genres', async (req, res) => {
    const api = await axios.get("https://api.rawg.io/api/genres?&key=8afcf837a73d4fc08cb9a9c5928320bb")

    const genres = api.data.results.map(async r => {
        await Genre.findOrCreate({ 
            where: { name: r.name }
        })
    })
 
    res.send(genres)
})

/////////////////////////////////////////////////////////// ~ POST /videogame - 5
router.post('/videogame', async (req, res) => {
    const { name, description, genres, release, rating, platforms } = req.body

    const videogame = await Videogame.create({ name, description, release, rating, platforms })

    const genre = await Genre.findAll({ where: { name: { [Op.in]: genres } } })

    videogame.addGenre(genre)

    res.send({ message: 'todo salio bien' })
})

module.exports = router;
