import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [sessionType, setSessionType] = useState('Interval'); 
  const [isLoading, setIsLoading] = useState(false); // Nouveau: état de chargement

  // Gère la sélection du fichier par l'utilisateur
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Gère le changement du type de séance
  const handleSessionTypeChange = (event) => {
    setSessionType(event.target.value);
  };

  // Gère le clic sur "Get Started"
  const handlestart = () => {
    navigate('/stats')
  }
  const handleStartWithImport = async () => {
    // Le handlestart une fois que je traiterais les fichiers que j'importe
    if (!selectedFile) {
      alert("Veuillez importer un fichier .fit avant de commencer l'analyse.");
      return;
    }
    
    setIsLoading(true); // Démarrer le chargement
    
    // Préparation des données pour l'envoi
    const formData = new FormData();
    formData.append('fitFile', selectedFile); 
    formData.append('sessionType', sessionType);

    try {
        // Envoi du fichier au serveur backend (port 5000)
        const response = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData, 
        });

        const data = await response.json();

        if (!response.ok) {
            // Si le statut HTTP est un échec (ex: 500), lève une erreur.
            const errorMessage = data.errorDetails || data.message || `Erreur HTTP: ${response.status}`;
            throw new Error(errorMessage);
        }

        console.log("Analyse réussie. Réponse du serveur:", data);
        
        // Navigation après Succès, en passant les chemins des CSV stockés dans le backend
        navigate('/stats', { 
            state: { 
                recordsCsvPath: data.recordsCsvPath,
                lapsCsvPath: data.lapsCsvPath,
                sessionType: sessionType
            } 
        });


    } catch (error) {
        console.error("Échec de l'analyse:", error);
        alert(`Échec de l'analyse. Erreur: ${error.message}`);
    } finally {
        setIsLoading(false); // Arrêter le chargement, que ce soit un succès ou un échec
    }
  };

  return (
    <div className="home-container">
      <h1 className="home-title">ANALYZE YOUR PERFORMANCES WITH ENDURAW<span className="registered-symbol">®</span></h1>
      <div className="chart-container">
        <h4>Début de la Version 3</h4>
        {/* --- Importation de Fichier --- */}
        <div className="file-importer">
          <label htmlFor="fit-file-upload" className="file-upload-label">
            Importer un fichier d'activité (.fit) :
          </label>
          <input 
            type="file" 
            id="fit-file-upload" 
            accept=".fit"
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
        <button 
          className={`start-button ${(!selectedFile || isLoading) ? 'disabled' : ''}`}
          disabled={!selectedFile || isLoading}
          onClick={handleStartWithImport}
          >
          {isLoading ? 'Analyse en cours...' : 'Get Started'}
        </button>

      </div>

      <p className="home-subtitle">Make data accessible and bring lisibility to our sports.</p>

      {/* --- Bouton de Démarrage --- */}
      <p className="home-subtitle">The analysis of your last session is ready.</p>
      <button 
        className={`start-button`}
        onClick={handlestart}
      >
        {isLoading ? 'Analyse en cours...' : 'Get Started'}
      </button>
      
    </div>
  );
};

export default Home;