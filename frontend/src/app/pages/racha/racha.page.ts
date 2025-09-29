import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-racha',
  templateUrl: './racha.page.html',
  styleUrls: ['./racha.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class RachaPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}