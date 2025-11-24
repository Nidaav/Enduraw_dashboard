import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  // État pour stocker le fichier sélectionné
  const [selectedFile, setSelectedFile] = useState(null);
  // État pour stocker le type de séance sélectionné
  const [sessionType, setSessionType] = useState('Interval'); // 'Interval' par défaut pour le fractionné (outil actuel)

  // Gère la sélection du fichier par l'utilisateur
  const handleFileChange = (event) => {
    // Ne prend que le premier fichier (il ne devrait y en avoir qu'un)
    setSelectedFile(event.target.files[0]);
  };

  // Gère le changement du type de séance
  const handleSessionTypeChange = (event) => {
    setSessionType(event.target.value);
  };

  // Gère le clic sur "Get Started"
  const handleStart = async () => { // **Ajouter 'async' ici**
    if (!selectedFile) {
      alert("Veuillez importer un fichier .fit avant de commencer l'analyse.");
      return;
    }
    
    // --- NOUVEAU : Préparation des données pour l'envoi ---
    const formData = new FormData();
    // 'fitFile' doit correspondre au nom du champ utilisé dans Multer sur le serveur
    formData.append('fitFile', selectedFile); 
    formData.append('sessionType', sessionType);

    // Mettez le bouton en état de chargement si vous implémentez l'état `isLoading`
    // setIsLoading(true);

    try {
        // Envoi du fichier au serveur backend (port 5000)
        const response = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData, // Les données Form Data sont envoyées
            // Le Content-Type est automatiquement géré par le navigateur avec FormData
        });

        // Vérification de la réponse
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Réponse du serveur:", data);

        // --- Navigation après Succès ---
        // Une fois que le serveur confirme le stockage, on navigue.
        // On pourrait passer des informations de `data` (comme le nom de fichier stocké) à la page /stats
        navigate('/stats', { state: { 
            uploadedFilePath: data.filePath, 
            sessionType: sessionType,
            originalName: data.originalName
        }});


    } catch (error) {
        console.error("Erreur lors de l'envoi du fichier:", error);
        alert(`Échec de l'analyse. Erreur: ${error.message}`);
    } finally {
        // setIsLoading(false);
    }
  };

  return (
    <div className="home-container">
      <h1 className="home-title">ANALYZE YOUR PERFORMANCES WITH ENDURAW<span className="registered-symbol">®</span></h1>
      <p className="home-subtitle">Make data accessible and bring lisibility to our sports.</p>
      
      {/* --- Importation de Fichier --- */}
      <div className="file-importer">
        <label htmlFor="fit-file-upload" className="file-upload-label">
          Importer un fichier d'activité (.fit) :
        </label>
        <input 
          type="file" 
          id="fit-file-upload" 
          accept=".fit" // N'accepter que les fichiers .fit
          onChange={handleFileChange}
          className="file-input"
        />
        {selectedFile && (
          <p className="selected-file-info">
            Fichier sélectionné : **{selectedFile.name}**
          </p>
        )}
      </div>

      {/* --- Sélecteur de Type de Séance --- */}
      <div className="session-type-selector">
        <label htmlFor="session-type">Choisir le type de séance :</label>
        <select 
          id="session-type" 
          value={sessionType} 
          onChange={handleSessionTypeChange}
          className="select-input"
        >
          <option value="Interval">Fractionné (Piste)</option>
          <option value="Road">Course sur Route</option>
          <option value="Trail">Course de Trail</option>
        </select>
      </div>


      {/* --- Bouton de Démarrage --- */}
      <p className="home-subtitle">L'analyse de votre dernière session est prête.</p>
      <button 
        className={`start-button ${!selectedFile ? 'disabled' : ''}`} // Optionnel: désactiver si pas de fichier
        onClick={handleStart}
        disabled={!selectedFile} // Désactiver si aucun fichier n'est sélectionné
      >
        Get Started
      </button>
      
    </div>
  );
};

export default Home;