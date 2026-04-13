// src/pages/Profile.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth';
import Layout from '@/components/layout/Layout';
import {
  User,
  Mail,
  Crown,
  Settings,
  Loader2,
  Star,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Camera,
  GraduationCap,
  Linkedin,
  Globe,
  FileText,
  ExternalLink,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  EN_COURS: 'En cours',
  TERMINE_AVEC_CERTIFICAT: 'Terminé avec certificat',
  TERMINE_SANS_CERTIFICAT: 'Terminé',
};

const Profile = () => {
  const { user, isPremium, isLearner, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // Learner profile state
  const [learnerProfile, setLearnerProfile] = useState<any>(null);
  const [loadingLearner, setLoadingLearner] = useState(false);
  const [editingLearner, setEditingLearner] = useState(false);
  const [learnerData, setLearnerData] = useState({ bio: '', linkedinUrl: '', portfolioUrl: '' });
  const [savingLearner, setSavingLearner] = useState(false);
  const [learnerError, setLearnerError] = useState('');
  const [learnerSuccess, setLearnerSuccess] = useState('');

  // Avatar upload state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  
  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    phone: user?.phone || '',
    country: user?.country || '',
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Delete account state
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Load learner profile if user is a learner
  useEffect(() => {
    if (!isLearner) return;
    setLoadingLearner(true);
    fetch('/api/learners/me', {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setLearnerProfile(json.data);
          setLearnerData({
            bio: json.data.bio || '',
            linkedinUrl: json.data.linkedinUrl || '',
            portfolioUrl: json.data.portfolioUrl || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingLearner(false));
  }, [isLearner]);

  const handleSaveLearnerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLearnerError('');
    setLearnerSuccess('');
    setSavingLearner(true);
    try {
      const res = await fetch('/api/learners/me', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(learnerData),
      });
      const json = await res.json();
      if (json.success) {
        setLearnerProfile(json.data);
        setLearnerSuccess('Profil apprenant mis à jour');
        setEditingLearner(false);
      } else {
        setLearnerError(json.message || 'Erreur lors de la mise à jour');
      }
    } catch {
      setLearnerError('Une erreur est survenue');
    } finally {
      setSavingLearner(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/premium');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    setUploadingAvatar(true);
    try {
      const result = await authService.uploadAvatar(file);
      if (result.success) {
        await refreshUser();
      } else {
        setAvatarError(result.message || 'Échec de l\'upload');
      }
    } catch {
      setAvatarError('Une erreur est survenue');
    } finally {
      setUploadingAvatar(false);
      // Reset input so same file can be re-selected
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    
    setSavingProfile(true);
    try {
      const response = await authService.updateProfile({
        username: profileData.username,
        phone: profileData.phone,
        country: profileData.country,
        email: user?.email, // Send current email (required by backend but user can't change it)
      });
      if (response.success) {
        setProfileSuccess('Profil mis a jour avec succes');
        await refreshUser();
        setEditingProfile(false);
      } else {
        setProfileError(response.message || 'Erreur lors de la mise a jour du profil');
      }
    } catch (error) {
      setProfileError('Une erreur est survenue');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setChangingPassword(true);
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      if (response.success) {
        setPasswordSuccess('Mot de passe modifié avec succès');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(response.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      setPasswordError('Une erreur est survenue');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user?.email) {
      setPasswordError('Veuillez entrer votre email pour confirmer');
      return;
    }
    
    setDeleting(true);
    try {
      const response = await authService.deleteAccount();
      if (response.success) {
        await logout();
        navigate('/');
      } else {
        setPasswordError(response.message || 'Erreur lors de la suppression du compte');
      }
    } catch (error) {
      setPasswordError('Une erreur est survenue');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 mb-8"
          >
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar — cliquable pour upload */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden">
                  {user?.picture ? (
                    <img src={user.picture} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gold" />
                  )}
                </div>
                {/* Overlay au survol */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Changer la photo"
                >
                  {uploadingAvatar
                    ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                    : <Camera className="w-6 h-6 text-white" />
                  }
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <p className="text-center text-xs text-white/30 mt-2">Cliquer pour changer</p>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                  <h1 className="text-2xl font-display font-bold">
                    {user?.name || `${user?.firstName} ${user?.lastName}` || 'Utilisateur'}
                  </h1>
                  {isLearner && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                      <GraduationCap className="w-4 h-4" />
                      Crack Accompagné
                    </span>
                  )}
                  {!isLearner && isPremium && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gold/20 text-gold text-sm">
                      <Crown className="w-4 h-4" />
                      Premium
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-white/40">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-white/40 mt-1">
                  <span className="text-sm">
                    Connecte via {user?.provider === 'google' ? 'Google' : user?.provider === 'github' ? 'GitHub' : 'Email'}
                  </span>
                </div>
              </div>
            </div>

            {avatarError && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {avatarError}
              </div>
            )}

            {/* Premium Upgrade Banner (if not premium) */}
            {!isPremium && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 p-6 rounded-xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <h3 className="font-semibold text-gold mb-1">
                      Devenez Premium
                    </h3>
                    <p className="text-white/60 text-sm">
                      Accedez a tous les contenus, telechargements et Ressources exclusives.
                    </p>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    className="btn-primary whitespace-nowrap"
                  >
                    <Star className="w-4 h-4 inline mr-2" />
                    Passer Premium
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Tabs Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-gold text-black'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profil
            </button>
            {isLearner && (
              <button
                onClick={() => setActiveTab('learner')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'learner'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <GraduationCap className="w-4 h-4 inline mr-2" />
                Mon parcours
              </button>
            )}
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-gold text-black'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Securite
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Change Password Section */}
              {user?.provider === 'local' ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-semibold">
                        Changer le mot de passe
                      </h2>
                      <p className="text-white/40 text-sm">
                        Modifiez votre mot de passe de connexion
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">
                        Mot de passe actuel
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                          placeholder="Entrez votre mot de passe actuel"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-2">
                          Nouveau mot de passe
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                          placeholder="Nouveau mot de passe"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-2">
                          Confirmer le mot de passe
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                          placeholder="Confirmer le mot de passe"
                          required
                        />
                      </div>
                    </div>

                    {passwordError && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {passwordError}
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {passwordSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="btn-primary w-full md:w-auto"
                    >
                      {changingPassword ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Modifier le mot de passe'
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-semibold">
                        Mot de passe
                      </h2>
                      <p className="text-white/40 text-sm">
                        Gestion du mot de passe
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 text-white/60">
                    <p className="text-sm">
                      Vous etes connecte via <strong className="text-gold">{user?.provider === 'google' ? 'Google' : 'GitHub'}</strong>. 
                      Votre mot de passe est gere par ce provider. Vous ne pouvez pas modifier votre mot de passe ici.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Delete Account Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-8 border-red-500/20"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-red-400">
                      Supprimer le compte
                    </h2>
                    <p className="text-white/40 text-sm">
                      Cette action est irreversible
                    </p>
                  </div>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                  >
                    Supprimer mon compte
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                        <div>
                          <p className="text-red-400 font-medium mb-1">Etes-vous sur ?</p>
                          <p className="text-white/60 text-sm">
                            Entrez <strong>{user?.email}</strong> pour confirmer la suppression definitive de votre compte.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-red-500"
                        placeholder="Entrez votre email pour confirmer"
                      />
                    </div>

                    {passwordError && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {passwordError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                          setPasswordError('');
                        }}
                        className="px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-sm flex items-center gap-2"
                      >
                        {deleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Confirmer la suppression
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Learner Tab */}
          {activeTab === 'learner' && isLearner && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {loadingLearner ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
              ) : !learnerProfile ? (
                <div className="card p-8 text-center text-white/50">Profil apprenant non disponible.</div>
              ) : (
                <div className="card p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-semibold">Mon parcours apprenant</h2>
                        <p className="text-white/40 text-sm">Ces informations apparaissent sur votre profil public</p>
                      </div>
                    </div>
                    {!editingLearner && (
                      <button
                        onClick={() => setEditingLearner(true)}
                        className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors text-sm"
                      >
                        Modifier
                      </button>
                    )}
                  </div>

                  {/* Status + cohort (read-only — admin manages these) */}
                  <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-white/5">
                    <div>
                      <p className="text-white/40 text-xs mb-1">Statut</p>
                      <p className="text-white text-sm font-medium">
                        {STATUS_LABELS[learnerProfile.status] || learnerProfile.status}
                      </p>
                    </div>
                    {learnerProfile.cohort && (
                      <div>
                        <p className="text-white/40 text-xs mb-1">Cohorte</p>
                        <p className="text-white text-sm font-medium">{learnerProfile.cohort}</p>
                      </div>
                    )}
                    {learnerProfile.slug && (
                      <div className="col-span-2">
                        <p className="text-white/40 text-xs mb-1">Profil public</p>
                        <a
                          href={`/apprenants/${learnerProfile.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-gold text-sm hover:underline"
                        >
                          /apprenants/{learnerProfile.slug}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {editingLearner ? (
                    <form onSubmit={handleSaveLearnerProfile} className="space-y-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-2">
                          <FileText className="w-4 h-4 inline mr-1" />
                          Bio
                        </label>
                        <textarea
                          value={learnerData.bio}
                          onChange={(e) => setLearnerData({ ...learnerData, bio: e.target.value })}
                          rows={4}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold resize-none"
                          placeholder="Parlez de vous, votre parcours, vos projets..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-2">
                          <Linkedin className="w-4 h-4 inline mr-1" />
                          LinkedIn
                        </label>
                        <input
                          type="url"
                          value={learnerData.linkedinUrl}
                          onChange={(e) => setLearnerData({ ...learnerData, linkedinUrl: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                          placeholder="https://linkedin.com/in/votre-profil"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-2">
                          <Globe className="w-4 h-4 inline mr-1" />
                          Portfolio / GitHub
                        </label>
                        <input
                          type="url"
                          value={learnerData.portfolioUrl}
                          onChange={(e) => setLearnerData({ ...learnerData, portfolioUrl: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                          placeholder="https://github.com/votre-profil"
                        />
                      </div>

                      {learnerError && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{learnerError}</div>
                      )}
                      {learnerSuccess && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />{learnerSuccess}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLearner(false);
                            setLearnerData({ bio: learnerProfile.bio || '', linkedinUrl: learnerProfile.linkedinUrl || '', portfolioUrl: learnerProfile.portfolioUrl || '' });
                            setLearnerError(''); setLearnerSuccess('');
                          }}
                          className="px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
                        >
                          Annuler
                        </button>
                        <button type="submit" disabled={savingLearner} className="btn-primary text-sm">
                          {savingLearner ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-white/40 text-xs mb-2">Bio</p>
                        <p className="text-white/80 text-sm leading-relaxed">
                          {learnerProfile.bio || <span className="italic text-white/30">Aucune bio renseignée</span>}
                        </p>
                      </div>
                      <div className="flex gap-4 pt-2">
                        {learnerProfile.linkedinUrl && (
                          <a href={learnerProfile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm">
                            <Linkedin className="w-4 h-4" /> LinkedIn
                          </a>
                        )}
                        {learnerProfile.portfolioUrl && (
                          <a href={learnerProfile.portfolioUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-gold hover:text-gold/80 text-sm">
                            <Globe className="w-4 h-4" /> Portfolio
                          </a>
                        )}
                        {!learnerProfile.linkedinUrl && !learnerProfile.portfolioUrl && (
                          <span className="text-white/30 text-sm italic">Aucun lien renseigné</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <>
              {/* Profile Info Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-8 mb-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-semibold">
                        Informations du profil
                      </h2>
                      <p className="text-white/40 text-sm">
                        Gerez vos informations personnelles
                      </p>
                    </div>
                  </div>
                  {!editingProfile && (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="px-4 py-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors text-sm"
                    >
                      Modifier
                    </button>
                  )}
                </div>

                {editingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                        placeholder="Votre nom d'utilisateur"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-2">
                          Telephone
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                          placeholder="Votre numero de telephone"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-2">
                          Pays
                        </label>
                        <input
                          type="text"
                          value={profileData.country}
                          onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                          placeholder="Votre pays"
                        />
                      </div>
                    </div>

                    {profileError && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {profileError}
                      </div>
                    )}

                    {profileSuccess && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {profileSuccess}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProfile(false);
                          setProfileData({
                            username: user?.username || '',
                            phone: user?.phone || '',
                            country: user?.country || '',
                          });
                          setProfileError('');
                          setProfileSuccess('');
                        }}
                        className="px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="btn-primary text-sm"
                      >
                        {savingProfile ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Enregistrer'
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-white/40 mb-1">Email</label>
                      <div className="flex items-center gap-2 text-white">
                        <Mail className="w-4 h-4 text-white/40" />
                        {user?.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-white/40 mb-1">Nom d'utilisateur</label>
                      <div className="text-white">{user?.username || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-white/40 mb-1">Telephone</label>
                      <div className="text-white">{user?.phone || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-white/40 mb-1">Pays</label>
                      <div className="text-white">{user?.country || '-'}</div>
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
