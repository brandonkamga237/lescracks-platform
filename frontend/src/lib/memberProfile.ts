import type { MemberGoal, MemberSituation, ProfileField } from '@/services/types';

export const SITUATION_LABEL: Record<MemberSituation, string> = {
  STUDENT: 'Étudiant·e',
  EMPLOYED: 'En poste',
  CAREER_CHANGE: 'En reconversion',
  JOB_SEEKING: 'En recherche d’emploi',
  FREELANCE: 'Freelance ou indépendant·e',
};

export const GOAL_LABEL: Record<MemberGoal, string> = {
  FIND_JOB: 'Trouver un emploi dans la tech',
  LEVEL_UP: 'Progresser dans mon poste',
  FREELANCE: 'Me lancer en freelance',
  BUILD_PROJECT: 'Construire mon propre projet',
};

/** What each missing piece of the profile is called in the completion prompts. */
export const FIELD_LABEL: Record<ProfileField, string> = {
  PHONE: 'Ton numéro de téléphone',
  SITUATION: 'Ta situation',
  INTERESTS: 'Tes centres d’intérêt',
  GOAL: 'Ton objectif',
  CITY: 'Ta ville',
  AVATAR: 'Ta photo',
  BIO: 'Quelques mots sur toi',
};
