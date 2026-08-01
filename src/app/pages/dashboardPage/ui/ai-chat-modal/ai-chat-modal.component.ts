import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { detectTextDir } from '../../../../shared/utils/text-direction.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AiRequirementsService } from '../../../../shared/api/ai-requirements.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';

interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

@Component({
  selector: 'app-ai-chat-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <!-- ═══════════════════════════════════════════════════════════
         PAGE MODE  (embedded=false — full-height inline panel)
    ═══════════════════════════════════════════════════════════ -->
    @if (!embedded()) {
      <div class="flex flex-col h-full overflow-hidden bg-background">

        <!-- TOP BAR -->
        <header class="flex items-center justify-between gap-4 px-5 py-3.5 bg-sidebar border-b border-border shrink-0">
          <!-- Left: Avatar + info -->
          <div class="flex items-center gap-3 min-w-0">
            <div class="relative shrink-0">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <span class="absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-sidebar"></span>
            </div>
            <div class="min-w-0">
              <p class="text-[13px] font-extrabold text-text-primary leading-tight">{{ 'AI_CHAT.TITLE' | translate }}</p>
              <p class="text-[11px] text-text-secondary truncate mt-px">
                @if (isLoading()) {
                  <span class="inline-flex items-center gap-1 text-primary font-bold">
                    <span class="typing-dot"></span>
                    <span class="typing-dot" style="animation-delay:.18s"></span>
                    <span class="typing-dot" style="animation-delay:.36s"></span>
                    {{ 'AI_CHAT.THINKING' | translate }}
                  </span>
                } @else {
                  {{ 'AI_CHAT.SUBTITLE' | translate }}
                }
              </p>
            </div>
          </div>

          <!-- Right: completeness pill + generate + close -->
          <div class="flex items-center gap-2.5 shrink-0">
            @if (projectState.isProjectManager() && completenessScore() > 0) {
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/8 border border-primary/20">
                <div class="w-14 h-1 bg-border rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full transition-all duration-700" [style.width.%]="completenessScore()"></div>
                </div>
                <span class="text-[11px] font-extrabold text-primary">{{ completenessScore() }}%</span>
              </div>
            }
            @if (isReadyForFinalization() && projectState.isProjectManager()) {
              <button (click)="onGenerateDraft()"
                      class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold rounded-xl border-none cursor-pointer transition-all shadow-md hover:scale-[1.03] animate-pulse">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
                {{ 'AI_CHAT.GENERATE_DRAFT' | translate }}
              </button>
            }
            <button (click)="close.emit()" [title]="'AI_CHAT.BACK' | translate"
                    class="flex items-center justify-center w-8 h-8 rounded-lg border-none bg-transparent text-text-secondary hover:bg-border hover:text-text-primary cursor-pointer transition-all">
              <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- Progress strip (PM only) -->
        @if (projectState.isProjectManager()) {
          <div class="h-[3px] bg-border shrink-0 overflow-hidden">
            <div class="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700" [style.width.%]="completenessScore()"></div>
          </div>
        }

        <!-- MESSAGES -->
        <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4" #chatScrollContainer>

          <!-- Welcome bubble -->
          <div class="flex items-end gap-2 max-w-[78%] self-start shrink-0">
            <div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-sm shrink-0 mb-[18px]">🤖</div>
            <div class="flex flex-col gap-0.5 items-start">
              <div class="px-4 py-3 rounded-2xl rounded-bl-[4px] bg-sidebar border border-border text-text-primary text-[13px] leading-relaxed break-words whitespace-pre-wrap max-w-full shadow-sm">
                <span>{{ 'AI_CHAT.GREETING' | translate }}</span><br/>
                @if (projectState.isProjectManager()) {
                  <span>{{ 'AI_CHAT.GREETING_PM' | translate }}</span>
                } @else {
                  <span>{{ 'AI_CHAT.GREETING_DEV' | translate }}</span>
                }
              </div>
              <span class="text-[10px] text-text-secondary px-0.5">{{ 'AI_CHAT.JUST_NOW' | translate }}</span>
            </div>
          </div>

          <!-- History -->
          @for (msg of chatHistory(); track msg.timestamp) {
            <div class="flex items-end gap-2 max-w-[78%] shrink-0"
                 [class.self-start]="msg.sender === 'ai'"
                 [class.self-end]="msg.sender === 'user'"
                 [class.flex-row-reverse]="msg.sender === 'user'"
                 [dir]="detectTextDir(msg.text)">
              @if (msg.sender === 'ai') {
                <div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-sm shrink-0 mb-[18px]">🤖</div>
              }
              <div class="flex flex-col gap-0.5" [class.items-start]="msg.sender === 'ai'" [class.items-end]="msg.sender === 'user'">
                <div class="px-4 py-3 rounded-2xl text-[13px] leading-relaxed break-words whitespace-pre-wrap max-w-full"
                     [class.rounded-bl-[4px]]="msg.sender === 'ai'"
                     [class.bg-sidebar]="msg.sender === 'ai'"
                     [class.border]="msg.sender === 'ai'"
                     [class.border-border]="msg.sender === 'ai'"
                     [class.text-text-primary]="msg.sender === 'ai'"
                     [class.shadow-sm]="msg.sender === 'ai'"
                     [class.rounded-br-[4px]]="msg.sender === 'user'"
                     [class.bg-primary]="msg.sender === 'user'"
                     [class.text-white]="msg.sender === 'user'">
                  {{ msg.text }}
                </div>
                <span class="text-[10px] text-text-secondary px-0.5" [class.text-end]="msg.sender === 'user'">
                  {{ msg.timestamp | date:'HH:mm' }}
                </span>
              </div>
              @if (msg.sender === 'user') {
                <div class="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center text-[11px] font-extrabold shrink-0 mb-[18px]">
                  {{ userInitial() }}
                </div>
              }
            </div>
          }

          <!-- WhatsApp Typing Dots -->
          @if (isLoading()) {
            <div class="flex items-end gap-2 max-w-[78%] self-start shrink-0">
              <div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-sm shrink-0 mb-[18px]">🤖</div>
              <div class="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-[4px] bg-sidebar border border-border min-w-[56px]">
                <span class="typing-dot"></span>
                <span class="typing-dot" style="animation-delay:.2s"></span>
                <span class="typing-dot" style="animation-delay:.4s"></span>
              </div>
            </div>
          }

          <!-- Generating Draft Indicator -->
          @if (isGeneratingDraft()) {
            <div class="flex items-center gap-3 self-start max-w-[90%] shrink-0 px-4 py-3 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-2xl text-[13px] font-semibold text-emerald-700">
              <div class="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0"></div>
              <span>{{ 'AI_CHAT.ANALYZING' | translate }}</span>
            </div>
          }

          <!-- Clarifying Questions (PM only) -->
          @if (clarifyingQuestions().length > 0 && projectState.isProjectManager()) {
            <div class="self-start max-w-[90%] shrink-0 px-4 py-3.5 bg-amber-500/[0.06] border border-amber-500/22 rounded-2xl">
              <p class="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-600 mb-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ 'AI_CHAT.CLARIFYING_QUESTIONS' | translate }}
              </p>
              <ul class="list-disc ps-4.5 flex flex-col gap-1">
                @for (q of clarifyingQuestions(); track q) {
                  <li class="text-xs text-text-secondary">{{ q }}</li>
                }
              </ul>
            </div>
          }
        </div>

        <!-- FOOTER -->
        <footer class="shrink-0 bg-sidebar border-t border-border px-4 pt-3 pb-3 flex flex-col gap-2">
          <!-- Attachment row -->
          <div class="flex items-center gap-2">
            <input type="file" #fileInput (change)="onFileSelected($event)" class="hidden" accept=".pdf,.docx,.txt"/>
            <button type="button" (click)="fileInput.click()"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-xl bg-transparent text-[11px] font-bold text-text-secondary hover:bg-background hover:text-text-primary cursor-pointer transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
              </svg>
              {{ 'AI_CHAT.ATTACH' | translate }}
            </button>
            @if (selectedFileName()) {
              <div class="flex items-center gap-1.5 flex-1 min-w-0">
                <svg class="w-3.5 h-3.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span class="text-[11px] text-primary font-semibold truncate">{{ selectedFileName() }}</span>
                <button (click)="clearFile()" class="text-[10px] font-extrabold text-red-500 hover:underline cursor-pointer shrink-0 bg-transparent border-none">{{ 'AI_CHAT.REMOVE' | translate }}</button>
              </div>
            }
          </div>

          <!-- Input + Send -->
          <form (submit)="onSendMessage($event)" class="flex gap-2 items-center">
            <textarea
              [(ngModel)]="messageInput"
              name="message"
              autocomplete="off"
              rows="2"
              (keydown)="onKeyDown($event)"
              [placeholder]="'AI_CHAT.INPUT_PLACEHOLDER' | translate"
              class="flex-1 bg-background border border-border rounded-2xl px-3.5 py-2.5 text-[13px] text-text-primary font-[inherit] leading-relaxed outline-none resize-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-text-secondary"
            ></textarea>
            <button type="submit"
                    [disabled]="isLoading() || (!messageInput.trim() && !selectedFile())"
                    class="w-9 h-9 shrink-0 rounded-xl bg-primary text-white border-none cursor-pointer flex items-center justify-center shadow-md transition-all hover:brightness-110 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </button>
          </form>
          <p class="text-[10px] text-center text-text-secondary">{{ 'AI_CHAT.SEND_HINT' | translate }}</p>
        </footer>
      </div>
    }

    <!-- ═══════════════════════════════════════════════════════════
         LEGACY MODAL MODE  (embedded=true — overlay)
    ═══════════════════════════════════════════════════════════ -->
    @if (embedded()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
        <div class="bg-surface border border-border rounded-3xl w-full max-w-3xl flex flex-col shadow-sm overflow-hidden animate-[scaleUp_0.25s_ease_both] h-[85vh]">
          <div class="p-5 border-b border-border bg-sidebar flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <svg class="w-5.5 h-5.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-base font-bold text-text-primary">{{ 'AI_CHAT.TITLE' | translate }}</h3>
                <p class="text-xs text-text-secondary">{{ 'AI_CHAT.SUBTITLE' | translate }}</p>
              </div>
            </div>
            <button (click)="close.emit()" class="p-2 hover:bg-border rounded-full transition-colors text-text-secondary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          @if (projectState.isProjectManager()) {
            <div class="px-6 py-4 bg-primary/5 border-b border-primary/10 shrink-0 flex items-center justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center justify-between text-xs font-bold text-primary mb-1">
                  <span [dir]="detectTextDir(completenessLabel())">{{ completenessLabel() }}</span>
                  <span>{{ completenessScore() }}%</span>
                </div>
                <div class="w-full h-2.5 bg-border rounded-full overflow-hidden">
                  <div class="h-full bg-primary transition-all duration-500 rounded-full" [style.width.%]="completenessScore()"></div>
                </div>
              </div>
              @if (isReadyForFinalization()) {
                <button (click)="onGenerateDraft()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 animate-bounce">
                  {{ 'AI_CHAT.GENERATE_DRAFT' | translate }}
                </button>
              }
            </div>
          }
          <div class="flex-1 overflow-y-auto p-6 space-y-4 max-h-[360px]" #chatScrollContainer>
            <div class="flex gap-3 max-w-[85%]">
              <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">🤖</div>
              <div class="p-4 bg-sidebar border border-border rounded-2xl text-sm text-text-primary rounded-tl-none leading-relaxed">
                {{ 'AI_CHAT.GREETING' | translate }}<br/>
                @if (projectState.isProjectManager()) {
                  {{ 'AI_CHAT.GREETING_PM' | translate }}
                } @else {
                  {{ 'AI_CHAT.GREETING_DEV' | translate }}
                }
              </div>
            </div>
            @for (msg of chatHistory(); track msg.timestamp) {
              <div class="flex gap-3 max-w-[85%] animate-[fadeUp_0.2s_ease_both]"
                   [ngClass]="msg.sender === 'user' ? 'ms-auto flex-row-reverse' : ''"
                   [dir]="detectTextDir(msg.text)"
                   [class.text-end]="detectTextDir(msg.text) === 'rtl'">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                     [ngClass]="msg.sender === 'user' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'">
                  {{ msg.sender === 'user' ? userInitial() : '🤖' }}
                </div>
                <div class="p-4 rounded-2xl text-sm leading-relaxed border"
                     [ngClass]="msg.sender === 'user' ? 'bg-primary/10 border-primary/20 text-text-primary rounded-te-none' : 'bg-sidebar border-border text-text-primary rounded-ts-none'">
                  {{ msg.text }}
                </div>
              </div>
            }
            @if (isLoading()) {
              <div class="flex gap-3 max-w-[85%]">
                <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">🤖</div>
                <div class="p-4 bg-sidebar border border-border rounded-2xl rounded-tl-none">
                  <span class="flex gap-1.5 items-center">
                    <span class="typing-dot"></span>
                    <span class="typing-dot" style="animation-delay:.2s"></span>
                    <span class="typing-dot" style="animation-delay:.4s"></span>
                  </span>
                </div>
              </div>
            }
            @if (clarifyingQuestions().length > 0 && projectState.isProjectManager()) {
              <div class="p-5 bg-warning/5 border border-warning/20 rounded-2xl space-y-2.5 animate-[fadeIn_0.3s_ease_both]">
                <h4 class="text-xs font-bold text-warning uppercase tracking-wider">{{ 'AI_CHAT.CLARIFYING_QUESTIONS' | translate }}</h4>
                <ul class="space-y-1.5 text-xs text-text-secondary list-disc ps-5">
                  @for (q of clarifyingQuestions(); track q) { <li>{{ q }}</li> }
                </ul>
              </div>
            }
            @if (isGeneratingDraft()) {
              <div class="flex items-center gap-2 text-primary font-semibold text-sm animate-pulse p-4">
                <div class="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                {{ 'AI_CHAT.ANALYZING' | translate }}
              </div>
            }
          </div>

          <!-- Input Area -->
          <!-- NOTE: previously wrapped in @if (clarifyingQuestions().length === 0) { ... }
               which hid the entire input box whenever there were pending clarifying
               questions. The input area is now always rendered. -->
          <div class="p-4 border-t border-border bg-sidebar shrink-0 space-y-3">
            <div class="flex items-center gap-2">
              <input type="file" #fileInput2 (change)="onFileSelected($event)" class="hidden" accept=".pdf,.docx,.txt"/>
              <button type="button" (click)="fileInput2.click()" class="p-2 border border-border text-text-secondary hover:text-text-primary rounded-xl hover:bg-background transition-colors flex items-center gap-1.5 text-xs font-semibold">
                <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                </svg>
                {{ 'AI_CHAT.ATTACH_DOC' | translate }}
              </button>
              @if (selectedFileName()) {
                <span class="text-xs text-primary font-semibold truncate max-w-xs">{{ selectedFileName() }}</span>
                <button (click)="clearFile()" class="text-xs text-error font-bold hover:underline">{{ 'AI_CHAT.REMOVE' | translate }}</button>
              }
            </div>
            <form (submit)="onSendMessage($event)" class="flex gap-2 items-end">
              <textarea [(ngModel)]="messageInput" name="message" autocomplete="off" rows="2"
                        (keydown)="onKeyDown($event)"
                        [placeholder]="'AI_CHAT.INPUT_PLACEHOLDER' | translate"
                        class="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea>
              <button type="submit" [disabled]="isLoading() || (!messageInput.trim() && !selectedFile())"
                      class="px-5 py-3 h-[46px] bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-50 shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- ═══════════════════════════════════════════════════════════
         CONFIGURE PROJECT MODAL (shared)
    ═══════════════════════════════════════════════════════════ -->
    @if (showNamePrompt()) {
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fadeIn_0.2s_ease_both]">
        <div class="bg-surface border border-border rounded-3xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-5 animate-[scaleUp_0.25s_ease_both] overflow-hidden">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg">📂</div>
            <div>
              <h4 class="text-base font-bold text-text-primary">{{ 'AI_CHAT.CONFIGURE_TITLE' | translate }}</h4>
              <p class="text-xs text-text-secondary">{{ 'AI_CHAT.CONFIGURE_SUBTITLE' | translate }}</p>
            </div>
          </div>
          <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-[11px] font-extrabold text-text-secondary mb-1 uppercase tracking-wider">{{ 'AI_CHAT.PROJ_NAME_EN' | translate }}</label>
                <input type="text" [value]="projectNameInput()" (input)="projectNameInput.set(nameEnField.value)" #nameEnField
                       [disabled]="isGeneratingDraft()"
                       class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold disabled:opacity-50"
                       placeholder="e.g. E-Commerce App"/>
              </div>
              <div>
                <label class="block text-[11px] font-extrabold text-text-secondary mb-1 uppercase tracking-wider">{{ 'AI_CHAT.PROJ_NAME_AR' | translate }}</label>
                <input type="text" [value]="projectNameArInput()" (input)="projectNameArInput.set(nameArField.value)" #nameArField
                       dir="rtl" [disabled]="isGeneratingDraft()"
                       class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold disabled:opacity-50 text-right"
                       placeholder="مثال: تطبيق التجارة الإلكترونية"/>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-[11px] font-extrabold text-text-secondary mb-1 uppercase tracking-wider">{{ 'AI_CHAT.DESC_EN' | translate }}</label>
                <textarea [value]="projectDescriptionEnInput()" (input)="projectDescriptionEnInput.set(descEnField.value)" #descEnField
                          rows="3" [disabled]="isGeneratingDraft()"
                          class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all disabled:opacity-50"
                          placeholder="Describe the project goal, features, and audience..."></textarea>
              </div>
              <div>
                <label class="block text-[11px] font-extrabold text-text-secondary mb-1 uppercase tracking-wider">{{ 'AI_CHAT.DESC_AR' | translate }}</label>
                <textarea [value]="projectDescriptionArInput()" (input)="projectDescriptionArInput.set(descArField.value)" #descArField
                          rows="3" dir="rtl" [disabled]="isGeneratingDraft()"
                          class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all disabled:opacity-50 text-right"
                          placeholder="اكتب وصف المشروع..."></textarea>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/60 pt-4">
              <div>
                <label class="block text-[11px] font-extrabold text-text-secondary mb-1 uppercase tracking-wider">{{ 'AI_CHAT.SPRINT_DAYS' | translate }}</label>
                <input type="number" [value]="sprintDurationInput() ?? ''" (input)="sprintDurationInput.set(+durationField.value || null)" #durationField
                       [disabled]="isGeneratingDraft()" min="1" max="90" [placeholder]="'e.g. ' + sprintDurationPlaceholder()"
                       class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold disabled:opacity-50"/>
              </div>
              <div>
                <label class="block text-[11px] font-extrabold text-text-secondary mb-1 uppercase tracking-wider">{{ 'AI_CHAT.SPRINT_HOURS' | translate }}</label>
                <input type="number" [value]="targetSprintHoursInput() ?? ''" (input)="targetSprintHoursInput.set(+hoursField.value || null)" #hoursField
                       [disabled]="isGeneratingDraft()" min="1" max="1000" [placeholder]="'e.g. ' + targetSprintHoursPlaceholder()"
                       class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold disabled:opacity-50"/>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2.5 mt-2 border-t border-border/60 pt-4 shrink-0">
            <button (click)="showNamePrompt.set(false)" [disabled]="isGeneratingDraft()"
                    class="px-4 py-2.5 border border-border text-text-secondary hover:text-text-primary text-xs font-bold rounded-xl transition-all disabled:opacity-50">
              {{ 'AI_CHAT.CANCEL' | translate }}
            </button>
            <button (click)="submitFinalization()" [disabled]="isGeneratingDraft()"
                    class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 min-w-[140px] justify-center">
              @if (isGeneratingDraft()) {
                <span class="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
                <span>{{ 'AI_CHAT.GENERATING' | translate }}</span>
              } @else {
                <span>{{ 'AI_CHAT.CONFIRM_SAVE' | translate }}</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    /* Typing dots — needs keyframe, can't be Tailwind */
    .typing-dot {
      display: inline-block;
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--color-text-secondary, #94a3b8);
      opacity: 0.7;
      animation: typingBounce 1.2s ease-in-out infinite;
    }
    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
      30%            { transform: translateY(-6px); opacity: 1; }
    }
    /* Global modal animations referenced via animate-[] */
    @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeUp  { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `],
})
export class AiChatModalComponent implements AfterViewChecked {
  embedded = input(false);
  @Output() close = new EventEmitter<void>();
  @Output() draftGenerated = new EventEmitter<{ projectId: string; chatId: string; draft: any }>();

  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

  private aiRequirements = inject(AiRequirementsService);
  projectState = inject(ProjectStateService);
  toastService = inject(ToastService);

  chatId = signal<string | null>(null);
  completenessScore = signal(0);

  detectTextDir = detectTextDir;

  /** User initial for avatar — reads from localStorage (same as Dashboard) */
  userInitial = computed(() => {
    if (typeof localStorage !== 'undefined') {
      const name = localStorage.getItem('userFullName') ?? '';
      if (name.trim()) return name.trim().charAt(0).toUpperCase();
    }
    return 'U';
  });

  completenessLabel = computed(() => {
    const score = this.completenessScore();
    if (score >= 85 && score < 100) {
      const history = this.chatHistory();
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].sender === 'user') {
          return detectTextDir(history[i].text) === 'rtl' ? 'اكتمال قريب' : 'Almost Complete';
        }
      }
      return 'Almost Complete';
    }
    const history = this.chatHistory();
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].sender === 'user') {
        return detectTextDir(history[i].text) === 'rtl' ? 'اكتمال المتطلبات' : 'Requirements Completeness';
      }
    }
    return 'Requirements Completeness';
  });

  isReadyForFinalization = signal(false);
  clarifyingQuestions = signal<string[]>([]);
  chatHistory = signal<ChatMessage[]>([]);

  messageInput = '';
  selectedFile = signal<File | null>(null);
  selectedFileName = signal<string>('');
  lastUploadedFileName = signal<string>('');
  lastUploadedDocText = signal<string>('');

  isLoading = signal(false);
  isGeneratingDraft = signal(false);

  private _shouldScroll = false;

  ngAfterViewChecked() {
    if (this._shouldScroll) {
      this.scrollToBottom();
      this._shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.chatScrollContainer.nativeElement.scrollTop =
        this.chatScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage(event);
    }
  }

  async onSendMessage(event: Event) {
    event.preventDefault();
    if (this.isLoading() || (!this.messageInput.trim() && !this.selectedFile())) return;

    const userText = this.messageInput.trim();
    this.messageInput = '';

    if (userText) {
      this.chatHistory.update((h) => [...h, { text: userText, sender: 'user', timestamp: new Date() }]);
    } else if (this.selectedFile()) {
      this.chatHistory.update((h) => [...h, {
        text: `📎 Attached: ${this.selectedFile()?.name}`, sender: 'user', timestamp: new Date()
      }]);
    }

    this._shouldScroll = true;
    this.isLoading.set(true);

    try {
      const res = await this.aiRequirements.startOrContinueSession(userText, this.selectedFile(), this.chatId());
      const currentChatId =
        res.data?.sessionId || res.sessionId || res.data?.SessionId || res.SessionId ||
        res.data?.chatId || res.chatId || res.data?.id || res.id ||
        res.data?.SessionID || res.SessionID || this.chatId();

      if (!currentChatId) console.warn('Failed to extract chat ID from response:', res);
      this.chatId.set(currentChatId);

      const resData = res.data || res;
      const aiReply =
        resData.reply || resData.Reply || resData.aiResponse || resData.AiResponse ||
        resData.message || resData.Message || resData.response || resData.Response;

      if (aiReply && typeof aiReply === 'string' && aiReply.trim()) {
        this.chatHistory.update((h) => [...h, { text: aiReply.trim(), sender: 'ai', timestamp: new Date() }]);
      }

      this.clearFile();
      this._shouldScroll = true;
      await this.pollStatus(currentChatId);
    } catch (e) {
      console.error(e);
      this.chatHistory.update((h) => [...h, {
        text: 'Error: Failed to process message. Please check connection and try again.',
        sender: 'ai', timestamp: new Date()
      }]);
    } finally {
      this.isLoading.set(false);
      this._shouldScroll = true;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile.set(file);
      this.selectedFileName.set(file.name);
      this.lastUploadedFileName.set(file.name.replace(/\.[^.]+$/, ''));
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => this.lastUploadedDocText.set((e.target?.result as string) || '');
        reader.readAsText(file);
      } else {
        this.lastUploadedDocText.set('');
      }
    }
  }

  clearFile() {
    this.selectedFile.set(null);
    this.selectedFileName.set('');
  }

  async pollStatus(chatId: string) {
    try {
      const res = await this.aiRequirements.getSessionStatus(chatId);
      const data = res.data || res;
      if (data) {
        const scorePercentage = Math.round(
          (data.completenessReport?.score || data.CompletenessReport?.Score || 0) * 100,
        );
        this.completenessScore.set(scorePercentage);

        const pool = data.questionPool || data.QuestionPool || [];
        const unanswered = pool.filter((q: any) => !q.isAnswered && !q.IsAnswered);
        const questionsList = unanswered.map((q: any) => q.question || q.Question);
        this.clarifyingQuestions.set(questionsList);

        const isReady =
          data.status === 'Planning' || data.Status === 'Planning' ||
          unanswered.length === 0 || scorePercentage >= 85 ||
          data.completenessReport?.readyForFinalization === true;
        this.isReadyForFinalization.set(isReady);

        const sprintDays = data.suggestedSprintDurationInDays || data.sprintDurationInDays || data.SprintDurationInDays || null;
        const sprintHours = data.suggestedTargetSprintHours || data.targetSprintHours || data.TargetSprintHours || null;
        if (sprintDays) this.suggestedSprintDuration.set(sprintDays);
        if (sprintHours) this.suggestedTargetHours.set(sprintHours);

        const history = this.chatHistory();
        const lastMsg = history[history.length - 1];

        if (questionsList.length > 0) {
          const isArabic = questionsList.length > 0 && detectTextDir(questionsList[0]) === 'rtl';
          const prefix = isArabic ? 'يرجى الإجابة على الأسئلة التالية:\n' : 'Please answer the following questions:\n';
          const allQuestions =
            questionsList.length === 1
              ? questionsList[0]
              : prefix + questionsList.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
          if (!lastMsg || lastMsg.text !== allQuestions || lastMsg.sender !== 'ai') {
            this.chatHistory.update((h) => [...h, { text: allQuestions, sender: 'ai', timestamp: new Date() }]);
          }
        } else if (lastMsg && lastMsg.sender === 'user') {
          const isRtl = detectTextDir(lastMsg.text) === 'rtl';
          const ackMsg =
            scorePercentage >= 100
              ? (isRtl ? 'شكراً! تم تحديث المتطلبات (100% اكتمال). لا توجد أسئلة إضافية.' :
                'Thank you! Requirements updated (100% completeness). No further questions required.')
              : (isRtl ? `شكراً! تم تحديث المتطلبات (${scorePercentage}% اكتمال). اضغط "توليد المسودة" للمتابعة.` :
                `Thank you! Requirements updated (${scorePercentage}% completeness). Click "Generate Draft" to proceed.`);
          this.chatHistory.update((h) => [...h, { text: ackMsg, sender: 'ai', timestamp: new Date() }]);
        } else {
          const completionMsg = `Requirements gathering is complete (${scorePercentage}%). You can now generate your project draft!`;
          if (!lastMsg || lastMsg.text !== completionMsg || lastMsg.sender !== 'ai') {
            this.chatHistory.update((h) => [...h, { text: completionMsg, sender: 'ai', timestamp: new Date() }]);
          }
        }
        this._shouldScroll = true;
      }
    } catch (err) {
      console.warn('Failed to fetch session completeness status:', err);
    }
  }

  private suggestedSprintDuration = signal<number | null>(null);
  private suggestedTargetHours = signal<number | null>(null);
  showNamePrompt = signal(false);
  projectNameInput = signal('');
  projectNameArInput = signal('');
  projectDescriptionEnInput = signal('');
  projectDescriptionArInput = signal('');
  sprintDurationInput = signal<number | null>(null);
  targetSprintHoursInput = signal<number | null>(null);
  sprintDurationPlaceholder = signal('14');
  targetSprintHoursPlaceholder = signal('80');

  onGenerateDraft() {
    const activeChatId = this.chatId();
    const companyId = this.projectState.userCompanyId();
    const managerId = this.projectState.userId();
    if (!activeChatId) { this.toastService.show('Missing chat session ID. Please try sending a message again.', 'error'); return; }
    if (!companyId) { this.toastService.show('Missing company ID in your profile. Please contact support.', 'error'); return; }
    if (!managerId) { this.toastService.show('Missing user ID. Please log in again.', 'error'); return; }

    this.projectNameInput.set('');
    this.projectNameArInput.set('');
    this.projectDescriptionEnInput.set('');
    this.projectDescriptionArInput.set('');
    this.sprintDurationInput.set(this.suggestedSprintDuration() ?? 14);
    this.targetSprintHoursInput.set(this.suggestedTargetHours() ?? 80);
    this.showNamePrompt.set(true);
  }

  async submitFinalization() {
    const activeChatId = this.chatId();
    const companyId = this.projectState.userCompanyId();
    const managerId = this.projectState.userId();

    const defaultName = `New AI Project ${Math.floor(Math.random() * 10000)}`;
    const nameEn = this.projectNameInput().trim() || defaultName;
    const nameAr = this.projectNameArInput().trim() || nameEn;
    const descEn = this.projectDescriptionEnInput().trim() || 'Project requirements collected via AI Assistant.';
    const descAr = this.projectDescriptionArInput().trim() || descEn;
    const sprintDuration = this.sprintDurationInput() ?? this.suggestedSprintDuration() ?? 14;
    const targetHours = this.targetSprintHoursInput() ?? this.suggestedTargetHours() ?? 80;

    if (!activeChatId) { this.toastService.show('Missing chat session ID.', 'error'); return; }
    if (!companyId) { this.toastService.show('Missing company ID.', 'error'); return; }
    if (!managerId) { this.toastService.show('Missing user ID.', 'error'); return; }

    this.isGeneratingDraft.set(true);
    try {
      const res = await this.aiRequirements.finalizeSession(activeChatId, {
        projectNameEn: nameEn, projectNameAr: nameAr,
        companyId: companyId,
        sprintDurationInDays: sprintDuration || 0,
        targetSprintHours: targetHours || 0,
        descriptionEn: descEn, descriptionAr: descAr,
      });
      const finalizeResult = res.data || res;
      if (finalizeResult && finalizeResult.projectId) {
        await this.projectState.loadProjects();
        this.showNamePrompt.set(false);
        this.draftGenerated.emit({ projectId: finalizeResult.projectId, draft: finalizeResult, chatId: activeChatId });
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.response?.data?.error?.message || err?.message || 'Please check and try again.';
      this.toastService.show(`Failed to finalize requirements: ${msg}`, 'error');
    } finally {
      this.isGeneratingDraft.set(false);
    }
  }
}