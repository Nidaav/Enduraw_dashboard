// server/index.js

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5000; // Le serveur backend tournera sur ce port

// Configuration CORS pour autoriser les requêtes depuis votre application React (port 3000 par défaut)
app.use(cors({
  origin: 'http://localhost:3000' 
}));

// --- Configuration du stockage pour Multer ---
const uploadDir = path.join(__dirname, 'uploads');
// Créer le dossier d'uploads s'il n'existe pas
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  // Stocker dans le dossier 'uploads' à la racine du backend
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  // Renommer le fichier pour qu'il soit unique et préserve l'extension
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});

const upload = multer({ storage: storage });

// --- Route d'Upload ---
app.post('/upload', upload.single('fitFile'), (req, res) => {
  // 'fitFile' doit correspondre au nom du champ que vous enverrez depuis le frontend.
  if (!req.file) {
    return res.status(400).send('Aucun fichier n\'a été envoyé.');
  }

  // Ici, le fichier est stocké !
  console.log(`Fichier reçu et stocké : ${req.file.path}`);
  
  // Vous pouvez maintenant exécuter vos scripts d'analyse ici, en utilisant req.file.path
  // ... (Logique d'analyse ici)

  // Envoi d'une réponse au frontend
  res.json({ 
    message: 'Fichier bien reçu et stocké.',
    filePath: req.file.path,
    originalName: req.file.originalname
  });
});

app.listen(port, () => {
  console.log(`Serveur Backend démarré sur http://localhost:${port}`);
});