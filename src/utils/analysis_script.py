import sys
import pandas as pd
import numpy as np
from pathlib import Path


# --- Configuration et Constantes ---
# Note: Ces constantes doivent correspondre aux caractéristiques de votre session
DISTANCE_EFFORT_M = 200
DISTANCE_RECUP_M = 100
MIN_SPEED_EFFORT_KMH = 15  # Vitesse minimale pour considérer une phase d'effort
MIN_STEP_LENGTH = 1000  # Longueur de pas minimale pour exclure les arrêts


def load_and_preprocess_data(filepath):
    """
    Charge les données du CSV et effectue le prétraitement initial.
    
    Args:
        filepath (str): Chemin d'accès au fichier CSV.
        
    Returns:
        pd.DataFrame: DataFrame nettoyé et préparé.
    """
    try:
        df = pd.read_csv(filepath)
    except FileNotFoundError:
        print(f"Erreur: Le fichier {filepath} n'a pas été trouvé.")
        return None

    # Renommage des colonnes pour une meilleure manipulation
    df.columns = df.columns.str.replace('[^A-Za-z0-9_]+', '', regex=True).str.lower()

    # Suppression des lignes avec des valeurs manquantes critiques
    df = df.dropna(subset=['speed_kmh', 'heart_rate'])
    
    return df


def segment_activity(df):
    """
    POINT 1: Préparation des Données et Segmentation
    Identifie et segmente les phases d'effort (200m) et de récupération (100m)
    en attribuant un numéro de Lap et de Série.
    
    Args:
        df (pd.DataFrame): DataFrame prétraité.
        
    Returns:
        pd.DataFrame: DataFrame avec les colonnes 'lap_nature', 'lap_number', 'series'.
    """
    # 1. Identifier les phases d'arrêt/marche lente (utilisé comme indicateur de fin de lap)
    # Détecte les moments où la vitesse est basse et la longueur de pas est faible.
    df['is_resting'] = (df['speed_kmh'] < MIN_SPEED_EFFORT_KMH) | (df['step_length'] < MIN_STEP_LENGTH)

    # 2. Détection des changements de lap/série basés sur la distance et les pauses
    df['distance_in_lap'] = df['distance'] - df.iloc[0]['distance']
    
    lap_segments = []
    current_lap_start_index = 0
    lap_counter = 1
    
    # Heuristique basée sur la distance parcourue et le temps de pause
    for i in range(1, len(df)):
        # Vérifie si la distance depuis le début du lap est proche de 300m (200m effort + 100m récup)
        distance_since_start = df.iloc[i]['distance'] - df.iloc[current_lap_start_index]['distance']
        
        # Le seuil de 280m est utilisé comme un marqueur pour chercher la pause/fin de la boucle
        if distance_since_start >= 280:
            
            # Chercher la pause (is_resting = True) qui marque la fin du 200m + 100m
            # Nous cherchons la première pause significative APRÈS 280m
            potential_rest_indices = df.loc[current_lap_start_index:i, :][
                (df['is_resting']) & 
                (df['distance'] - df.iloc[current_lap_start_index]['distance'] >= 280)
            ].index
            
            if not potential_rest_indices.empty:
                end_index = potential_rest_indices[0] - 1 # Fin de l'effort/récup avant la pause
                
                segment_df = df.loc[current_lap_start_index:end_index].copy()
                
                # Attribuer la nature du lap (Effort ou Récup)
                # Nous attribuons tout le segment à l'effort + récup de ce lap
                segment_df['lap_nature'] = f"Lap_{lap_counter}"
                segment_df['lap_number'] = lap_counter
                
                # La logique pour les séries (S1: Laps 1-8, S2: Laps 9-16)
                segment_df['series'] = 1 if lap_counter <= 8 else 2
                
                lap_segments.append(segment_df)
                
                current_lap_start_index = potential_rest_indices[0]
                lap_counter += 1
                
                if lap_counter > 16: # Arrêter après 16 laps
                    break

    # Recombiner et finaliser
    if not lap_segments:
        print("Avertissement: Aucun segment de lap valide n'a été trouvé. Veuillez ajuster les seuils.")
        return df.assign(lap_number=np.nan, series=np.nan, lap_nature=np.nan)

    df_laps = pd.concat(lap_segments, ignore_index=True)
    df_laps = df_laps.set_index(df_laps['timestamp']).drop(columns=['distance_in_lap', 'is_resting'], errors='ignore')
    
    return df_laps

