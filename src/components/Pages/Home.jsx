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
  const handleStart = () => {
    if (!selectedFile) {
      alert("Veuillez importer un fichier .fit avant de commencer l'analyse.");
      return;
    }

    // Ici, vous naviguerez vers la page d'analyse appropriée
    // en fonction du type de séance sélectionné et du fichier.
    
    // Pour l'exemple, nous allons vers '/stats' comme avant,
    // mais dans un vrai scénario, vous pourriez utiliser une logique comme :
    // if (sessionType === 'Interval') { navigate('/stats/interval', { state: { file: selectedFile } }); }
    // else if (sessionType === 'Trail') { navigate('/stats/trail', { state: { file: selectedFile } }); }
    // else if (sessionType === 'Road') { navigate('/stats/road', { state: { file: selectedFile } }); }

    // Pour l'instant, on navigue vers /stats et on suppose que 
    // l'étape suivante gérera le fichier et le type.
    console.log(`Fichier sélectionné: ${selectedFile.name}`);
    console.log(`Type de séance sélectionné: ${sessionType}`);
    navigate('/stats', { state: { file: selectedFile, sessionType: sessionType } });
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