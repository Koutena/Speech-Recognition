import { Dialog, QDialogOptions } from 'quasar';

export function showDialog(options: QDialogOptions) {
  return new Promise<boolean>((resolve) => {
    Dialog.create({
      color: 'inherit',
      focus: 'none',
      ...options,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });
}

export function toLowerCaseWithRemovePunctuations(text: string) {
  const removeAllPunctuations = (text: string) => {
    return text.replace(/[\.\?\!\,\:\;]/g, '');
  };

  return removeAllPunctuations(text).toLowerCase();
}
