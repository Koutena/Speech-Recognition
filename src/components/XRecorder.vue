<template>
  <component :is="props.tag">
    <slot />
    <hr />
    <div>
      {{ transcript }}
    </div>
  </component>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { t } from 'src/boot/i18n';
import { showDialog } from 'src/services/ui.services';
import { onBeforeRouteLeave } from 'vue-router';
import { toLowerCaseWithRemovePunctuations } from 'src/services/ui.services';
import { Language } from 'src/models/language.models';
import { RecordAction } from 'src/models/record.models';
import { Platform } from 'quasar';
import { useVModel } from 'src/services/vue.services';

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
const transcript = ref<string>('');
const isRecording = ref<boolean>(false);
const isInCalculateResult = ref<boolean>(false);
const wantsToLeavePage = ref<boolean>(false);
const automaticallyStopped = ref<boolean>(false);

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface Props {
  tag?: string;
  lang?: Language;
  action: RecordAction;
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'span',
  lang: 'en-US',
  action: 'stop',
});

const emits = defineEmits([
  'onResult',
  'onStopped',
  'onRecording',
  'onCalculateResult',
  'update:action',
]);

const action = useVModel<RecordAction>(props, emits, 'action');

function stop() {
  isRecording.value = false;
  if (automaticallyStopped.value === false) {
    isInCalculateResult.value = true;
  }

  recognition.stop();
}

watch(
  () => action.value,
  (newValue) => {
    if (newValue === 'start') {
      recognition.start();
    }

    if (newValue === 'stop') {
      stop();
    }
  }
);

watch(
  () => isRecording.value,
  (newValue) => {
    emits('onRecording', newValue);
  }
);

watch(
  () => isInCalculateResult.value,
  (newValue) => {
    emits('onCalculateResult', newValue);
  }
);

watch(
  () => props.lang,
  (newValue) => {
    recognition.lang = newValue;
  },
  {
    immediate: true,
  }
);

onMounted(() => {
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    transcript.value = '';
    isRecording.value = true;
    automaticallyStopped.value = false;
  };

  recognition.onend = () => {
    action.value = 'stop';
    if (Platform.is.mobile && isRecording.value) {
      automaticallyStopped.value = true;
    }

    isInCalculateResult.value = false;

    if (transcript.value && wantsToLeavePage.value === false) {
      emits('onStopped', transcript.value);
    }
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    if (Platform.is.desktop) {
      transcript.value = toLowerCaseWithRemovePunctuations(
        event.results[0][0].transcript
      );
    } else {
      transcript.value = toLowerCaseWithRemovePunctuations(
        event.results[event.results.length - 1][0].transcript
      );
    }

    emits('onResult', transcript.value);
  };
});

onBeforeRouteLeave(async (to, from, next) => {
  if (isRecording.value === false && isInCalculateResult.value === false) {
    next();
  } else {
    wantsToLeavePage.value = await showDialog({
      message: t('areYouSureToLeavePage'),
      class: 'reverse-actions',
      ok: {
        label: t('yes'),
        color: 'primary',
      },
      cancel: {
        label: t('no'),
        color: 'secondary',
      },
      persistent: true,
    });

    if (wantsToLeavePage.value) {
      recognition.removeEventListener('end', recognition.onend);
      recognition.abort();
    }

    next(wantsToLeavePage.value);
  }
});
</script>
