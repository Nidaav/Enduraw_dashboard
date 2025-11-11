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

def determine_lap_nature(lap_num):
    """
    Détermine la nature du lap basée sur la logique personnalisée fournie par l'utilisateur.
    - Laps 1-3: Échauffement
    - Laps 4-19: Série 1 (Alternance Intensité/Récupération, commence par Intensité)
    - Lap 19: Récupération Inter-séries (inclut la dernière récupération de la première série)
    - Laps 20-35: Série 2 (Alternance Intensité/Récupération, commence par Intensité)
    - Lap 35: Retour au calme (inclut la dernière récupération)
    """

    if 1 <= lap_num <= 3:
        return 'Warm-up'

    elif 4 <= lap_num <= 34:
        # Lap 4 est le premier effort (Intensité). 
        # Si (lap_num - 4) est pair (4, 6, 8...), c'est Intensité. 
        # S'il est impair (5, 7, 9...), c'est Récupération.
        if (lap_num - 4) % 2 == 0:
            return 'Intensity'
        else:
            return 'Recovery'
        
    elif lap_num == 35:
        return 'Cool-down'
    
    else:
        return 'Unknown'
    
def parse_fit(ff):
    
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
            'lap_nature', 
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

    # La colonne 'lap_number' est maintenant remplie, on peut appliquer la classification
    df['lap_nature'] = df['lap_number'].apply(determine_lap_nature)
    
    return df

def export_lap_csv(fitfile, output_path):
    """
    Extrait toutes les données des messages 'lap', ajoute les colonnes de lisibilité
    et les exporte dans le fichier activity_data_by_lap.csv.
    """
    laps = []

    columns_to_drop = [
        "avg_cadence_position", "avg_combined_pedal_smoothness", "avg_fractional_cadence", "avg_left_pco", "avg_left_pedal_smoothness", "enhanced_avg_speed", "enhanced_max_speed", "total_ascent", 
        "avg_left_power_phase", "avg_left_power_phase_peak", "avg_left_torque_effectiveness", "avg_power", "avg_power_position", "avg_right_pco", "avg_right_pedal_smoothness", "avg_right_power_phase", "avg_right_power_phase_peak", "avg_right_torque_effectiveness", "avg_stroke_distance", "end_position_lat", "end_position_long", "event_group", "event", "event_type", "first_length_index", "intensity", "lap_trigger", "left_right_balance", "max_cadence_position", "max_fractional_cadence", "max_power", "max_power_position", "max_running_cadence", "max_temperature", "message_index", "normalized_power", "num_active_lengths", "num_lengths", "sport", "stand_count", "start_position_lat", "start_position_long", "sub_sport", "swim_stroke", "time_standing", "total_calories", "total_descent", "total_fat_calories", "total_fractional_cycles", "total_work", "wkt_step_index", "unknown_124", "unknown_125", "unknown_126", "unknown_27", "unknown_28", "unknown_29", "unknown_30", "unknown_70", "unknown_72", "unknown_73", "unknown_90", "unknown_96", "unknown_97"
    ]
    # Parcourir les messages 'lap'
    for lap_num, lap in enumerate(fitfile.get_messages('lap'), 1):
        lap_data = {"lap_number": lap_num}
        for field in lap:
            lap_data[field.name] = field.value
        laps.append(lap_data)

    if not laps:
        print("Avertissement: Aucun lap trouvé pour l'exportation par lap.")
        return

    df_laps = pd.DataFrame(laps)
    
    # # Ajouter la nature du lap basée sur la logique utilisateur
    # if 'lap_number' in df_laps.columns:
    #     df_laps['lap_nature'] = df_laps['lap_number'].apply(determine_lap_nature)
    
    # Conversion des vitesses en km/h
    for speed_col in ['max_speed', 'avg_speed']:
        if speed_col in df_laps.columns:
            # Assurer la conversion numérique avant le calcul
            df_laps[speed_col] = pd.to_numeric(df_laps[speed_col], errors='coerce') 
            df_laps[f'{speed_col}_kmh'] = np.round(df_laps[speed_col] * MS_TO_KMH, 2)

    
    # Conversion du cycle de la cadence en ppm
    if 'avg_running_cadence' in df_laps.columns:
        df_laps['avg_running_cadence'] = df_laps['avg_running_cadence'] * 2
        # df_laps = df_laps.sort_values('start_time').reset_index(drop=True)

    # 8. Suppression des colonnes indésirables
    df_laps = df_laps.drop(columns=columns_to_drop, errors='ignore')

    # Export CSV
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df_laps.to_csv(output_path, index=False)
    return df_laps

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_fit.py path/to/file.fit")
        sys.exit(1)
    
    fn = Path(sys.argv[1])
    # Déterminer les chemins de sortie
    public_dir = Path(__file__).parent.parent.parent / "public"
    output_path_records_csv = public_dir / "activity_data.csv"
    output_path_laps_csv = public_dir / "activity_data_by_lap.csv"

    try:
        # Initialisation du FitFile une seule fois
        ff = FitFile(str(fn))
        # 1. Traitement et export du fichier de RECORDS 
        df = parse_fit(ff)

        # S'assurer que le répertoire de destination existe
        public_dir.mkdir(parents=True, exist_ok=True)
        
        # Export CSV des records
        df.to_csv(output_path_records_csv, index=False)
        print("Export terminé : activity_data")
        
        # 2. Traitement et export du fichier de LAPS
        export_lap_csv(ff, output_path_laps_csv)
        print("Export terminé : activity_data_by_lap")

        
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