def split_lap_into_effort_and_recovery(df_laps):
    """
    Sous-segmente chaque Lap (300m) en Effort (200m) et Récupération (100m).
    
    Args:
        df_laps (pd.DataFrame): DataFrame segmenté par Lap.
        
    Returns:
        tuple: (df_efforts, df_recoveries)
    """
    efforts = []
    recoveries = []
    
    for lap_num, group in df_laps.groupby('lap_number'):
        # 1. Trouver le point de bascule : environ 200m après le début du Lap
        start_distance = group['distance'].iloc[0]
        
        # Trouver l'indice où la distance est la plus proche de (start_distance + 200m)
        effort_end_index = (group['distance'] - (start_distance + DISTANCE_EFFORT_M)).abs().idxmin()
        
        # 2. Séparation
        effort_segment = group.loc[:effort_end_index].copy()
        recovery_segment = group.loc[effort_end_index + 1:].copy()
        
        # 3. Calcul de la durée et nettoyage
        if not effort_segment.empty:
            effort_segment['phase'] = 'Effort_200m'
            effort_segment['duration_s'] = effort_segment['elapsed_time_s'].iloc[-1] - effort_segment['elapsed_time_s'].iloc[0]
            efforts.append(effort_segment)

        if not recovery_segment.empty:
            recovery_segment['phase'] = 'Recovery_100m'
            recovery_segment['duration_s'] = recovery_segment['elapsed_time_s'].iloc[-1] - recovery_segment['elapsed_time_s'].iloc[0]
            recoveries.append(recovery_segment)

    return pd.concat(efforts), pd.concat(recoveries)


# --- Fonctions d'Analyse ---

def analyse_performance_per_repetition(df_efforts):
    """
    POINT 2: Analyse de la Performance par Répétition (200m)
    Agrège les métriques clés pour chaque effort de 200m.
    
    Returns:
        pd.DataFrame: Tableau agrégé par lap.
    """
    # Calcul des métriques pour chaque lap de 200m
    lap_metrics = df_efforts.groupby(['lap_number', 'series']).agg(
        Duration_s=('duration_s', 'max'),
        Avg_Speed_kmh=('speed_kmh', 'mean'),
        Max_Speed_kmh=('speed_kmh', 'max'),
        Max_HR_bpm=('heart_rate', 'max'),
        Avg_Cadence_step_per_min=('cadence_step_per_min', 'mean'),
        Avg_VR=('vertical_ratio', 'mean'),
        Avg_STP_percent=('stance_time_percent', 'mean')
    ).reset_index()

    # Formatage pour correspondre au tableau de la réponse précédente
    lap_metrics = lap_metrics.round({
        'Duration_s': 1, 'Avg_Speed_kmh': 1, 'Max_Speed_kmh': 1, 
        'Avg_Cadence_step_per_min': 0, 'Avg_VR': 2, 'Avg_STP_percent': 1
    })

    return lap_metrics


def analyse_pacing_strategy(df_efforts, lap_metrics):
    """
    POINT 3: Étude de l'Impact de la Stratégie d'Allure
    Analyse le profil de vitesse (départ rapide vs progressif).
    On compare la vitesse Max et la vitesse Moyenne pour quantifier le 'Pacing Drift'.
    """
    # Calcul du Pacing Drift: (Max Speed - Avg Speed) / Avg Speed
    # Un drift élevé indique un départ rapide suivi d'un ralentissement.
    lap_metrics['Pacing_Drift_percent'] = ((lap_metrics['Max_Speed_kmh'] - lap_metrics['Avg_Speed_kmh']) / lap_metrics['Avg_Speed_kmh']) * 100
    
    # On peut catégoriser les laps pour l'analyse
    lap_metrics['Pacing_Style'] = np.where(
        lap_metrics['Pacing_Drift_percent'] > lap_metrics['Pacing_Drift_percent'].median(), 
        'Rapid_Start', 
        'Progressive_Start'
    )
    
    pacing_summary = lap_metrics.groupby('Pacing_Style').agg(
        Nb_Laps=('lap_number', 'count'),
        Avg_Duration_s=('Duration_s', 'mean'),
        Avg_Max_HR=('Max_HR_bpm', 'mean'),
        Avg_VR=('Avg_VR', 'mean')
    ).round(2).reset_index()

    return pacing_summary, lap_metrics


def analyse_recovery_quality(df_recoveries):
    """
    POINT 4: Analyse de la Qualité de la Récupération (100m)
    Mesure la dérive du rythme cardiaque pendant la récupération.
    """
    recovery_analysis = []
    
    for lap_num, group in df_recoveries.groupby(['lap_number', 'series']):
        if len(group) < 2:
            continue
            
        # HR au début de la récup (HR_End_Effort)
        hr_start_recovery = group['heart_rate'].iloc[0]
        # HR à la fin de la récup (HR_End_Recovery)
        hr_end_recovery = group['heart_rate'].iloc[-1]
        
        # Réduction de la FC (FC_Drop)
        hr_drop = hr_start_recovery - hr_end_recovery
        
        # Durée de la récupération (pour normalisation)
        duration = group['duration_s'].max() # 'max' car la colonne a été remplie avec la durée totale
        
        # Taux de récupération (bpm/seconde)
        recovery_rate = hr_drop / duration if duration > 0 else 0
        
        recovery_analysis.append({
            'lap_number': lap_num[0],
            'series': lap_num[1],
            'HR_Start_Recovery_bpm': hr_start_recovery,
            'HR_End_Recovery_bpm': hr_end_recovery,
            'HR_Drop_bpm': hr_drop,
            'Recovery_Rate_bpm_s': recovery_rate
        })

    df_recovery_analysis = pd.DataFrame(recovery_analysis).round(2)
    
    # Agrégation par série
    series_recovery_summary = df_recovery_analysis.groupby('series').agg(
        Avg_HR_Start=('HR_Start_Recovery_bpm', 'mean'),
        Avg_HR_End=('HR_End_Recovery_bpm', 'mean'),
        Avg_Recovery_Rate=('Recovery_Rate_bpm_s', 'mean')
    ).round(2).reset_index()

    return series_recovery_summary, df_recovery_analysis


