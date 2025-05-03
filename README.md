# EduMap Bénin

Plateforme citoyenne pour localiser et soutenir les écoles en besoin au Bénin.

## Fonctionnalités

- Carte interactive des écoles
- Système de donation via PayPal
- Formulaire d'ajout d'écoles
- Interface responsive
- Filtrage des écoles par statut, besoins et région

## Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/edumap-benin.git
cd edumap-benin

# Installer les dépendances
npm install

# Compiler le projet
npm run build

# Démarrer le serveur de développement
npm start
```

## Structure du projet

```
root/
├── dist/          # Dossier de build
│   ├── js/        # JavaScript compilé
│   └── assets/    # Images et ressources
├── src/           # Sources TypeScript
├── about.html     # Pages supplémentaires
├── package.json   # Configuration projet
└── tsconfig.json  # Configuration TypeScript
```

## Configuration PayPal

1. Créez un compte développeur PayPal
2. Obtenez votre Client ID
3. Remplacez `YOUR_PAYPAL_CLIENT_ID` dans `index.html` par votre Client ID

## Déploiement

Le site est automatiquement déployé sur GitHub Pages à chaque push sur la branche main.

## Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amelioration`)
3. Committez vos changements (`git commit -am 'Ajout de fonctionnalité'`)
4. Push sur la branche (`git push origin feature/amelioration`)
5. Créez une Pull Request

## Licence

MIT 