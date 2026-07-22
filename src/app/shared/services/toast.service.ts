import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  toast$: Observable<ToastMessage | null> = this.toastSubject.asObservable();
  private nextId = 0;

  show(message: string, type: ToastType = 'success', durationMs = 4000): void {
    const id = ++this.nextId;
    this.toastSubject.next({ id, message, type });

    if (durationMs > 0) {
      timer(durationMs).subscribe(() => {
        // Only clear if the current toast is still the one we just showed
        if (this.toastSubject.value?.id === id) {
          this.toastSubject.next(null);
        }
      });
    }
  }

  clear(): void {
    this.toastSubject.next(null);
  }
}