def analyse_global_drifts(lap_metrics):
    """
    POINT 5: Analyse des Drifts Globaux (Comparaison S1 vs S2)
    Compare la moyenne des métriques entre la Série 1 et la Série 2.
    """
    drift_summary = lap_metrics.groupby('series').agg(
        Avg_Duration_s=('Duration_s', 'mean'),
        Avg_Speed_kmh=('Avg_Speed_kmh', 'mean'),
        Avg_Max_HR_bpm=('Max_HR_bpm', 'mean'),
        Avg_VR=('Avg_VR', 'mean'),
        Avg_STP_percent=('Avg_STP_percent', 'mean')
    ).T

    # Calcul du Drift (S2 - S1) / S1 * 100 pour les %
    drift_summary['Drift_Change'] = drift_summary[2] - drift_summary[1]
    drift_summary['Drift_Percent'] = (drift_summary['Drift_Change'] / drift_summary[1]) * 100
    
    return drift_summary.round(3)


def calculate_correlations(lap_metrics):
    """
    POINT 6: Corrélations Pertinentes pour l'Entraînement de Haut Niveau
    Calcule les coefficients de corrélation entre les métriques clés.
    """
    metrics_to_correlate = [
        'Duration_s', 
        'Avg_Speed_kmh', 
        'Max_HR_bpm', 
        'Avg_VR', 
        'Avg_STP_percent'
    ]
    
    correlation_matrix = lap_metrics[metrics_to_correlate].corr()
    
    # Extraire les corrélations clés
    key_correlations = {
        # Corrélation performance/économie (plus elle est négative, meilleure est l'économie pour la même vitesse)
        'Speed_vs_VR': correlation_matrix.loc['Avg_Speed_kmh', 'Avg_VR'],
        # Corrélation performance/fatigue cardiaque (plus elle est positive, plus la FC est coûteuse)
        'Speed_vs_MaxHR': correlation_matrix.loc['Avg_Speed_kmh', 'Max_HR_bpm'],
        # Corrélation entre l'économie et la fatigue (comment l'économie se dégrade avec l'effort)
        'VR_vs_MaxHR': correlation_matrix.loc['Avg_VR', 'Max_HR_bpm'],
    }
    
    return key_correlations, correlation_matrix


def run_full_analysis(filepath):
    """
    Exécute l'analyse complète en séquençant tous les points.
    """
    print("Démarrage de l'analyse complète...")
    df = load_and_preprocess_data(filepath)
    if df is None:
        return

    # 1. Segmentation
    print("\n--- 1. Segmentation (Laps 300m) ---")
    df_laps = segment_activity(df)
    df_efforts, df_recoveries = split_lap_into_effort_and_recovery(df_laps)
    
    if df_efforts.empty:
        print("Erreur: Impossible de segmenter en efforts et récupérations. Veuillez vérifier les données ou les seuils.")
        return

    # 2. Analyse de Performance (200m)
    print("\n--- 2. Analyse de la Performance par Répétition (200m) ---")
    lap_metrics = analyse_performance_per_repetition(df_efforts)
    print(lap_metrics)

    # 3. Stratégie d'Allure
    print("\n--- 3. Analyse de la Stratégie d'Allure ---")
    pacing_summary, lap_metrics_with_pacing = analyse_pacing_strategy(df_efforts, lap_metrics.copy())
    print(pacing_summary)

    # 4. Qualité de la Récupération
    print("\n--- 4. Analyse de la Qualité de la Récupération (100m) ---")
    series_recovery_summary, _ = analyse_recovery_quality(df_recoveries)
    print(series_recovery_summary)

    # 5. Drifts Globaux
    print("\n--- 5. Analyse des Drifts Globaux (S1 vs S2) ---")
    global_drifts = analyse_global_drifts(lap_metrics_with_pacing)
    print(global_drifts)

    # 6. Corrélations
    print("\n--- 6. Corrélations Pertinentes ---")
    key_correlations, _ = calculate_correlations(lap_metrics_with_pacing)
    print(key_correlations)
    
    print("\nAnalyse terminée avec succès.")
    return lap_metrics, global_drifts, series_recovery_summary, key_correlations


# --- EXÉCUTION ---
# Remplacez 'activity_data.csv' par le nom de votre fichier
if __name__ == '__main__':
  # fn = Path(sys.argv[1])
  csv_path = Path(__file__).parent.parent.parent / "public" / "activity_data.csv"
  run_full_analysis(csv_path)