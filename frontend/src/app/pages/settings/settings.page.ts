import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, BottomNavComponent]
})
export class SettingsPage implements OnInit {

  notificationSettings = {
    masterSwitch: true,
    streakNotifications: true,
    achievementNotifications: true,
    studyReminders: true,
    tipsNotifications: true,
    goalNotifications: true,
    weeklyReport: true,
    motivationalMessages: true,
    dailyReminder: true,
    dailyReminderTime: '20:00',
    pushNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    doNotDisturbEnabled: false,
    doNotDisturbStart: '22:00',
    doNotDisturbEnd: '08:00'
  };

  constructor(private router: Router) { }

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      this.notificationSettings = JSON.parse(saved);
    }
  }

  saveSettings() {
    localStorage.setItem('notificationSettings', JSON.stringify(this.notificationSettings));
    console.log('Configuración guardada:', this.notificationSettings);
  }

  onSettingChange() {
    this.saveSettings();
  }

  onMasterSwitchChange() {
    if (!this.notificationSettings.masterSwitch) {
      this.notificationSettings.streakNotifications = false;
      this.notificationSettings.achievementNotifications = false;
      this.notificationSettings.studyReminders = false;
      this.notificationSettings.tipsNotifications = false;
      this.notificationSettings.goalNotifications = false;
      this.notificationSettings.weeklyReport = false;
      this.notificationSettings.motivationalMessages = false;
      this.notificationSettings.pushNotifications = false;
    }
    this.saveSettings();
  }

  goBack() {
    this.router.navigate(['/notifications']);
  }
}