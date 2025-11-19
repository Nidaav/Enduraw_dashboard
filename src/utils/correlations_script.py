import pandas as pd
import numpy as np
from pathlib import Path


# --- Configuration et Constantes ---
# Note: Ces constantes doivent correspondre aux caractéristiques de votre session
DISTANCE_EFFORT_M = 200
DISTANCE_RECUP_M = 100
MIN_SPEED_EFFORT_KMH = 15  # Vitesse minimale pour considérer une phase d'effort
# ATTENTION: La colonne 'step_length' n'est pas toujours disponible. Utilisez 'lap_nature' si possible.
# Dans ce script, nous nous basons uniquement sur la distance et la vitesse pour la segmentation heuristique.
# MIN_STEP_LENGTH = 1000  # Longueur de pas minimale pour exclure les arrêts


def load_and_preprocess_data(filepath):
    """
    Charge les données du CSV et effectue le prétraitement initial.
    
    Args:
        filepath (str): Chemin d'accès au fichier CSV.
        
    Returns:
        pd.DataFrame: DataFrame nettoyé et préparé.
    """
    try:
        # Tente de lire le fichier CSV
        df = pd.read_csv(filepath)
    except FileNotFoundError:
        print(f"Erreur: Le fichier {filepath} n'a pas été trouvé.")
        return None

    # Renommage des colonnes pour une meilleure manipulation (retire caractères spéciaux et met en minuscules)
    df.columns = df.columns.str.replace('[^A-Za-z0-9_]+', '', regex=True).str.lower()
    
    # Assurer la présence des colonnes nécessaires (y compris les métriques d'économie de course)
    required_cols = ['distance', 'elapsed_time_s', 'speed_kmh', 'heart_rate', 
                     'cadence_step_per_min', 'stance_time_percent', 'vertical_ratio']

    # Si la colonne 'step_length' est présente, l'ajouter pour l'analyse
    if 'step_length' in df.columns:
        required_cols.append('step_length')
        
    if not all(col in df.columns for col in required_cols):
        missing = [col for col in required_cols if col not in df.columns]
        print(f"Erreur: Colonnes manquantes dans le CSV: {missing}")
        return None

    # Suppression des lignes avec des valeurs manquantes critiques
    df = df.dropna(subset=['speed_kmh', 'heart_rate', 'vertical_ratio'])
    
    return df


