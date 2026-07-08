import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  isOpen = signal(false);
  config = signal<ConfirmDialogConfig>({
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    type: 'danger'
  });

  private _resolve: ((val: boolean) => void) | null = null;

  confirm(cfg: ConfirmDialogConfig): Promise<boolean> {
    this.config.set({
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      type: 'danger',
      ...cfg
    });
    this.isOpen.set(true);
    return new Promise(resolve => { this._resolve = resolve; });
  }

  resolve(value: boolean) {
    this.isOpen.set(false);
    this._resolve?.(value);
    this._resolve = null;
  }
}
