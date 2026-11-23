package com.brandonkamga.lescracks.event.domain.model;

/**
 * When a reminder goes out, before a rendez-vous starts. Their windows never overlap: a member
 * who asks for a reminder less than an hour before the start only gets the last one.
 */
public enum ReminderMoment { DAY_BEFORE, HOUR_BEFORE }