def segment_activity(df):
    """
    POINT 1: Préparation des Données et Segmentation
    Identifie et segmente les phases d'effort (200m) et de récupération (100m)
    en attribuant un numéro de Lap et de Série, en se basant sur la distance et 
    les seuils de vitesse/pause.
    
    Args:
        df (pd.DataFrame): DataFrame prétraité.
        
    Returns:
        pd.DataFrame: DataFrame avec les colonnes 'lap_nature', 'lap_number', 'series'.
    """
    
    # Détection des pauses/ralentissements pour marquer la fin d'un cycle 300m
    # Utilisation d'un seuil de vitesse bas comme indicateur de pause/marche
    df['is_resting'] = (df['speed_kmh'] < MIN_SPEED_EFFORT_KMH) 

    df['distance_in_lap'] = df['distance'] - df.iloc[0]['distance']
    
    lap_segments = []
    current_lap_start_index = df.index[0] # Utiliser l'index réel du DataFrame
    lap_counter = 1
    
    for i in df.index[1:]:
        
        distance_since_start = df.loc[i, 'distance'] - df.loc[current_lap_start_index, 'distance']
        
        # Le seuil de 280m est utilisé comme un marqueur pour chercher la pause/fin de la boucle
        if distance_since_start >= (DISTANCE_EFFORT_M + DISTANCE_RECUP_M) - 20: # 280m
            
            # Chercher la pause (is_resting = True) qui marque la fin du 200m + 100m
            potential_rest_indices = df.loc[current_lap_start_index:i, :][
                (df['is_resting']) & 
                (df['distance'] - df.loc[current_lap_start_index, 'distance'] >= (DISTANCE_EFFORT_M + DISTANCE_RECUP_M) - 50)
            ].index
            
            if not potential_rest_indices.empty:
                # Trouver l'indice juste avant la pause pour marquer la fin du lap
                end_index = potential_rest_indices[0] 
                
                # S'assurer que le segment ne soit pas vide
                if end_index > current_lap_start_index:
                    segment_df = df.loc[current_lap_start_index:end_index -1].copy()
                    
                    if not segment_df.empty:
                        # Attribuer la nature du lap (Effort ou Récup)
                        segment_df['lap_nature'] = f"Lap_{lap_counter}"
                        segment_df['lap_number'] = lap_counter
                        
                        # La logique pour les séries (S1: Laps 1-8, S2: Laps 9-16)
                        segment_df['series'] = 1 if lap_counter <= 8 else 2
                        
                        lap_segments.append(segment_df)
                
                # La prochaine lap commence après cette pause
                current_lap_start_index = potential_rest_indices[0]
                lap_counter += 1
                
                if lap_counter > 16: # Arrêter après 16 laps
                    break

    # Recombiner et finaliser
    if not lap_segments:
        print("Avertissement: Aucun segment de lap valide n'a été trouvé. Veuillez ajuster les seuils.")
        return df.assign(lap_number=np.nan, series=np.nan, lap_nature=np.nan)

    df_laps = pd.concat(lap_segments, ignore_index=False)
    # Assurer que les index sont uniques après concaténation et avant de manipuler
    df_laps = df_laps.drop_duplicates(subset=['lap_number', 'elapsed_time_s'])
    
    return df_laps.drop(columns=['distance_in_lap', 'is_resting'], errors='ignore')

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
        if group.empty: continue
            
        # 1. Trouver le point de bascule : environ 200m après le début du Lap
        start_distance = group['distance'].iloc[0]
        
        # Trouver l'indice où la distance est la plus proche de (start_distance + 200m)
        distance_target = start_distance + DISTANCE_EFFORT_M
        
        # Utiliser l'index (timestamp) de la ligne qui a la distance la plus proche de 200m
        effort_end_index_label = (group['distance'] - distance_target).abs().idxmin()
        
        # 2. Séparation
        effort_segment = group.loc[group.index <= effort_end_index_label].copy()
        recovery_segment = group.loc[group.index > effort_end_index_label].copy()
        
        # 3. Calcul de la durée et nettoyage
        
        # Calcul précis de la Durée pour l'Effort (Utilise la première et la dernière horodatation du segment)
        if not effort_segment.empty:
            effort_segment['phase'] = 'Effort_200m'
            effort_segment['duration_s'] = effort_segment['elapsed_time_s'].iloc[-1] - effort_segment['elapsed_time_s'].iloc[0]
            efforts.append(effort_segment)

        # Calcul précis de la Durée pour la Récupération
        if not recovery_segment.empty:
            recovery_segment['phase'] = 'Recovery_100m'
            recovery_segment['duration_s'] = recovery_segment['elapsed_time_s'].iloc[-1] - recovery_segment['elapsed_time_s'].iloc[0]
            recoveries.append(recovery_segment)

    # Concaténation et gestion des DataFrames vides
    df_efforts = pd.concat(efforts, ignore_index=False) if efforts else pd.DataFrame()
    df_recoveries = pd.concat(recoveries, ignore_index=False) if recoveries else pd.DataFrame()
    
    return df_efforts, df_recoveries


# --- Fonctions d'Analyse ---

def analyse_performance_per_repetition(df_efforts):
    """
    POINT 2: Analyse de la Performance par Répétition (200m)
    Agrège les métriques clés pour chaque effort de 200m.
    """
    # Calcul des métriques pour chaque lap de 200m
    lap_metrics = df_efforts.groupby(['lap_number', 'series']).agg(
        # La durée réelle est la différence entre le temps écoulé (elapsed_time_s) maximum et minimum du segment.
        Duration_s=('duration_s', 'max'), # Utiliser max car 'duration_s' est déjà pré-calculée dans split_lap_into_effort_and_recovery
        Avg_Speed_kmh=('speed_kmh', 'mean'),
        Max_Speed_kmh=('speed_kmh', 'max'),
        Max_HR_bpm=('heart_rate', 'max'),
        Avg_Cadence_step_per_min=('cadence_step_per_min', 'mean'),
        Avg_VR=('vertical_ratio', 'mean'),
        Avg_STP_percent=('stance_time_percent', 'mean')
    ).reset_index()

    # Formatage pour correspondre au tableau
    lap_metrics = lap_metrics.round({
        'Duration_s': 1, 'Avg_Speed_kmh': 1, 'Max_Speed_kmh': 1, 
        'Avg_Cadence_step_per_min': 0, 'Avg_VR': 2, 'Avg_STP_percent': 1
    })

    return lap_metrics


