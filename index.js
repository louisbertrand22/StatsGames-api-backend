// Importez les modules nécessaires
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // Pour charger les variables d'environnement

const app = express();
const port = 3000;

// Middleware pour permettre à votre application React Native d'accéder à ce serveur
app.use(cors());
app.use(express.json());

// Clé API stockée de manière sécurisée dans un fichier .env (environnement du serveur)
const SUPERCELL_API_KEY = process.env.SUPERCELL_API_KEY;

app.get('/diag/ip', async (req, res) => {
    try {
        // Utilise un service externe pour trouver l'adresse IP publique du serveur Vercel
        const response = await axios.get('https://api.ipify.org?format=json');
        res.json({ outbound_ip: response.data.ip, message: 'Add this IP to the Supercell developer portal.' });
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch IP address.' });
    }
});

// L'endpoint pour obtenir les informations d'un joueur
// Exemple d'appel : /player?tag=%23L9YJLP22
app.get('/player', async (req, res) => {
    const playerTag = req.query.tag;

    if (!playerTag) {
        return res.status(400).json({ error: 'Player tag is required.' });
    }

    if (!SUPERCELL_API_KEY) {
        // Cette erreur ne devrait jamais se produire en production si le .env est configuré
        console.error("API Key is missing.");
        return res.status(500).json({ error: 'Internal server error: API key missing.' });
    }

    // Le tag du joueur doit être encodé (par exemple, #XXXXXX devient %23XXXXXX)
    const encodedTag = encodeURIComponent(playerTag);
    const apiUrl = `https://api.clashofclans.com/v1/players/${encodedTag}`;

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                // Utilisation de la clé API sécurisée
                'Authorization': `Bearer ${SUPERCELL_API_KEY}`
            }
        });

        // Renvoie les données du joueur à l'application cliente
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data from Supercell API:', error.response ? error.response.data : error.message);
        // Renvoie l'erreur de l'API Supercell à l'application cliente
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch player data from Supercell.',
            details: error.response?.data || error.message
        });
    }
});

// Endpoint de base pour vérifier que le serveur est actif
app.get('/', (req, res) => {
    res.send('Clash API Backend is running.');
});

// Pour le développement local :
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
}

// Pour l'utilisation Serverless (Vercel/Netlify), on exporte l'application Express
module.exports = app;