import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LimitReachedModalService } from '../../services/limit-reached-modal.service';

@Component({
  selector: 'app-limit-reached-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './limit-reached-modal.component.html'
})
export class LimitReachedModalComponent {
  private router = inject(Router);
  public modalService = inject(LimitReachedModalService);

  upgradePlan() {
    this.modalService.closeModal();
    this.router.navigate(['/subscription']);
  }
}
