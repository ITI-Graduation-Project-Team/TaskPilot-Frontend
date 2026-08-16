import { Injectable, signal } from '@angular/core';

export type LimitType = 'projects' | 'teamMembers' | 'storage' | 'tokens';

export interface LimitReachedModalData {
  limitType: LimitType;
  limit: number;
  currentCount: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class LimitReachedModalService {
  isOpen = signal(false);
  modalData = signal<LimitReachedModalData | null>(null);

  openModal(data: LimitReachedModalData) {
    this.modalData.set(data);
    this.isOpen.set(true);
  }

  closeModal() {
    this.isOpen.set(false);
  }
}
