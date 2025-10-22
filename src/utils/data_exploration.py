import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

# --- 1. Chargement et Préparation des Données ---

# Nom du fichier CSV (il doit se trouver dans le même répertoire que le script)
file_path = './public/activity_data.csv'
try:
    df = pd.read_csv(file_path)
except FileNotFoundError:
    print(f"Erreur : Le fichier {file_path} n'a pas été trouvé.")
    exit()

# Renommage des colonnes pour la lisibilité
df = df.rename(columns={
    'speed_kmh': 'Vitesse (km/h)',
    'heart_rate': 'FC',
    'cadence_step_per_min': 'Cadence (pas/min)',
    'stance_time': 'Temps de Contact (ms)',
    'step_length': 'Longueur de Foulée (mm)',
    'vertical_ratio': 'Ratio Vertical',
    'distance': 'Distance (m)',
    'altitude': 'Altitude (m)',
    'temperature': 'Température (°C)',
    'stance_time_balance': 'Équilibre T. Contact (%)'
})

# Conversion des types de données et nettoyage
# S'assurer que les colonnes clés sont numériques
numerical_cols = ['Vitesse (km/h)', 'FC', 'Cadence (pas/min)', 'Temps de Contact (ms)',
                  'Longueur de Foulée (mm)', 'Ratio Vertical', 'Distance (m)',
                  'Altitude (m)', 'Température (°C)', 'Équilibre T. Contact (%)']

for col in numerical_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Filtrage des arrêts : on ne garde que les moments où la course est active
# (typiquement Vitesse > 2 km/h pour éliminer les pauses ou les faibles allures de marche)
df_running = df[df['Vitesse (km/h)'] > 2].copy()

print(f"Données brutes : {len(df)} lignes")
print(f"Données de course filtrées : {len(df_running)} lignes\n")


# --- 2. Calcul et Affichage de la Matrice de Corrélation ---

# Sélection des métriques les plus pertinentes pour la matrice
metrics = [
    'Vitesse (km/h)',
    'FC',
    'Cadence (pas/min)',
    'Temps de Contact (ms)',
    'Longueur de Foulée (mm)',
    'Ratio Vertical',
    'Distance (m)',
    'Altitude (m)',
    'Température (°C)'
]

correlation_matrix = df_running[metrics].corr()

print("--- Matrice de Corrélation (Coefficient de Pearson) ---\n")
print(correlation_matrix.round(2))

# Visualisation de la matrice
plt.figure(figsize=(10, 8))
sns.heatmap(
    correlation_matrix,
    annot=True,        # Afficher les valeurs numériques
    cmap='coolwarm',   # Palette de couleurs
    fmt=".2f",         # Formatage des nombres
    linewidths=.5,     # Espacement
    cbar_kws={'label': 'Coefficient de Corrélation'}
)
plt.title("Matrice de Corrélation des Métriques de Course")
plt.show()


# --- 3. Visualisation des Corrélations Clés (Nuages de Points) ---

key_correlations = [
    # 1. Effort Cardiaque vs Vitesse
    {'x': 'Vitesse (km/h)', 'y': 'FC', 'title': 'Efficacité Cardiaque : Vitesse vs FC'},
    # 2. Efficacité vs Technique (Temps de Contact)
    {'x': 'Vitesse (km/h)', 'y': 'Temps de Contact (ms)', 'title': 'Efficacité : Vitesse vs Temps de Contact au Sol'},
    # 3. Économie de Course
    {'x': 'Vitesse (km/h)', 'y': 'Ratio Vertical', 'title': 'Économie de Course : Vitesse vs Ratio Vertical'},
    # 4. Impact de la Fatigue (Dérive Cardiaque)
    {'x': 'Distance (m)', 'y': 'FC', 'title': 'Dérive Cardiaque : Distance vs FC (Effet de la Fatigue)'}
]

plt.figure(figsize=(15, 12))
for i, corr in enumerate(key_correlations):
    plt.subplot(2, 2, i + 1)
    sns.scatterplot(data=df_running, x=corr['x'], y=corr['y'], alpha=0.6)
    
    # Optionnel : Ajout d'une ligne de régression pour mieux voir la tendance
    sns.regplot(data=df_running, x=corr['x'], y=corr['y'], scatter=False, color='red')
    
    plt.title(corr['title'])
    plt.xlabel(corr['x'])
    plt.ylabel(corr['y'])
    plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()