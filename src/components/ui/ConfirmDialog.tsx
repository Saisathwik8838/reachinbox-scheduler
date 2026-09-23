import React from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { AlertCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.ReactElement | null {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      maxWidth="max-w-md"
      showCloseButton={false}
    >
      <div className="flex items-start gap-3.5 mb-5">
        <div
          className={`p-2 rounded-full shrink-0 ${
            isDestructive ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
          }`}
        >
          <AlertCircle className="w-5 h-5" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mt-0.5">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button
          variant={isDestructive ? 'danger' : 'primary'}
          size="sm"
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Dialog>
  );
}
