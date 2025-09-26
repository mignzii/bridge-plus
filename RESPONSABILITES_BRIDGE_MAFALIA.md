# 📋 RESPONSABILITÉS - Bridge+ ↔ Mafalia

## 🎯 Vue d'ensemble

**Document détaillant les responsabilités exactes** de chaque partie dans l'intégration Bridge+ ↔ Mafalia.

**Version :** 1.0  
**Date :** 27 Janvier 2025

---

## 🔐 AUTHENTIFICATION

### **Bridge+ (Responsabilités)**
- ✅ **Valider le token** `mafalia-api-token-2025` sur toutes les requêtes
- ✅ **Rejeter les requêtes** sans token ou avec token invalide
- ✅ **Logger les tentatives** d'authentification échouées
- ✅ **Maintenir la sécurité** du token d'accès

### **Mafalia (Responsabilités)**
- ✅ **Inclure le token** dans tous les headers : `Authorization: Bearer mafalia-api-token-2025`
- ✅ **Gérer la rotation** du token si nécessaire
- ✅ **Ne pas exposer** le token dans les logs

---

## 📡 API ENDPOINTS

### **1. Synchronisation Restaurant & Catégories**

#### **Bridge+ (Responsabilités)**
- ✅ **Créer/mettre à jour** le restaurant dans la base de données
- ✅ **Créer/mettre à jour** les catégories associées
- ✅ **Générer des IDs Bridge+** uniques pour restaurant et catégories
- ✅ **Retourner le mapping** mafalia_id → bridge_id
- ✅ **Valider les données** reçues (nom_restaurant, statut, etc.)
- ✅ **Gérer les erreurs** de base de données

#### **Mafalia (Responsabilités)**
- ✅ **Envoyer les données** restaurant et catégories
- ✅ **Valider les données** avant envoi (nom_restaurant max 100 chars, statut enum)
- ✅ **Sauvegarder le mapping** retourné par Bridge+
- ✅ **Gérer les erreurs** de validation

### **2. Synchronisation Produits par Lots**

#### **Bridge+ (Responsabilités)**
- ✅ **Traiter un lot** de produits (max 30 produits)
- ✅ **Valider chaque produit** du lot
- ✅ **Créer/mettre à jour** les produits dans la base de données
- ✅ **Générer des IDs Bridge+** uniques pour les produits
- ✅ **Retourner le mapping** mafalia_id → bridge_id
- ✅ **Gérer les erreurs** de validation et base de données
- ✅ **Maintenir la cohérence** des données

#### **Mafalia (Responsabilités)**
- ✅ **Diviser les produits** en lots selon la configuration
- ✅ **Respecter la taille** maximale de 30 produits par lot
- ✅ **Inclure les IDs Bridge+** du restaurant et des catégories
- ✅ **Valider les données** avant envoi
- ✅ **Gérer les retry** en cas d'erreur
- ✅ **Respecter les délais** entre les lots

### **3. Statut de Synchronisation**

#### **Bridge+ (Responsabilités)**
- ✅ **Calculer le statut** de synchronisation du restaurant
- ✅ **Retourner les métriques** (batches traités, produits totaux, etc.)
- ✅ **Maintenir l'historique** des synchronisations

#### **Mafalia (Responsabilités)**
- ✅ **Vérifier le statut** avant de commencer une nouvelle synchronisation
- ✅ **Gérer les synchronisations** incomplètes

---

## 📊 CONFIGURATION DES LOTS

### **Bridge+ (Responsabilités)**
- ✅ **Accepter les lots** jusqu'à 30 produits
- ✅ **Rejeter les lots** trop volumineux avec erreur `BATCH_TOO_LARGE`
- ✅ **Maintenir les performances** pour traiter les lots rapidement

### **Mafalia (Responsabilités)**
- ✅ **Optimiser la taille** des lots selon le volume :
  - ≤ 50 produits : 10 produits par lot
  - 51-200 produits : 20 produits par lot
  - 201-500 produits : 25 produits par lot
  - 500+ produits : 30 produits par lot
- ✅ **Respecter les délais** entre les lots :
  - ≤ 50 produits : 1000ms
  - 51-200 produits : 800ms
  - 201-500 produits : 600ms
  - 500+ produits : 500ms
- ✅ **Gérer les timeouts** (2 minutes par lot)

---

## 🔄 GESTION DES ERREURS

### **Bridge+ (Responsabilités)**
- ✅ **Retourner des codes d'erreur** standardisés
- ✅ **Fournir des messages** d'erreur clairs
- ✅ **Logger toutes les erreurs** pour debugging
- ✅ **Maintenir la disponibilité** de l'API

### **Mafalia (Responsabilités)**
- ✅ **Implémenter retry automatique** avec backoff exponentiel
- ✅ **Gérer 5 tentatives** maximum par requête
- ✅ **Respecter les délais** : 2s, 4s, 8s, 16s, 32s
- ✅ **Logger les erreurs** et tentatives de retry
- ✅ **Gérer les timeouts** (2 minutes pour gros volumes)

---

## 📋 VALIDATION DES DONNÉES

### **Bridge+ (Responsabilités)**
- ✅ **Valider les données** reçues selon les contraintes
- ✅ **Rejeter les données** invalides avec erreur `VALIDATION_ERROR`
- ✅ **Maintenir la cohérence** des données en base

### **Mafalia (Responsabilités)**
- ✅ **Valider les données** avant envoi :
  - `nom_produit` : max 100 chars, requis
  - `prix` : 0-1000000, requis
  - `description` : max 200 chars (optionnel)
  - `image` : URL valide, max 500 chars (optionnel)
  - `note` : 0-5 (optionnel)
