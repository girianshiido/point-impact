# Point d’impact

**Le défi des paraboles** — Un jeu mathématique en TypeScript et Canvas 2D.

Piloter la courbe **f(x) = a(x − α)² + β** pour traverser des cristaux, placer le sommet et éviter des obstacles. Conçu pour la seconde et la première technologique, sur ordinateur, tablette ou téléphone.

## Essayer immédiatement

Ouvrir **Jouer.html** dans un navigateur récent. Ce fichier autonome est inclus dans l’archive de livraison : aucune installation ni connexion requise. Les possibilités de sauvegarde d’un fichier local varient selon le navigateur ; exporter la progression dans les réglages pour la conserver.

Pour la version installable sur écran d’accueil, servir le dossier `dist/` via HTTPS (ou localhost). L’ouverture directe de `dist/index.html` ne convient pas aux modules JavaScript et aux service workers.

## Le jeu

- Cinq mondes de dix défis : sommet, ouverture, racines, précision, maîtrise.
- Déblocage séquentiel, paramètres fixés selon l’objectif pédagogique.
- Commandes au pas de 0,25, boutons et curseurs, coefficient a toujours non nul.
- Cibles simultanées, sommet imposé distinct des intersections ordinaires.
- Obstacles circulaires : la distance minimale à la parabole est calculée sur x ∈ [−6 ; 6], indépendamment de l’échantillonnage graphique.
- Dernier monde : 45 secondes et six réglages. Un déplacement complet de curseur compte pour un réglage ; chaque bouton ± compte pour un réglage. Le temps continue en arrière-plan.
- 150 étoiles, expérience, douze succès, défi quotidien déterministe à la date locale et entraînement généré sans limite.
- Indices mathématiques, affichage des coordonnées exactes, explication après réussite.
- Sauvegarde locale, export et fusion d’une sauvegarde JSON.
- Sons facultatifs, particules limitées à la réussite et préférence de réduction des mouvements respectée.
- Aucun compte, aucune publicité, aucun service externe en fonctionnement.

### Étoiles

- **3** : première validation, sans indice, en 30 secondes maximum.
- **2** : au plus trois validations et 45 secondes, ou première validation avec indice.
- **1** : toute autre réussite.

Les essais et le temps sont libres dans les quatre premiers mondes. Le meilleur score est conservé. L’expérience est fondée sur les meilleures étoiles de campagne, sans gain artificiel par répétition. La série porte sur les premières réussites de campagne ; une validation incorrecte interrompt la série.

## Développement

Node.js **24 ou supérieur** et npm.

```sh
npm ci
npm run verify
npm run dev
```

Ouvrir `http://localhost:4173`. Le serveur reconstruit les fichiers au lancement ; le relancer après modification.

```sh
npm run build
node scripts/standalone.mjs
```

La production est intégralement statique. TypeScript et jsdom sont seulement des dépendances de développement. La compilation utilise la suppression native des annotations de Node 24 ; `npm run check` réalise séparément la vérification TypeScript stricte.

## Déployer sur GitHub Pages

1. Créer un dépôt nommé `point-impact`, puis y déposer les sources (sans `node_modules/`).
2. Utiliser la branche `main`.
3. Dans **Settings → Pages → Build and deployment → Source**, choisir **GitHub Actions**.
4. Le workflow `.github/workflows/pages.yml` installe les dépendances, vérifie les types, exécute les tests, construit `dist/` et le publie.

Les chemins sont relatifs : le jeu fonctionne sous un sous-répertoire GitHub Pages. Aucune variable secrète ni serveur applicatif n’est nécessaire. Ne pas utiliser de formule de déploiement payante par défaut ; vérifier les possibilités de Pages selon la visibilité du dépôt et le compte.

## Installation et hors ligne

Après la première visite en ligne, attendre **« Prêt hors ligne »**. Sur iPhone/iPad : Safari → Partager → Sur l’écran d’accueil. Sur Android : menu du navigateur → Installer.

La mise à jour du service worker est activée lorsque les anciennes pages sont fermées. Lors d’une évolution des fichiers de production, changer le nom de cache dans `public/sw.js`. Le navigateur peut évincer ses données : l’export de progression reste recommandé pour les conserver durablement.

## Structure

```text
src/engine.ts         Génération et géométrie des niveaux
src/app.ts            Interface, commandes, progression et rendu Canvas
public/              HTML, CSS, icônes, manifeste et service worker
scripts/             Construction, serveur local et fichier autonome
tests/               Tests de géométrie, génération, build et parcours simulé
.github/workflows/   Vérification et déploiement GitHub Pages
```

## Vérifications effectuées

Vérification TypeScript stricte, tests des cinquante niveaux et de 5 000 niveaux générés, comparaison des distances à une référence dense, tests de tangence, objectifs simultanés, sommet imposé, défi quotidien, construction et couverture du cache hors ligne. Le parcours des cinquante niveaux, le déblocage, les succès, la sauvegarde et le budget de réglages sont testés dans un DOM simulé.

**Limite de validation :** le rendu visuel, les gestes tactiles réels, l’installation PWA et la reprise hors ligne n’ont pas encore été contrôlés dans un navigateur réel. Un essai sur iPhone et sur un appareil Android modeste reste nécessaire avant diffusion aux élèves.
