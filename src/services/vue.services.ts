import { computed } from 'vue';

export function useVModel<Type>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Readonly<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emits: any,
  name = 'modelValue',
  modifier: ((value: Type) => Type) | null = null
) {
  return computed<Type>({
    get: () => props[name],
    set: (value) => emits(`update:${name}`, modifier ? modifier(value) : value),
  });
}
