import sys
import json
from pathlib import Path
import pandas as pd
from fitparse import FitFile
from datetime import timedelta
import matplotlib.pyplot as plt
import numpy as np

# Utilisation:
# Depuis l'origine du dossier "enduraw_dashboard" -> python src/utils/extract_fit_file.py "./src/utils/20355680594_ACTIVITY.fit"
#
# Fichier créé: activity_data.csv

# Facteur de conversion de la vitesse: 1 m/s = 3.6 km/h
MS_TO_KMH = 3.6

# Seuil pour la détection des arrêts longs et immobiles
PAUSE_TIME_THRESHOLD_S = 10.0 # Écart de temps minimum pour suspecter une pause
PAUSE_DISTANCE_THRESHOLD_M = 1.0 # Écart de distance maximum pour confirmer l'immobilité

def format_seconds_to_min_sec(seconds):
        if pd.isna(seconds):
            return None
        total_seconds = int(seconds)
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        return f"{minutes:02d}:{seconds:02d}"

def parse_fit(path):
    ff = FitFile(path)
    
    # 1. Extraction des enregistrements de la session (Record Messages)
    rows = []
    # Liste des colonnes à supprimer à la fin du traitement
    columns_to_drop = [
        "activity_type", "enhanced_altitude", "enhanced_speed", "fractional_cadence", 
        "unknown_87", "unknown_88", "unknown_90", "speed", "cadence", "position_lat", "position_long"
    ]
    
    for rec in ff.get_messages('record'):
        r = {}
        for field in rec:
            r[field.name] = field.value
        rows.append(r) 
        
    if not rows:
        raise RuntimeError("Aucun record trouvé dans le fichier .fit")
    
    df = pd.DataFrame(rows)
    
    # 2. Nettoyage et normalisation des données
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp').reset_index(drop=True)
    
        # Crée la colonne de temps écoulé en secondes (pour toute la séance)
        df['elapsed_time_s'] = (df['timestamp'] - df['timestamp'].iloc[0]).dt.total_seconds()
    
    # 3. Conversion de la vitesse m/s -> km/h
    if 'speed' in df.columns:
        # Calcule et arrondit 'speed_kmh' à 2 décimales
        df['speed_kmh'] = np.round(df['speed'] * MS_TO_KMH, 2)
        
    # 4. Traitements sur les colonnes existantes

    # A. Cadence en pas par minute (step/min)
    if 'cadence' in df.columns:
        # Cadence = cycle/min. Pour la course à pied (running), 1 cycle = 2 pas.
        df['cadence_step_per_min'] = df['cadence'] * 2

    # B. Arrondir 'stance_time' et 'step_length' à l'unité
    for col in ['stance_time', 'step_length', 'altitude']:
        if col in df.columns:
            # Arrondir à l'unité et convertir en entier pour supprimer le '.0'
            df[col] = np.round(df[col]).astype('Int64')

    # 5. Ajout de l'information des laps
    df = add_lap_info(ff, df)
    
    # 6. Ajout du temps écoulé dans le lap en cours (elapsed_time_in_lap_s)
    if 'lap_number' in df.columns and 'elapsed_time_s' in df.columns:
        # Calculer le temps minimum (début) pour chaque lap
        lap_start_time = df.groupby('lap_number')['elapsed_time_s'].transform('min')
        # Soustraire le temps de début du lap au temps écoulé total
        df['elapsed_time_in_lap_s'] = df['elapsed_time_s'] - lap_start_time
        df['elapsed_time_in_lap_s'] = np.round(df['elapsed_time_in_lap_s'], 1)

    # 7. Ajout des colonnes demandées
    
    # 7.A Colonne de temps d'activité cumulé (moving_elapsed_time_s)
    if 'elapsed_time_s' in df.columns and 'distance' in df.columns:
        
        # Calculer l'écart temporel et l'écart de distance avec la ligne précédente
        df['dt'] = df['elapsed_time_s'].diff()
        df['dd'] = df['distance'].diff().fillna(0)
        
        # Identifier une pause longue et immobile
        is_break_real = (df['dt'] >= PAUSE_TIME_THRESHOLD_S) & (df['dd'] <= PAUSE_DISTANCE_THRESHOLD_M)
        
        # Calculer le temps de pause à soustraire (l'écart total moins 1s pour le delta normal)
        # Le premier point (dt est NaN) est initialisé à 0
        df['pause_correction_s'] = np.where(is_break_real, df['dt'] - 1.0, 0.0)
        df.loc[0, 'pause_correction_s'] = 0.0
        
        # Calculer le temps de pause cumulé
        df['cumulative_pause_s'] = df['pause_correction_s'].cumsum()
        
        # Calculer le temps d'activité réel (Temps total - Temps de pause cumulé)
        df['moving_elapsed_time_s'] = df['elapsed_time_s'] - df['cumulative_pause_s']
        df['moving_elapsed_time_s'] = np.round(df['moving_elapsed_time_s'], 1)
        
        # On supprime les colonnes intermédiaires de calcul
        df = df.drop(columns=['dt', 'dd', 'pause_correction_s', 'cumulative_pause_s'], errors='ignore')

    # 7.B Colonne de temps formaté (MM:SS)
    if 'elapsed_time_s' in df.columns:
        df['elapsed_time_min_sec'] = df['moving_elapsed_time_s'].apply(format_seconds_to_min_sec)

    # 8. Suppression des colonnes indésirables
    df = df.drop(columns=columns_to_drop, errors='ignore')
    
    # 9. Réorganisation des colonnes principales
    
    # Définir l'ordre des colonnes principales
    col_order_priority = [
            'timestamp', 
            'elapsed_time_s',
            'moving_elapsed_time_s',
            'elapsed_time_min_sec',
            'lap_number', 
            'elapsed_time_in_lap_s', 
            'distance', 
            'speed_kmh', 
            'heart_rate', 
            'cadence_step_per_min', 
            'stance_time', 
            'stance_time_balance', 
            'stance_time_percent', 
            'step_length', 
            'vertical_oscillation', 
            'vertical_ratio', 
            'altitude', 
            'temperature'
    ]

    # Obtenir la liste des colonnes restantes
    remaining_cols = [col for col in df.columns if col not in col_order_priority]

    # Créer le nouvel ordre en combinant la priorité et le reste
    new_column_order = [col for col in col_order_priority if col in df.columns] + sorted(remaining_cols)
    
    df = df.reindex(columns=new_column_order)
    
    return df