def analyse_pacing_strategy(df_efforts, lap_metrics):
    """
    POINT 3: Étude de l'Impact de la Stratégie d'Allure
    """
    # Calcul du Pacing Drift: (Max Speed - Avg Speed) / Avg Speed
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
    """
    recovery_analysis = []
    
    for lap_num, group in df_recoveries.groupby(['lap_number', 'series']):
        if len(group) < 2:
            continue
            
        hr_start_recovery = group['heart_rate'].iloc[0]
        hr_end_recovery = group['heart_rate'].iloc[-1]
        hr_drop = hr_start_recovery - hr_end_recovery
        duration = group['duration_s'].max() # 'max' car la colonne a été remplie avec la durée totale
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
    
    # Renommage des colonnes
    drift_summary.columns = ['S1_Avg', 'S2_Avg', 'Drift_Change', 'Drift_Percent']
    
    return drift_summary.round(3)


def calculate_correlations(lap_metrics):
    """
    POINT 6: Corrélations Pertinentes pour l'Entraînement de Haut Niveau
    Calcule la matrice de corrélation complète et filtre les résultats clés.
    """
    # Exclure les colonnes non numériques ou non pertinentes pour la corrélation
    numeric_metrics = [
        'Duration_s', 
        'Avg_Speed_kmh', 
        'Max_Speed_kmh',
        'Max_HR_bpm', 
        'Avg_Cadence_step_per_min',
        'Avg_VR', 
        'Avg_STP_percent',
        'Pacing_Drift_percent'
    ]
    
    # 1. Calcul de la matrice de corrélation de Pearson
    # Utiliser dropna() pour s'assurer qu'il n'y ait pas de NaN, ce qui ferait échouer corr()
    correlation_matrix = lap_metrics[numeric_metrics].dropna().corr().round(3)
    
    # 2. Filtrage des corrélations clés autour des métriques de performance
    corr_series = correlation_matrix.unstack().sort_values(ascending=False)
    
    # Retirer les auto-corrélations (1.000) et les doubles
    corr_series = corr_series[corr_series.index.get_level_values(0) != corr_series.index.get_level_values(1)]
    # Utiliser ~ pour garder seulement la première occurrence de chaque paire (ex: (A, B) mais pas (B, A))
    corr_series = corr_series[~corr_series.index.map(lambda x: tuple(sorted(x))).duplicated(keep='first')] 

    key_correlations = {}
    
    # Corrélation avec la Durée (Performance). Plus c'est NÉGATIF, plus la métrique fait baisser le temps.
    # On prend les 5 plus négatives (meilleurs prédicteurs de temps rapide)
    key_correlations['Duration_s_Best_Predictors'] = corr_series.loc['Duration_s'].sort_values(ascending=True).head(5)
    
    # Corrélation avec la Vitesse Moyenne (Performance). Plus c'est POSITIF, plus la métrique fait monter la vitesse.
    # On prend les 5 plus positives (meilleurs prédicteurs de vitesse élevée)
    key_correlations['Avg_Speed_kmh_Best_Predictors'] = corr_series.loc['Avg_Speed_kmh'].sort_values(ascending=False).head(5)
    
    # Corrélation avec la FC Max (Fatigue). Qu'est-ce qui cause le plus l'augmentation de la FC ?
    # On prend les 5 plus positives (ce qui monte le plus avec la FC)
    key_correlations['Max_HR_bpm_Best_Correlates'] = corr_series.loc['Max_HR_bpm'].sort_values(ascending=False).head(5)

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
    print("Métriques par Lap d'Effort (200m) :")
    print(lap_metrics.to_markdown(index=False, numalign="left", stralign="left"))

    # 3. Stratégie d'Allure
    print("\n--- 3. Analyse de la Stratégie d'Allure ---")
    pacing_summary, lap_metrics_with_pacing = analyse_pacing_strategy(df_efforts, lap_metrics.copy())
    print("Synthèse de la Stratégie d'Allure :")
    print(pacing_summary.to_markdown(index=False, numalign="left", stralign="left"))

    # 4. Qualité de la Récupération
    print("\n--- 4. Analyse de la Qualité de la Récupération (100m) ---")
    series_recovery_summary, _ = analyse_recovery_quality(df_recoveries)
    print("Synthèse de la Récupération par Série :")
    print(series_recovery_summary.to_markdown(index=False, numalign="left", stralign="left"))

    # 5. Drifts Globaux
    print("\n--- 5. Analyse des Drifts Globaux (S1 vs S2) ---")
    global_drifts = analyse_global_drifts(lap_metrics_with_pacing)
    print("Drifts Globaux (S2 vs S1) :")
    print(global_drifts.to_markdown(numalign="left", stralign="left"))

    # 6. Corrélations étendues
    print("\n--- 6. Analyse Complète des Corrélations de Pearson ---")
    key_correlations, correlation_matrix = calculate_correlations(lap_metrics_with_pacing)
    
    print("\nMATRICE DE CORRÉLATION COMPLÈTE (r) :")
    print(correlation_matrix.to_markdown(numalign="left", stralign="left"))
    
    print("\n--- RÉSULTATS DES CORRÉLATIONS CLÉS ---")
    
    # Affichage des résultats filtrés
    print("\nCorrélations avec la Durée (Performance - Négative est Meilleure) :")
    # Utiliser to_frame().reset_index() pour afficher les métriques corrélées en colonnes
    df_duration_corr = key_correlations['Duration_s_Best_Predictors'].to_frame('Coefficient_r').reset_index()
    df_duration_corr.columns = ['Métriques', 'Coefficient_r']
    print(df_duration_corr.to_markdown(index=False, numalign="left", stralign="left"))
    
    print("\nCorrélations avec la Vitesse Moyenne (Performance - Positive est Meilleure) :")
    df_speed_corr = key_correlations['Avg_Speed_kmh_Best_Predictors'].to_frame('Coefficient_r').reset_index()
    df_speed_corr.columns = ['Métriques', 'Coefficient_r']
    print(df_speed_corr.to_markdown(index=False, numalign="left", stralign="left"))
    
    print("\nCorrélations avec la FC Max (Indicateur de FATIGUE - Positive est liée à l'effort) :")
    df_hr_corr = key_correlations['Max_HR_bpm_Best_Correlates'].to_frame('Coefficient_r').reset_index()
    df_hr_corr.columns = ['Métriques', 'Coefficient_r']
    print(df_hr_corr.to_markdown(index=False, numalign="left", stralign="left"))
    
    print("\nAnalyse de corrélation terminée avec succès.")
    return lap_metrics, global_drifts, series_recovery_summary, key_correlations


# --- EXÉCUTION ---
# Remplacez 'activity_data.csv' par le nom de votre fichier
if __name__ == '__main__':
    # Définir le chemin d'accès au fichier (ajusté pour l'environnement d'exécution)
    # Assurez-vous que le fichier 'activity_data.csv' est bien accessible dans le répertoire public
    try:
        csv_path = Path(__file__).parent.parent.parent / "public" / "activity_data.csv"
        # Ajout d'une vérification basique du chemin pour l'exécution locale si nécessaire
        if not csv_path.exists():
            csv_path = 'activity_data.csv' # Tente le chemin local si le chemin absolu échoue

        run_full_analysis(csv_path)
    except NameError:
        # Cas où __file__ n'est pas défini (ex: exécution directe dans certains shells)
        run_full_analysis('activity_data.csv')