- ✅ **Tronquer les descriptions** à 200 caractères
- ✅ **Nettoyer les données** avant envoi

---

## 🚀 PERFORMANCE

### **Bridge+ (Responsabilités)**
- ✅ **Maintenir temps de réponse** < 2 secondes par lot
- ✅ **Optimiser la base de données** avec index appropriés
- ✅ **Implémenter le cache** pour améliorer les performances
- ✅ **Maintenir taux de succès** > 95%
- ✅ **Surveiller les métriques** de performance

### **Mafalia (Responsabilités)**
- ✅ **Respecter les délais** entre les lots
- ✅ **Optimiser la taille** des lots selon le volume
- ✅ **Gérer les timeouts** et retry
- ✅ **Surveiller les performances** de synchronisation

---

## 🔐 SÉCURITÉ

### **Bridge+ (Responsabilités)**
- ✅ **Implémenter rate limiting** :
  - 100 requêtes/minute par token
  - 10 lots/minute par restaurant
  - 1000 produits/minute par restaurant
- ✅ **Logger toutes les requêtes** pour audit
- ✅ **Maintenir la sécurité** des données

### **Mafalia (Responsabilités)**
- ✅ **Respecter les limites** de rate limiting
- ✅ **Inclure User-Agent** : `Mafalia-POS/1.0`
- ✅ **Ne pas exposer** les tokens dans les logs
- ✅ **Maintenir la sécurité** des communications

---

## 📊 MONITORING

### **Bridge+ (Responsabilités)**
- ✅ **Fournir métriques** de synchronisation :
  - `restaurantId`, `totalProducts`, `totalBatches`
  - `processingTime`, `successRate`, `errorCount`
  - `lastSyncTime`
- ✅ **Logger les synchronisations** au format standardisé
- ✅ **Maintenir un dashboard** de monitoring
- ✅ **Alerter en cas** de problèmes

### **Mafalia (Responsabilités)**
- ✅ **Logger les synchronisations** au format standardisé :
  - `timestamp`, `level`, `service`
  - `restaurantId`, `batchId`, `action`
  - `productsCount`, `processingTime`, `status`
- ✅ **Surveiller les performances** de synchronisation
- ✅ **Alerter en cas** de problèmes

---

## 🧪 TESTS

### **Bridge+ (Responsabilités)**
- ✅ **Tests de performance** :
  - 43 produits → < 8 secondes
  - 500 produits → < 18 secondes
  - 1000+ produits → < 25 secondes
- ✅ **Tests de charge** : 10 restaurants simultanés
- ✅ **Tests de validation** des données
- ✅ **Tests de gestion d'erreurs**

### **Mafalia (Responsabilités)**
- ✅ **Tests de retry** et gestion d'erreurs
- ✅ **Tests de validation** des données
- ✅ **Tests de charge** avec 500 produits
- ✅ **Tests de performance** de synchronisation

---

## 📅 PLAN D'IMPLÉMENTATION

### **Phase 1 : API de base (Semaine 1)**

#### **Bridge+**
- ✅ Implémenter endpoint `/sync/restaurant`
- ✅ Implémenter endpoint `/sync/products/batch`
- ✅ Ajouter validation des données
- ✅ Implémenter gestion d'erreurs basique

#### **Mafalia**
- ✅ Développer client de synchronisation basique
- ✅ Implémenter envoi des données restaurant/catégories
- ✅ Implémenter envoi des lots de produits

### **Phase 2 : Optimisations (Semaine 2)**

#### **Bridge+**
- ✅ Ajouter index de base de données
- ✅ Implémenter compression gzip
- ✅ Optimiser les performances

#### **Mafalia**
- ✅ Optimiser la taille des lots
- ✅ Implémenter retry automatique
- ✅ Optimiser les délais entre lots

### **Phase 3 : Performance (Semaine 3)**

#### **Bridge+**
- ✅ Implémenter monitoring avancé
- ✅ Ajouter tests de performance
- ✅ Optimiser la base de données

#### **Mafalia**
- ✅ Implémenter tests de charge
- ✅ Optimiser les performances
- ✅ Ajouter monitoring

---

## 🎯 CRITÈRES DE SUCCÈS

### **Performance**
- ✅ **43 produits** : < 8 secondes
- ✅ **500 produits** : < 18 secondes
- ✅ **1000+ produits** : < 25 secondes
- ✅ **Taux de succès** : > 95%

### **Fiabilité**
- ✅ **Retry automatique** en cas d'erreur
- ✅ **Gestion des timeouts** robuste
- ✅ **Logs détaillés** pour debugging
- ✅ **Monitoring** en temps réel

### **Scalabilité**
- ✅ **Support** de 1000+ produits
- ✅ **Traitement** de 10 restaurants simultanés
- ✅ **Base de données** optimisée

---

## 📞 SUPPORT

### **Bridge+ (Responsabilités)**
- ✅ **Fournir support technique** pour les APIs
- ✅ **Maintenir la documentation** à jour
- ✅ **Répondre aux incidents** dans les 2 heures
- ✅ **Fournir status page** pour la disponibilité

### **Mafalia (Responsabilités)**
- ✅ **Fournir support technique** pour l'intégration
- ✅ **Tester les nouvelles versions** des APIs
- ✅ **Signaler les problèmes** rapidement
- ✅ **Maintenir la compatibilité** avec les APIs

---

## 🚨 URGENT

**Ces responsabilités doivent être implémentées dans les 2 semaines pour supporter la synchronisation de 500+ produits sans timeout !**

**Performance actuelle :** Timeout après 30s  
**Performance cible :** 18s pour 500 produits

**Action requise :** Implémentation immédiate des responsabilités définies dans ce document.

---

*Document des responsabilités - Version 1.0 - 27 Janvier 2025*