def add_lap_info(fitfile, df):
    """Ajoute le numéro de lap à chaque timestamp du dataframe"""
    
    if df.empty or 'timestamp' not in df.columns:
        print("DataFrame ou colonne 'timestamp' manquante pour l'ajout des laps.")
        df['lap_number'] = 1  
        return df
    
    # Extraire les données des laps (Lap Messages)
    laps = []
    for lap in fitfile.get_messages('lap'):
        lap_data = {}
        for field in lap:
            lap_data[field.name] = field.value
        laps.append(lap_data)
    
    if not laps:
        print("Aucun lap trouvé dans le fichier .fit. Tous les enregistrements sont assignés au lap 1.")
        df['lap_number'] = 1  # Par défaut, tout est dans le lap 1
        return df
    
    # Trier les laps par start_time et s'assurer qu'il y a un start_time
    laps_sorted = sorted([lap for lap in laps if 'start_time' in lap and lap['start_time']], 
                        key=lambda x: x['start_time'])
    
    if not laps_sorted:
        print("Laps trouvés mais sans 'start_time'. Tous les enregistrements sont assignés au lap 1.")
        df['lap_number'] = 1
        return df

    # Assigner un numéro de lap à chaque enregistrement
    df['lap_number'] = 0
    
    for lap_num, lap in enumerate(laps_sorted, 1):
        lap_start = pd.to_datetime(lap['start_time'])
        
        # Trouver le lap suivant pour définir la fin
        if lap_num < len(laps_sorted):
            # Le lap se termine juste avant le début du lap suivant
            next_lap_start = pd.to_datetime(laps_sorted[lap_num]['start_time'])
        else:
            # Dernier lap - prendre le dernier timestamp du DF comme fin + 1 seconde
            next_lap_start = df['timestamp'].max() + timedelta(seconds=1)
        
        # Assigner le numéro de lap aux enregistrements dans cet intervalle
        mask = (df['timestamp'] >= lap_start) & (df['timestamp'] < next_lap_start)
        df.loc[mask, 'lap_number'] = lap_num
    
    # Gérer les enregistrements au-delà du dernier lap (s'ils existent)
    df.loc[df['lap_number'] == 0, 'lap_number'] = len(laps_sorted)
    
    print(f"{len(laps_sorted)} laps détectés et assignés aux enregistrements")
    
    return df

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_fit.py path/to/file.fit")
        sys.exit(1)
    
    fn = Path(sys.argv[1])
    output_path_csv = Path(__file__).parent.parent.parent / "public" / "activity_data.csv"
    try:
        # Lancement de l'extraction et des traitements
        df = parse_fit(str(fn))

        # S'assurer que le répertoire de destination existe
        output_path_csv.parent.mkdir(parents=True, exist_ok=True)
        
        # Export CSV final
        df.to_csv(output_path_csv, index=False)
        print("Export terminé : activity_data.csv")
        
    except FileNotFoundError:
        print(f"Erreur: Fichier non trouvé à l'emplacement '{fn}'")
        sys.exit(1)
    except RuntimeError as e:
        print(f"Erreur de traitement du fichier .fit: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Une erreur inattendue s'est produite: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()